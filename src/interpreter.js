/* eslint no-new-func:0, no-use-before-define: 0 */
'use strict';

const assert      = require('assert');
const d           = require('./util').log;
const setInScope  = require('./scope').setInScope;
const findInScope = require('./scope').findInScope;
const createScope = require('./scope').createScope;
const atoms       = ['Number', 'Boolean', 'String', 'Identifier'];
const ops         = [
  'DivisionOperator', 'MultiplicationOperator', 'AdditionOperator', 'SubtractionOperator',
  'AndOperator', 'OrOperator', 'EqualityOperator', 'InequalityOperator', 'LTEOperator',
  'GTEOperator', 'LTOperator', 'GTOperator', 'NegationOperator', 'UnaryOperator'
];


// isAtom :: Node -> Bool
function isAtom(node) {
  return atoms.indexOf(node.type) > -1;
}

// isOp :: Node -> Bool
function isOp(node) {
  return ops.indexOf(node.type) > -1;
}

// type Type = String
// data Node v = Node Type v
// newtype Scope = Map Identifier Value

function atomsHandler(atom, scope) {
  assert(atoms.indexOf(atom.type) > -1, 'Invalid atom received by atoms handler');
  switch (atom.type) {
    case 'Number':
    case 'Boolean':
    case 'String':
      return atom.val;
    case 'Identifier':
      return findInScope(scope, atom.val);
    case 'Array':
      return atom.val.map(v => traverse(v, scope));
    case 'HashMap':
      return atom.val.reduce((p, c) => {
        assert(c[0].type === 'Key', 'Invalid key given to hash map');
        let key = c[0].val;
        let val = traverse(c[1], scope);

        p[key] = val;
        return p;
      }, {});
  }
}

// assignmentExpressionHandler :: Node -> Scope -> undefined
function assignmentExpressionHandler(node, scope) {
  if ('AtomAssignment' === node.type) {
    assert(node.val.filter(v => atoms.indexOf(v.type) > -1).length === node.val.length, 'Non atoms found in atom assignment');

    // since this is an atom assignment, we know that traversal will hit
    // atomsHandler which just returns a simple value (an atom value) or

    // a function (if the atom it received was an identifer)
    let traversalResult = traverse(node.val[1], scope);
    let thunk;

    // everything is a function
    // so even atoms are converted into functions that return the atom
    // for e.g., 8 is converted to function (){ return 8; }
    // so thunks really.
    // when we do something like let a = 10; let b = a;
    // then findInScope(scope, a) will return the thunk for 'a'
    // so we needn't wrap it again hence the check below
    // Note: Arrays and objects aren't stored as thunks so that it's easier to deref them
    if (
      'function' !== typeof traversalResult &&
      !Array.isArray(traversalResult) &&
      'object' !== typeof traversalResult &&
      null !== traversalResult
    ) thunk = function () { return traversalResult; };

    // d('Traversal result:');
    // d('identifier:');
    // d(node.val[0].val);
    // d(traversalResult.toString());
    // d('------------------------------');

    setInScope(scope, node.val[0].val, thunk || traversalResult);
  }
  else if ('BlockAssignment' === node.type) {
    let blockNode = node.val[1];
    let params    = node.val[0].slice(1).map(v => v.val);
    let fnName    = node.val[0].shift().val; // take the fn name out from the identifier list

    d('assignmentExpressionHandler -> BlockAssignment');

    d('fn name:');
    d(fnName);
    d('params:');
    d(params);
    setInScope(scope, fnName, function(...args) {
      let newScope  = createScope({}, scope); // block creates new scope so new function always executes in new scope
      let result;

      // add block params to new scope for the block
      newScope.__params__ = params;

      d('BlockAssignment fn');
      d(args);
      d(newScope);

      newScope = newScope.__params__.reduce((p, c) => {
        let temp = args.shift();

        p[c] = function() {
          return temp;
        };
        return p;
      }, newScope);

      d(blockNode);
      d('Going to traverse');
      result = traverse(blockNode, newScope);

      d(result);
      d('/BlockAssignment fn');

      return result;
    });
    d('/assignmentExpressionHandler -> BlockAssignment');
  }
  else if ('OperatorAssignment' === node.type) {
    d('assignmentExpressionHandler -> OperatorAssignment:');
    d(node.val[0].val);
    d(node.val[1]);
    d('/assignmentExpressionHandler -> OperatorAssignment');

    setInScope(scope, node.val[0].val, () => traverse(node.val[1], scope));
  }
  else if ('InvocationAssignment' === node.type) {
    d('assignmentExpressionHandler -> InvocationAssignment:');
    d(node.val[0].val);
    d(node.val[1]);
    d('/assignmentExpressionHandler -> InvocationAssignment');

    setInScope(scope, node.val[0].val, () => traverse(node.val[1], scope));
  }
}

// argumentsHandler :: Node -> Scope -> [a]
function argumentsHandler(argsNode, scope) {
  assert(argsNode.type === 'Arguments', 'Invalid arguments node received by arguments handler');

  return argsNode.val.map(v => {
    let temp = traverse(v, scope);

    if ('function' === typeof temp) temp = temp.apply(null);
    return temp;
  });
}

// invocationExpressionHandler :: Node -> Scope -> a
function invocationExpressionHandler(node, scope) {
  let fn   = atomsHandler(node[0], scope);
  let args = argumentsHandler(node[1], scope);
  let result;

  d('invocationExpressionHandler');
  d(node[0]);
  d(fn.toString());
  d(args);

  // this is here so that debug log nests properly.
  // I know, I KNOW! :(
  result = fn.apply(null, args);

  d(result);
  d('/invocationExpressionHandler');

  return result;
}

// binaryOperatorExpressionHandler :: Node -> Scope -> a
function binaryOperatorExpressionHandler(node, scope) {
  let arg1 = traverse(node[0], scope);
  let op   = node[1];
  let arg2 = traverse(node[2], scope);
  let result;

  d('binaryOperatorExpressionHandler:');
  d(arg1);
  d(op.type);
  d(arg2);

  switch(op.type) {
    case 'DivisionOperator':
      result = arg1 / arg2;
      break;
    case 'MultiplicationOperator':
      result = arg1 * arg2;
      break;
    case 'AdditionOperator':
      result = arg1 + arg2;
      break;
    case 'SubtractionOperator':
      result = arg1 - arg2;
      break;
    case 'AndOperator':
      result = arg1 && arg2;
      break;
    case 'OrOperator':
      result = arg1 || arg2;
      break;
    case 'EqualityOperator':
      result = arg1 === arg2;
      break;
    case 'InequalityOperator':
      result = arg1 !== arg2;
      break;
    case 'LTEOperator':
      result = arg1 <= arg2;
      break;
    case 'GTEOperator':
      result = arg1 >= arg2;
      break;
    case 'LTOperator':
      result = arg1 < arg2;
      break;
    case 'GTOperator':
      result = arg1 > arg2;
      break;
  }
  d(result);
  d('/binaryOperatorExpressionHandler:');
  return result;
}

// ternaryOperatorExpressionHandler :: Node -> Scope -> a
function ternaryOperatorExpressionHandler(node, scope) {
  let predicate   = traverse(node[0], scope);
  let trueBranch  = node[1];
  let falseBranch = node[2];

  d('ternaryOperatorExpressionHandler');
  d(predicate);
  d(trueBranch);
  d(falseBranch);
  d('/ternaryOperatorExpressionHandler');

  assert('boolean' === typeof predicate, 'Predicate given to ternary operator must be a boolean');
  if (predicate) return traverse(trueBranch, scope);
  return traverse(falseBranch, scope);

}

// unaryOperatorExpressionHandler :: Node -> Scope -> a
function unaryOperatorExpressionHandler(node, scope) {
  let op = node[0].type;
  let param = traverse(node[1], scope);
  let result;

  switch(op) {
    case 'NegationOperator':
      assert('boolean' === typeof param, 'Boolean not operator can only be applied to a boolean');
      result = !param;
      break;
  }
  return result;
}

// traverse :: Node -> Scope -> undefined
function traverse(root, scope) {
  // d(root.type);
  let result;

  if ('AssignmentExpression' === root.type) return assignmentExpressionHandler(root.val, scope);

  else if ('InvocationExpression' === root.type) return invocationExpressionHandler(root.val, scope);

  else if ('BinaryOperatorExpression' === root.type) return binaryOperatorExpressionHandler(root.val, scope);

  else if ('TernaryOperatorExpression' === root.type) return ternaryOperatorExpressionHandler(root.val, scope);

  else if ('UnaryOperatorExpression' === root.type) return unaryOperatorExpressionHandler(root.val, scope);

  else if (isAtom(root)) return atomsHandler(root, scope);

  // traverse over all child nodes from L to R
  if (Array.isArray(root.val)) {
    root.val.forEach(function(v) {
      result = traverse(v, scope);
    });
    // return result of last node (which technically means last line of whatever (program or block))
    return result;
  }
  // else it's an object so it's just one child. traverse it
  return traverse(root.val, scope);
}

function interpret(ast, scope) {
  d('Interpret');
  d(ast);
  traverse(ast, scope);
}

module.exports = interpret;
