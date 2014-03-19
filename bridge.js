var webpage     = require('webpage');
var webserver   = require('webserver').create();
var system      = require('system');

var pages  = {};
var page_id = 1;

var callback_stack = [];

phantom.onError = function (msg, trace) {
	var msgStack = ['PHANTOM ERROR: ' + msg];
	if (trace && trace.length) {
	    msgStack.push('TRACE:');
	    trace.forEach(function(t) {
	        msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function + ')' : ''));
	    });
	}
	system.stderr.writeLine(msgStack.join('\n'));
	phantom.exit(1);
}

function page_open (res, page, args) {
	page.open.apply(page, args.concat(function (success) {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.write(JSON.stringify(success));
		// console.log("Close1");
		res.close();
	}))
}

function include_js (res, page, args) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json');
	res.write('"success"');
	// console.log("Calling includeJs");
	var response = page.includeJs.apply(page, args.concat(function () {
		// console.log("Came back...");
		try {
			res.write('');
			// console.log("Close2");
			res.close();
		}
		catch (e) {
			if (!/cannot call function of deleted QObject/.test(e)) { // Ignore this error
				page.onError(e);
			}
		}
	}));
}

var service = webserver.listen('127.0.0.1:0', function (req, res) {
	// console.log("Got a request of type: " + req.method);
	if (req.method === 'GET') {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		// console.log("Sending back " + callback_stack.length + " callbacks");
		res.write(JSON.stringify(callback_stack));
		callback_stack = [];
		// console.log("Close3");
		res.close();
	}
	else if (req.method === 'POST') {
		var request = JSON.parse(req.post);
		var method  = request.method;
		var output  = null;
		var error   = null;
		if (request.page) {
			if (method === 'open') { // special case this as it's the only one with a callback
				return page_open(res, pages[request.page], request.args);
			}
			else if (method === 'includeJs') {
				return include_js(res, pages[request.page], request.args);
			}
			try {
				// console.log("Calling: page." + method + "(" + request.args + ")");
				var output = pages[request.page][method].apply(pages[request.page], request.args);
				// console.log("Got output: ", output);
			}
			catch (err) {
				error = err;
			}
		}
		else {
			try {
				output = global_methods[method].apply(global_methods, request.args);
			}
			catch (err) {
				error = err;
			}
		}

		res.setHeader('Content-Type', 'application/json');
		if (error) {
			res.statusCode = 500;
			res.write(JSON.stringify(error));
		}
		else {
			// console.log("Results: " + output);
			res.statusCode = 200;
			res.write(JSON.stringify(output || null));
		}
		// console.log("Close4")
		res.close();
	}
	else {
		throw "Unknown request type!";
	}
});

var callbacks = [
	'onAlert', 'onCallback', 'onClosing', 'onConfirm', 'onConsoleMessage', 'onError', 'onFilePicker',
	'onInitialized', 'onLoadFinished', 'onLoadStarted', 'onNavigationRequested',
	'onPrompt', 'onResourceRequested', 'onResourceReceived', 'onResourceError', 'onUrlChanged',
];

function setup_callbacks (id, page) {
	callbacks.forEach(function (cb) {
        page[cb] = function (parm) {
            var args = Array.prototype.slice.call(arguments);
            if ((cb==='onResourceRequested') && (parm.url.indexOf('data:image') === 0)) return;
            // console.log("Callback: " + cb);
            if (cb==='onClosing') { args = [] };
            callback_stack.push({'page_id': id, 'callback': cb, 'args': args});
	        // console.log("Callback stack size now: " + callback_stack.length);
        };
	});
	// Special case this
	page.onPageCreated = function (page) {
		var new_id = setup_page(page);
		callback_stack.push({'page_id': id, 'callback': 'onPageCreated', 'args': [new_id]})
	}
}

function setup_page (page) {
	var id    = page_id++;
	page.getProperty = function (prop) {
		return page[prop];
	}
	page.setProperty = function (prop, val) {
		return page[prop] = val;
	}
	page.setFunction = function (name, fn) {
		page[name] = eval('(' + fn + ')');
		return true;
	}
	pages[id] = page;
	setup_callbacks(id, page);
	return id;
}

var global_methods = {
	createPage: function () {
		var page  = webpage.create();
		var id = setup_page(page);
		return { page_id: id };
	},

	injectJs: function (filename) {
		return phantom.injectJs(filename);
	},

	exit: function (code) {
		return phantom.exit(code);
	},

	addCookie: function (cookie) {
		return phantom.addCookie(cookie);
	},

	clearCookies: function () {
		return phantom.clearCookies();
	},

	deleteCookie: function (name) {
		return phantom.deleteCookie(name);
	},

	getProperty: function (prop) {
		return phantom[prop];
	},

	setProperty: function (prop, value) {
		phantom[prop] = value;
		return true;
	},
}

console.log("Ready [" + system.pid + "]");
