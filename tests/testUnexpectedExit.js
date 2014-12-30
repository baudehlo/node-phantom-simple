var phantom=require('../node-phantom-simple');

exports.testUnexpectedExit = function(test) {
    phantom.create(function (error, ph) {
        test.ifError(error);
        ph.createPage(function (err,page) {
            ph.exit();  // exit the phantom process at a strange time
            page.open('http://www.google.com', function(err, result) {
              test.ok(!!err); // we expect an error
              test.done();
            })
        });
    });
};
