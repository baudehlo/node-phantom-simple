'use strict';


var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  it('set get hierarchical', function (done) {
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

        page.set('settings.userAgent', 'node-phantom tester', function (err) {
          if (err) {
            done(err);
            return;
          }

          page.get('settings.userAgent', function (err, ua) {
            if (err) {
              done(err);
              return;
            }

            assert.equal(ua, 'node-phantom tester');

            page.get('viewportSize.width', function (err, oldValue) {
              if (err) {
                done(err);
                return;
              }

              page.set('viewportSize.width', 3000, function (err) {
                if (err) {
                  done(err);
                  return;
                }

                page.get('viewportSize.width', function (err, newValue) {
                  if (err) {
                    done(err);
                    return;
                  }

                  assert.notEqual(oldValue, newValue);
                  assert.equal(newValue, 3000);

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
