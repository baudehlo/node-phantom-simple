'use strict';


var assert  = require('assert');
var driver  = require('../');


describe('command line options', function () {
  it('load-images is default', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        callback(err);
        return;
      }

      browser.get('defaultPageSettings.loadImages', function (err, loadImages) {
        if (err) {
          callback(err);
          return;
        }

        assert.equal(loadImages, true);

        browser.exit(done);
      });
    }, {
      phantomPath: require(process.env.ENGINE || 'phantomjs').path
    });
  });


  it('load-images is true', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        callback(err);
        return;
      }

      browser.get('defaultPageSettings.loadImages', function (err, loadImages) {
        if (err) {
          callback(err);
          return;
        }

        assert.equal(loadImages, true);

        browser.exit(done);
      });
    }, {
      parameters: { 'load-images': true },
      phantomPath: require(process.env.ENGINE || 'phantomjs').path
    });
  });


  it('load-images is false', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        callback(err);
        return;
      }

      browser.get('defaultPageSettings.loadImages', function (err, loadImages) {
        if (err) {
          callback(err);
          return;
        }

        assert.equal(!!loadImages, false);

        browser.exit(done);
      });
    }, {
      parameters: { 'load-images': false },
      phantomPath: require(process.env.ENGINE || 'phantomjs').path
    });
  });
});
