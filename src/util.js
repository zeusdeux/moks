var inspect = require('util').inspect;


exports.log = function(input, depth) {
  if ('*' !== process.env.DEBUG) return;
  if ('string' === typeof input && input.indexOf('\n') > -1) console.log(input);
  else console.log(inspect(input, { colors: true, showHidden: false, depth: depth || null }));
};
