var phantom = require('../node-phantom-simple');

exports.testPhantomPageRelease = function (test) {
    phantom.create(function (error, ph) {
        test.ifError(error);
        ph.createPage(function (err, page) {
            test.ifError(err);
            page.close(function (err) {
                test.ifError(err);
                ph.on('exit', function () { test.done() });
                ph.exit();
            });
        });
    });
};
