'use strict';


var http = require('http')
    , _utils = require('./_utils')
    , callbackOrDummy = _utils.callbackOrDummy
    , unwrapArray = _utils.unwrapArray
    , wrapArray = _utils.wrapArray;


module.exports = longPoll;


function longPoll(phantom, port, pages, setup_new_page) {
    var POLL_INTERVAL = process.env.POLL_INTERVAL || 500;
    // console.log("Setting up long poll");

    var http_opts = {
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: 'GET',
    }

    var dead = false;
    phantom.once('exit', function () { dead = true; });
    repeater();
    return poll_func;


    function poll_func(cb) {
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
                        var page = pages[r.page_id];
                        if (page && r.callback === 'onPageCreated') {
                            var child_page = setup_new_page(r.args[0]);
                            if (page.onPageCreated) {
                                page.onPageCreated(child_page);
                            }
                        }
                        else if (page && page[r.callback]) {
                            var callbackFunc = page[r.callback];
                            if (callbackFunc.length > 1) {
                                // We use `apply` if the function is expecting multiple args
                                callbackFunc.apply(page, wrapArray(r.args));
                            }
                            else {
                                // Old `call` behaviour is deprecated
                                callbackFunc.call(page, unwrapArray(r.args));
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
    }

    function repeater() {
        setTimeout(function () {
            poll_func(repeater)
        }, POLL_INTERVAL);
    }
}
