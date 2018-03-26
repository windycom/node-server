#!/usr/bin/env node

'use strict';

/**
 * @module server
 * @author Arne Seib <arne.seib@windy.com>
 * Main entry point.
 */

const Path = require('path');
const chalk = require('chalk');
const express = require('express');
const helmet = require('helmet');
const { loadConfig, setConfig, config } = require('./config');

const app = express();

//------------------------------------------------------------------------------
// Promisify app.listen()
const listen = () => new Promise((resolve, reject) => {
	app.listen(config.port, config.bind, resolve).on('error', reject);
});

//------------------------------------------------------------------------------
const run = async () => {
	if (process.argv.length < 3) {
		console.error('Usage: node-server service.js [config-file.js]');
		process.exit(1);
	}

	// load config
	const configFilename = process.argv.length > 3
		? process.argv[3]
		: 'default';
	const options = await loadConfig(configFilename);
	console.log(`Config: ${chalk.whiteBright(options.__file)}.`);

	// update process
	process.env.NODE_ENV = options.NODE_ENV;
	console.log(`NODE_ENV: ${chalk.whiteBright(process.env.NODE_ENV)}.`);

	// run server
	process.stdout.write(chalk.yellow(`*** Booting server\n`));

	// validate and set config
	await setConfig(options);

	// some basic express setup
	process.stdout.write(chalk.yellow(`Initializing server... `));
	app.enable('trust proxy');
	app.set('etag', false);
	app.use(helmet({
		hsts: false,
		noCache: true,
	}));
	process.stdout.write(chalk.green(`✓ Ok.\n`));

	// load service
	const service = Path.resolve(process.cwd(), process.argv[2]);
	process.stdout.write(chalk.yellow(`Loading service from ${service}... `));
	await require(service)(app);
	process.stdout.write(chalk.green(`\n✓ Ok.\n`));

	// listen
	process.stdout.write(chalk.yellow(`Starting server on ${config.bind}:${chalk.whiteBright(config.port)}... `));
	await listen();
	process.stdout.write(chalk.green(`✓ Ok.\n`));

	// done
	process.stdout.write(chalk.greenBright(`Server up and running.\n`));
};

//==============================================================================
run().then(() => { process.send && process.send('ready'); }).catch(error => {
	console.log(chalk.red(`✗ ${error.message}`));
	process.exit(1);
});
