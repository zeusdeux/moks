var d = require('./util').log;


exports.createScope = function(obj, parentScope) {
  return (obj.__parent__ = parentScope) && obj;
};

exports.findInScope = function findInScope(scope, identifier) {
  d(scope);
  d(identifier);
  if (0 === Object.keys(scope).length) throw new ReferenceError(identifier + ' is not defined');
  if (scope.hasOwnProperty(identifier)) return scope[identifier];
  return findInScope(scope.__parent__, identifier);
};

exports.setInScope = function (scope, identifier, value) {
  scope[identifier] = value;
  return true;
};
