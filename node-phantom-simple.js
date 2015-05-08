"use strict";

var spawnPhantom = require('./lib/spawn_phantom')
    , longPoll = require('./lib/long_poll')
    , requestQueue = require('./lib/request_queue')
    , PhantomProxy = require('./lib/phantom_proxy')
    , Page = require('./lib/page')
    , _utils = require('./lib/_utils')
    , callbackOrDummy = _utils.callbackOrDummy
    , unwrapArray = _utils.unwrapArray
    , wrapArray = _utils.wrapArray;


exports.create = function (callback, options) {
    options = options || {};
    options.bridge = options.bridge || (__dirname + '/bridge.js');

    spawnPhantom(options, function (err, phantom, port) {
        if (err) return callback(err);

        // console.log("Phantom spawned with web server on port: " + port);

        var pages = {};
        var request_queue = requestQueue(phantom, port);
        var poll_func = longPoll(phantom, port, pages, setup_new_page);
        var proxy = new PhantomProxy(phantom, request_queue, poll_func, setup_new_page);

        callback(null, proxy);


        function setup_new_page(id) {
            // console.log("Page created with id: " + id);
            var page = new Page(id, request_queue, poll_func);
            pages[id] = page;
            return page;            
        }
    });
}
