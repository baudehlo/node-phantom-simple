2.2.4 / 2016-01-26
------------------

- Fix: parse 127.0.0.0/8 properly, #115, thanks to @janl.


2.2.3 / 2016-01-17
------------------

- Allow engine options to be an array to pass in verbatim keys and values.


2.2.2 / 2015-12-30
------------------

- One more improvement of phantom exit check, #102, thanks to @siboulet.


2.2.1 / 2015-12-09
------------------

- Improved phantom die detection (connection loss), #100, thanks to @joscha.


2.2.0 / 2015-11-28
------------------

- Don't write messages to console - use `debug` instead, #96.


2.1.1 / 2015-11-07
------------------

- Improved port detection support for DO droplets, #76, thanks to @svvac.


2.1.0 / 2015-10-28
------------------

- Replaced SIGINT/SIGTERM handlers with watchdog, #81.
- Improved nested page props support, #90.
- Added support for `page.header.contents` & `page.footer.contents`, #78.


2.0.6 / 2015-10-09
------------------

- Added `.setProxy()` support.


2.0.5 / 2015-09-17
------------------

- Removed uncaught exception handler and forced exit (that should be in parent
  application)
- Added process events proxy to avoid memleak warnings on parallel browser
  instances run.
- Added `onConfirm` details to known issues.


2.0.4 / 2015-08-22
------------------

- Fixed poll loop termination after browser die (missed in 2.0.3).


2.0.3 / 2015-08-17
------------------

- Fixed poll loop termination after `.close()`.


2.0.2 / 2015-08-02
------------------

- Added `clearMemoryCache()` engine method support.
- Coding style update.
- Added linter to tests.


2.0.1 / 2015-07-12
------------------

- Improved iproute2 support (different output format in Ubuntu 15.04+).


2.0.0 / 2015-07-09
------------------

- Added SlimerJS support.
- Moved callbacks to last position in all functions.
  - old style calls still work but show deprecation message.
- Renamed `options.phantomPath` -> `options.path`
  - old style options still work but show deprecation message.
- Added FreeBSD support.
- Improved Linux support - try iproute2 before net-tools.
- Added dot notation support for nested properties in `.set` / `.get`.
- Defined missed `onResourceTimeout` handler.
- Defined `onAuthPrompt` handler, specific to SlimerJS.
- Fixed Win32 support.
- Fixed Yosemite support with multiname localhost aliases.
- Return proper errors when PhantomJS / SlimerJS process dies.
- Fixed `waitForSelector` callback result.
- Fixed possible result corruption in `evaluate`.
- Rewritten tests & automated testing.


1.2.0 / 2014-03-19
------------------

- Tests rewrite & code cleanup.


1.1.1 / 2014-03-12
------------------

- Fix possible ECONNRESET after exit.


1.1.0 / 2014-02-10
------------------

- Fix and work-around broken includeJs function.


Previous versions
-----------------

...
