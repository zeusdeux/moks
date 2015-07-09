const fs   = require('fs');
const path = require('path');
const peg  = require('pegjs');


module.exports = peg.buildParser(
  fs.readFileSync(path.join(__dirname, './moks.pegjs'), 'utf8')
).parse;
