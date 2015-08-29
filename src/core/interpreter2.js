/* eslint no-use-before-define: 0, no-fallthrough: 0 */
'use strict';

const fs          = require('fs');
let path          = require('path');
const assert      = require('assert');

const dath        = require('debug')('i:atom');
const dph         = require('debug')('i:program');
const dash        = require('debug')('i:assignment');
const dih         = require('debug')('i:invocation');
const dblh        = require('debug')('i:block');
const doh         = require('debug')('i:operator');
const dimh        = require('debug')('i:import');
const dlh         = require('debug')('i:lambda');

const parse       = require('./parser');
const stdlib      = require('./lib/stdlib');
const setInScope  = require('./scope2').setInScope;
const findInScope = require('./scope2').findInScope;
const createScope = require('./scope2').createScope;
const params      = Symbol('Symbol for internal property that maps to formal paramters to a function in blr lang');

function makeReturnVal(env, val) {
  return { env, val };
}

function getReturnVal(env) {
  return env.val;
}

function isBlock(node) {
  return 'Block' === node.type;
}

// Gets name of the identifier from an atom node
function getRawAtomValue(atomNode) {
  assert('Atom' === atomNode.type, 'getRawAtomValue can only be called on an Atom node');
  return atomNode.val.val;
}

function programHandler(env, node) {
  let returnObj;

  node.forEach(expr => {
    returnObj = interpret(env, expr);
    env = returnObj.env;
  });

  dph('Returning %o', returnObj);
  return returnObj;
}

function atomHandler(env, node) {
  let returnObj;

  switch (node.type) {
  case 'Number':
  case 'Boolean':
  case 'String':
  case 'Nil':
    returnObj =  makeReturnVal(env, node.val);
    break;
  case 'Identifier':
    returnObj =  makeReturnVal(env, findInScope(env, node.val));
    break;
  case 'Array':
    returnObj =  makeReturnVal(
      env,
      node.val.map(v => getReturnVal(interpret(env, v)))
    );
    break;
  case 'HashMap':
    returnObj =  makeReturnVal(
      env,
      node.val.reduce((p, c) => {
        assert(c[0].type === 'Key', 'Invalid key given to hash map');
        const key = c[0].val;
        const val = getReturnVal(interpret(env, c[1]));

        p[key] = val;
        return p;
      }, {})
    );
    break;
  default: throw new TypeError('Invalid atom type ' + node.type);
  }

  dath('Returning %o', returnObj);
  return returnObj;
}

function assignmentExpressionHandler(env, node) {
  let returnObj;

  switch(node.type) {
  case 'AtomAssignment':
    // evaluate the atom that is being assigned
    const evaldAtom = getReturnVal(interpret(env, node.val[1]));

    returnObj = makeReturnVal(setInScope(env, getRawAtomValue(node.val[0]), evaldAtom));

    dash('Evaluated atom: ', evaldAtom);
    break;
  case 'BlockAssignment':
    const rawAtomValArray = node.val[0].map(getRawAtomValue);
    const fnName = rawAtomValArray[0];
    const argNames = rawAtomValArray.slice(1);
    let fnBody = node.val[1];

    // set params as part of body
    fnBody[params] = argNames;

    dash('block: %o', fnBody);

    returnObj = makeReturnVal(
      setInScope(
        env,
        fnName,
        fnBody
      )
    );
    break;
  case 'OperatorAssignment':
  case 'InvocationAssignment':
    returnObj = makeReturnVal(
      setInScope(
        env,
        getRawAtomValue(node.val[0]),
        getReturnVal(interpret(env, node.val[1]))
      )
    );
    break;
  default: throw new TypeError('Invalid assignment type ' + node.type);
  }

  dash('Returning %o', returnObj);
  return returnObj;
}

function lambdaExpressionHandler(env, node) {
  let returnObj;
  const argNames = node[0].map(getRawAtomValue);
  const lambdaBody = node[1];

  // set params as part of body that'll be executed
  lambdaBody[params] = argNames;

  // since lamdas can be passed to javascript functions,
  // they need to be real js functions so that the js engine
  // can invoke 'em
  // this doesn't effect lambda usage from within pure moks
  // functions either since invocationExpressionHandler
  // has an if case for when the fnBody is a 'function'
  function _lambda(...args) {
    return getReturnVal(blockHandler(env, args, lambdaBody));
  }
  returnObj = makeReturnVal(env, _lambda);

  dlh('lamdaBody %o', lambdaBody);
  dlh('Returning %o', returnObj);
  return returnObj;
}

function invocationExpressionHandler(env, node) {
  let returnObj, fnBody, fnName, args;

  if ('LambdaExpression' === node[0].type) fnBody = getReturnVal(interpret(env, node[0]));
  else {
    fnName = getRawAtomValue(node[0]);
    fnBody = findInScope(env, fnName);
  }
  args = node[1].map(n => getReturnVal(interpret(env, n)));

  dih(fnName ? fnName : 'LambdaExpression', args, JSON.stringify(fnBody, null, 4));

  // exec using block handler if block
  if (isBlock(fnBody)) returnObj = blockHandler(env, args, fnBody);
  // exec function body
  else if ('function' === typeof fnBody) returnObj = makeReturnVal(env, fnBody.apply(null, args));
  // if fnBody not an object, return as is (it might be a primitive)
  else if (!(fnBody instanceof Object)) returnObj = makeReturnVal(env, fnBody);

  dih('Returning %o', returnObj);
  return returnObj;
}

function blockHandler(env, args, fnBody) {
  let returnObj;
  let newEnv = createScope(env);

  dblh('fnBody', JSON.stringify(fnBody, null, 4));
  dblh('fnBody[params]', fnBody[params]);
  // setup params in new env
  if (fnBody[params]) {
    fnBody[params].forEach(
      (param, i) => newEnv = setInScope(newEnv, param, args[i])
    );
  }
  fnBody.val.forEach(expr => {
    returnObj = interpret(newEnv, expr);
    newEnv = returnObj.env;
  });

  dblh('Returning %o', returnObj);
  return returnObj;
}

function operatorExpressionHandler(env, node) {
  let returnObj;
  let op;

  switch(node.type) {
  case 'UnaryOperatorExpression':
    op = node.val[0];
    const param = getReturnVal(interpret(env, node.val[1]));

    doh(op, param);

    switch(op.type) {
    case 'NegationOperator':
      assert('boolean' === typeof param, 'Boolean not operator can only be applied to a boolean');
      returnObj = makeReturnVal(env, !param);
      break;
    }
    break;
  case 'BinaryOperatorExpression':
    op = node.val[1];
    const arg1 = getReturnVal(interpret(env, node.val[0]));
    const arg2 = getReturnVal(interpret(env, node.val[2]));

    doh(arg1, op, arg2);

    switch(op.type) {
    case 'DivisionOperator':
      returnObj = makeReturnVal(env, arg1 / arg2);
      break;
    case 'MultiplicationOperator':
      returnObj = makeReturnVal(env, arg1 * arg2);
      break;
    case 'AdditionOperator':
      returnObj = makeReturnVal(env, arg1 + arg2);
      break;
    case 'SubtractionOperator':
      returnObj = makeReturnVal(env, arg1 - arg2);
      break;
    case 'ExponentiationOperator':
      returnObj = makeReturnVal(env, Math.pow(arg1, arg2));
      break;
    case 'AndOperator':
      returnObj = makeReturnVal(env, arg1 && arg2);
      break;
    case 'OrOperator':
      returnObj = makeReturnVal(env, arg1 || arg2);
      break;
    case 'EqualityOperator':
      returnObj = makeReturnVal(env, arg1 === arg2);
      break;
    case 'InequalityOperator':
      returnObj = makeReturnVal(env, arg1 !== arg2);
      break;
    case 'LTEOperator':
      returnObj = makeReturnVal(env, arg1 <= arg2);
      break;
    case 'GTEOperator':
      returnObj = makeReturnVal(env, arg1 >= arg2);
      break;
    case 'LTOperator':
      returnObj = makeReturnVal(env, arg1 < arg2);
      break;
    case 'GTOperator':
      returnObj = makeReturnVal(env, arg1 > arg2);
      break;
    }
    break;
  case 'TernaryOperatorExpression':
    const predicate = getReturnVal(interpret(env, node.val[0]));
    const trueBlock = node.val[1];
    const falseBlock = node.val[2];

    doh(predicate, trueBlock, falseBlock);

    if ('boolean' !== typeof predicate) throw new Error('Predicate given to ternary operator must be boolean');

    if (predicate) returnObj = isBlock(trueBlock) ? blockHandler(env, [], trueBlock) : interpret(env, trueBlock);
    else returnObj = isBlock(falseBlock) ? blockHandler(env, [], falseBlock) : interpret(env, falseBlock);
    break;
  }

  doh('Returning %o', returnObj);
  return returnObj;
}

function interpret(env, node) {
  switch(node.type) {
  case 'Program':
    return programHandler(env, node.val);
  case 'Atom':
    return atomHandler(env, node.val);
  case 'AssignmentExpression':
    return assignmentExpressionHandler(env, node.val);
  case 'InvocationExpression':
    return invocationExpressionHandler(env, node.val);
  case 'OperatorExpression':
    return operatorExpressionHandler(env, node.val);
  case 'ImportExpression':
    return importExpressionHandler(env, node.val);
  case 'LambdaExpression':
    return lambdaExpressionHandler(env, node.val);
  }
}


module.exports = interpret;
