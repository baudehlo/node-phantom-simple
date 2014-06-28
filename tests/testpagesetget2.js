var phantom = require('../node-phantom-simple');

exports.testPhantomPageSetGet2 = function (test) {
    phantom.create(function (error, ph){
        test.ifError(error);
        ph.createPage(function (err, page){
            test.ifError(err);
            page.set('settings.userAgent', 'node-phantom tester', function (err) {
                test.ifError(err);
                page.get('settings',function (err, newSettings) {
                    test.ifError(err);
                    test.equal(newSettings.userAgent, 'node-phantom tester');
                    ph.on('exit', function () { test.done() });
                    ph.exit();
                });
            });
        });
    });
};
