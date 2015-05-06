var d = require('./util').log;
var scope = require('./scope');
var atom = ['Number', 'Boolean', 'String', 'Identifier'];
var ops = ['DivisionOperator', 'MultiplicationOperator', 'AdditionOperator', 'SubtractionOperator', 'AndOperator', 'OrOperator', 'EqualityOperator', 'NotEqualOperator', 'LTEOperator', 'GTEOperator', 'LTOperator', 'GTOperator', 'NegationOperator', 'UnaryOperator'];


function traverse(root) {
  d(root.type);
  if (
    atom.indexOf(root.type) > -1 ||
    ops.indexOf(root.type) > -1
  ) {
    console.log(root.val);
    return;
  }
  if (Array.isArray(root.val)) {
    root.val.forEach(function(v) {
      traverse(v);
    });
  }
  // else it's an object
  else traverse(root.val);
}

function interpret(ast) {
  d(ast);
  traverse(ast);
}

module.exports = interpret;
