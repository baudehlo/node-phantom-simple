'use strict';


var http    = require('http');
var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  var server;

  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('<html><head></head><body>Hello World</body></html>');
    }).listen(done);
  });

  it('open', function (done) {
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

            browser.exit(done);
          });
        });
      }
    );
  });

  after(function (done) {
    server.close(done);
  });
});
