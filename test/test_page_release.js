'use strict';


var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  it('release', function (done) {
    driver.create({ path: require(process.env.ENGINE || 'phantomjs').path }, function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.createPage(function (err, page) {
        assert.ifError(err);
        page.close(function (err) {
          assert.ifError(err);

          browser.exit(done);
        });
      });
    });
  });
});
