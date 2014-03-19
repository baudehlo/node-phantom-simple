var http = require('http');
var phantom = require('../node-phantom-simple');

var gotFile = false;
var server;

module.exports = {
    setUp: function (cb) {
        server = http.createServer(function (request, response) {
            if (request.url==='/upload') {
                request.on('data', function (buffer) {
                    gotFile = buffer.toString('ascii').indexOf('Hello World') > 0;
                });
            }
            else {
                response.writeHead(200,{"Content-Type": "text/html"});
                response.end('<html><head></head><body><form id="testform" action="/upload" method="post" enctype="multipart/form-data"><input id="test" name="test" type="file"></form></body></html>');
            }
        }).listen(cb);
    },
    tearDown: function (cb) {
        server.close(cb);
    },
    testPhantomPageUploadFile: function (test) {
        phantom.create(function (error, ph) {
            test.ifError(error);
            ph.createPage(function (err, page) {
                test.ifError(err);
                page.open('http://localhost:'+server.address().port, function (err, status) {
                    test.ifError(err);
                    test.equal(status, 'success');
                    page.uploadFile('input[name=test]', __dirname+'/files/uploadtest.txt', function (err) {
                        test.ifError(err);
                        page.evaluate(function () {
                            document.forms['testform'].submit();
                        }, function (err, result) {
                            test.ifError(err);
                            setTimeout(function () {
                                test.ok(gotFile);
                                ph.on('exit', function () { test.done() });
                                ph.exit();
                            },100);
                        });
                    });
                });
            });
        }, {ignoreErrorPattern: /CoreText performance note/});
    }
};
