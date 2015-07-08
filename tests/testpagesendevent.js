var http = require('http');
var phantom = require('../node-phantom-simple');
var server;

module.exports = {
    setUp: function (cb) {
        server = http.createServer(function (request, response) {
            response.writeHead(200,{"Content-Type": "text/html"});
            response.end('<html><head></head><body><button onclick="document.getElementsByTagName(\'h1\')[0].innerText=\'Hello Test\';">Test</button><h1>Hello World</h1></body></html>');
        }).listen(cb);
    },
    tearDown: function (cb) {
        server.close(cb);
    },
    testPhantomPageSendEvent: function (test) {
        phantom.create({ignoreErrorPattern: /CoreText performance note/}
        , function(error,ph){
            test.ifError(error);
            ph.createPage(function(err,page){
                test.ifError(err);
                page.open('http://localhost:'+server.address().port,function(err,status){
                    test.ifError(err);
                    test.equal(status,'success');
                    page.sendEvent('click',30,20,function(err){
                        test.ifError(err);
                        page.evaluate(function(){
                            return document.getElementsByTagName('h1')[0].innerText;
                        },function(err,result){
                            test.ifError(err);
                            test.equal(result,'Hello Test');
                            ph.on('exit', function () { test.done() });
                            ph.exit();
                        });
                    });
                });
            });
        });
    },
};
