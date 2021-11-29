'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, noda = require('noda')
	// , ctriputil = require('ctriputil')
	, aresUtil = require('@tripcloud/ares-util')
	
	/* in-package */
	, __CONFIG = noda.inRequire('config')
	, callbackable = noda.inRequire('lib/callbackable')
	, PromiseQueue = noda.inRequire('class/PromiseQueue')
	
	, locator = require('./manager/locator')
	, domains = require('./manager/domains')
	, vendors = require('./manager/vendors')
	, modules = require('./manager/modules')
	// , misc = require('./manager/misc')
	, resourceNames = require('./manager/resourceNames')
	
	, normal = noda.inRequire('normal')
	;

let _pq = new PromiseQueue();

// 一旦开启初始化过程，环境不可再变更。
let _env_confirmed = false;

let _alive = false;

/**
 * @param {Object}    [options]
 * @param {string}    [options.env]       - 指定环境
 * @param {string[]}  [options.pathnames] - 需要预热的资源文件
 * @param {Object}    [options.modules]   - 需要加载的资源模块
 * @param {boolean}   [options.tryHttp]   - 尝试启用 HTTP 协议
 * @param {string}    [options.company]   - 限定当前业务所属公司
 * 
 * 可用的公司名称包括：
 * - ctrip.com
 * - trip.com
 */
async function _init_one(options) {
	// 初始化可能被执行多次。
	// 任何一次初始化开始执行时，API 不可用。
	_alive = false;

	options = Object.assign({}, options);

	if (options.company) {
		__CONFIG.company = options.company;
	}

	// 强制指定环境。
	CONFIRM_ENV: {
		// 如初始化参数中指定的环境与模块自主确定的环境不一致，则尝试重置。
		let env = options.env && aresUtil.env.parse(options.env);
		if (env && env != __CONFIG.env) {
			if (_env_confirmed) {
				throw new Error('env should not be reset');
			}
			else {
				__CONFIG.reset({ env });
			}
		}

		// 如此时仍未确定当前环境，则使用公共模块提供的环境信息。
		// if (!__CONFIG.env) {
		// 	let env = await ctriputil.foundationFramework.getEnv();
		// 	if (env) {
		// 		__CONFIG.reset({ env });
		// 		console.warn('[ARES] ctriputil.foundationFramework env info adopted.');
		// 	}
		// }

		// 如果无法确定当前环境，则抛出异常。
		if (!__CONFIG.env) {
			throw new Error('env not confirmed');
		}
		
		// 确认当前环境，不再允许改变。
		_env_confirmed = true;
	}

	// 2021/11/24 新需求by chaotang@trip.com。由于IM+的客服在家办公，电脑上没有安装HTTPS证书，导致内网ARES地址无法访问
	__CONFIG.tryHttp = options.tryHttp;
	
	if (options.tryHttp && __CONFIG.env != 'PROD') {
		__CONFIG.protocol = 'http:';
	}

	// await misc.init();

	if (__CONFIG['i18n.multiHosts.enabled']) {
		await domains.init();
		await vendors.init();
		await locator.init();
	}

	// 预热文件和加载模块功能非单例运行。
	await modules.init(options.modules);
	await resourceNames.init(options.pathnames);

	await normal.init();

	// 初始化完成，API 恢复可用状态。
	_alive = true;
}

function _init(options) {
	return _pq.append(_init_one, options);
}

async function _destroy_one() {
	// 销毁开始，API 即不可用。
	_alive = false;

	// await misc.destroy();
	await modules.destroy();
	await resourceNames.destroy();

	if (__CONFIG['i18n.multiHosts.enabled']) {
		await domains.destroy();
		await vendors.destroy();
		await locator.destroy();
	}

	await normal.destroy();
}

function _destroy() {
	return _pq.append(_destroy_one);
}

function isAlive() {
	return _alive;
}

module.exports = { 
	init: callbackable(_init),
	destroy: callbackable(_destroy),
	isAlive,
};
