'use strict';


var assert  = require('assert');
var driver  = require('../');


describe('engine', function () {
  it('unexpected exit', function (done) {
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

        browser.exit();  // exit the phantom process at a strange time

        page.open('http://www.google.com', function (err) {
          assert.ok(!!err); // we expect an error
          done();
        })
      });
    }, { phantomPath: require(process.env.ENGINE || 'phantomjs').path });
  });
});
