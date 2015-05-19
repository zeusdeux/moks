'use strict';

let math = Object.getOwnPropertyNames(Math).reduce((p, c) => {
  p[c] = Math[c];
  return p;
}, {});


module.exports = {
  print: console.log.bind(console),
  Math: math
};
