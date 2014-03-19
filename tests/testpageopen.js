var http = require('http');
var phantom = require('../node-phantom-simple');
var server;

module.exports = {
    setUp: function (cb) {
        server = http.createServer(function (request,response) {
            response.writeHead(200,{"Content-Type": "text/html"});
            response.end('<html><head></head><body>Hello World</body></html>');
        }).listen(cb);
    },
    tearDown: function (cb) {
        server.close(cb);
    },
    testPhantomPageOpen: function (test) {
        phantom.create(function (error,ph) {
            // console.log("Phantom created...");
            test.ifError(error);
            ph.createPage(function (err,page) {
                test.ifError(err);
                page.open('http://localhost:'+server.address().port, function (err,status) {
                    test.ifError(err);
                    test.equal(status,'success');
                    ph.on('exit', function () {
                        test.done();
                    })
                    ph.exit();
                });
            });
        }, {ignoreErrorPattern: /CoreText performance note/});
    },
};
