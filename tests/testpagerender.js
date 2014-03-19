var http = require('http');
var phantom = require('../node-phantom-simple');
var fs = require('fs');
var crypto = require('crypto');

var server;

var testFilename=__dirname+'/files/testrender.png';
var verifyFilename=__dirname+'/files/verifyrender.png';

function fileHash (filename) {
    var shasum = crypto.createHash('sha256');
    var f = fs.readFileSync(filename);
    shasum.update(f);
    return shasum.digest('hex');
}

module.exports = {
    setUp: function (cb) {
        server = http.createServer(function (request, response) {
            response.writeHead(200,{"Content-Type": "text/html"});
            response.end('<html><head></head><body>Hello World</body></html>');
        }).listen(cb);
    },
    tearDown: function (cb) {
        server.close(cb);
    },
    testPhantomPageRender: function (test) {
        phantom.create(function (error, ph) {
            test.ifError(error);
            ph.createPage(function (err, page) {
                test.ifError(err);
                page.open('http://localhost:'+server.address().port, function (err, status) {
                    test.ifError(err);
                    test.equal(status,'success');
                    page.render(testFilename, function (err) {
                        test.ifError(err);
                        test.equal(fileHash(testFilename), fileHash(verifyFilename));
                        fs.unlinkSync(testFilename);    //clean up the testfile
                        ph.on('exit', function () { test.done() });
                        ph.exit();
                    });
                });
            });
        }, {ignoreErrorPattern: /CoreText performance note/});
    },
};
