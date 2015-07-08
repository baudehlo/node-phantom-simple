'use strict';


var assert  = require('assert');
var driver = require('../');


describe('engine', function () {
  it('bad path', function (done) {
    driver.create(function (err) {
      assert.notEqual(null, err, 'Bad path produces an error');
      done();
    }, { phantomPath: '@@@', ignoreErrorPattern: /execvp/ });
  });
});
