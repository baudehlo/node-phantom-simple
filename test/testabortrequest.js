var http=require('http');
var phantom=require('../node-phantom-simple');

var server=http.createServer(function(request,response){
    setTimeout(function () {
        response.writeHead(200,{"Content-Type": "text/html"});
        response.end('<html><head></head><body>Hello World</body></html>');
    }, 5000);
}).listen();

exports.testPhantomPageOpen=function(beforeExit,assert){
    phantom.create(function(error,ph){
        console.log("Phantom created...");
        assert.ifError(error);
        ph.createPage(function(err,page){
            assert.ifError(err);
            page.onResourceRequested = function (requestData, networkRequest) {
                console.log(requestData);
                console.log(networkRequest);
                console.log("Aborting...");
                networkRequest.abort();
            }
            page.onResourceReceived = function (foo) {
                // console.log("Received: ", foo);
            }
            page.onResourceError = function (bar) {
                console.log("Error: ", bar);
            }
            page.open('http://localhost:'+server.address().port);
            page.onLoadFinished = function (status) {
                console.log("Loaded");
                assert.ifError(err);
                assert.equal(status,'success');
                setTimeout(function () {
                    server.close();
                    ph.exit();
                }, 5000);
            }
        });
    });
};
