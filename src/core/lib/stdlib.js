'use strict';

module.exports = {
  print: console.log.bind(console),
  push: function(list, val, key) {
    if (Array.isArray(list)) {
      list.push(val);
      return list;
    }
    if ('object' === typeof list && null !== list) {
      if (!key) throw new SyntaxError('push needs a key as the last arg when used with a hashmap');
      list[key] = val;
      return list;
    }
    throw new SyntaxError('push can only be used with arrays and hashmaps');
  },
  pop: function(list) {
    if (Array.isArray(list)) return list.pop();
    throw new SyntaxError('pop can only be used with arrays');
  }
};
