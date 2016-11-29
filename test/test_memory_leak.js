'use strict';


var assert = require('assert');
var driver = require('../');

describe('memory leak', function() {
  it('create 10 browsers', function(done) {

    this.timeout(60 * 60 * 1000);

    var limit = 100;
    var count = 0;

    var memoryUsageStart = process.memoryUsage();
    var memoryUsageLast = memoryUsageStart;

    create();

    function exit() {
      count++;
      console.log('browser count:', count);
      var memoryUsage = calculateMemoryUsage();
      if (count < limit) {
        create();
      } else {
        done();
      }
      memoryUsageLast = memoryUsage;
    }

    function calculateMemoryUsage(memoryUsage) {
      var memoryUsage = process.memoryUsage();
      log('rss', memoryUsage, memoryUsageLast, memoryUsageStart);
      log('heapTotal', memoryUsage, memoryUsageLast, memoryUsageStart);
      log('heapUsed', memoryUsage, memoryUsageLast, memoryUsageStart);
      return memoryUsage;
    }

    function create() {
      driver.create({ path: require(process.env.ENGINE || 'phantomjs-prebuilt').path }, function(err, browser) {
        if (err) {
          done(err);
          return;
        }
        browser.exit(exit);
      });
    }

  });

});

function percentIncrease(before, after) {
  return (((after - before) / before) * 100).toFixed(0);
}

function log(propName, current, last, start) {
  console.log('%s increase: %d% (%d% total)',
    propName,
    percentIncrease(last[propName], current[propName]),
    percentIncrease(start[propName], current[propName])
  );
}
