'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	// , ctriputil = require('ctriputil')
	
	/* in-package */
	;

function parse(address) {
	let ipaddr = null;
	if (address) {
		let version = address.indexOf(':') >= 0 ? 6 : 4;
		if (parse['v' + version](address)) {
			ipaddr = { address, version };
		}
	}
	return ipaddr;
}

const REG_IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
parse.v4 = function(address) {
	if (!REG_IPV4.test(address)) {
		return null;
	}
	else {
		return address.split('.');
	}
}

const RE_HEX = /^[0-9A-Fa-f]{1,4}$/;
parse.v6 = function (address) {
	let parts = address.split(':');
	let len = parts.length;
	
	// IPv6 地址正常为 8 段，缩写形式则可能少于 8 段。
	// 超过 8 段必为异常。
	if (len > 8) {
		return null;
	}

	// IPv6 地址中，连续的 0 可以合并为 ::，但只允许出现一次。
	// 如 :: 出现在首尾，则切分后将出现两个空字符串，去掉其中一个。
	if (parts[0] === '' && parts[1] === '') {
		parts.shift();
	}
	else if (parts[len - 1] === '' && parts[len - 2] === '') {
		parts.pop();
	}

	let parsed = new Array(8);
	for (let i = 0, j = 0, k = 8 - parts.length; i < parts.length; i++) {
		let hex = parts[i];
		if (hex == '') {
			// 若再次出现代表缩写的空字符串，则判定为非法格式。
			if (!k) {
				return null;
			}
			// 填充为连续的 0。
			for (; j <= i + k; ) {
				parsed[j++] = 0;
			}
			// 将差额置 0，如再遇 :: 将触发异常。
			k = 0;
		}

		// 检验地址片断是否为合法的 4 位以内十六进制数。
		else if (!RE_HEX.test(hex)) {
			return null;
		}

		else {
			parsed[j++] = parseInt(hex, 16);
		}
	}

	return parsed;
}

/**
 * 获取远端请求的 IP 地址及其类型。
 * @param {http.IncomingMessage} req 
 * @return `{ address, version }`
 */
function getRemoteIP(req) {
	let address;
	let H = req.headers, h;
	
	// 该字段贯穿用户请求全流程，SOA 客户端转发请求时会转发所有 x-ctx-* 请求首部。
	if (h = H['x-ctx-externalclientip']) {
		address = h;
	}

	// 如请求经 CDN 网络动态加速，则可能会附加这两个请求首部，指代终端用户地址。
	else if (h = H['true-client-ip'] || H['cdn-src-ip']) {
		address = h;
	}

	else if (h = H['x-forwarded-for']) {
		let i = h.indexOf(',');
		address = i > 0 ? h.slice(0, h.indexOf(',')) : h;
	}

	// 应用服务器上 Nginx 中间件在执行反向代理时设置。
	// 但是通常这都是内部反向代理服务器地址，实际上意义不大。
	else if (h = H['x-real-ip']) {
		address = h;
	}

	else if (req.connection) {
		address = req.connection.remoteAddress;
	}

	let ipaddr = parse(address);
	if (!ipaddr) {
		let data =  {
			'cdn-src-ip': H['cdn-src-ip'],
			'x-forwarded-for': H['x-forwarded-for'],
			'conn-remoteAddress': req.connection ? req.connection.remoteAddress : undefined,
		};
		// ctriputil.cat.event('ARES.i18n.error', 'no_remote_ip', data);
	}
	
	return ipaddr;
}

module.exports = getRemoteIP;