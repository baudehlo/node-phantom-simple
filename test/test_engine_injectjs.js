'use strict';


var path    = require('path');
var driver  = require('../');


describe('engine', function () {
  it('injectjs', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.injectJs(path.join('fixtures', 'injecttest.js'), function (err) {
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
