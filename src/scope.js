'use strict';

const d = require('./util').log;


function createScope(obj, parentScope) {
  d('Creating new scope...');
  d(obj);
  d(parentScope);
  d('/createScope');

  obj = obj || {};
  Object.defineProperty(obj, '__parent__', {
    value: parentScope
  });
  return obj;
}

function findInScope(scope, identifier, fullIdentifier, parent) {
  let idSplit = identifier.split('.');
  let temp = idSplit.shift();

  // hold full original identifier for use during look up in parent
  // if it's already initialized (which happens only on the first call), leave it be
  fullIdentifier = fullIdentifier || identifier;

  // storing parent scope since a child node might not have a __parent__ property
  // so we memoize the parent a level above and use that in the recursive calls
  // so that we can come out of the child object and resume checking up the parents
  parent = scope.__parent__ || parent;

  d('findInScope:');
  d(scope);
  d(temp);
  d(idSplit);
  d('/findInScope');

  if (0 === Object.keys(scope).length) throw new ReferenceError(fullIdentifier + ' is not defined');

  if (idSplit.length && scope.hasOwnProperty(temp)) return findInScope(scope[temp], idSplit.join('.'), fullIdentifier, parent);

  if (!idSplit.length && scope.hasOwnProperty(temp)) return scope[temp];
  return findInScope(scope.__parent__ || parent, fullIdentifier, fullIdentifier, parent);
}

function setInScope(scope, identifier, value) {
  d('SetInScope');
  d(identifier);
  d(value.toString());
  d(scope);
  d('/SetInScope');

  scope[identifier] = value;
  return true;
}

module.exports = {
  setInScope: setInScope,
  createScope: createScope,
  findInScope: findInScope
};
