{
  function node(type, value, line, column) {
    //console.log(type, value);
    //return { type: type, val: value, l: line, c: column }
    return { type: type, val: value }
  }
}

start
  = Expressions+

Digit
  = [0-9]

Digits
  = digits:Digit+                                                                                      { return digits.join('') }

Alphabet
  = [a-zA-Z]

Alphabets
  = alphabets:Alphabet+                                                                                { return alphabets.join('') }

Symbol
  = [!@#$%\^&*()\-_=\+\[\]\{\}\|;:'.,<>/?\\]

Whitespace
  = [ \t]

LineTerminator
  = [\n\r]

NullLiteral
  = "null"

TrueLiteral
  = "true"

FalseLiteral
  = "false"

BooleanLiteral
  = TrueLiteral
  / FalseLiteral

Keyword
  = "let"

DoubleQuoteLiteral
  = "\\\""

WhitespaceOrLineTerminator
  = Whitespace
  / LineTerminator

Char
  = Alphabet / Digit / Symbol / Whitespace / LineTerminator

ArithmeticOperator
  = "/"                                                                                                { return node('DivisionOperator', '/') }
  / "*"                                                                                                { return node('MultiplicationOperator', '*') }
  / "+"                                                                                                { return node('AdditionOperator', '+') }
  / "-"                                                                                                { return node('SubtractionOperator', '-') }

LogicalOperator
  = "&&"                                                                                               { return node('AndOperator', '&&') }
  / "||"                                                                                               { return node('OrOperator', '||') }
  / "=="                                                                                               { return node('EqualityOperator', '==') }
  / "!="                                                                                               { return node('NotEqualOperator', '!=') }
  / "<="                                                                                               { return node('LTEOperator', '<=') }
  / ">="                                                                                               { return node('GTEOperator', '>=') }
  / "<"                                                                                                { return node('LTOperator', '<') }
  / ">"                                                                                                { return node('GTOperator', '>') }

UnaryLogicalOperator
  = "!"                                                                                                { return node('NegationOperator', '!') }

UnaryOperator
  = "+"
  / "-"

BinaryOperator
  = ArithmeticOperator
  / LogicalOperator

Operator
  = BinaryOperator
  / UnaryOperator

ReservedWord
  = Keyword
  / NullLiteral
  / BooleanLiteral
  / Operator

Integer
  = integer:(UnaryOperator?Digits)                                                                     { return parseInt(integer.join(''), 10) }


Float
  = float:(UnaryOperator?Digits"."Digits)                                                              { return parseFloat(float.join(''), 10) }


String
  = "\"" string:Char* "\""                                                                             { return node("String", string.join('')) }


Boolean
  = TrueLiteral                                                                                        { return node("Boolean", true) }
  / FalseLiteral                                                                                       { return node("Boolean", false) }

Number
  = float:Float                                                                                        { return node("Number", float) }
  / int:Integer                                                                                        { return node("Number", int) }

Identifier
  = !ReservedWord first:("_" / Alphabet)rest:("_" / Alphabet / Digit)*                                 { return node("Identifier", first+rest.join('')) }


Identifiers
  = id:Identifier Whitespace+                                                                          { return id }

Atom
  = Number
  / Boolean
  / String
  / Identifier

Block
  = "{" WhitespaceOrLineTerminator* exprs:Expressions* WhitespaceOrLineTerminator* "}"                 { return node("Block", exprs) }


AtomAssignment
  = Whitespace* "let" Whitespace+ id:Identifier Whitespace+ "=" Whitespace* atom:Atom                  { return [id, atom, "AtomAssignment"] }


BlockAssignment
  = Whitespace* "let" Whitespace+ ids:Identifiers* Whitespace* "=" Whitespace* block:Block             { return [ids, block, "BlockAssignment"] }


LambdaAssignment
  = Whitespace* "let" Whitespace+ ids:Identifiers* Whitespace* "=" Whitespace* lambda:LambdaExpression { return [ids, lambda, "LambdaAssignment"] }


AssignmentExpression
  = atomAssignment:AtomAssignment                                                                      { return node("AssignmentExpression", atomAssignment) }
  / blockAssignment:BlockAssignment                                                                    { return node("AssignmentExpression", blockAssignment) }
  / lambdaAssignment:LambdaAssignment                                                                  { return node("LambdaAssignment", lambdaAssignment) }

InvocationExpression
  = Whitespace* functionId:Identifier args:Arguments*                                                  { return node("InvocationExpression", [functionId, node("Arguments", args)]); }
  / Whitespace* lambda:LambdaExpression args:Arguments*                                                { return node("InvocationExpression", [lambda, node("Arguments", args)]) }

Argument
  = Atom
  / LambdaExpression
  / Expression
  / Block
  / "(" Whitespace* invExpr:InvocationExpression Whitespace* ")"                                       { return invExpr }
  / "(" Whitespace* atom:Atom Whitespace* ")"                                                          { return atom }

Arguments
  = Whitespace+ arg:Argument                                                                           { return arg }

LambdaExpression
  = "(" Whitespace* block:Block Whitespace* ")"                                                        { return node("LambdaExpression", [block]) }
  / "(" Whitespace* ids:Identifiers* Whitespace* block:Block Whitespace* ")"                           { return node("LambdaExpression", [ids, block]) }

OperatorExpression
  = Whitespace* binaryOp:BinaryOperator Whitespace* expr:Expression Whitespace* OperatorExpression*    { return node("OperatorExpression", [binaryOp, expr]) }
  / Whitespace* unaryOp:UnaryLogicalOperator Whitespace* expr:Expression Whitespace* OperatorExpression* { return node("OperatorExpression", [unaryOp, expr]) }

Expression
  = AssignmentExpression
  / invExpr:InvocationExpression opExpr:OperatorExpression*                                            { if (opExpr.length) return [invExpr, opExpr]; else return invExpr }
  / lambdaExpr:LambdaExpression opExpr:OperatorExpression*                                             { if (opExpr.length) return [lambdaExpr, opExpr]; else return lambdaExpr }
  / OperatorExpression
  / "(" Whitespace* expr:Expression Whitespace* ")" opExpr:OperatorExpression*                         { if (opExpr.length) return [expr, opExpr]; else return expr }
  / atom:Atom opExpr:OperatorExpression*                                                               { if (opExpr.length) return [atom, opExpr]; else return atom }

ExpressionTerminator
  = [;\n]

Expressions
  = expr:Expression? Whitespace* ExpressionTerminator Whitespace*                                       { return expr }

// start = Expressions+
