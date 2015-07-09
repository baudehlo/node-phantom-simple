'use strict';


var path    = require('path');
var assert  = require('assert');
var helpers = require('./helpers');
var driver  = require('../');


describe('engine', function () {
  it('injectjs', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      var filePath = helpers.toTmp(path.join(__dirname, 'fixtures', 'injecttest.js'));

      browser.injectJs(filePath, function (err, result) {
        helpers.unlink(filePath);

        if (err) {
          done(err);
          return;
        }

        assert.ok(result);

        browser.exit(done);
      });
    }, { phantomPath: require(process.env.ENGINE || 'phantomjs').path });
  });
});
