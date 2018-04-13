#!/usr/bin/env node

'use strict';

/**
 * @module node-dev-server
 * @author Arne Seib <arne.seib@windy.com>
 * CLI for running the server with reload capability.
 */

const Path = require('path');
const { fork } = require('child_process');

let child = null;

const startChild = () => {
	child = fork(Path.join(__dirname, 'node-server.js'), process.argv.slice(2));
	child.once('exit', (code, signal) => {
		if (signal === 'SIGHUP') {
			console.log(`Restarting child`);
			setTimeout(startChild, 200);
		}
	});
};

//==============================================================================
process.stdin.on('data', (data) => {
	const s = data.toString().trim().toLowerCase();
	switch (s) {
		case 'r':
		case 'reload':
		case 'hup':
			child && child.kill('SIGHUP');
			break;
		default:
			break;
	}
});

process.on('SIGTSTP', () => {
	child && child.kill('SIGHUP');
});

startChild();
