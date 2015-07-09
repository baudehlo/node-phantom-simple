2.0.0 / WIP
------------------

- Added SlimerJS support.
- Moved callbacks to last position in all functions.
  - old style format still works but shows deprecation message.
- Added FreeBSD support.
- Improved Linux support - try iproute2 before net-tools.
- Added dot notation support for nested properties in `.set` / `.get`.
- Defined missed `onResourceTimeout` handler.
- Defined `onAuthPrompt` handler, specific to SlimerJS.
- Fixed Win32 support.
- Fixed Yosemite support with multiname localhost aliases.
- Return proper errors when PhantomJS / SlimerJS process dies.
- Fixed `waitForSelector` callback result.
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
