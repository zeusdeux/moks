'use strict';

// Math doesn't expose any properties
// So we force it to list its non-enumerable props and then
// add it to a simple object and store it onto Math

module.exports = Object.getOwnPropertyNames(Math).reduce((p, c) => {
  p[c] = Math[c];
  return p;
}, {});
