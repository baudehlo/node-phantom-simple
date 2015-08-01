'use strict';


var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  it('set get', function (done) {
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

        page.get('viewportSize', function (err, oldValue) {
          if (err) {
            done(err);
            return;
          }

          page.set('viewportSize', { width: 800, height: 600 }, function (err) {
            if (err) {
              done(err);
              return;
            }

            page.get('viewportSize', function (err, newValue) {
              if (err) {
                done(err);
                return;
              }

              assert.notEqual(oldValue, newValue);

              var rnd = Math.floor(100000 * Math.random());

              page.set('zoomFactor', rnd, function (err) {
                if (err) {
                  done(err);
                  return;
                }

                page.get('zoomFactor', function (err, zoomValue) {
                  if (err) {
                    done(err);
                    return;
                  }

                  assert.equal(zoomValue, rnd);

                  page.get('settings', function (err, oldSettings) {
                    if (err) {
                      done(err);
                      return;
                    }

                    page.set('settings', { userAgent: 'node-phantom tester' }, function (err) {
                      if (err) {
                        done(err);
                        return;
                      }

                      page.get('settings', function (err, newSettings) {
                        if (err) {
                          done(err);
                          return;
                        }

                        assert.notEqual(oldSettings.userAgent, newSettings.userAgent);

                        browser.exit(done);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
