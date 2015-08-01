'use strict';


var http    = require('http');
var path    = require('path');
var assert  = require('assert');
var helpers = require('./helpers');
var driver  = require('../');


describe('page', function () {
  var server;
  var gotFile = false;

  before(function (done) {
    server = http.createServer(function (request, response) {
      if (request.url === '/upload') {
        request.on('data', function (buffer) {
          gotFile = buffer.toString('ascii').indexOf('Hello World') > 0;
        });
      } else {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end('<html><head></head><body><form id="testform" action="/upload" method="post" enctype="multipart/form-data"><input id="test" name="test" type="file"></form></body></html>');
      }
    }).listen(done);
  });

  it('uploadFile', function (done) {
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

            var filePath = helpers.toTmp(path.join(__dirname, 'fixtures', 'uploadtest.txt'));

            page.uploadFile('input[name=test]', filePath, function (err) {
              if (err) {
                helpers.unlink(filePath);
                done(err);
                return;
              }

              page.evaluate(function () {
                document.forms.testform.submit();
              }, function (err) {
                if (err) {
                  helpers.unlink(filePath);
                  done(err);
                  return;
                }

                setTimeout(function () {
                  assert.ok(gotFile);

                  helpers.unlink(filePath);
                  browser.exit(done);
                }, 100);
              });
            });
          });
        });
      }
    );
  });

  after(function (done) {
    server.close(done);
  });
});
