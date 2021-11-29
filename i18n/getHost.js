'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, crypto = require('crypto')
	
	/* NPM */
	, noda = require('noda')
	// , ctriputil = require('ctriputil')
	
	/* in-package */
	, __CONFIG = noda.inRequire('config')
	, domains = require('./manager/domains')
	, vendors = require('./manager/vendors')
	, locator = require('./manager/locator')
	, getRemoteIP = require('./getRemoteIP')
	;

const REQ_REG_NAME = '_ares_i18n_host';

/**
 * 综合全局配置及上下文，判断当前可用的完整域名。
 * @param {http.IncomingMessage} [req]
 */
function getHost(req) {
	// 如调用方未指定请求对象，则尝试利用 CAT 模块获取该对象。
	// if (!req) {
	// 	let span = ctriputil.cat.getActiveSpan();
	// 	if (span) {
	// 		req = span.getInheritValue('reqEntity');
	// 	}
	// }

	// @tag 20190610
	if (req && req[REQ_REG_NAME]) {
		return req[REQ_REG_NAME];
	}
	
	let host;

	// 如未开启 i18n 功能，则使用配置中的默认域名。
	if (!__CONFIG['i18n.multiHosts.enabled']) {
		if (__CONFIG['i18n.internet.host']
			&& req
			&& req.headers
			&& req.headers.host
			&& req.headers.host.endsWith('.ctripqa.com')
			) {
			host = __CONFIG['i18n.internet.host'];
		}
		else {
			host = __CONFIG['i18n.host'];
		}
	}
	else {
		let region, domain, vendor, ip;

		// 确定资源的归属地。
		FIND_REGION: {
			/**
			 * @hardcode #DEVIDE#
			 * @date 2020-09-17
			 */
			if (__CONFIG['company'] == 'trip.com') {
				region = 'oversea';
			}
			
			// 优先靠近客户端归属地，
			if (!region && req) {
				ip = getRemoteIP(req);
				if (ip) {
					region = locator.getRegion(ip.address); 
				}
			}

			// 其次靠近当前应用服务器所在地。
			if (!region) {
				region = __CONFIG['region'];
			}

			// 每个请求的归属地区只记录一次，与 PV 相当。
			// ctriputil.cat.event('ARES.i18n', region);
		}

		FIND_DOMAIN: {
			// 主域名
			// tripcdn.com | tripcdn.cn
			// domain = domains.findMeByRegion(region);
			domain = 'tripcdn.com';
		}

		FIND_VENDOR: {
			// 供应商内部代号
			// ak | aw | bd | dl | ws

			// let percents = undefined;
			// if (req) {
			// 	let text = (ip || '0.0.0.0') + req.headers['user-agent'];
			// 	percents = parseInt(crypto.createHash('md5').update(text).digest('hex').slice(0, 3), 16) % 100;
			// }
			// vendor = vendors.findMeByRegionAndChance(region, percents);
			vendor = 'ak';
		}
		
		host = `${vendor}-s.${domain}`;
		VERIFY: {
			// @TODO 复核生成的主机名是否真实存在。
			// 主要为避免程序疏漏。
		}
		
		// 每个请求的归属域名只记录一次，与 PV 相当。
		// ctriputil.cat.event('ARES.i18n', host);
	}

	// 寄存备用，同一请求无须重复执行上述逻辑。
	// @tag 20190610
	if (req) {
		req[REQ_REG_NAME] = host;
	}
	
	return host;
}

module.exports = getHost;