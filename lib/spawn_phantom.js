'use strict';


var child_process = require('child_process')
    , spawn = child_process.spawn
    , exec = child_process.exec
    , util = require('util');


module.exports = spawnPhantom;


function spawnPhantom(options, callback) {
    options.phantomPath = options.phantomPath || 'phantomjs';
    options.parameters = options.parameters || {};

    var args = [];
    for (var param in options.parameters) {
        args.push('--' + param + '=' + options.parameters[param]);
    }
    args.push(options.bridge);

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
