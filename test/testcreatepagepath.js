var phantom=require('../node-phantom-simple');

exports.testPhantomCreatePagePath=function(beforeExit,assert) {
	phantom.create(function(error,ph){
		assert.isNotNull(error);
	},{phantomPath:'@@@'});
};
