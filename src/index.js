var fs = require('fs');
var peg = require('pegjs');
var inspect = require('util').inspect;
var path = require('path');
var pegParse = peg.buildParser(
  fs.readFileSync(path.join(__dirname, '/moo.pegjs'), 'utf8')
).parse;
var d = function(input, depth) {
  console.log(inspect(input, {depth: depth || 100}));
};

// let a = !{ print a } -> unsafe block since io
console.log('let a = {10; 20;}\nlet b = 20');
var parsed = pegParse('let a = {10; 20;}\nlet b = 20');

d(parsed);

//module.exports = pegParse(process.argv[2]);


/*
// program containing only a literal or identifer
1
// declarations
let if p then else = {
  p == true ? then : else
}
1
let a = 1
let b x y z = {
  let c = 10

  if (c == 10) {
    print a c x y z
  } {
    print "boo!"
  }
}

// name function
let b = (x y z {

})

// function invocation
b 1 2 3

// lambda
(a { print a }) 10 //should ouput 10
(a { let a = 10; print a; print 5 })
(a {
  let a = 10
  print a
  print 5
})

letDeclaration
  = _* "let" _+ idList:identifierListItem+ "=" _* "{" block:block "}" _*
  { return console.log('let', idList, block) }

lambdaDeclaration
  = _* "(" _* idList:identifierListItem+ _* "{" block:block "}"  _* ")"
  { return console.log('lambda', idList, block) }

block
  = exprs:exprGrouped*
  / exprs:blockParen
  {  console.log(exprs); return exprs }

blockParen
  = "{" _* block:block _* "}"
  { return block }

exprGrouped
  = _* expr:expr [\;\n]? _*
  { return expr }
*/
