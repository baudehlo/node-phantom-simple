'use strict';


var driver  = require('../');


describe('page', function () {
  it('create', function (done) {
    driver.create({ path: require(process.env.ENGINE || 'phantomjs').path }, function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.createPage(function (err) {
        if (err) {
          done(err);
          return;
        }

        browser.exit(done);
      });
    });
  });
});
