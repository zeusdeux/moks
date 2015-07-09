'use strict';

const fs        = require('fs');
const path      = require('path');
const parse     = require('./parser');
const d         = require('./util').log;
const interpret = require('./interpreter');
const pgm       = fs.readFileSync(path.resolve(__dirname, '../../test/fib.mok'), 'utf8');
const inputs    = [
  'as;',
  'asd.asdad\n',
  'Math.round\n',
  'app.test.assert\n',
  '_123;',
  '_123\n',
  '"as\dasd \t\'asdad\'\n"\n',
  '12\n',
  '123.21381720\n',
  '-10;',
  '-1231\n',
  '-10.231293;',
  '-123.2109480124\n',
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
  'let m = 10 + 20;',
  'let a = fib 10;',
  'let m = {\n  let a =  m + 10\n}\n',
  'print 5 "-" 5;',
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
  '(\\{10;})\n',
  '(\\a b {print a; print b;})\n',
  '(\\a { print a; }) 20\n',
  '(\\a {\n print a\n})\n',
  'let a = (\\x y {\nprint x\nprint y\n})\n',
  'map (\\ v { print v; }) 20\n',
  'print (fib 10);',
  'print (fib 10) 10 b c;',
  'if true {\n\tdosomething a\n} {\n\tlet t = 10\n\tdosomeotherthing t\n}\n',
  'print (2-1);',
  'a + b;',
  '1+2\n',
  '(1-213);',
  '1/2\n10*2\n',
  'true && false;',
  '1 < 20;',
  '2 == 20\n',
  '!true;',
  '2 != 20\n',
  '1 + 2 + 5 - 4 / 6 * 10;',
  '2 < 20 || 3 > 40\n',
  '(2 < 20) || (3 > 40)\n',
  '2 == 2 || 3 >= 30;',
  '2 > 10 && 3 <= 20\n',
  '2 < !(4 <= 10)\n',
  '!true && (dothiss 20);',
  '2 - boom 10\n',
  'boom 10 - 2\n',
  '(2 - boom 10)\n',
  '(boom 12-boom 20)\n',
  '(boom 10 - boom 20)\n',
  'boom 10 - boom 20 / boom 30 * boom 40\n',
  '(boom 10 - boom 20 / boom 30 * boom 40) * 200\n',
  '1-9*10\n',
  '(1-9)*10;',
  '(1 + 2) / 20\n',
  'true && (v == 10);',
  '(a == b) && ( n < 10 )\n',
  '((n == 0))\n',
  '((n==0) && (n >= 1))\n',
  '(1-2) + (2*9) / (9-8);',
  '(fib (1-1)) + (fib (1-2));',
  '(fib (n-1) + fib (n-2));',
  'fib (n-1) + fib (n-2);',
  '(2) - 2\n',
  '2 - boom (2);',
  'boom (2) - 2\n',
  'fib 10 > 20;',
  'true ? a : b\n',
  '((fib 10) > 20) ? true : (fib 40 > 10) ? false : true\n',
  'if true { print "10"; } { print "1"; }\n',
  pgm,
  'import "stdlib"\n',
  'import "boop123" as boop123\n',
  'export let fib n = {\n  print 1;\n}\n',
  'export default let a = 10;',
  'export let b = "dude"\n',
  '[1];',
  '[1 2 3 4];',
  '[\n  1\n  2\n];',
  '{:a 1};',
  '{:a 1 :b 20};',
  '{\n  :a 1\n  :b 20\n};'
];

inputs.map(function(input) {
  d(input);
  d(parse(input));
  d('\n');
});

module.exports = {
  parser: parse,
  interpreter: interpret
};

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
