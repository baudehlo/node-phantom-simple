var phantom=require('../node-phantom-simple');

exports.testPhantomCreatePage = function(test) {
    phantom.create(function (error, ph) {
        test.ifError(error);
        ph.createPage(function (err,page) {
            test.ifError(err);
            ph.exit();
            test.done();
        });
    });
};
