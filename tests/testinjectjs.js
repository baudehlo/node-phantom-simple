var phantom=require('../node-phantom-simple');

exports.testPhantomInjectJs = function(test) {
    phantom.create(function (error,ph) {
        test.ifError(error);
        ph.injectJs('test/files/injecttest.js', function (err) {
            test.ifError(err);
            ph.exit();
            test.done();
        });
    });
};
