/**
 * 模块管理器。
 * 加载并管理模块元数据，及生成模块资源 URL。
 */

'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, path = require('path')
	
	/* NPM */
	, htp = require('htp')
	, noda = require('noda')
	// , ctriputil = require('ctriputil')
	
	/* in-package */
	, __CONFIG = noda.inRequire('config')
	, resourceNamesManager = require('./resourceNames')
	, PromiseQueue = noda.inRequire('class/PromiseQueue')
	
	/* in-file */
	, _agent_version = noda.currentPackage().version
	, fetch = async (urlname, etag) => {
		let headers = {
			// 'x-ares-agent-appid' : await ctriputil.foundationFramework.getAppID(),
			'x-ares-agent'       : `node_${_agent_version}`,
		};
		let codes = [ 200 ];
		if (etag) {
			headers['if-none-match'] = etag;
			codes.push(304);
		}
		let response = await htp.get(urlname, headers).catch(ex => null);
		if (!response || !codes.includes(response.statusCode)) {
			let data = !response ? [ urlname, 'no response' ] : [ urlname, response.statusCode, response.statusMessage ];
			// ctriputil.cat.event('ARES.i18n.error', 'load_module_fail', data);
			
			let reason = response ? response.statusCode : 'no response';
			throw new Error(`[ARES] failed to load module: ${urlname}: ${reason}`);
		}
		return response;
	}
	;

const _pq = new PromiseQueue();

const EXPLICIT_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

// 存储模块基本信息。
// 键名为模块别名（该别名在初始化参数中定义）。
let _metas = {};

let _timer_reload;

/**
 * @param {Object}   info               模块信息
 * @param {string}   info.group   
 * @param {string}   info.name
 * @param {string}   info.version       version OR versionRange
 */
async function _loadRemoteOne(info) {
	// 生产环境版本不允许重复发布，因此对于确定版本的模块，若 manifest 已加载，则无须再重新加载。
	if (info.fixed && info.enable.manifest && info.canary.manifest && __CONFIG['env'] == 'PROD') {
		return;
	}

	let hostname = __CONFIG['i18n.registry.host'];

	let versions = {
		canary: info.canary.version, 
		enable: info.enable.version,
	};

	if (!info.fixed) {
		let response = await fetch(`http://${hostname}/module/${info.group}/${info.name}/${info.version}/versions.json`);
		versions = response.body;
		if (!versions.enable || !versions.canary) {
			// ctriputil.cat.event('ARES.i18n.error', 'module_not_available', info.fullname);
			throw new Error(`[ARES] module not available now: ${info.fullname}`);
		}
	}

	// 在测试环境中，即使版本号一致，仍然要尝试重新加载。
	if (versions.canary == info.canary.version && info.canary.manifest && __CONFIG['env'] == 'PROD') {
		// DO NOTHING.
	}
	else {
		// 读取 canary 版本数据。
		let urlname = `http://${hostname}/module/${info.group}/${info.name}/${versions.canary}/manifest.json`;
		let response = await fetch(urlname, info.canary.etag);

		// 如果是 304 则不替换。
		if (response.statusCode == 200) {
			info.canary.version = versions.canary;
			info.canary.manifest = response.body;
			info.canary.etag = response.headers['etag'];
		}

		// ctriputil.cat.event('ARES.i18n.info', `@${info.group}/${info.name}@${versions.canary}`);
	}

	if (versions.enable == info.enable.version && info.enable.manifest && __CONFIG['env'] == 'PROD') {
		// DO NOTHING.
	}
	else if (versions.enable == versions.canary) {
		Object.assign(info.enable, info.canary);
	}
	else {
		// 读取 enable 版本数据。
		let urlname = `http://${hostname}/module/${info.group}/${info.name}/${versions.enable}/manifest.json`;
		let response = await fetch(urlname, info.enable.etag);

		// 如果是 304 则不替换。
		if (response.statusCode == 200) {
			info.enable.version = versions.enable;
			info.enable.manifest = response.body;
			info.enable.etag = response.headers['etag'];
		}

		// ctriputil.cat.event('ARES.i18n.info', `@${info.group}/${info.name}@${versions.enable}`);
	}
}

/**
 * 加载当前登记的所有模块。
 */
async function _loadRemote(aliases) {
	if (!aliases) {
		aliases = Object.keys(_metas);
	}
	let promises = aliases.map(alias => _loadRemoteOne(_metas[alias]));
	await Promise.all(promises);
}

async function _startReloading() {
	if (_timer_reload) return;

	// 定时重新加载。
	_timer_reload = setInterval(() => {
		_loadRemote().catch(ex => {
			// @TODO
		});
	}, __CONFIG['i18n.modules.interval']);
}

/**
 * @param {Object} modules 模块别名（简称）: 信息
 */
async function _init(modules) {	
	// 未指定模块，则无须执行初始化。
	if (!modules) return;

	// 自检。
	const MODULE_DESC = /^@([^@/]+)\/([^@/]+)@(.+)$/;
	const aliases = Object.keys(modules);
	aliases.forEach(alias => {
		if (_metas[alias]) {
			throw new Error(`[ARES] module alias already exists: ${alias}`);
		}

		let info = modules[alias];

		if (typeof info == 'string') {
			if (!MODULE_DESC.test(info)) {
				throw new Error(`[ARES] invalid module desc found: ${info}`);
			}
			info = {
				group   : RegExp.$1,
				name    : RegExp.$2,
				version : RegExp.$3,
			};
		}

		else if (typeof info == 'object') {
			if (!(info.group && info.name && info.version)) {
				throw new Error(`[ARES] invalid module desc found: ${info}`);
			}
			// Clone it.
			info = Object.assign({}, info);
		}

		else {
			throw new Error(`[ARES] module desc should be a string or an object`);
		}

		info.fullname = `@${info.group}/${info.name}@${info.version}`;

		info.enable = {};
		info.canary = {};

		if (EXPLICIT_VERSION.test(info.version)) {
			info.fixed = true;
			info.canary.version = info.version;
			info.enable.version = info.version;
		}

		_metas[alias] = info;
	});

	// 加载远端配置。
	await _loadRemote(aliases);
	
	_startReloading();
}

async function _destroy() {
	clearInterval(_timer_reload);
}

// 已有的伪地址映射表。
// 伪地址 vs. 分解后信息（用于检索真实的资源路径，而非真实路径本身）。
const _moduleResourceNames = {};

function _parse(resourceName) {
	// 对于非模块资源伪地址，直接原样返回。
	if (!resourceName.startsWith('module://')) {
		return null; 
	}

	let pathInfo = _moduleResourceNames[resourceName];
	if (!pathInfo) {
		let alias = resourceName.slice(9 /* length of "module://" */).split('/', 1)[0];
		let pathname = resourceName.slice(9 + alias.length + 1);
		pathInfo = { alias, pathname };
		_moduleResourceNames[pathname] = pathInfo;
	}
	return pathInfo;
}

/**
 * 根据伪地址，获取真实的资源路径。
 * @param {string} resourceName 
 * @param {boolean} [isCanary=false]
 * @return {string}
 */
function getRealpath(resourceName, isCanary) {
	// 对于非模块资源伪地址，直接原样返回。
	let pathInfo = _parse(resourceName);
	if (!pathInfo) {
		return resourceName; 
	}

	let manifest = getManifest(pathInfo.alias, isCanary);
	let realpath = manifest[pathInfo.pathname];
	if (!realpath) {
		throw new Error(`[ARES] resource not found: ${resourceName}`);
	}

	return path.posix.join('/', realpath);
}

/**
 * 根据伪地址数组，获取真实的资源路径数组。
 * @param {string[]} resourceNames 
 * @param {boolean} [isCanary=false]
 * @return {string[]}
 */
function getRealpaths(resourceNames, isCanary) {
	let realpaths = [];
	for (let i = 0, prev = null; i < resourceNames.length; i++) {
		let resourceName = resourceNames[i];

		let current = _parse(resourceName);
		if (prev && !current 
			// pathname 系相对路径（非伪地址且不以斜杠起始）。
			&& resourceNamesManager.isValid(resourceName) && !resourceName.startsWith('/') 
			) {
			current = {
				alias: prev.alias,
				pathname: path.posix.join(prev.pathname, '..', resourceName),
			};
			resourceName = `module://${current.alias}/${current.pathname}`;
		}
		prev = current;

		realpaths.push(getRealpath(resourceName, isCanary));
	}
	return realpaths;
}

/**
 * 获取指定模块内部的静态资源映射表。
 * @param {string} moduleAlias 
 * @param {boolean} isCanary 
 * @return {Object}
 */
function getManifest(moduleAlias, isCanary) {
	let meta = _metas[moduleAlias];
	if (!meta) {
		throw new Error(`[ARES] module alias not predefined: ${moduleAlias}`);
	}

	let manifest = isCanary ? meta.canary.manifest : meta.enable.manifest;
	return manifest;
}

/**
 * 返回所有模块的详细信息（不含资源清单）。
 * @param {string} [alias]
 * @return {Object}
 */
function info(alias) {
	if (alias) {
		let meta = _metas[alias];
		return {
			group         : meta.group,
			name          : meta.name,
			versionRange  : meta.version,
			activeVersion : meta.enable.version,
			canaryVersion : meta.canary.version,
		};
	}

	let infos = {};
	for (let alias in _metas) {
		infos[alias] = info(alias);
	}
	return infos;
}

/**
 * 获取指定模块的基础路径（不含协议头和主机名）。
 * @param {string} moduleAlias 
 * @return {string}
 */

function getBasepath(moduleAlias) {
	let _meta = _metas[moduleAlias];
	if (!_meta) {
		throw new Error(`[ARSE] module alias not predefined: ${moduleAlias}`);
	}
	return `/modules/${_meta.group}/${_meta.name}/`;
}

module.exports = {
	getBasepath,
	getManifest,
	getRealpath,
	getRealpaths,
	info,
	init: (modules) => _pq.append(_init, modules),
	destroy: () => _pq.append(_destroy),
};
