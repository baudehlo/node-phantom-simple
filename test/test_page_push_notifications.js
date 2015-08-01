'use strict';


var http    = require('http');
var assert  = require('assert');
var driver  = require('../');


describe('push notifications', function () {
  var server;

  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('<html><head><script>window.callPhantom({ msg: "callPhantom" }); conXsole.log("cause-an-error");</script></head><body><h1>Hello World</h1></body></html>');
    }).listen(done);
  });


  it('onConsoleMessage', function (done) {
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


        page.onConsoleMessage = function (msg) {
          assert.ok(/Test console message/.test(String(msg)));

          browser.exit(done);
        };

        page.evaluate(function () {
          /*eslint-disable no-console*/
          console.log('Test console message');
        }, function (err) {
          if (err) {
            done(err);
            return;
          }
        });
      });
    });
  });


  it('onCallback', function (done) {
    var url = 'http://localhost:' + server.address().port + '/';

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


        page.onCallback = function (msg) {
          assert.deepEqual(msg, { msg: 'callPhantom' });

          browser.exit(done);
        };

        page.open(url, function (err, status) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(status, 'success');
        });
      });
    });
  });


  it('onError', function (done) {
    var url = 'http://localhost:' + server.address().port + '/';

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


        page.onError = function (msg) {
          assert.ok(/conXsole/.test(String(msg)));

          browser.exit(done);
        };

        page.open(url, function (err, status) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(status, 'success');
        });
      });
    });
  });


  it('onUrlChanged', function (done) {
    var url = 'http://localhost:' + server.address().port + '/';

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


        page.onUrlChanged = function (newUrl) {
          assert.equal(newUrl, url);

          browser.exit(done);
        };

        page.open(url, function (err, status) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(status, 'success');
        });
      });
    });
  });


  it('onLoadStarted', function (done) {
    var url = 'http://localhost:' + server.address().port + '/';

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

        page.onLoadStarted = function () {
          browser.exit(done);
        };

        page.open(url, function (err, status) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(status, 'success');
        });
      });
    });
  });


  it('onLoadFinished', function (done) {
    var url = 'http://localhost:' + server.address().port + '/';

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

        page.onLoadFinished = function () {
          browser.exit(done);
        };

        page.open(url, function (err, status) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(status, 'success');
        });
      });
    });
  });


  it('onResourceReceived', function (done) {
    var url = 'http://localhost:' + server.address().port + '/';

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

        page.onResourceReceived = function (res) {
          if (res.stage === 'end') {
            browser.exit(done);
          }
        };

        page.open(url, function (err, status) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(status, 'success');
        });
      });
    });
  });


  after(function (done) {
    server.close(done);
  });
});
