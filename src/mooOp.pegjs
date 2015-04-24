start = E+

Atom
  = [a-z]+
I
  = "[" E "]"
E
  = "(" E ")" EPrime*
  / I EPrime*
  / Atom EPrime*

EPrime
  = "&&" E EPrime*

// E = EopE | (E)E | A

// E = AE'
// E' = EopEE' | (E)EE'
