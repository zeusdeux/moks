'use strict';

const clone = require('clone');


module.exports = {
  print: console.log.bind(console),
  push: function(list, val, key) {
    if (Array.isArray(list)) {
      let tempList = list.slice(0);

      tempList.push(val);
      return tempList;
    }
    if ('object' === typeof list && null !== list) {
      let tempMap = clone(list);

      if (!key) throw new SyntaxError('push needs a key as the last arg when used with a hashmap');
      tempMap[key] = val;
      return tempMap;
    }
    throw new SyntaxError('push can only be used with arrays and hashmaps');
  },
  pop: function(list) {
    let tempList = list.slice(0);

    if (Array.isArray(list)) return tempList.pop();
    throw new SyntaxError('pop can only be used with arrays');
  },
  map: function(fn, list) {
    if('function' === typeof fn) {
      if (Array.isArray(list)) return list.map(fn);
      throw new SyntaxError('map needs an array as its second parameter');
    }
    else throw new SyntaxError('map needs a function as first parameter');
  }
};
