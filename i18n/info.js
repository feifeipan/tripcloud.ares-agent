'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, http = require('http')
	
	/* NPM */
	, noda = require('noda')
	
	/* in-package */
	, __CONFIG = noda.inRequire('config')
	, modulesManager = require('./manager/modules')
	;

function info(/* [req] */) {
	let data = null;
	if (arguments[0] instanceof http.IncomingMessage) {
		data = {
			headers: req.headers,
			remoteAddress: req.connection ? req.connection.remoteAddress : null,
		};
	}
	else {
		data = {};
		data.config = Object.assign({}, __CONFIG);
		data.modules = modulesManager.info();
	}
	return data;
}

module.exports = info;