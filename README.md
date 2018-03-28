# node-server

Express server setup for quick tests.

Here are the ~100 lines of code you need to run an
[express](https://github.com/expressjs/express)-server with
[CORS](https://github.com/expressjs/cors) and [helmet](https://github.com/helmetjs/helmet).

It should save you the hustle of copying and pasting those same 100 lines each
time you need to try something or just want to play around.

Just specify your js-file on the command line, and you have a server running.

### Installation

Usually you would install node-server as global:

```
sudo npm i -g windycom/node-server
```

### Usage

```
node-server <js-file> [...<js-file>]
```

Each file (a "service") must export an (asynchronous) `init()`-function, either
as the default (`module.exports`) or as a named function (`module.exports.init`).

The function will recieve the expressjs-app, together with an options object, and
is free to do with `app` whatever it feels like (add middleware, set some routes etc):

```JavaScript
module.exports = async (app, options) => {
  app.get('/', myFancyRequestHandler);
};

// or:

module.exports.init = async (app, options) => {
  app.get('/', myFancyRequestHandler);
};
```

Additionally, you can export a few configuration values:

```JavaScript
module.exports.PORT = 8100;
module.exports.HOSTNAME = '127.0.0.1';
module.exports.HELMET = {
  hsts: false,
  noCache: true,
};
module.exports.CORS = {};
module.exports.DEBUG = true;
```

The values above are the defaults that will be used if you don't specify overrides.

**Note:** When you run multiple services, the configuration is taken from the
first one. Values on other services will be ignored.

The options-object passed to `init()` has the following properties:

- `server`: The http-server. Use to add e.g. websockets.
- `debug`: If `true`, full errors will be shown (only the message otherwise).
- `port`: The port used.
- `hostname`: The hostname used.

When the server starts, it does the following:

- Create an express-app via `express()`.
- Create a http-server via `http.createServer(app)`.
- Load the services you specified.
- Set some defaults: Helmet, CORS, etc.
- Calls each of the `init`-functions asynchronously: `await init(app, options)`.
- calls `listen` on `server`.

That's all.

## License

This software is licenced under the [MIT](https://opensource.org/licenses/MIT) license.
