#!/usr/bin/env node

'use strict';

/**
 * @module node-server
 * @author Arne Seib <arne.seib@windy.com>
 * CLI for running the server.
 */

const chalk = require('chalk');
const runServer = require('../src/server');

//==============================================================================
// Sends a 'ready'-message in case this is run via pm2.
runServer(process.argv.slice(2))
	.then(() => { process.send && process.send('ready'); })
	.catch(error => {
		console.log(chalk.red(`✗`));
		console.log(chalk.red(error.message));
		if (process.env.NODE_ENV !== 'production') {
			console.log(error);
		}
		process.exit(1);
	}
);
