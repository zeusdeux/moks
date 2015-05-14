const d = require('./util').log;


exports.createScope = function(obj, parentScope) {
  obj = obj || {};
  return (obj.__parent__ = parentScope) && obj;
};

exports.findInScope = function findInScope(scope, identifier) {
  d('findInScope:');
  d(scope);
  d(identifier);
  d('/findInScope');

  if (0 === Object.keys(scope).length) throw new ReferenceError(identifier + ' is not defined');
  if (scope.hasOwnProperty(identifier)) return scope[identifier];
  return findInScope(scope.__parent__, identifier);
};

exports.setInScope = function (scope, identifier, value) {
  scope[identifier] = value;
  return true;
};
