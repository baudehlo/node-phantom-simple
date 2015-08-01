'use strict';


var assert  = require('assert');
var driver  = require('../');


describe('command line options', function () {
  it('load-images is default', function (done) {
    driver.create({ path: require(process.env.ENGINE || 'phantomjs').path }, function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.get('defaultPageSettings.loadImages', function (err, loadImages) {
        if (err) {
          done(err);
          return;
        }

        assert.equal(loadImages, true);

        browser.exit(done);
      });
    });
  });


  it('load-images is true', function (done) {
    driver.create(
      { parameters: { 'load-images': true }, path: require(process.env.ENGINE || 'phantomjs').path },
      function (err, browser) {
        if (err) {
          done(err);
          return;
        }

        browser.get('defaultPageSettings.loadImages', function (err, loadImages) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(loadImages, true);

          browser.exit(done);
        });
      }
    );
  });


  it('load-images is false', function (done) {
    driver.create({ parameters: { 'load-images': false }, path: require(process.env.ENGINE || 'phantomjs').path },
      function (err, browser) {
        if (err) {
          done(err);
          return;
        }

        browser.get('defaultPageSettings.loadImages', function (err, loadImages) {
          if (err) {
            done(err);
            return;
          }

          assert.equal(loadImages, false);

          browser.exit(done);
        });
      }
    );
  });
});
