/**
 * 供应商管理器。
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
	, VendorMatrix = noda.inRequire('class/VendorMatrix')
	, PromiseQueue = noda.inRequire('class/PromiseQueue')
	;

const _pq = new PromiseQueue();

let _vendor_matrices = {};
let _timer;
let _etag;
let _version;

async function _parse(settings) {
	let { version, data } = settings;
	let matrices = {};
	for (let region in data) {
		// 如果该区域此前已指定供应商组合，则更新并继承。
		if (_vendor_matrices[region]) {
			matrices[region] = _vendor_matrices[region].update(data[region]);
		}
		// 否则，则初始化供应商组合。
		else {
			matrices[region] = new VendorMatrix(data[region]);
		}
	}
	// 替换现有的矩阵组。
	_vendor_matrices = matrices;
	_version = version;
}

async function _loadRemote() {
	let urlname = __CONFIG['i18n.vendors.url'];

	let headers = { 'if-none-match': _etag };
	let response = await htp.get(urlname, headers).catch(() => null);
	if (!response || ![ 200, 304 ].includes(response.statusCode)) {
		let data = !response ? 'no response' : [ response.statusCode, response.statusMessage ];
		// ctriputil.cat.event('ARES.i18n.error', 'load_vendors_fail', data);
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
	let settings = noda.inRequire('config/vendors');
	let err = await _parse(settings);
	return err;
}

async function _init() {
	if (_timer) return;
	
	// 优先加载远端配置。
	let err = await _loadRemote();
	
	// 其次加载本地配置。
	if (err) {
		err = await _loadLocal();
	}

	if (err) {
		throw new Error('[ARES] failed to init manager/vendors');
	}
	// 加载成功后，启动定时任务。
	else {
		_timer = setInterval(() => {
			_loadRemote().catch(ex => {});
			// ctriputil.cat.event('ARES.i18n.info', `vendors_version_${_version}`);
		}, __CONFIG['i18n.vendors.interval']);
	}
}

async function _destroy() {
	clearTimeout(_timer);
}

function findMeByRegionAndChance(region, percents) {
	let matrix = _vendor_matrices[region];

	// 如当前地区示指定供应商组，则使用默认供应商组。
	if (!matrix) {
		matrix = _vendor_matrices['others'];
	}

	// 根据比例分配对应位置的供应商。
	let vendor = matrix.getVendor(percents);

	return vendor;
}

module.exports = {
	findMeByRegionAndChance,
	init: () => _pq.append(_init),
	destroy: () => _pq.append(_destroy),
};
