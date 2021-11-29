// /**
//  * 其他。
//  */

// 'use strict';

// const MODULE_REQUIRE = 1
// 	/* built-in */
	
// 	/* NPM */
// 	, noda = require('noda')
// 	, ctriputil = require('ctriputil')
	
// 	/* in-package */
// 	, __CONFIG = noda.inRequire('config')
// 	, PromiseQueue = noda.inRequire('class/PromiseQueue')
// 	;

// const _pq = new PromiseQueue();

// let _timer_catlog = null;;
// function _startCatlog(info) {
// 	if (!_timer_catlog) {
// 		_timer_catlog = setInterval(() => {
// 			ctriputil.cat.event('ARES.i18n.info', info._node_version);
// 			ctriputil.cat.event('ARES.i18n.info', info._app_id);
// 		}, __CONFIG['i18n.heartbeat.interval']);
// 	}
// }

// async function _init() {
// 	const _node_version = `node_version_${noda.currentPackage().version}`;
// 	const _app_id = `app_${await ctriputil.foundationFramework.getAppID()}`;
// 	_startCatlog({ _node_version, _app_id });
// }

// async function _destroy() {
// 	if (_timer_catlog) {
// 		clearInterval(_timer_catlog);
// 		_timer_catlog = null;
// 	}
// }

// module.exports = {
// 	init: () => _pq.append(_init),
// 	destroy: () => _pq.append(_destroy),
// };