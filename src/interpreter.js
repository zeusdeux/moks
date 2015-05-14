/* eslint no-new-func:0, no-use-before-define: 0 */
'use strict';

const assert      = require('assert');
const cu          = require('auto-curry');
const d           = require('./util').log;
const setInScope  = require('./scope').setInScope;
const findInScope = require('./scope').findInScope;
const atoms       = ['Number', 'Boolean', 'String', 'Identifier'];
const ops         = [
  'DivisionOperator', 'MultiplicationOperator', 'AdditionOperator', 'SubtractionOperator',
  'AndOperator', 'OrOperator', 'EqualityOperator', 'NotEqualOperator', 'LTEOperator',
  'GTEOperator', 'LTOperator', 'GTOperator', 'NegationOperator', 'UnaryOperator'
];
const opsMap = {
  DivisionOperator: '/',
  MultiplicationOperator: '*',
  AdditionOperator: '+',
  SubtractionOperator: '-',
  AndOperator: '&&',
  OrOperator: '||',
  EqualityOperator: '==',
  NotEqualOperator: '!=',
  LTEOperator: '<=',
  GTEOperator: '>=',
  LTOperator: '<',
  GTOperator: '>',
  NegationOperator: '!'
};

// isAtom :: Node -> Bool
function isAtom(node) {
  return atoms.indexOf(node.type) > -1;
}

// isOp :: Node -> Bool
function isOp(node) {
  return ops.indesOx(node.type) > -1;
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
  }
}

// makeJSFnBodyString :: Node -> String
function makeJSFnBodyString(blockNode) {
  return 'return x + y'; // make this actually work ffs
}

// buildBlock :: ids -> Node -> ()
function buildBlock(ids, blockNode) {
  let params = ids.map(v => v.val);

  d(params.concat(makeJSFnBodyString(blockNode)));
  // build javascript function from ast at block node
  return Function.apply(Object.create(null), params.concat(makeJSFnBodyString(blockNode)));
}

// assignmentExpressionHandler :: Node -> Scope -> undefined
function assignmentExpressionHandler(node, scope) {
  if ('AtomAssignment' === node.type) {
    assert(node.val.filter(v => atoms.indexOf(v.type) > -1).length === node.val.length, 'Non atoms found in atom assignment');
    let traversalResult = traverse(node.val[1], scope);

    // everything is a function
    // so even atoms are converted into function that return the atom
    // so thunks
    if ('function' !== typeof traversalResult) traversalResult = new Function('', 'return ' + traversalResult + ';');

    // d('Traversal result:');
    // d('identifier:');
    // d(node.val[0].val);
    // d(traversalResult.toString());
    // d('------------------------------');

    setInScope(scope, node.val[0].val, traversalResult);
  }
  else if ('BlockAssignment' === node.type) {
    let ids = node.val[0];
    let blockNode = node.val[1];
    let fnName = ids.shift().val; // take the fn name out from the identifier list
    let fn = buildBlock(ids, blockNode);

    //d(fnName);
    setInScope(scope, fnName, fn);
  }
}

// argumentsHandler :: Node -> Scope -> [a]
function argumentsHandler(argsNode, scope) {
  assert(argsNode.type === 'Arguments', 'Invalid arguments node received by arguments handler');
  // since everything in scope is a function, call apply on whatever traverse returns
  return argsNode.val.map(v => traverse(v, scope).apply(null));
}

// invocationExpressionHandler :: Node -> Scope -> a
function invocationExpressionHandler(node, scope) {
  let fn   = atomsHandler(node[0], scope);
  let args = argumentsHandler(node[1], scope);

  fn = cu(fn);
  d(fn.toString());
  d(args);
  return fn.apply(null, args);
}

// traverse :: Node -> Scope -> undefined
function traverse(root, scope) {
  d(root.type);

  if ('AssignmentExpression' === root.type) return assignmentExpressionHandler(root.val, scope);

  else if ('InvocationExpression' === root.type) return invocationExpressionHandler(root.val, scope);

  // terminating condition is atoms
  else if (atoms.indexOf(root.type) > -1) return atomsHandler(root, scope);

  // traverse over all child nodes from L to R
  if (Array.isArray(root.val)) {
    root.val.forEach(function(v) {
      traverse(v, scope);
    });
  }
  // else it's an object so it's just one child. traverse it
  else traverse(root.val, scope);
}

function interpret(ast, scope) {
  d('Interpret');
  d(ast);
  traverse(ast, scope);
}

module.exports = interpret;
