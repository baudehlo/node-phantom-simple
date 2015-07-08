'use strict';


var http    = require('http');
var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  var server;

  before(function (done) {
    server = http.createServer(function (request, response) {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end('<html><head><script>window.callPhantom({ msg: "callPhantom" }); conXsole.log("cause-an-error");</script></head><body><h1>Hello World</h1></body></html>');
    }).listen(done);
  });

  it('push notifications', function (done) {
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

        var events = registerCallbacks(page);

        page.open(url, function (err, status) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(status, 'success');

          page.evaluate(function () {
            console.log('POW');
            console.log('WOW');
          }, function (err) {
            if (err) {
              done(err);
              return;
            }

            assert.equal(events.onLoadStarted.length, 1);
            assert.deepEqual(events.onUrlChanged, [url]);
            assert.equal(events.onResourceRequested.length, 1);
            assert.equal(events.onResourceReceived.length, 2);
            assert.equal(events.onResourceReceived[0].stage, 'start');
            assert.equal(events.onResourceReceived[1].stage, 'end');

            assert.deepEqual(events.onCallback, [{ msg: "callPhantom" }]);
            assert.deepEqual(events.onConsoleMessage, ['POW', 'WOW']);

            // console.log(JSON.stringify(events.onError));
            assert.equal(events.onError.length, 1);
            assert.equal(events.onError[0].length, 2);

            var error = events.onError[0];

            assert.ok(/variable: conXsole/.test(error[0]));
            assert.equal(error[1][0].line, 1);

            events.onConsoleMessage = [];

            page.evaluate(function (a, b) {
              console.log(a);
              console.log(b);
            }, function (err) {
              if (err) {
                done(err);
                return;
              }

              assert.deepEqual(events.onConsoleMessage, ['A', 'B']);

              browser.createPage(function (err, page) {
                if (err) {
                  done(err);
                  return;
                }

                page.onLoadFinished = function () {
                  assert.ok(true);

                  browser.on('exit', function () {
                    done();
                  });
                  browser.exit();
                };

                page.open(url);
              });
            }, 'A', 'B');
          });
        });
      });
    }, {
      ignoreErrorPattern: /CoreText performance note/,
      phantomPath: require(process.env.ENGINE || 'phantomjs').path
    });

    function registerCallbacks(page) {
      var events = {};
      var callbacks = [
        'onAlert', 'onConfirm', 'onConsoleMessage', 'onError', 'onInitialized', /*'onLoadFinished',*/
        'onLoadStarted', 'onPrompt', 'onResourceRequested', 'onResourceReceived', 'onUrlChanged',
        'onCallback'
      ];
      callbacks.forEach(function (cb) {
        page[cb] = function (evt) {
          if (!events[cb]) events[cb] = [];
          events[cb].push(evt);
        }
      });
      return events;
    }
  });

  after(function (done) {
    server.close(done);
  });
});
