'use strict';


var http = require('http')
    , Queue = require('./queue');


module.exports = requestQueue;


function requestQueue(phantom, opts) {
    return new Queue(function (paramarr, next) {
        var params = paramarr[0];
        var callback = paramarr[1];
        var page = params[0];
        var method = params[1];
        var args = params.slice(2);
        
        var http_opts = {
            hostname: '127.0.0.1',
            port: opts.port,
            path: '/',
            method: 'POST',
        }

        phantom.POSTING = true;

        var req = http.request(http_opts, function (res) {
            // console.log('Got a response: ' + res.statusCode);
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
                    return callback('No response body for page.' + method + '()');
                }
                var results = JSON.parse(data);
                // console.log('Response: ', results);
                
                if (err) {
                    next();
                    return callback(results);
                }

                next();
                callback(null, results);
            });
        });

        req.on('error', function (err) {
            console.warn('Request() error evaluating ' + method + '() call: ' + err);
            callback('Request() error evaluating ' + method + '() call: ' + err);
        })

        req.setHeader('Content-Type', 'application/json');

        var json = JSON.stringify({page: page, method: method, args: args});
        // console.log('Sending: ', json);
        req.setHeader('Content-Length', Buffer.byteLength(json));
        req.write(json);
        req.end();
    });
}
