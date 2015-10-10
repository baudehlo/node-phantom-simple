'use strict';


var http    = require('http');
var fs      = require('fs');
var assert  = require('assert');
var helpers = require('./helpers');
var driver  = require('../');


describe('page', function () {
  var server;
  var testFileName = helpers.tmp();
  var testPDF = helpers.pdf();

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

  it('render to pdf with header and foot', function (done) {
    driver.create(
        { ignoreErrorPattern: /CoreText performance note/, path: require(process.env.ENGINE || 'phantomjs').path },
        function (err, browser) {
          var phantom = browser;
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

              page.render(testPDF, function (err) {
                if (err) {
                  done(err);
                  return;
                }

                var statWithoutHeaderFooter = fs.statSync(testPDF);

                // Relaxed check to work in any browser/OS
                // We should have image and this image should be > 0 bytes.
                assert.ok(statWithoutHeaderFooter.size > 1000, 'generated pdf too small');


                var paperSize = {
                  format: 'A4',
                  margin: '1cm',
                  header: {
                    height: '2cm',
                    contents: phantom.callback(function(pageNum, numPages) {
                      return '<h1>Header ' + pageNum + ' / ' + numPages + '</h1>';
                    })
                  },
                  footer: {
                    height: '2cm',
                    contents: phantom.callback(function(pageNum, numPages) {
                      return '<h1>Footer ' + pageNum + ' / ' + numPages + '</h1>';
                    })
                  }
                };

                page.set('paperSize', paperSize, function() {
                  page.render(testPDF, {
                    format: 'pdf',
                    quality: '100'
                  }, function (err) {
                    if (err) {
                      done(err);
                      return;
                    }

                    var statWithHeaderFooter = fs.statSync(testPDF);


                    // Relaxed check to work in any browser/OS
                    // We should have image and this image should be > 0 bytes.
                    assert.ok(statWithHeaderFooter.size > 2000, 'generated pdf (header/footer) too small');

                    assert.ok(statWithHeaderFooter.size > statWithoutHeaderFooter.size, 'generated pdf with header & footer can not be smaller than generated pdf without header & footer');
                    browser.exit(done);
                  });

                });

              });
            });
          });
        }
    );
  });

  after(function (done) {
    helpers.unlink(testFileName);
    helpers.unlink(testPDF);
    server.close(done);
  });
});
