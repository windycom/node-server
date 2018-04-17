'use strict';

/**
 * @module server
 * @author Arne Seib <arne.seib@windy.com>
 * Main entry point.
 */

const Path = require('path');
const { createServer } = require('http');
const chalk = require('chalk');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pckg = require('../package.json');

let server = null;
let app = null;

// Defaults:
const DEFAULTS = {
	// port 8100
	PORT: 8100,
	// localhost only
	HOSTNAME: '127.0.0.1',
	HELMET: {
		// disable Strict Transport Security
		hsts: false,
		// disable cache
		noCache: true,
	},
	CORS: {},
};

//------------------------------------------------------------------------------
// Promisified server.listen()
const listen = (...args) => new Promise((resolve, reject) => {
	server.listen(...args, resolve).on('error', reject);
});

//------------------------------------------------------------------------------
const runServer = async (...sources) => {
	console.log(`*********************************`);
	console.log(`*`, chalk.whiteBright(`node-server ${pckg.version}`));
	console.log(`*********************************`);
	server = createServer(app = express());

	// load services
	console.log(chalk.yellow(`Loading services:`));
	const serviceModules = sources.map((service) => {
		switch (typeof service) {
			case 'string': {
				const servicePath = Path.resolve(process.cwd(), service);
				console.log(chalk.yellow(`Loading ${chalk.whiteBright(servicePath)}`));
				service = require(servicePath);
			}
			// fallthrough
			case 'object':
			case 'function': {
				// init-function
				const init = (typeof service === 'function')
					? service
					: service.init;
				if (typeof init !== 'function') {
					throw new TypeError('Service export must be a function or an object containing a "init()" function.');
				}
				return { service, init };
			}
			default:
				throw new TypeError(`Arguments passed to runServer must be either a string or a function. Have ${typeof arg}.`)
		}
	});

	// allow service to do loading before anything else is happening
	console.log(chalk.yellow(`Calling service.load()`));
	for (const service of serviceModules) {
		if (typeof service.service.load === 'function') {
			await service.service.load();
		}
	}
	console.log(chalk.green(`✓ ${serviceModules.length} Service(s) loaded.`));

	// first service only is used for configuration
	const firstService = serviceModules[0].service;

	// -- validate config
	process.stdout.write(chalk.yellow(`Checking config... `));

	// port
	const port = parseInt(firstService.PORT || DEFAULTS.PORT, 10);

	// hostname
	const hostname = (typeof firstService.HOSTNAME === 'undefined')
		? DEFAULTS.HOSTNAME
		: firstService.HOSTNAME;

	// helmet options
	const helmetOptions = Object.assign(DEFAULTS.HELMET, firstService.HELMET);

	// cors options
	const corsOptions = Object.assign(DEFAULTS.CORS, firstService.CORS);

	// validate
	if (isNaN(port)) {
		throw new TypeError('Port must be a number');
	}

	console.log(chalk.green(`✓ Ok.`));

	// -- setup server
	process.stdout.write(chalk.yellow(`Initializing server... `));

	// trust proxy
	app.enable('trust proxy');

	// disable etag
	app.set('etag', false);

	// helmet
	app.use(helmet(helmetOptions));

	// cors
	app.use(cors(corsOptions));
	console.log(chalk.green(`✓ Ok.`));

	// -- init services
	console.log(chalk.yellow(`Initializing services:`));
	for (const service of serviceModules) {
		await service.init(app, { server, port, hostname });
	}
	console.log(chalk.green(`✓ Done.`));

	// -- start server
	const onHost = hostname ? `${hostname}:` : 'port ';
	process.stdout.write(chalk.yellow(`Starting server on ${onHost}${chalk.whiteBright(port)}... `));
	await listen(port, hostname);
	console.log(chalk.green(`✓ Ok.`));
	console.log(chalk.greenBright(`Server up and running.`));
};

module.exports = runServer;
