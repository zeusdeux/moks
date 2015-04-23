{
  function node(type, value, line, column) {
    //console.log(type, value);
    //return { type: type, val: value, l: line, c: column }
    return { type: type, val: value }
  }
}

start = Expressions+

Digit
  = [0-9]

Digits
  = digits:Digit+
  { return digits.join('') }

Alphabet
  = [a-zA-Z]

Alphabets
  = alphabets:Alphabet+
  { return alphabets.join('') }

Symbol
  = [!@#$%\^&*()\-_=\+\[\]\{\}\|;:'.,<>/?\\]

Whitespace
  = [ \t]

LineTerminator
  = [\n\r]

DoubleQuoteLiteral
  = "\\\""

WhitespaceOrLineTerminator
  = Whitespace
  / LineTerminator

Char
  = Alphabet / Digit / Symbol / Whitespace / LineTerminator

Integer
  = integer:Digits
  { return parseInt(integer, 10) }

Float
  = float:(Digits"."Digits)
  { return parseFloat(float.join(''), 10) }

String
  = "\"" string:Char* "\""
  { return node("String", string.join('')) }

Boolean
  = "true"  { return node("Boolean", true) }
  / "false" { return node("Boolean", false) }

Number
  = float:Float { return node("Number", float) }
  / int:Integer { return node("Number", int) }

Identifier
  = first:("_" / Alphabet)rest:("_" / Alphabet / Digit)*
  { return node("Identifier", first+rest.join('')) }

Identifiers
  = id:Identifier Whitespace+
  { return id }

Atom
  = Number
  / Boolean
  / String
  / Identifier

Block
  = "{" WhitespaceOrLineTerminator* exprs:Expressions* WhitespaceOrLineTerminator* "}"
  { return node("Block", exprs) }

AtomAssignment
  = Whitespace* "let" Whitespace+ id:Identifier Whitespace+ "=" Whitespace* atom:Atom
  { return [id, atom, "AtomAssignment"] }

BlockAssignment
  = Whitespace* "let" Whitespace+ ids:Identifiers* Whitespace* "=" Whitespace* block:Block
  { return [ids, block, "BlockAssignment"] }

AssignmentExpression
  = atomAssignment:AtomAssignment   { return node("AssignmentExpression", atomAssignment) }
  / blockAssignment:BlockAssignment { return node("AssignmentExpression", blockAssignment) }

InvocationExpression
  = Whitespace* functionId:Identifier args:Arguments*
  { return node("InvocationExpression", [functionId, args]) }

Argument
  = Atom
  / "(" Whitespace* invExpr:InvocationExpression Whitespace* ")" { return invExpr }
  / "(" Whitespace* atom:Atom Whitespace* ")" { return atom }

Arguments
  = Whitespace+ arg:Argument
  { return arg }

Expression
  = AssignmentExpression
  / InvocationExpression
  / "(" Whitespace* expr:Expression Whitespace* ")" { return expr }
  / Atom

ExpressionTerminator
  = [;\n]

Expressions
  = expr:Expression Whitespace* ExpressionTerminator Whitespace* { return expr }

// start = Expressions+
