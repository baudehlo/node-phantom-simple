'use strict';


var assert  = require('assert');
var driver  = require('../');

describe('page.getPage()', function() {

  it('should retrieve pages as actual node-phantom-simple pages (#131)', function(done) {
    var path = require(process.env.ENGINE || 'phantomjs').path;
    driver.create({ path: path }, function(err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.createPage(function(err, page) {
        if (err) {
          done(err);
          return;
        }

        var child_page_name = 'child_page';
        // this should be called when
        // window.open is executed
        page.onPageCreated = function(childPage) {
          // Set the name of the child so it can be retrieved
          childPage.evaluate(function(name_to_use) {
            window.name = name_to_use;
            window.special_recognisable_property = 5;
          }, child_page_name, function() {
            // Retrieve the previous childPage, now through getPage
            page.getPage(child_page_name, function(err, new_child_page) {
              if (err) {
                done(err);
                return;
              }

              assert.strictEqual(typeof new_child_page, 'object');
              assert.strictEqual(typeof new_child_page.evaluate, 'function');
              new_child_page.evaluate(function() {
                // tried using window.name, but slimerjs returns empty string,
                // but still matches the correct page
                return window.special_recognisable_property;
              }, function(err, special_prop) {
                if (err) {
                  done(err);
                  return;
                }

                assert.strictEqual(special_prop, 5);
                browser.exit(done);
              });
            });
          });
        };

        // open an empty new page
        page.evaluate(function() {
          window.open('');
        }, function(err) {
          if (err) {
            done(err);
            return;
          }
        });
      });
    });
  });

  it('should return null when page with given name cannot be found', function(done) {
    var path = require(process.env.ENGINE || 'phantomjs').path;
    driver.create({ path: path }, function(err, browser) {
      if (err) {
        done(err);
        return;
      }

      browser.createPage(function(err, page) {
        if (err) {
          done(err);
          return;
        }

        page.getPage('some-name', function(err, child_page) {
          if (err) {
            done(err);
            return;
          }

          assert.strictEqual(child_page, null);
          browser.exit(done);
        });
      });
    });
  });
});
