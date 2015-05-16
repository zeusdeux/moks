# moks
An interpreted language that I am writing [@recursecenter](https://github.com/recursecenter).

Sample program in `moks`:

```moks
let fib n = {
  ((n == 0) || (n == 1))? {
    1
  } : {
    fib (n-1) + fib (n-2)
  }
}

print (fib 10) // should be 89

```
Either semicolons *OR* newlines terminate lines. Do not use both or my parser will throw a cryptic error.

## Play with it

```javascript
npm i -g moks
```
This should install the `moks` interpreter globally.

You can then run `moks <path to .mok file>` or `moks -e "<expressions in valid moks syntax>"`.

For e.g.,:

```moks
moks ./fib.mok
moks -e "let add x y = {  x + y; }; print (add 2 3);"
```

## Future plans

Things/features I plan to experiment with in the future:

- FFI to Javascript
- support arrays & maps
- module system
- error handling
- marking side effects syntactically
- runtime optimizations
- stack based runtime (currently uses the underlying js runtime stack)
- macros
- simple type system
- pausable and rewindable code editing

Also, if you use emacs, [here's](https://github.com/zeusdeux/moks-mode) a simple emacs major mode for [moks](https://github.com/zeusdeux/moks).
