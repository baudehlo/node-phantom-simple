"use strict";

var http = require('http')
    , spawnPhantom = require('./lib/spawn_phantom')
    , Page = require('./lib/page')
    , requestQueue = require('./lib/request_queue')
    , _utils = require('./lib/_utils')
    , callbackOrDummy = _utils.callbackOrDummy
    , unwrapArray = _utils.unwrapArray
    , wrapArray = _utils.wrapArray;

var POLL_INTERVAL   = process.env.POLL_INTERVAL || 500;


exports.create = function (callback, options) {
    options = options || {};
    options.bridge = options.bridge || (__dirname + '/bridge.js');

    spawnPhantom(options, function (err, phantom, port) {
        if (err) {
            return callback(err);
        }

        // console.log("Phantom spawned with web server on port: " + port);

        var pages = {};

        function setup_new_page(id) {
            // console.log("Page created with id: " + id);

            var page = new Page(id, request_queue, poll_func);
            pages[id] = page;
            return page;            
        }

        var poll_func = setup_long_poll(phantom, port, pages, setup_new_page);

        var request_queue = requestQueue(phantom, { port: port });

        var proxy = {
            process: phantom,
            createPage: function (callback) {
                request_queue.push([[0,'createPage'], callbackOrDummy(function (err, results) {
                    if (err)
                        callback(err);
                    else {
                        var id = results.page_id;
                        var page = setup_new_page(id);
                        return callback(null, page);
                    }
                }, poll_func)]);
            },
            injectJs: function (filename,callback) {
                request_queue.push([[0,'injectJs', filename], callbackOrDummy(callback, poll_func)]);
            },
            addCookie: function (cookie, callback) {
                request_queue.push([[0,'addCookie', cookie], callbackOrDummy(callback, poll_func)]);
            },
            clearCookies: function (callback) {
                request_queue.push([[0, 'clearCookies'], callbackOrDummy(callback, poll_func)]);
            },
            deleteCookie: function (cookie, callback) {
                request_queue.push([[0, 'deleteCookie', cookie], callbackOrDummy(callback, poll_func)]);
            },
            set : function (property, value, callback) {
                request_queue.push([[0, 'setProperty', property, value], callbackOrDummy(callback, poll_func)]);
            },
            get : function (property, callback) {
                request_queue.push([[0, 'getProperty', property], callbackOrDummy(callback, poll_func)]);
            },
            exit: function(callback){
                phantom.kill('SIGTERM');
                callbackOrDummy(callback)();
            },
            on: function () {
                phantom.on.apply(phantom, arguments);
            },
        };
        
        callback(null, proxy);
    });
}

function setup_long_poll (phantom, port, pages, setup_new_page) {
    // console.log("Setting up long poll");

    var http_opts = {
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: 'GET',
    }

    var dead = false;
    phantom.once('exit', function () { dead = true; });

    var poll_func = function (cb) {
        if (dead) return cb('Phantom Process died');
        if (phantom.POSTING) return cb();
        // console.log("Polling...");
        var req = http.get(http_opts, function(res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                // console.log("Poll results: " + data);
                if (dead) return cb('Phantom Process died');
                try {
                    var results = JSON.parse(data);
                }
                catch (err) {
                    console.warn("Error parsing JSON from phantom: " + err);
                    console.warn("Data from phantom was: " + data);
                    return cb("Error parsing JSON from phantom: " + err
                            + "\nData from phantom was: " + data);
                }
                // if (results.length > 0) {
                //     console.log("Long poll results: ", results);
                // }
                // else {
                //     console.log("Zero callbacks");
                // }
                results.forEach(function (r) {
                    if (r.page_id) {
                        if (pages[r.page_id] && r.callback === 'onPageCreated') {
                            var new_page = setup_new_page(r.args[0]);
                            if (pages[r.page_id].onPageCreated) {
                                pages[r.page_id].onPageCreated(new_page);
                            }
                        }
                        else if (pages[r.page_id] && pages[r.page_id][r.callback]) {
                            var callbackFunc = pages[r.page_id][r.callback];
                            if (callbackFunc.length > 1) {
                                // We use `apply` if the function is expecting multiple args
                                callbackFunc.apply(pages[r.page_id], wrapArray(r.args));
                            }
                            else {
                                // Old `call` behaviour is deprecated
                                callbackFunc.call(pages[r.page_id], unwrapArray(r.args));
                            }
                        }
                    }
                    else {
                        var cb = callbackOrDummy(phantom[r.callback]);
                        cb.apply(phantom, r.args);
                    }
                });
                cb();
            });
        });
        req.on('error', function (err) {
            if (dead || phantom.killed) return;
            console.warn("Poll Request error: " + err);
        });
    };

    var repeater = function () {
        setTimeout(function () {
            poll_func(repeater)
        }, POLL_INTERVAL);
    }

    repeater();

    return poll_func;
}
