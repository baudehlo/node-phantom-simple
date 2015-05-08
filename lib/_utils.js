'use strict';


module.exports = {
    callbackOrDummy: callbackOrDummy,
    unwrapArray: unwrapArray,
    wrapArray: wrapArray
};


function callbackOrDummy (callback, poll_func) {
    if (!callback) return function () {};
    if (poll_func) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            // console.log("Polling for results before returning with: " + JSON.stringify(args));
            poll_func(function (err) {
                // console.log("Inside...");
                if (err) {
                    // We could send back the original arguments,
                    // but I'm assuming that this error is better.
                    callback(err)
                } else {
                    callback.apply(null, args);
                }
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


function wrapArray(arr) {
    // Ensure that arr is an Array
    return (arr instanceof Array) ? arr : [arr];
}
