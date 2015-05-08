"use strict";

var http = require('http');
var child_process = require('child_process');
var spawn = child_process.spawn;
var exec = child_process.exec;
var util = require('util');
var Page = require('./lib/page');
var Queue = require('./lib/queue');
var _utils = require('./lib/_utils');
var callbackOrDummy = _utils.callbackOrDummy;
var unwrapArray = _utils.unwrapArray;
var wrapArray = _utils.wrapArray;

var POLL_INTERVAL   = process.env.POLL_INTERVAL || 500;


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

        // Ensure that the child process is closed when this process dies
        var closeChild = function () {
            try {
                phantom.kill();
            } catch(e) {}
            process.exit(1);
        };

        var uncaughtHandler = function (err) {
            console.error(err.stack);
            closeChild();
        };

        // Note it's possible to blow up maxEventListeners doing this - consider moving to a single handler.
        ['SIGINT', 'SIGTERM'].forEach(function(sig) {
            process.on(sig, closeChild);
        });

        process.on('uncaughtException', uncaughtHandler);

        phantom.once('error', function (err) {
        	callback(err);
        });

        phantom.stderr.on('data', function (data) {
            if (options.ignoreErrorPattern && options.ignoreErrorPattern.exec(data)) {
                return;
            }
            return console.warn('phantom stderr: '+data);
        });
        var exitCode = 0;
        phantom.once('exit', function (code) {
            ['SIGINT', 'SIGTERM'].forEach(function(sig) {
                process.removeListener(sig, closeChild);
            });
            process.removeListener('uncaughtException', uncaughtHandler);
            exitCode = code;
        });

        // Wait for "Ready" line
        phantom.stdout.once('data', function (data) {
            // setup normal listener now
            phantom.stdout.on('data', function (data) {
                return console.log('phantom stdout: '+data);
            });
            
            var matches = data.toString().match(/Ready \[(\d+)\]/);
            if (!matches) {
                phantom.kill();
                return callback("Unexpected output from PhantomJS: " + data);
            }

            var phantom_pid = parseInt(matches[1], 0);

            // Now need to figure out what port it's listening on - since
            // Phantom is busted and can't tell us this we need to use lsof on mac, and netstat on Linux
            // Note that if phantom could tell you the port it ends up listening
            // on we wouldn't need to do this - server.port returns 0 when you ask
            // for port 0 (i.e. random free port). If they ever fix that this will
            // become much simpler
            var platform = require('os').platform();
            var cmd = null;
            switch (platform) {
                case 'linux':
                            cmd = 'netstat -nlp | grep "[[:space:]]%d/"';
                            break;
                case 'darwin':
                            cmd = 'lsof -p %d | grep LISTEN';
                            break;
                case 'win32':
                            cmd = 'netstat -ano | findstr /R "\\<%d\\>"';
                            break;
                case 'cygwin':
                            cmd = 'netstat -ano | grep %d';
                            break;
                case 'freebsd':
                            cmd = 'sockstat | grep %d';
                            break;
                default:
                            phantom.kill();
                            return callback("Your OS is not supported yet. Tell us how to get the listening port based on PID");
            }

            // We do this twice - first to get ports this process is listening on
            // and again to get ports phantom is listening on. This is to work
            // around this bug in libuv: https://github.com/joyent/libuv/issues/962
            // - this is only necessary when using cluster, but it's here regardless
            var my_pid_command = util.format(cmd, process.pid);

            exec(my_pid_command, function (err, stdout, stderr) {
                if (err !== null) {
                    // This can happen if grep finds no matching lines, so ignore it.
                    stdout = '';
                }
                var re = /(?:127\.0\.0\.1|localhost):(\d+)/ig, match;
                var ports = [];
                
                while (match = re.exec(stdout)) {
                    ports.push(match[1]);
                }

                var phantom_pid_command = util.format(cmd, phantom_pid);

                exec(phantom_pid_command, function (err, stdout, stderr) {
                    if (err !== null) {
                        phantom.kill();
                        return callback("Error executing command to extract phantom ports: " + err);
                    }
                    var port;
                    while (match = re.exec(stdout)) {
                        if (ports.indexOf(match[1]) == -1) {
                            port = match[1];
                        }
                    }

                    if (!port) {
                        phantom.kill();
                        return callback("Error extracting port from: " + stdout);
                    }

                    callback(null, phantom, port);
                });
            });
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

        function setup_new_page(id) {
            // console.log("Page created with id: " + id);

            var page = new Page(id, request_queue, poll_func);
            pages[id] = page;
            return page;            
        }

        var poll_func = setup_long_poll(phantom, port, pages, setup_new_page);

        var request_queue = new Queue(function (paramarr, next) {
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

            phantom.POSTING = true;

            var req = http.request(http_opts, function (res) {
                // console.log("Got a response: " + res.statusCode);
                var err = res.statusCode == 500 ? true : false;
                res.setEncoding('utf8');
                var data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    phantom.POSTING = false;
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
                callback("Request() error evaluating " + method + "() call: " + err);
            })

            req.setHeader('Content-Type', 'application/json');

            var json = JSON.stringify({page: page, method: method, args: args});
            // console.log("Sending: ", json);
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
