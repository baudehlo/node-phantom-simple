var phantom=require('../node-phantom-simple');

exports.testPhantomCreatePagePath = function(test) {
    phantom.create({phantomPath:'@@@', ignoreErrorPattern: /execvp/}
	, function (error,ph) {
        test.notStrictEqual(null, error, "Bad path produces an error");
        test.done();
    });
};
