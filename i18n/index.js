'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, http = require('http')
	, url = require('url')
	
	/* NPM */
	, noda = require('noda')
	
	/* in-package */
	, __CONFIG = noda.inRequire('config')
	, normal = noda.inRequire('normal')
	, isCanaryRequest = noda.inRequire('lib/isCanaryRequest')
	
	, lifecycle = require('./lifecycle')
	, info = require('./info')
	, getHost = require('./getHost')
	, _immutable = require('./_immutable')
	, modulesManager = require('./manager/modules')
	, resourceNamesManager = require('./manager/resourceNames')
	;

/**
 * Assistant symbol used in `getUrl()`.
 */
const SYMBOL_INTRANET = Symbol('intranet_request');

function _checkAlive() {
	if (!lifecycle.isAlive()) {
		throw new Error('@ctrip/ares-agent is not alive!');
	}
}

/**
 * Get intranet hostname of the website serving static contents.
 * @return {string}
 */
function getIntranetHost() {
	_checkAlive();

	return __CONFIG['intranet.host'];
}

/**
 * Transform resource name (pesudo URL) to real integrated URL.
 * @param {string} resourceName 
 * @param {http.IncomingMessage} [req]
 */
function getUrl(/* resourceName, resourceName, ..., req */) {
	_checkAlive();

	let args = Array.from(arguments);

	let hostname;
	let protocol = __CONFIG.protocol;
	if (args[0] == SYMBOL_INTRANET) {
		args.shift();
		hostname = getIntranetHost();
		if(__CONFIG.tryHttp){
			protocol = 'http:';
		}
	}

	// Find the IncomingMessage object if exists.
	let req = args.find(arg => arg instanceof http.IncomingMessage);
	let canary = false;

	// Skip the IncomingMessage object.
	if (req) {
		args = args.filter(arg => arg !== req);
		canary = isCanaryRequest(req);
	}

	if (!hostname) {
		hostname = getHost(req);
	}

	// ---------------------------

	const L = args.length;

	SINGLE: {
		let parsed = {
			hostname,
			protocol,
			query: {},
		};
		
		// (string)
		if (L == 1 && typeof args[0] == 'string') {
			let resourceName = args[0];
			parsed.pathname = modulesManager.getRealpath(resourceName, canary);
			return _one(parsed);
		}
	}

	CONCAT: {
		// (string, ...)
		if (L > 1 && args.every(arg => typeof arg == 'string')) {
			let pathnames = modulesManager.getRealpaths(args, canary);
			return _concat(pathnames, hostname);
		}

		// ([string, ...])
		if (L == 1 && Array.isArray(args[0]) && args[0].every(arg => typeof arg == 'string')) {
			let pathnames = modulesManager.getRealpaths(args[0], canary);
			return _concat(pathnames, hostname);
		}
	}

	INVALID_ARGUMENTS: {
		throw new Error('[ARES] invalid arguments found');
	}
}

/**
 * Get manifest of the module.
 * @param {string} moduleAlias 
 * @param {http.IncomingMessage} req 
 * @return {object}
 */
function getManifest(moduleAlias, req) {
	_checkAlive();

	let canary = req ? isCanaryRequest(req) : false;
	return modulesManager.getManifest(moduleAlias, canary);
}

/**
 * Get public base path of a module.
 * @param {string} moduleAlias - alias of module defined while init()
 * @param {http.IncomingMessage} [req]
 * @return {string}
 */
function getModuleBase(moduleAlias, req) {
	_checkAlive();

	let hostname = getHost(req);
	let basepath = modulesManager.getBasepath(moduleAlias);
	return `${__CONFIG.protocol}//${hostname}${basepath}`;
}

/**
 * Get public base path of a module.
 * @param {string} moduleAlias - alias of module defined while init()
 * @param {http.IncomingMessage} [req]
 * @return {string}
 */
function getIntranetModuleBase(moduleAlias) {
	_checkAlive();

	let hostname = getIntranetHost();
	let basepath = modulesManager.getBasepath(moduleAlias);
	return `${__CONFIG.protocol}//${hostname}${basepath}`;
}


/**
 * Similiar to `getUrl()`, except that the returned URL is only accessiable in intranet.
 * @param {string} resourceName 
 * @param {http.IncomingMessage} [req]
 * @return {string}
 */
function getIntranetUrl() {
	_checkAlive();

	let args = Array.from(arguments);
	args.unshift(SYMBOL_INTRANET);
	return getUrl.apply(null, args);
}

/**
 * getUrl(string)
 * getUrl(string, req)
 */
function _one(parsed) {
	// 检查路径是否合法。
	// 如不合法，将直接抛出异常。
	resourceNamesManager.validate(parsed.pathname);

	// 内容不可变的资源，无须尝试获取额外信息以强制更新。
	if (!_immutable(parsed.pathname)) {		
		let cacheName = `//${__CONFIG['i18n.host']}${parsed.pathname}`;
		let meta = normal.tryMeta(cacheName);
		if (meta) {
			parsed.query.etagc = meta.etagc;
		}
	}
	return url.format(parsed);
}

/**
 * getUrl(string, string, ...)
 * getUrl(string, string, ..., req)
 */
function _concat(pathnames, hostname) {
	pathnames.every(resourceNamesManager.validate);

	// 获取合并后的资源路径及特征参数。
	let options = {
		hostname: __CONFIG['i18n.host'],
		pathnames,
	};
	let extra = {
		noFormat: true,
		noMeta: pathnames.every(_immutable),
	};
	let parsed = normal.getConcatUrl(options, extra);
	
	// 替换协议和域名。
	parsed.protocol = __CONFIG.protocol;
	parsed.hostname = hostname;

	return url.format(parsed);
}

module.exports = {
	getHost,
	getUrl,
	getIntranetUrl,
	getManifest,
	getModuleBase,
	getIntranetModuleBase,

	init: lifecycle.init,
	destroy: lifecycle.destroy,

	info,
};