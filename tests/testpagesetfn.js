var http = require('http');
var phantom = require('../node-phantom-simple');
var server;

module.exports = {
    setUp: function (cb) {
        server = http.createServer(function(request,response){
            response.writeHead(200,{"Content-Type": "text/html"});
            response.end('<html><head><script>console.log("handled on phantom-side")</script></head><body><h1>Hello World</h1></body></html>');
        }).listen(cb);
    },
    tearDown: function (cb) {
        server.close(cb);
    },
    testPhantomPageSetFn: function (test) {
        var url = 'http://localhost:'+server.address().port+'/';
        phantom.create(errOr(function (ph) {
            ph.createPage(errOr(function (page) {
                var messageForwardedByOnConsoleMessage = undefined;
                var localMsg = undefined;
                page.onConsoleMessage = function (msg) { messageForwardedByOnConsoleMessage = msg; };
                page.setFn('onCallback', function (msg) { localMsg = msg; page.onConsoleMessage(msg); });
                page.open(url, errOr(function () {
                    test.ok(localMsg === undefined);
                    test.equal(messageForwardedByOnConsoleMessage, "handled on phantom-side");
                    ph.on('exit', function () { test.done() });
                    ph.exit();
                }));
            }));
        }), {ignoreErrorPattern: /CoreText performance note/});

        function errOr(fn) {
            return function(err, res) {
                test.ifError(err);
                fn(res);
            }
        }
    },
};
