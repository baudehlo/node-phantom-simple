var http = require('http');
var phantom = require('../node-phantom-simple');
var server;

module.exports = {
    setUp: function (cb) {
        server = http.createServer(function (request,response) {
            if (request.url==='/test.js') {
                response.writeHead(200, {"Content-Type": "text/javascript"});
                response.end('document.getElementsByTagName("h1")[0].innerText="Hello Test";');
            }
            else {
                response.writeHead(200,{"Content-Type": "text/html"});
                response.end('<html><head></head><body><h1>Hello World</h1></body></html>');
            }
        }).listen(cb);
    },
    tearDown: function (cb) {
        server.close(cb);
    },
    testPhantomPageEvaluate: function (test) {
        phantom.create(function (error, ph) {
            test.ifError(error, "phantom error");
            ph.createPage(function (err, page) {
                test.ifError(err, "createPage error");
                page.open('http://localhost:'+server.address().port, function (err, status) {
                    test.ifError(err, "page open error");
                    test.equal(status, 'success', "Status is success");
                    page.includeJs('http://localhost:'+server.address().port+'/test.js', function (err) {
                        test.ifError(err, "includeJs error");
                        page.evaluate(function () {
                            return [document.getElementsByTagName('h1')[0].innerText, document.getElementsByTagName('script').length];
                        }, function (err, result) {
                            test.ifError(err, "page.evaluate error");
                            test.equal(result[0], 'Hello Test', "Script was executed");
                            test.equal(result[1], 1, "Added a new script tag");
                            ph.on('exit', function () {
                                test.done();
                            });
                            ph.exit();
                        });
                    });
                });
            });
        }, {ignoreErrorPattern: /CoreText performance note/});
    },
};
