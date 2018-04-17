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

//------------------------------------------------------------------------------
const startChild = (restarting) => {
	if (child) {
		child.restart = true;
		child.kill();
		return;
	}
	if (!restarting) {
		console.log(`Starting child`);
	}

	child = fork(Path.join(__dirname, 'node-server.js'), process.argv.slice(2));
	child.once('exit', (code, signal) => {
		console.log(`Child exited (${code}) (${signal}).`);
		if (child.restart) {
			console.log(`Restarting child`);
			setTimeout(() => { startChild(true); }, 200);
		}
		child = null;
	});
};

//------------------------------------------------------------------------------
process.stdin.on('data', (data) => {
	const s = data.toString().trim().toLowerCase();
	switch (s) {
		case 'r':
		case 'reload':
		case 'hup':
			startChild();
			break;
		default:
			break;
	}
});

process.on('SIGTSTP', () => { startChild(); });
startChild();
