var http = require('http');
var phantom = require('../node-phantom-simple');
var server;

module.exports = {
    setUp: function (cb) {
        server = http.createServer(function(request,response){
            response.writeHead(200,{"Content-Type": "text/html"});
            response.end('<html><head><script>window.callPhantom({ msg: "callPhantom" }); conXsole.log("cause-an-error");</script></head><body><h1>Hello World</h1></body></html>');
        }).listen(cb);
    },
    tearDown: function (cb) {
        server.close(cb);
    },
    testPhantomPagePushNotifications: function (test) {
        var url = 'http://localhost:'+server.address().port+'/';
        var onLoadFinishedFired = false;
        phantom.create(errOr(function(ph){
            ph.createPage(errOr(function(page){
                var events = registerCallbacks(page);

                page.open(url, errOr(function(status){
                    test.equal(status,'success');
                    page.evaluate(function(){
                        console.log('POW');
                        console.log('WOW');
                    },errOr(function() {
                        //console.log(events);
                        test.equal(events.onLoadStarted.length, 1);
                        test.deepEqual(events.onUrlChanged,[url]);
                        test.equal(events.onResourceRequested.length, 1);
                        test.equal(events.onResourceReceived.length, 2);
                        test.equal(events.onResourceReceived[0].stage, 'start');
                        test.equal(events.onResourceReceived[1].stage, 'end');

                        test.deepEqual(events.onCallback, [{ msg: "callPhantom" }]);
                        test.deepEqual(events.onConsoleMessage, ['POW', 'WOW']);

                        // console.log(JSON.stringify(events.onError));
                        test.equal(events.onError.length, 1);
                        test.equal(events.onError[0].length, 2);
                        var err = events.onError[0];
                        test.ok(/variable: conXsole/.test(err[0]));
                        test.equal(err[1][0].line, 1);

                        events.onConsoleMessage = [];
                        page.evaluate(function(a,b){
                            console.log(a);
                            console.log(b);
                        }, errOr(function(){
                            test.deepEqual(events.onConsoleMessage, ['A', 'B']);

                            ph.createPage(errOr(function(page){
                                page.onLoadFinished = function(){
                                    test.ok(true);
                                    ph.on('exit', function () {
                                        test.done();
                                    })
                                    ph.exit();
                                };
                                page.open(url);
                            }));
                        }), 'A', 'B');
                    }));
                }));
            }));
        }), {ignoreErrorPattern: /CoreText performance note/});

        function registerCallbacks(page) {
            var events = {};
            var callbacks = [
                'onAlert','onConfirm','onConsoleMessage','onError', 'onInitialized',/*'onLoadFinished',*/
                'onLoadStarted','onPrompt', 'onResourceRequested','onResourceReceived','onUrlChanged',
                'onCallback'
            ];
            callbacks.forEach(function(cb) {
                page[cb] = function(evt) {
                    if (!events[cb]) events[cb] = [];
                    events[cb].push(evt);
                }
            })
            return events;
        }

        function errOr(fn) {
            return function(err, res) {
                test.ifError(err);
                fn(res);
            }
        }
    },
};
