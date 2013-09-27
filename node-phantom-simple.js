"use strict";

var http            = require('http');
var spawn 			= require('child_process').spawn;
var exec            = require('child_process').exec;
var util            = require('util');

var POLL_INTERVAL   = process.env.POLL_INTERVAL || 500;

var queue = function (worker) {
    var _q = [];
    var running = false;
    var q = {
        push: function (obj) {
            _q.push(obj);
            q.process();
        },
        process: function () {
            if (running || _q.length === 0) return;
            running = true;
            var cb = function () {
                running = false;
                q.process();
            }
            var task = _q.shift();
            worker(task, cb);
        }
    }
    return q;
}

function callbackOrDummy (callback, poll_func) {
    if (!callback) return function () {};
    if (poll_func) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            // console.log("Polling for results before returning with: " + JSON.stringify(args));
            poll_func(function () {
                // console.log("Inside...");
                callback.apply(null, args);
            });
        }
    }
    else {
        return callback;
    }
}

function unwrapArray (arr) {
    return arr && arr.length == 1 ? arr[0] : arr
}

exports.create = function (callback, options) {
    if (options === undefined) options = {};
    if (options.phantomPath === undefined) options.phantomPath = 'phantomjs';
    if (options.parameters === undefined) options.parameters = {};

    function spawnPhantom (callback) {
        var args=[];
        for(var parm in options.parameters) {
            args.push('--' + parm + '=' + options.parameters[parm]);
        }
        args = args.concat([__dirname + '/bridge.js']);

        var phantom = spawn(options.phantomPath, args);
        phantom.once('error', function (err) {
        	callback(err);
        });
        phantom.stderr.on('data', function (data) {
            return console.warn('phantom stderr: '+data);
        });
        var exitCode = 0;
        phantom.once('exit', function (code) {
            exitCode = code;
        });

        // Wait for "Ready" line
        phantom.stdout.once('data', function (data) {
            // setup normal listener now
            phantom.stdout.on('data', function (data) {
                return console.log('phantom stdout: '+data);
            });
            if (!/Ready/.test(data)) {
                phantom.kill();
                return callback("Unexpected output from PhantomJS: " + data);
            }
            // Now need to figure out what port it's listening on - since
            // Phantom is busted and can't tell us this we need to use lsof on mac, and netstat on Linux
            // Note that if phantom could tell you the port it ends up listening
            // on we wouldn't need to do this - but instead we have to.
            
            var platform = require('os').platform();
            var pid = phantom.pid;
            var cmd = null;

            var runPidFinder = function () {
                switch (platform) {
                    case 'linux':
                        cmd = 'PPID=`ps -f --ppid ' + pid + ' | grep ' + pid + ' | awk \' { print $2 } \'` ; netstat -nlp | grep ${PPID}/';
                        break;
                    case 'darwin':
                        cmd = 'lsof -p ' + pid + ' | grep LISTEN';
                        break;
                    case 'win32':
                        cmd = 'netstat -ano | find "' + pid + '"';
                        break;
                    case 'cygwin':
                        cmd = 'netstat -ano | grep ' + pid;
                        break;
                    default:
                        phantom.kill();
                        return callback("Your OS is not supported yet. Tell us how to get the listening port based on PID");
                }

                exec(cmd, function (err, stdout, stderr) {
                    if (err !== null && platform == 'win32') {
                        platform = 'cygwin';
                        return runPidFinder();
                    }
                    if (err !== null) {
                        phantom.kill();
                        return callback("Error executing command to extract port: " + err);
                    }
                    var match = /(?:127\.0\.0\.1|localhost):(\d+)/i.exec(stdout);
                    if (!match) {
                        phantom.kill();
                        return callback("Error extracting port from: " + stdout);
                    }
                    var port = match[1];
                    callback(null, phantom, port);
                });
            };
            
            runPidFinder();
        });

        setTimeout(function () {    //wait a bit to see if the spawning of phantomjs immediately fails due to bad path or similar
        	if (exitCode !== 0) {
        		return callback("Phantom immediately exited with: " + exitCode);
        	}
        },100);
    };
    
    spawnPhantom(function (err, phantom, port) {
        if (err) {
            return callback(err);
        }

        // console.log("Phantom spawned with web server on port: " + port);

        var pages = {};

        var setup_new_page = function (id) {
            // console.log("Page created with id: " + id);
            var methods = [
                'addCookie', 'childFramesCount', 'childFramesName', 'clearCookies', 'close',
                'currentFrameName', 'deleteCookie', 'evaluateJavaScript',
                'evaluateAsync', 'getPage', 'go', 'goBack', 'goForward', 'includeJs',
                'injectJs', 'open', 'openUrl', 'release', 'reload', 'render', 'renderBase64',
                'sendEvent', 'setContent', 'stop', 'switchToFocusedFrame', 'switchToFrame',
                'switchToFrame', 'switchToChildFrame', 'switchToChildFrame', 'switchToMainFrame',
                'switchToParentFrame', 'uploadFile',
            ];
            var page = {
                setFn: function (name, fn, cb) {
                    request_queue.push([[id, 'setFunction', name, fn.toString()], callbackOrDummy(cb, poll_func)]);
                },
                get: function (name, cb) {
                    request_queue.push([[id, 'getProperty', name], callbackOrDummy(cb, poll_func)]);
                },
                set: function (name, val, cb) {
                    request_queue.push([[id, 'setProperty', name, val], callbackOrDummy(cb, poll_func)]);
                },
                evaluate: function (fn, cb) {
                    var extra_args = [];
                    if (arguments.length > 2) {
                        extra_args = Array.prototype.slice.call(arguments, 2);
                        // console.log("Extra args: " + extra_args);
                    }
                    request_queue.push([[id, 'evaluate', fn.toString()].concat(extra_args), callbackOrDummy(cb, poll_func)]);
                },
                waitForSelector: function (selector, cb, timeout) {
                    var startTime = Date.now();
                    var timeoutInterval = 150;
                    var testRunning = false;
                    //if evaluate succeeds, invokes callback w/ true, if timeout,
                    // invokes w/ false, otherwise just exits
                    var testForSelector = function () {
                        var elapsedTime = Date.now() - startTime;

                        if (elapsedTime > timeout) {
                            return cb("Timeout waiting for selector: " + selector);
                        }

                        page.evaluate(function (selector) {
                            return document.querySelectorAll(selector).length;
                        }, function (result) {
                            testRunning = false;
                            if (result > 0) {//selector found
                                cb();
                            }
                            else {
                                setTimeout(testForSelector, timeoutInterval);
                            }
                        }, selector);
                    };

                    timeout = timeout || 10000; //default timeout is 10 sec;
                    setTimeout(testForSelector, timeoutInterval);
                },
            };
            methods.forEach(function (method) {
                page[method] = function () {
                    var all_args = Array.prototype.slice.call(arguments);
                    var callback = null;
                    if (all_args.length > 0 && typeof all_args[all_args.length - 1] === 'function') {
                        callback = all_args.pop();
                    }
                    var req_params = [id, method];
                    request_queue.push([req_params.concat(all_args), callbackOrDummy(callback, poll_func)]);
                }
            });

            pages[id] = page;

            return page;            
        }

        var poll_func = setup_long_poll(phantom, port, pages, setup_new_page);

        var request_queue = queue(function (paramarr, next) {
            var params = paramarr[0];
            var callback = paramarr[1];
            var page = params[0];
            var method = params[1];
            var args = params.slice(2);
            
            var http_opts = {
                hostname: '127.0.0.1',
                port: port,
                path: '/',
                method: 'POST',
            }

            var req = http.request(http_opts, function (res) {
                var err = res.statusCode == 500 ? true : false;
                res.setEncoding('utf8');
                var data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    if (!data) {
                        next();
                        return callback("No response body for page." + method + "()");
                    }
                    var results = JSON.parse(data);
                    // console.log("Response: ", results);
                    
                    if (err) {
                        next();
                        return callback(results);
                    }

                    if (method === 'createPage') {
                        var id = results.page_id;
                        var page = setup_new_page(id);
                        
                        next();
                        return callback(null, page);
                    }

                    // Not createPage - just run the callback
                    next();
                    callback(null, results);
                });
            });

            req.on('error', function (err) {
                console.warn("Request() error evaluating " + method + "() call: " + err);
                next();
            })

            req.setHeader('Content-Type', 'application/json');

            var json = JSON.stringify({page: page, method: method, args: args});
            req.setHeader('Content-Length', Buffer.byteLength(json));
            req.write(json);
            req.end();
        });

        var proxy = {
            process: phantom,
            createPage: function (callback) {
                request_queue.push([[0,'createPage'], callbackOrDummy(callback, poll_func)]);
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
        if (dead) return;
        // console.log("Polling...");
        var req = http.get(http_opts, function(res) {
            res.setEncoding('utf8');
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                // console.log("Poll results: " + data);
                if (dead) return;
                try {
                    var results = JSON.parse(data);
                }
                catch (err) {
                    console.warn("Error parsing JSON from phantom: " + err);
                    console.warn("Data from phantom was: " + data);
                    return;
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
                            pages[r.page_id][r.callback].call(pages[r.page_id], unwrapArray(r.args));
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
            if (dead) return;
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
