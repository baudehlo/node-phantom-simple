'use strict';


var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  it('set get hierarchical', function (done) {
    driver.create(function (err, browser) {
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

          assert.equal(userAgent, defaultPageSettings.userAgent);

          browser.exit(done);
        });
      });
    }, { phantomPath: require(process.env.ENGINE || 'phantomjs').path });
  });
});
