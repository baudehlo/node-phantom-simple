'use strict';


var http    = require('http');
var fs      = require('fs');
var assert  = require('assert');
var helpers = require('./helpers');
var driver  = require('../');


describe('page', function () {
  var server;
  var testFileName = helpers.tmp();


  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('<html><head></head><body>Hello World</body></html>');
    }).listen(done);
  });


  it('render to binary & base64', function (done) {
    driver.create(
      { ignoreErrorPattern: /CoreText performance note/, path: require(process.env.ENGINE || 'phantomjs').path },
      function (err, browser) {
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

            page.render(testFileName, function (err) {
              if (err) {
                done(err);
                return;
              }

              var stat = fs.statSync(testFileName);

              // Relaxed check to work in any browser/OS
              // We should have image and this image should be > 0 bytes.
              assert.ok(stat.size > 100, 'generated image too small');


              page.renderBase64('png', function (err, imagedata) {
                if (err) {
                  done(err);
                  return;
                }

                // Base64 decoded image should be the same (check size only)
                assert.equal((new Buffer(imagedata, 'base64')).length, stat.size);

                browser.exit(done);
              });
            });
          });
        });
      }
    );
  });


  after(function (done) {
    helpers.unlink(testFileName);
    server.close(done);
  });
});
