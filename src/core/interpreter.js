/* eslint no-use-before-define: 0 */
'use strict';

const fs          = require('fs');
let p             = require('path');
const assert      = require('assert');
const parse       = require('./parser');
const stdlib      = require('./lib/stdlib');
const d           = require('./util').log;
const setInScope  = require('./scope').setInScope;
const findInScope = require('./scope').findInScope;
const createScope = require('./scope').createScope;
const atoms       = ['Nil', 'Number', 'Boolean', 'String', 'Identifier', 'Array', 'HashMap'];
const ops         = [
  'DivisionOperator', 'MultiplicationOperator', 'AdditionOperator', 'SubtractionOperator',
  'AndOperator', 'OrOperator', 'EqualityOperator', 'InequalityOperator', 'LTEOperator',
  'GTEOperator', 'LTOperator', 'GTOperator', 'NegationOperator', 'UnaryOperator'
];
let __loadedModules__ = createScope({}, {});

// adding isRelative to imported path module
// type Path = String
// isRelative :: Path -> Bool
p.isRelative = function(path) {
  return path[0] === '.' && (path[1] === '/' || (path[1] === '.' && path[2] === '/'));
};

// isAtom :: Node -> Bool
function isAtom(node) {
  return atoms.indexOf(node.type) > -1;
}

// isOp :: Node -> Bool
function isOp(node) {
  return ops.indexOf(node.type) > -1;
}

// isThunkifiable :: Val -> Bool
function isThunkifiable(val) {
  if (
    'function' !== typeof val &&
      !Array.isArray(val) &&
      ('object' !== typeof val || null === val)
  ) return true;
  return false;
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
    case 'Nil':
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

    d('AtomAssignment');
    d(traversalResult);
    d('/AtomAssignment');
    // everything is a function
    // so even atoms are converted into functions that return the atom
    // for e.g., 8 is converted to function (){ return 8; }
    // so thunks really.
    // when we do something like let a = 10; let b = a;
    // then findInScope(scope, a) will return the thunk for 'a'
    // so we needn't wrap it again hence the check below
    // Note: Arrays and objects aren't stored as thunks so that it's easier to deref them
    if (isThunkifiable(traversalResult)) thunk = function () { return traversalResult; };

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
    setInScope(scope, fnName, generateWrapperFnFromBlockAndArgs(params, blockNode, scope));
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
    let result = traverse(node.val[1], scope);

    setInScope(scope, node.val[0].val, () => result);
  }
}

// argumentsHandler :: Node -> Scope -> [a]
function argumentsHandler(argsNode, scope) {
  assert(argsNode.type === 'Arguments', 'Invalid arguments node received by arguments handler');

  return argsNode.val.map(v => {
    let temp = traverse(v, scope);

    if ('function' === typeof temp && 'LambdaExpression' !== v.type) temp = temp.apply(null);
    return temp;
  });
}

// invocationExpressionHandler :: Node -> Scope -> a
function invocationExpressionHandler(node, scope) {
  let fn   = traverse(node[0], scope);
  let args = argumentsHandler(node[1], scope);
  let result;

  d('invocationExpressionHandler');
  d(node);
  if (fn) d(fn.toString());
  else d(fn);
  d(args);

  // this is here so that debug log nests properly.
  // I know, I KNOW! :(
  result = 'function' === typeof fn ? fn.apply(null, args) : fn;

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
  let op    = node[0].type;
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

function makeIntoPaths(paths, root) {
  d('makeIntoPaths:');
  d(arguments);

  let result = paths.map(path => {
    if (p.isAbsolute(path) || p.isRelative(path)) return p.resolve(root, path);
    return p.join(__dirname, 'lib', path);
  }).concat([p.parse(paths[0]).name]);

  d(result);
  d('/makeIntoPaths');

  return result;
}

function setupExtensions(path) {
  let parsedPath = p.parse(path);

  if (!parsedPath.ext || parsedPath.ext === '.') {
    path = '.' === path[path.length - 1] ? path.slice(0, -1) : path;
    return [path + '.mok', path + '.js'];
  }
  return [path];
}

function linkFromLoadedModulesToScope(currScope, moduleName, importAs) {
  d('linkFromLoadedModulesToScope');
  if (!importAs) setInScope(currScope, '__loadedModules__', __loadedModules__[moduleName]);
  else setInScope(currScope, importAs, __loadedModules__[moduleName]);
  d('/linkFromLoadedModulesToScope');
}

/*
import algorithm:

0. Is path already in global `__loadedModules__`? if yes 6 else 1
1. Is path absolute or relative? if yes 2 else 7
2. Does path have extension? if yes 3 else 4
3. Call loader based on extension (require for .js etc, and mokLoader for .mok) and store in global `__loadedModules__` keyed by path and goto step 6
4. If path doesn't have an extension, try importing it as a mok file. If that fails step 5 else store in global `__loadedModules__` map keyed by path and goto step 6
5. Try importing using require. If that fails END WITH ERROR else store in global `__loadedModules__` map keyed by path and goto step 6
6. Link from `__loadedModules__` into scope for executing program and END WITH SUCCESS
7. Prepend path to moks core library to the name and goto step 2
*/
// importExpressionHandler :: Node -> Scope -> ()
function importExpressionHandler(node, scope) {
  assert(node[0].type === 'String', 'import statement needs a string path');
  if (node[1]) assert(node[1].type === 'Identifier', 'import statement requires an identifier after "as"');

  let module   = node[0].val;
  let importAs = node[1].val;
  let root = findInScope(scope, '__filepath__');

  d('importExpressionHandler');
  d('Module:');
  d(module);
  d('importAs:');
  d(importAs);
  d('root:');
  d(root);
  if (module in __loadedModules__) linkFromLoadedModulesToScope(scope, module, importAs);
  else {
    // d('setup extensions');
    // d(setupExtensions(module));
    // d('make into paths');
    // d(makeIntoPaths(setupExtensions(module), root));
    // get the first path that exists (.mok path come first then .js)
    let modulePaths = makeIntoPaths(setupExtensions(module), root).filter(path => {
      try {
        fs.statSync(path);
        return true;
      }
      catch (_) {
        try {
          require(path);
          return true;
        }
        catch (_) {
          return false;
        }
      }
    });

    d('Filtered module paths');
    d(modulePaths);

    if (!modulePaths.length) throw new ReferenceError(module + ' does not exist in your file system');
    let parsedPath = p.parse(modulePaths[0]);

    switch(parsedPath.ext) {
      case '.mok':
        setLoadedModules(module, loadMoksModule(modulePaths[0], root));
        break;
      default:
        setLoadedModules(module, loadJSModule(modulePaths[0]));
        break;
    }
    linkFromLoadedModulesToScope(scope, module, importAs);
  }
}

function setLoadedModules(moduleName, scope) {
  d('setLoadedModules');
  d(arguments);
  __loadedModules__[moduleName] = scope;
  d('__loadedModules__');
  d(__loadedModules__);
  d('/setLoadedModules');
}

function loadJSModule(moduleName) {
  let module = require(moduleName);

  d('loadJSModule');
  d(module);
  d('/loadJSModule');

  return module;
}

function loadMoksModule(path, root) {
  path = p.resolve(root, path);
  const pgm = parse(fs.readFileSync(path, 'utf8'));
  let newScope = createScope(stdlib, createScope({ __filepath__: p.dirname(path) }, {}));

  d('loadMoksModule');
  d(newScope);
  d(pgm);
  d(p.dirname(path));

  traverse(pgm, newScope);

  d('newScope');
  d(newScope);
  d('/loadMoksModule');

  return newScope;
}

// exportExpressionHandler :: Node -> Scope -> ()
// function exportExpressionHandler(node, scope) {

// }

function lamdaExpressionHandler(node, scope) {
  d(node);
  let params = node[0].map(id => id.val);
  let blockNode = node[1];

  return generateWrapperFnFromBlockAndArgs(params, blockNode, scope);
}

function generateWrapperFnFromBlockAndArgs(params, blockNode, scope) {
  return function(...args) {
    let newScope  = createScope({}, scope); // block creates new scope so new function always executes in new scope
    let result;

    // add block params to new scope for the block
    newScope.__params__ = params;

    d('Block to Generated wrapper fn');
    d(args);

    newScope = newScope.__params__.reduce((p, c) => {
      let temp = args.shift();

      // thunkify only if:
      if (isThunkifiable(temp)) {
        p[c] = function() {
          return temp;
        };
      }
      else p[c] = temp;

      return p;
    }, newScope);

    d(newScope);
    d(newScope.args);
    d(blockNode);
    d('Going to traverse');

    result = traverse(blockNode, newScope);

    d(result);
    d('/Block to generated wrapper fn');

    return result;
  };
}

// traverse :: Node -> Scope -> undefined
function traverse(root, scope) {
  d(root.type);
  let result;

  if ('AssignmentExpression' === root.type) return assignmentExpressionHandler(root.val, scope);

  else if ('InvocationExpression' === root.type) return invocationExpressionHandler(root.val, scope);

  else if ('BinaryOperatorExpression' === root.type) return binaryOperatorExpressionHandler(root.val, scope);

  else if ('TernaryOperatorExpression' === root.type) return ternaryOperatorExpressionHandler(root.val, scope);

  else if ('UnaryOperatorExpression' === root.type) return unaryOperatorExpressionHandler(root.val, scope);

  else if ('ImportExpression' === root.type) return importExpressionHandler(root.val, scope);

  else if ('LambdaExpression' === root.type) return lamdaExpressionHandler(root.val, scope);

  // else if ('ExportExpression' === root.type) return exportExpressionHandler(root.val, scope);

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
