'use strict';


var _utils = require('./_utils')
    , callbackOrDummy = _utils.callbackOrDummy;


module.exports = Page;


/**
 * Page class
 */
function Page(id, request_queue, poll_func) {
    this.id = id;
    this.request_queue = request_queue;
    this.poll_func = poll_func;
}


var methods = [
    'addCookie', 'childFramesCount', 'childFramesName', 'clearCookies', 'close',
    'currentFrameName', 'deleteCookie', 'evaluateJavaScript',
    'evaluateAsync', 'getPage', 'go', 'goBack', 'goForward', 'includeJs',
    'injectJs', 'open', 'openUrl', 'release', 'reload', 'render', 'renderBase64',
    'sendEvent', 'setContent', 'stop', 'switchToFocusedFrame', 'switchToFrame',
    'switchToFrame', 'switchToChildFrame', 'switchToChildFrame', 'switchToMainFrame',
    'switchToParentFrame', 'uploadFile',
];



Page.prototype.setFn = function (name, fn, cb) {
    this.request_queue.push([[this.id, 'setFunction', name, fn.toString()], callbackOrDummy(cb, this.poll_func)]);
};


Page.prototype.get = function (name, cb) {
    this.request_queue.push([[this.id, 'getProperty', name], callbackOrDummy(cb, this.poll_func)]);
};


Page.prototype.set = function (name, val, cb) {
    this.request_queue.push([[this.id, 'setProperty', name, val], callbackOrDummy(cb, this.poll_func)]);
};


Page.prototype.evaluate = function (fn, cb) {
    var extra_args = [];
    if (arguments.length > 2) {
        extra_args = Array.prototype.slice.call(arguments, 2);
        // console.log("Extra args: " + extra_args);
    }
    this.request_queue.push([[this.id, 'evaluate', fn.toString()].concat(extra_args), callbackOrDummy(cb, this.poll_func)]);
};


Page.prototype.waitForSelector = function (selector, cb, timeout) {
    var startTime = Date.now();
    var timeoutInterval = 150;
    var self = this;

    timeout = timeout || 10000; //default timeout is 10 sec;
    setTimeout(testForSelector, timeoutInterval);

    //if evaluate succeeds, invokes callback w/ true, if timeout,
    // invokes w/ false, otherwise just exits
    function testForSelector() {
        var elapsedTime = Date.now() - startTime;

        if (elapsedTime > timeout)
            return cb('Timeout waiting for selector: ' + selector);

        self.evaluate(function (selector) {
            return document.querySelectorAll(selector).length;
        }, function (err, result) {
            if (result > 0) cb(); //selector found
            else setTimeout(testForSelector, timeoutInterval);
        }, selector);
    }
};


methods.forEach(function (method) {
    Page.prototype[method] = function () {
        var args = Array.prototype.slice.call(arguments);
        var callback = null;
        if (args.length > 0 && typeof args[args.length - 1] === 'function')
            callback = args.pop();
        var req_params = [this.id, method].concat(args);
        this.request_queue.push([req_params, callbackOrDummy(callback, this.poll_func)]);
    }
});
