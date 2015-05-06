exports.createScope = function(obj, parentScope) {
  return (obj.__parent__ = parentScope) && obj;
};

exports.findInScope = function findInScope(scope, identifier) {
  if ({} === scope) return void 0;
  if (scope.hasOwnProperty(identifier)) return scope[identifier];
  return findInScope(scope.__parent__, identifier);
};

exports.setInScope = function (scope, identifier, value) {
  scope[identifier] = value;
  return true;
};
