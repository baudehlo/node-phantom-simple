node-phantom-simple
===================

[![Build Status](https://img.shields.io/travis/baudehlo/node-phantom-simple/master.svg?style=flat)](https://travis-ci.org/baudehlo/node-phantom-simple)
[![NPM version](https://img.shields.io/npm/v/node-phantom-simple.svg?style=flat)](https://www.npmjs.org/package/node-phantom-simple)

> A bridge between [PhantomJS](http://phantomjs.org/) / [SlimerJS](https://slimerjs.org/)
and [Node.js](http://nodejs.org/).

This module is API-compatible with
[node-phantom](https://www.npmjs.com/package/node-phantom) but doesn't rely on
`WebSockets` / `socket.io`. In essence the communication between Node and
Phantom / Slimer has been simplified significantly. It has the following advantages
over `node-phantom`:

  - Fewer dependencies/layers.
  - Doesn't use the unreliable and huge socket.io.
  - Works under [`cluster`](http://nodejs.org/api/cluster.html) (node-phantom
    does not, due to [how it works](https://nodejs.org/api/cluster.html#cluster_how_it_works))
    `server.listen(0)` works in cluster.
  - Supports SlimerJS.


Migrating 1.x -> 2.x
--------------------

Your software should work without changes, but can show deprecation warning
about outdated signatures. You need to update:

- `options.phantomPath` -> `options.path`
- in `.create()` `.evaluate()` & `.waitForSelector()` -> move `callback` to last
  position of arguments list.

That's all!


Installing
----------

```bash
npm install node-phantom-simple

# Also need phantomjs OR slimerjs:

npm install phantomjs
# OR
npm install slimerjs
```

__Note__. SlimerJS is not headless and requires a windowing environment.
Under Linux/FreeBSD/OSX [xvfb can be used to run headlessly.](https://docs.slimerjs.org/current/installation.html#having-a-headless-slimerjs). For example, if you wish
to run SlimerJS on Travis-CI, add those lines to your `.travis.yml` config:

```yaml
before_script:
  - export DISPLAY=:99.0
  - "sh -e /etc/init.d/xvfb start"
```


Development
-----------

You should manualy install `slimerjs` to run `npm test`:

```bash
npm install slimerjs
```

It's excluded from devDeps, because slimerjs binary download is banned on
Tvavice-CI network by authors.


Usage
-----

You can use it exactly like node-phantom, and the entire API of PhantomJS
should work, with the exception that every method call takes a callback (always
as the last parameter), instead of returning values.

For example, this is an adaptation of a
[web scraping example](http://net.tutsplus.com/tutorials/javascript-ajax/web-scraping-with-node-js/):

```js
var driver = require('node-phantom-simple');

driver.create({ path: require('phantomjs').path }, function (err, browser) {
  return browser.createPage(function (err, page) {
    return page.open("http://tilomitra.com/repository/screenscrape/ajax.html", function (err,status) {
      console.log("opened site? ", status);
      page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function (err) {
        // jQuery Loaded.
        // Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
        setTimeout(function () {
          return page.evaluate(function () {
            //Get what you want from the page using jQuery. A good way is to populate an object with all the jQuery commands that you need and then return the object.
            var h2Arr = [],
                pArr = [];

            $('h2').each(function () { h2Arr.push($(this).html()); });
            $('p').each(function () { pArr.push($(this).html()); });

            return {
              h2: h2Arr,
              p: pArr
            };
          }, function (err,result) {
            console.log(result);
            browser.exit();
          });
        }, 5000);
      });
	  });
  });
});
```

### .create(options, callback)

__options__ (not mandatory):

- __path__ (String) - path to phantomjs/slimerjs, if not set - will search in $PATH
- __parameters__ (Array) - CLI params for executed engine, [ { nave: value } ].
  You can also pass in an array to use verbatim names and values.
- __ignoreErrorPattern__ (RegExp) - a regular expression that can be used to
  silence spurious warnings in console, generated by Qt and PhantomJS.
  On Mavericks, you can use `/CoreText/` to suppress some common annoying
  font-related warnings.
- __bridgePath__ (String) - path to bridge.js, if not set - will take from root
  directory.


For example

```js
driver.create({ parameters: { 'ignore-ssl-errors': 'yes' } }, callback)
driver.create({ parameters: ['-jsconsole', '-P', 'myVal']} }, callback)
```

will start phantom as:

```bash
phantomjs --ignore-ssl-errors=yes
```

You can rely on globally installed engines, but we recommend to pass path explicit:

```js
driver.create({ path: require('phantomjs').path }, callback)
// or for slimer
driver.create({ path: require('slimerjs').path }, callback)
```

You can also have a look at [the test directory](tests/) to see some examples
of using the API, however the de-facto reference is the
[PhantomJS documentation](https://github.com/ariya/phantomjs/wiki/API-Reference).
Just mentally substitute all return values for callbacks.


WebPage Callbacks
-----------------

All of the `WebPage` callbacks have been implemented including `onCallback`,
and are set the same way as with the core phantomjs library:

```js
page.onResourceReceived = function(response) {
  console.log('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response));
};
```

This includes the `onPageCreated` callback which receives a new `page` object.


Properties
----------

Properties on the [WebPage](https://github.com/ariya/phantomjs/wiki/API-Reference-WebPage)
and [Phantom](https://github.com/ariya/phantomjs/wiki/API-Reference-phantom)
objects are accessed via the `get()`/`set()` method calls:

```js
page.get('content', function (err, html) {
  console.log("Page HTML is: " + html);
});

page.set('zoomfactor', 0.25, function () {
  page.render('capture.png');
});

// You can get/set nested values easy!
page.set('settings.userAgent', 'PhAnToSlImEr', callback);
```


Known issues
------------

Engines are buggy. Here are some cases you should know.

- `.evaluate` can return corrupted result:
  - SlimerJS: undefined -> null.
  - PhantomJS:
    - undefined -> null
    - null -> '' (empty string)
    - [ 1, undefined, 2 ] -> null
- `page.onConfirm()` handler can not return value due async driver nature.
  Use `.setFn()` instead: `page.setFn('onConfirm', function () { return true; })`.

License
-------

[MIT](https://github.com/baudehlo/node-phantom-simple/blob/master/LICENSE)


Other
-----

Made by Matt Sergeant for Hubdoc Inc.
