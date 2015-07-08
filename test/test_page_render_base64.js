'use strict';


var http    = require('http');
var fs      = require('fs');
var path    = require('path');
var assert  = require('assert');
var crypto  = require('crypto');
var driver  = require('../');


describe('page', function () {
  var server;
  var verifyFilename = path.join(__dirname, 'fixtures', 'verifyrender.png');

  function fileHash(filename) {
    var shasum = crypto.createHash('sha256');
    var f = fs.readFileSync(filename);
    shasum.update(f);
    return shasum.digest('hex');
  }

  function bufferHash(buffer) {
    var shasum = crypto.createHash('sha256');
    shasum.update(buffer);
    return shasum.digest('hex');
  }

  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end('<html><head></head><body>Hello World</body></html>');
    }).listen(done);
  });

  it.skip('render base64', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.createPage(function (err, page) {
        if (err) {
          done(err);
          return;
        }

        page.open('http://localhost:' + server.address().port, function (err, status) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(status, 'success');

          page.renderBase64('png', function (err, imagedata) {
            if (err) {
              done(err);
              return;
            }

            assert.equal(bufferHash(new Buffer(imagedata, 'base64')), fileHash(verifyFilename));

            browser.on('exit', function () {
              done();
            });
            browser.exit();
          });
        });
      });
    }, {
      ignoreErrorPattern: /CoreText performance note/,
      phantomPath: require(process.env.ENGINE || 'phantomjs').path
    });
  });

  after(function (done) {
    server.close(done);
  });
});
