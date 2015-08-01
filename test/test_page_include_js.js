'use strict';


var http    = require('http');
var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  var server;

  before(function (done) {
    server = http.createServer(function (request, response) {
      if (request.url === '/test.js') {
        response.writeHead(200, { 'Content-Type': 'text/javascript' });
        response.end('document.getElementsByTagName("h1")[0].innerText="Hello Test";');
      } else {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end('<html><head></head><body><h1>Hello World</h1></body></html>');
      }
    }).listen(done);
  });

  it('includeJs', function (done) {
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

            assert.equal(status, 'success', 'Status is success');

            page.includeJs('http://localhost:' + server.address().port + '/test.js', function (err) {
              if (err) {
                done(err);
                return;
              }

              page.evaluate(function () {
                return [ document.getElementsByTagName('h1')[0].innerText, document.getElementsByTagName('script').length ];
              }, function (err, result) {
                if (err) {
                  done(err);
                  return;
                }

                assert.equal(result[0], 'Hello Test', 'Script was executed');
                assert.equal(result[1], 1, 'Added a new script tag');

                browser.exit(done);
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
