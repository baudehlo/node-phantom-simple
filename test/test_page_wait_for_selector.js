'use strict';


var http    = require('http');
var assert  = require('assert');
var driver  = require('../');


describe('page.waitForSelector()', function () {
  var server;

  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('<html><head>' +
        '<script>' +
        'setTimeout(function() {' +
        'document.querySelector("body").innerHTML = "<div id=\'test\'></div>";' +
        '}, 300);' +
        '</script>' +
        '</head><body></body></html>');
    }).listen(done);
  });


  it('callback is last', function (done) {
    driver.create({ path: require(process.env.ENGINE || 'phantomjs').path }, function (err, browser) {
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

          page.waitForSelector('#test', 2000, function (err) {
            if (err) {
              done(err);
              return;
            }

            browser.exit(done);
          });
        });
      });
    });
  });


  it('callback without timeout', function (done) {
    driver.create({ path: require(process.env.ENGINE || 'phantomjs').path }, function (err, browser) {
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

          page.waitForSelector('#test', function (err) {
            if (err) {
              done(err);
              return;
            }

            browser.exit(done);
          });
        });
      });
    });
  });


  it('callback before timeout (legacy style)', function (done) {
    driver.create({ path: require(process.env.ENGINE || 'phantomjs').path }, function (err, browser) {
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

          page.waitForSelector('#test', function (err) {
            if (err) {
              done(err);
              return;
            }

            browser.exit(done);
          }, 2000);
        });
      });
    });
  });


  after(function (done) {
    server.close(done);
  });
});
