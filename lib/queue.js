'use strict';


module.exports = Queue;


function Queue(worker) {
    this.worker = worker;
    this._queue = [];
    this.running = false;
}


Queue.prototype.push = function (obj) {
    this._queue.push(obj);
    this.process();
};


Queue.prototype.process = function () {
    if (this.running || this._queue.length === 0) return;
    this.running = true;
    var task = this._queue.shift();
    var self = this;
    this.worker(task, function() {
        self.running = false;
        self.process();
    });
}
