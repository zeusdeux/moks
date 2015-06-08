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


// left recursion elimination as per http://web.cs.wpi.edu/~kal/PLT/PLT4.1.2.html
// E = EopE | (E)E | A

// E = AE'
// E' = EopEE' | (E)EE'
