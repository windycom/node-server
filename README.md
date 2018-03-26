# node-server

Express server setup for quick tests.

### Installation

Install as global:

```
sudo npm install -g windycom/node-server
```

### Usage

```
node-server path/to/file.js [configname]
```

`file.js` must export a single function:

```
module.exports = (app) => {
	// app is the express-app.
  // add your middleware / routes / whatever here
};
```

When the server starts, it:

- creates an express-app
- sets some reasonable defaults (using helmet)
- calls the exported function: `await fn(expressApp)`
- calls `listen` on `app`

That's all.

Oh, and `configname` defaults to `default` and is resolved towards `./config`.

`.local.*` config-files are gitignored and used with precedence, so copy `default.js` to `default.local.js`, and the server will pick up that one.
