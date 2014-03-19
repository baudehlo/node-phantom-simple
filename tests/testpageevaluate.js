var http = require('http');
var phantom = require('../node-phantom-simple');
var server;

module.exports = {
    setUp: function (cb) {
        server = http.createServer(function (request, response) {
            response.writeHead(200,{"Content-Type": "text/html"});
            response.end('<html><head></head><body><h1>Hello World</h1></body></html>');
        }).listen(cb);
    },
    tearDown: function (cb) {
        server.close(cb);
    },
    testPhantomPageEvaluate: function (test) {
        phantom.create(function (error, ph) {
            test.ifError(error);
            ph.createPage(function (err,page) {
                test.ifError(err);
                page.open('http://localhost:'+server.address().port, function (err,status) {
                    test.ifError(err);
                    test.equal(status,'success');
                    page.evaluate(function () {
                        return { h1text: document.getElementsByTagName('h1')[0].innerText };
                    }, function (err, result) {
                        test.ifError(err);
                        test.equal(result.h1text,'Hello World');
                        ph.on('exit', function () {
                            test.done();
                        });
                        ph.exit();
                    });
                });
            });
        }, {ignoreErrorPattern: /CoreText performance note/});
    },
};
