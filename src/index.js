var fs = require('fs');
var peg = require('pegjs');
var inspect = require('util').inspect;
var path = require('path');
var pegParse = peg.buildParser(
  fs.readFileSync(path.join(__dirname, '/moo.pegjs'), 'utf8')
).parse;
var d = function(input, depth) {
  if ('string' === typeof input && input.indexOf('\n') > -1) console.log(input);
  else console.log(inspect(input, { colors: true, showHidden: false, depth: depth || null }));
};



// let a = !{ print a } -> unsafe block since io
//console.log('let a = {10; 20;}\nlet b = "omgwtfbbq"\nlet c = true');
//var parsed = pegParse('let a = {10; 20;}\nlet b = "omgwtfbbq";let c = true');
var inputs = [
  '_123;',
  '_123\n',
  '"as\dasd \t\'asdad\'\n"\n',
  '12\n',
  '123.21381720\n',
  'true\n',
  'false\n',
  'let a = "mudit"\n',
  'let a = { 10; 20; }\n',
  'let a b c = { 10; }\n',
  'let a b c = {\n10\n}\n',
  'let a b c = { 10; 20; }\n',
  'let a b c = {\n10\n20\n}\n',
  'let a = 10; let b = "dude"; let x y z = { "lol"; true; }\n',
  'let a = 10\nlet b = "dude"\nlet x y z = {\n"lol"\ntrue\n}\n',
  'print 10;',
  'print 10 20;',
  'print 10 20\n',
  'print a b;',
  'print a b\n',
  'print a "asd";',
  'print 10 "asd"\n',
  'print true a\n',
  'let a = 10; let b x y = { print x y; }; b a 20;',
  'let a = 10\nlet b x y = { print x y; }\nb a 20\n',
  'let a b c = { print b c; }\na (10) 20\n',
  'let forever = { forever; }; forever;',
  '(10);',
  '(a { print a; }) 20\n',
  '(a {\n print a\n})\n',
];

inputs.map(function(input) {
  d(input);
  d(pegParse(input));
  d('\n');
});


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
  { return console.log('let',
  idList, block) }

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
