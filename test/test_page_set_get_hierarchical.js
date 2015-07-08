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

      browser.createPage(function (err, page){
        if (err) {
          done(err);
          return;
        }

        page.set('settings.userAgent', 'node-phantom tester', function (err) {
          if (err) {
            done(err);
            return;
          }

          page.get('settings.userAgent',function (err, ua) {
            if (err) {
              done(err);
              return;
            }

            assert.equal(ua, 'node-phantom tester');

            browser.on('exit', function () {
              done()
            });
            browser.exit();
          });
        });
      });
    }, { phantomPath: require(process.env.ENGINE || 'phantomjs').path });
  });
});
