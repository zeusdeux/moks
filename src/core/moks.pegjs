{
  function node(type, value, line, column) {
    //console.log(type, value);
    //return { type: type, val: value, l: line, c: column }
    return { type: type, val: value }
  }
}

start
  = exprs:Expressions*                                                                                 { return node("Program", exprs.filter(function(e){ return !!e; })) }

Digit "Digit"
  = [0-9]

Digits "Digits"
  = digits:Digit+                                                                                      { return digits.join("") }

Alphabet "Alphabet"
  = [a-zA-Z]

Alphabets "Alphabets"
  = alphabets:Alphabet+                                                                                { return alphabets.join("") }

Symbol "Symbol"
  = [!@#$%\^&*()\-_=\+\[\]\{\}\|;:'.,<>/?\\`~]

Whitespace "Whitespace"
  = [ \t]

LineTerminator "LineTerminator"
  = [\n\r]

NullLiteral "NullLiteral"
  = "null"

TrueLiteral "TrueLiteral"
  = "true"

FalseLiteral "FalseLiteral"
  = "false"

BooleanLiteral "BooleanLiteral"
  = TrueLiteral
  / FalseLiteral

Keyword "Keyword"
  = "let"

WhitespaceOrLineTerminator "WhitespaceOrLineTerminator"
  = Whitespace
  / LineTerminator

Char "Char"
  = Alphabet / Digit / Symbol / Whitespace / LineTerminator

ArithmeticOperator "ArithmeticOperator"
  = "/"                                                                                                { return node("DivisionOperator", "/") }
  / "*"                                                                                                { return node("MultiplicationOperator", "*") }
  / "+"                                                                                                { return node("AdditionOperator", "+") }
  / "-"                                                                                                { return node("SubtractionOperator", "-") }

LogicalOperator "LogicalOperator"
  = "&&"                                                                                               { return node("AndOperator", "&&") }
  / "||"                                                                                               { return node("OrOperator", "||") }
  / "=="                                                                                               { return node("EqualityOperator", "==") }
  / "!="                                                                                               { return node("InequalityOperator", "!=") }
  / "<="                                                                                               { return node("LTEOperator", "<=") }
  / ">="                                                                                               { return node("GTEOperator", ">=") }
  / "<"                                                                                                { return node("LTOperator", "<") }
  / ">"                                                                                                { return node("GTOperator", ">") }

UnaryLogicalOperator "UnaryLogicalOperator"
  = "!"                                                                                                { return node("NegationOperator", "!") }

UnaryOperator "UnaryOperator"
  = "+"
  / "-"

BinaryOperator "BinaryOperator"
  = ArithmeticOperator
  / LogicalOperator

Operator "Operator"
  = BinaryOperator
  / UnaryOperator

ReservedWord "ReservedWord"
  = Keyword
  / FutureKeyword
  / NullLiteral
  / BooleanLiteral

FutureKeyword "FutureKeyword"
  = "export"
  / "import"
  / "default"
  / "nil"

Integer "Integer"
  = integer:(UnaryOperator?Digits)                                                                     { return parseInt(integer.join(""), 10) }

Float "Float"
  = float:(UnaryOperator?Digits"."Digits)                                                              { return parseFloat(float.join(""), 10) }

String "String"
  = "\"" string:Char* "\""                                                                             { return node("String", string.join("")) }

Boolean "Boolean"
  = TrueLiteral                                                                                        { return node("Boolean", true) }
  / FalseLiteral                                                                                       { return node("Boolean", false) }

Number "Number"
  = float:Float                                                                                        { return node("Number", float) }
  / int:Integer                                                                                        { return node("Number", int) }

Identifier "Identifier"
  = !ReservedWord first:("_" / Alphabet)rest:IdentifierTail*                                           { return node("Identifier", first+rest.join("")) }

IdentifierTail "IdentifierTail"
  = dot:"."? rest:("_" / Alphabet / Digit)                                                             { if (dot) return dot+rest; else return rest; }

Identifiers "Identifiers"
  = Whitespace+ id:Identifier                                                                          { return id }

Array "Array"
  = Whitespace* "[" WhitespaceOrLineTerminator* atoms:Atoms* WhitespaceOrLineTerminator* "]"           { return node("Array", atoms) }
  / Whitespace* "[" WhitespaceOrLineTerminator*
    atoms:Atoms* lastAtom:Atom WhitespaceOrLineTerminator* "]"                                         { return node("Array", atoms.push(lastAtom) && atoms) }

HashMap "HashMap"
  = Whitespace* "{" WhitespaceOrLineTerminator* keyVal:KeyVal*  WhitespaceOrLineTerminator* "}"        { return node("HashMap", keyVal) }
  / Whitespace* "{" WhitespaceOrLineTerminator* keyVal:KeyVal*
    ":"key:(Alphabet / Digit / Symbol)* Whitespace+ val:Atom WhitespaceOrLineTerminator* "}"           { return node("HashMap", keyVal.push([node("Key", key.join("")), val]) && keyVal) }

KeyVal "KeyVal"
  = ":"key:(Alphabet / Digit / Symbol)* Whitespace+ val:Atom WhitespaceOrLineTerminator+               { return [node("Key", key.join("")), val] }

NilLiteral "NilLiteral"
  = "nil"

Nil "Nil"
  = nil:NilLiteral                                                                                     { return node("Nil", null) }

Atom "Atom"
  = Nil
  / Number
  / Boolean
  / String
  / Array
  / HashMap
  / Identifier

Atoms "Atoms"
  = atom:Atom WhitespaceOrLineTerminator+                                                              { return atom }

Block "Block"
  = "{" WhitespaceOrLineTerminator* exprs:Expressions* WhitespaceOrLineTerminator* "}"                 { return node("Block", exprs) }

AtomAssignment "AtomAssignment"
  = Whitespace* "let" Whitespace+ id:Identifier Whitespace* "=" Whitespace* atom:Atom                  { return node("AtomAssignment", [id, atom]) }

// the whitespace before and between ids is encoded in the Identifiers rule
BlockAssignment "BlockAssignment"
  = Whitespace* "let" ids:Identifiers+ Whitespace* "=" Whitespace* block:Block                         { return node("BlockAssignment", [ids, block]) }

OperatorAssignment "OperatorAssignment"
  = Whitespace* "let" Whitespace+ id:Identifier Whitespace* "=" Whitespace* opExpr:OperatorExpression  { return node("OperatorAssignment", [id, opExpr]) }

InvocationAssignment "InvocationAssignment"
  = Whitespace* "let" Whitespace+ id:Identifier Whitespace* "=" Whitespace* invExpr:InvocationExpression { return node("InvocationAssignment", [id, invExpr]) }

AssignmentExpression "AssignmentExpression"
  = operatorAssignment:OperatorAssignment                                                              { return node("AssignmentExpression", operatorAssignment) }
  / invocationAssignment:InvocationAssignment                                                          { return node("AssignmentExpression", invocationAssignment) }
  / atomAssignment:AtomAssignment                                                                      { return node("AssignmentExpression", atomAssignment) }
  / blockAssignment:BlockAssignment                                                                    { return node("AssignmentExpression", blockAssignment) }

InvocationExpression "InvocationExpression"
  = Whitespace* functionId:Identifier args:Arguments*                                                  { return node("InvocationExpression", [functionId, node("Arguments", args)]); }
  / Whitespace* lambda:LambdaExpression args:Arguments*                                                { return node("InvocationExpression", [lambda, node("Arguments", args)]) }

Argument "Argument"
  = Atom
  / LambdaExpression
  / Block
  / "(" Whitespace* !AssignmentExpression expr:Expression Whitespace* ")"                              { return expr }

Arguments
  = Whitespace+ arg:Argument                                                                           { return arg }

LambdaExpression "LambdaExpression"
  = "(\\" Whitespace* first:Identifier rest:Identifiers* Whitespace* block:Block Whitespace* ")"       { return node("LambdaExpression", [[first].concat(rest), block]) }
  / "(\\" Whitespace* block:Block Whitespace* ")"                                                      { return node("LambdaExpression", [block]) }

OperatorExpression "OperatorExpression"
  = Whitespace* arg1:OpArgument Whitespace* rest:FromOpExpression+                                     { return node("BinaryOperatorExpression", [arg1].concat(rest[0])) }
  / Whitespace* unaryOp:UnaryLogicalOperator expr:OpArgument Whitespace* rest:FromOpExpression*        { return node("UnaryOperatorExpression", [unaryOp, expr].concat(rest)) }
  / Whitespace* predicate:OpArgument Whitespace* "?" Whitespace*
    trueExpr:(Block / Expression) Whitespace* ":" Whitespace* falseExpr:(Block / Expression)           { return node("TernaryOperatorExpression", [predicate, trueExpr, falseExpr]) }

OpArgument "OpArgument"
  = InvocationExpression
  / Atom
  / "(" Whitespace* expr:Expression Whitespace* ")"                                                    { return expr }

FromOpExpression "FromOpExpression"
  = Whitespace* binaryOp:BinaryOperator Whitespace* expr:Expression Whitespace*                        { return [binaryOp, expr] }

CommentExpression "CommentExpression"
  = Whitespace* "//" Whitespace* comment:CommentContent*                                               { return node("CommentExpression", comment.join("")) }

CommentContent = !LineTerminator comment:.                                                             { return comment }

// temporarily making "as" required
ImportExpression "ImportExpression"
  = Whitespace* "import" Whitespace+ moduleName:String asId:ImportAsExpression                         { if (asId) return node("ImportExpression", [moduleName, asId]);
                                                                                                         else return node("ImportExpression", [moduleName]) }

ImportAsExpression "ImportAsExpression"
  = Whitespace+ "as" Whitespace+ id:Identifier                                                         { return id }

// ExportExpression "ExportExpression"
//   = Whitespace* "export" Whitespace+ def:ExportDefault? assignmentExpr:AssignmentExpression            { if (def) return node("DefaultExportExpression", assignmentExpr);
//                                                                                                         else return node("SimpleExportExpression", assignmentExpr) }

// ExportDefault "ExportDefault"
//   = def:"default"? Whitespace+                                                                         { return !!def }

Expression "Expression"
  = AssignmentExpression
  / opExpr:OperatorExpression                                                                          { return opExpr }
  / invExpr:InvocationExpression                                                                       { return invExpr }
  / importExpr:ImportExpression                                                                        { return importExpr }
//  / exportExpr:ExportExpression                                                                        { return exportExpr }
  / atom:Atom                                                                                          { return atom }
  / "(" Whitespace* expr:Expression Whitespace* ")"                                                    { return expr }

ExpressionTerminator "ExpressionTerminator"
  = [;\n]

Expressions
  = expr:Expression? Whitespace* CommentExpression? Whitespace* ExpressionTerminator Whitespace*       { return expr }

// notice how nothing is done with CommentExpression in the rule above. That basically to rid the AST of all commments
// They are simply ignored.

// start = Expressions*
