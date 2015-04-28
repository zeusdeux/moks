# moks
An interpreted language written @recursecenter

I don't get the name either.

Sample program in `moo`:

```moo
let fib n = {
  if (n == 0 || n == 1) {
     1
  } {
     fib (n-1) + fib (n-2)
  }
}

print (fib 10)

```

kthxbye
