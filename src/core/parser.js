var fs   = require('fs');
var path = require('path');
var peg  = require('pegjs');


module.exports = peg.buildParser(
  fs.readFileSync(path.join(__dirname, './moks.pegjs'), 'utf8')
).parse;
