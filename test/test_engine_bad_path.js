'use strict';


var assert  = require('assert');
var driver = require('../');


describe('bad path', function () {
  it('bad path produces an error', function (done) {
    driver.create(function (err) {
      assert.notEqual(null, err);
      done();
    }, { path: '@@@', ignoreErrorPattern: /execvp/ });
  });


  it('deprecated path name still should be ok', function (done) {
    driver.create(function (err) {
      assert.notEqual(null, err, 'Bad path produces an error');
      done();
    }, { phantomPath: '@@@', ignoreErrorPattern: /execvp/ });
  });
});
