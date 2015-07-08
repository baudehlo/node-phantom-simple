'use strict';


var http    = require('http');
var url     = require('url');
var os      = require('os');
var assert  = require('assert');
var driver  = require('../');


describe('engine', function () {
  var usingProxy = false, browser, proxyServer;

  before(function (done) {
    proxyServer = http.createServer(function (request, response) {
      console.log('Req!');
      var requestedUrl = url.parse(request.url);

      if (requestedUrl.path === '/testPhantomPagePushNotifications') {
        usingProxy = true;
        response.writeHead(200, { "Content-Type": 'text/html' });
        response.end('okay');
        return;
      }

      var req = http.request(
        {
          hostname: requestedUrl.hostname,
          port: requestedUrl.port,
          path: requestedUrl.path,
          method: request.method
        },
        function (res) {
          response.writeHead(res.statusCode, res.headers);
          res.on('data', function (data) {
            response.write(data)
          });
          res.on('end', function () {
            response.end()
          });
        }
      );

      req.on('error', function (error) {
        console.log(error);
        response.end();
        browser && browser.exit();
        proxyServer.close();
      });

      req.end();
    }).listen(done);
  });

  it.skip('command line options', function (done) {
    if (os.platform() === 'darwin') {
      this.skip(); // Proxy doesn't work on OSX
    }

    driver.create(function (err, eng) {
      if (err) {
        done(err);
        return;
      }

      browser = eng;
      browser.createPage(function (err, page) {
        if (err) {
          done(err);
          return;
        }

        page.open('http://localhost/testPhantomPagePushNotifications', function (err) {
          if (err) {
            done(err);
            return;
          }

          console.log('Got localhost from somewhere...');
          browser.exit(function () {
            assert.equal(usingProxy, true, 'Check if using proxy');
            done();
          });
        });
      });
    }, {
      parameters: { proxy: 'localhost:' + proxyServer.address().port },
      phantomPath: require(process.env.ENGINE || 'phantomjs').path
    });
  });

  after(function (done) {
    proxyServer.close(done);
  });
});
