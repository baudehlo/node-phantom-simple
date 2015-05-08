'use strict';


var _utils = require('./_utils')
    , callbackOrDummy = _utils.callbackOrDummy;


module.exports = PhantomProxy;


function PhantomProxy(phantom, request_queue, poll_func, setup_new_page) {
    this.process = phantom;
    this.request_queue = request_queue;
    this.poll_func = poll_func;
    this.setup_new_page = setup_new_page;
}


PhantomProxy.prototype.createPage = function (callback) {
    var self = this;
    this.request_queue.push([[0,'createPage'], callbackOrDummy(function (err, results) {
        if (err)
            callback(err);
        else {
            var id = results.page_id;
            var page = self.setup_new_page(id);
            return callback(null, page);
        }
    }, this.poll_func)]);
}


PhantomProxy.prototype.injectJs = function (filename, callback) {
    this.request_queue.push([[0,'injectJs', filename], callbackOrDummy(callback, this.poll_func)]);
}


PhantomProxy.prototype.addCookie = function (cookie, callback) {
    this.request_queue.push([[0,'addCookie', cookie], callbackOrDummy(callback, this.poll_func)]);
}


PhantomProxy.prototype.clearCookies = function (callback) {
    this.request_queue.push([[0, 'clearCookies'], callbackOrDummy(callback, this.poll_func)]);
}


PhantomProxy.prototype.deleteCookie = function (cookie, callback) {
    this.request_queue.push([[0, 'deleteCookie', cookie], callbackOrDummy(callback, this.poll_func)]);
}


PhantomProxy.prototype.set = function (property, value, callback) {
    this.request_queue.push([[0, 'setProperty', property, value], callbackOrDummy(callback, this.poll_func)]);
}


PhantomProxy.prototype.get = function (property, callback) {
    this.request_queue.push([[0, 'getProperty', property], callbackOrDummy(callback, this.poll_func)]);
}


PhantomProxy.prototype.exit = function (callback){
    this.process.kill('SIGTERM');
    callbackOrDummy(callback)();
}


PhantomProxy.prototype.on = function () {
    this.process.on.apply(this.process, arguments);
}
