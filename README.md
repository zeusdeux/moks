# moks
An interpreted language that I am writing @recursecenter

Sample program in `moks`:

```moks
let fib n = {
  (n == 0 || n == 1)? {
     1
  } : {
     fib (n-1) + fib (n-2)
  }
}

print (fib 10)

```

Things/features I plan to experiment with in the future:

- FFI to Javascript
- module system
- marking side effects syntactically
- calls into javascript
- runtime optimizations
- stack based runtime (currently uses the underlying js runtime stack)
- macros
- simple type system
- pausable and rewindable code editing

Also, if you use emacs, [here's](https://github.com/zeusdeux/moks-mode) a simple emacs major mode for [moks](https://github.com/zeusdeux/moks).
