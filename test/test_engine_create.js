'use strict';


var driver = require('../');


describe('engine.create()', function () {

  it('without options', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.exit(done);
    });
  });


  it('callback is last', function (done) {
    driver.create({ path: require(process.env.ENGINE || 'phantomjs').path }, function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.exit(done);
    });
  });


  it('callback is first (legacy style)', function (done) {
    driver.create(function (err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.exit(done);
    }, { path: require(process.env.ENGINE || 'phantomjs').path });
  });
});
