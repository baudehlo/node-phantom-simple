'use strict';


var http    = require('http');
var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  var server;

  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, { "Content-Type": 'text/html' });
      response.end('<html><head></head><body><h1>Hello World</h1></body></html>');
    }).listen(done);
  });

  it('evaluate', function (done) {
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

          page.evaluate(function () {
            return { h1text: document.getElementsByTagName('h1')[0].innerText };
          }, function (err, result) {
            if (err) {
              done(err);
              return;
            }

            assert.equal(result.h1text, 'Hello World');

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
