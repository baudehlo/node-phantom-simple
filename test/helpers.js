'use strict';


var path = require('path');
var fs   = require('fs');


// Generate path in os tmp dir
function tmp() {
  return path.join(
      require('os').tmpdir(),
      require('crypto').randomBytes(8).toString('hex') + '.png'
  );
}

// Generate path in os tmp dir
function pdf() {
  return path.join(
      require('os').tmpdir(),
      require('crypto').randomBytes(8).toString('hex') + '.pdf'
  );
}

// Copy file to tmp dir & return new name
function toTmp(filePath) {
  var p = tmp();

  fs.writeFileSync(p, fs.readFileSync(filePath));

  return p;
}


// Delete file if exists
function unlink(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}


exports.tmp     = tmp;
exports.pdf     = pdf;
exports.toTmp   = toTmp;
exports.unlink  = unlink;
