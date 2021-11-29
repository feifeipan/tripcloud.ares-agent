/**
 * 主域名管理器。
 * 决定相应国家或地区、城市应使用哪个主域名。
 */

'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, htp = require('htp')
	, noda = require('noda')
	// , ctriputil = require('ctriputil')
	
	/* in-package */
	, __CONFIG = noda.inRequire('config')
	, PromiseQueue = noda.inRequire('class/PromiseQueue')
	;

const _pq = new PromiseQueue();

let _region_domains;
let _timer_reload;
let _etag;
let _version;

async function _parse(settings) {
	let { version, data } = settings;
	_region_domains = data;
	_version = version;
}

async function _loadRemote() {
	let urlname = __CONFIG['i18n.domains.url'];
	let headers = { 'if-none-match': _etag };
	let response = await htp.get(urlname, headers).catch(() => null);
	if (!response || ![ 200, 304 ].includes(response.statusCode)) {
		let data = !response ? 'no response' : [ response.statusCode, response.statusMessage ];
		// ctriputil.cat.event('ARES.i18n.error', 'load_domains_fail', data);
		return new Error(`[ARES] failed to load remote settings: ${urlname}`);
	}
	
	// 如果远端未变更，则无需替换代理。
	if (response.statusCode == 304) {
		// DO NOTHING.
		return;
	}
	
	let settings = response.body;
	let err = await _parse(settings);

	// 替换成功后，须更换相应的 etag 记录。
	if (!err) {
		_etag = response.headers.etag;
	}
	return err;
}

async function _loadLocal() {
	let settings = noda.inRequire('config/domains');
	let err = await _parse(settings);
	return err;
}

async function _startReloading() {
	if (_timer_reload) return;

	// 定时重新加载。
	_timer_reload = setInterval(() => {
		_loadRemote().catch(ex => {});
		// ctriputil.cat.event('ARES.i18n.info', `domains_version_${_version}`);
	}, __CONFIG['i18n.domains.interval']);
}

async function _init() {
	// 优先加载远端配置。
	let err = await _loadRemote();
	
	// 其次加载本地配置。
	if (err) {
		err = await _loadLocal();
	}

	if (err) {
		throw new Error('[ARES] failed to init manager/domains');
	}
	// 加载成功后，启动定时任务。
	else {
		_startReloading();
	}
}

async function _destroy() {
	if (_timer_reload) {
		clearInterval(_timer_reload);
		_timer_reload = null;
	}
}

function findMeByRegion(region) {
	let domain = _region_domains[region];
	if (!domain) {
		domain = _region_domains['others'];
	}
	return domain;
}

module.exports = {
	findMeByRegion,
	init: () => _pq.append(_init),
	destroy: () => _pq.append(_destroy),
};
