#!/usr/bin/env node

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

let debug = false;

//------------------------------------------------------------------------------
// Promisified server.listen()
const listen = (...args) => new Promise((resolve, reject) => {
	server.listen(...args, resolve).on('error', reject);
});

//------------------------------------------------------------------------------
const main = async () => {
	const serviceNames = process.argv.slice(2);
	if (!serviceNames.length) {
		console.error('Usage: node-server <js-file> [...<js-file>]');
		process.exit(1);
	}

	console.log(`*********************************`);
	console.log(`*`, chalk.whiteBright(`node-server ${pckg.version}`));
	console.log(`*********************************`);
	server = createServer(app = express());

	// load service
	const services = serviceNames.map((name) => {
		const servicePath = Path.resolve(process.cwd(), name);
		console.log(chalk.yellow(`Loading ${chalk.whiteBright(servicePath)}`));
		const service = require(servicePath);
		// init-function
		const init = (typeof service === 'function')
			? service
			: service.init;
		if (typeof init !== 'function') {
			throw new TypeError('Service export must be a function or an object containing a "init()" function.');
		}
		return { service, init };
	});
	console.log(chalk.green(`✓ ${services.length} Service(s) loaded.`));

	// first service only is used for configuration
	const firstService = services[0].service;

	debug = (typeof firstService.DEBUG === 'undefined')
		? true
		: !!firstService.DEBUG;

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

	console.log(chalk.yellow(`Initializing services:`));
	for (const service of services) {
		await service.init(app, { server, debug, port, hostname });
	}
	console.log(chalk.green(`✓ Done.`));

	// listen
	const onHost = hostname ? `${hostname}:` : 'port ';
	process.stdout.write(chalk.yellow(`Starting server on ${onHost}${chalk.whiteBright(port)}... `));
	await listen(port, hostname);
	console.log(chalk.green(`✓ Ok.`));

	// done
	console.log(chalk.greenBright(`Server up and running.`));
};

//==============================================================================
// Sends a 'ready'-message in case this is run via pm2.
main().then(() => { process.send && process.send('ready'); }).catch(error => {
	console.log(chalk.red(`✗`));
	console.log(chalk.red(error.message));
	if (debug) {
		console.log(error);
	}
	process.exit(1);
});
