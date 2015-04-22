{
  function node(type, value, line, column) {
    //console.log(type, value);
    return { type: type, val: value, l: line, c: column }
  }
}

start
  = block:block
  { return node("Start", block, line, column) }

block
  = safeBlockParen
  / unsafeBlockParen
  / statements:statement*
  { return node("Block", statements, line, column) }

// pure stuff in this block
safeBlockParen
  = "{" _* block:block _* "}"
  { return node("SafeBlock", block, line, column) }

// io stuff in this kinda block
unsafeBlockParen
  = "!{" _* block:block _* "}"
  { return node("UnsafeBlock", block, line, column) }

statement
  = _* expr:expr [\;\n]? _*
  { return node("Statement", expr, line, column) }

expr
  = expr:declaration
  / expr:atom
  / "(" expr:expr ")"
  { return node("Expression", expr, line, column) }

declaration
  = _* "let" _+ ids:ids+ _* "=" _* block:block _*
  { return node("Declaration", [ids, block], line, column) }

id
  = id:[a-zA-Z]+
  { return node("Identifier", id.join(''), line, column) }

ids
  = id:id _+
  { return id }

atom
  = number
  / string
  / bool
  / id

number
  = num:float
  / num:integer
  { return node("Number", num, line, column) }

integer
  = digits

float
  = float:(digits"."digits)
  { return parseFloat(float.join(''), 10) }

digits
  = digit:digit+
  { return parseInt(digit.join(''), 10) }

digit
  = digit:[0-9]

string
  = "\"" val:char* "\""
  { return node("String", val.join(''), line, column) }

any
  = .

char
  = [a-zA-Z0-9_!@#$%^&*()\-=\+\{\}\[\]\\|]

bool
  = val:"true"i
  / val:"false"i
  {
    if ("true" === val) return node("Bool", true, line, column)
    else if ("false" === val) return node("Bool", false, line, column)
  }_
 = [ \t\r]
