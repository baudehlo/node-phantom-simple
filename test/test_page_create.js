'use strict';


var driver  = require('../');


describe('page', function () {
  it('create', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.createPage(function (err) {
        if (err) {
          done(err);
          return;
        }

        browser.exit();
        done();
      });
    }, { phantomPath: require(process.env.ENGINE || 'phantomjs').path });
  });
});
