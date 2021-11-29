/**
 * 路径管理器。
 * 用于管理路径，并根据其内容更新状态，生成附加了特写 querystring 的资源 URL。
 * @TODO 接替 /normal/ 子模块的功能。
 */

'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, url = require('url')
	
	/* NPM */
	, htp = require('htp')
	, noda = require('noda')
	, cat = require('@ctrip/node-vampire-cat')
	
	/* in-package */
	, __CONFIG = noda.inRequire('config')
	, normal = noda.inRequire('normal')
	, PromiseQueue = noda.inRequire('class/PromiseQueue')	
	;
	
const _pq = new PromiseQueue();
    
/**
 * @param {string[]} pathnames 需要预热的路径
 */
async function _init(pathnames) {	
	// 未指定路径，则无须执行初始化。
	if (!pathnames) return;

	let loadings = pathnames.map(pathname => new Promise((resolve, reject) => {
        try {
            validate(pathname);
        } catch(err) {
            reject(err);
        }

        let cacheName = `//${__CONFIG['i18n.host']}${pathname}`;
        normal.loadMeta(cacheName, err => {
            err ? reject(err) : resolve();
        });
    }));
    await Promise.all(loadings);
}

async function _destroy() {
	// DO NOTHING.
}

/**
 * pathname 格式必须是 POSIX 绝对路径。举例如下：
 *   正确 /foo/bar.js 
 *   错误 foo/bar.js
 *   错误 //static.tripcdn.com/foo/bar.js 
 *   错误 http://static.tripcdn.com/foo/bar.js
 */
function isValid(resourceName, extended = false) {
	if (resourceName.charAt(0) == '/' || resourceName.charAt(1) != '/') {
		return true;
	}

	if (extended && resourceName.startsWith('module://')) {
		return true;
	}

	return false;
}

function validate(resourceName, extended = false) {
	if (!isValid(resourceName, extended)) {
		throw new Error(`[ARES] invalid resourc name: ${resourceName}`);
	}
}

module.exports = {
	init: (pathnames) => _pq.append(_init, pathnames),
	destroy: () => _pq.append(_destroy),
 	isValid,
	validate,
};
