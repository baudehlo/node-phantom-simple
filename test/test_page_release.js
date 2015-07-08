'use strict';


var http    = require('http');
var assert  = require('assert');
var driver  = require('../');


describe('page', function () {
  it('release', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.createPage(function (err, page) {
        assert.ifError(err);
        page.close(function (err) {
          assert.ifError(err);

          browser.on('exit', function () {
            done()
          });
          browser.exit();
        });
      });
    }, { phantomPath: require(process.env.ENGINE || 'phantomjs').path });
  });
});
