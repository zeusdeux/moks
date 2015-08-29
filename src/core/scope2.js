'use strict';

const d = require('./util').log;
const parentSymbol = Symbol('Reference to parent scope');
const basefilePathSymbol = Symbol('Reference to the base file path that is used to load modules');


exports.createScope = function createScope(parentScope) {
  let m = new Map();
  const parentKeys = Object.keys(parentScope); // will be [] if parentScope is Map or WeakMap

  // if the parentScope is not a map, then make it a map
  // this will happen often as parentScope might be some
  // module imported using `require` from node which returns
  // a simple object and not map
  // And since all scope is modelled as a Map, we manually
  // copy properties into a new empty Map instance
  if (parentKeys.length) {
    let objToMap = new Map();

    parentKeys.forEach(key => objToMap.set(key, parentScope[key]));
    parentScope = objToMap;
  }

  m.set(parentSymbol, parentScope);
  return m;
}

exports.setInScope = function setInScope(scope, name, value) {
  let newScope = new Map(scope); // give scope immutability

  newScope.set(name, value);
  return newScope;
}

exports.findInScope = function findInScope(scope, name) {
  let splitName = name.split('.');
  const first   = splitName.shift();

  if (scope.has(first)) {
    let returnVal = scope.get(first);

    while (splitName.length) {
      let currName = splitName.shift();

      if (returnVal.hasOwnProperty(currName)) returnVal = returnVal[currName];
      else throw new ReferenceError(currName + ' in ' + name + ' is not defined');
    }
    return returnVal;
  }
  else {
    let parent = scope.get(parentSymbol);

    if (!parent) throw new ReferenceError(first + ' in ' + name + ' is not defined');
    return findInScope(parent, name);
  }
}

exports.filePathSymbol = basefilePathSymbol;
