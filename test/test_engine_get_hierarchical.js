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

      browser.get('defaultPageSettings', function (err, defaultPageSettings) {
        if (err) {
          done(err);
          return;
        }

        browser.get('defaultPageSettings.userAgent', function (err, userAgent) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(userAgent, defaultPageSettings.userAgent);

          browser.exit(done);
        });
      });
    });
  });
});
