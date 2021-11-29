/**
 * Canary 测试请求的识别，依据以下文档：
 * http://conf.ctripcorp.com/pages/viewpage.action?pageId=152235045
 */

'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, querystring = require('querystring')
	, url = require('url')

	/* NPM */
	, cookie = require('cookie')
		
	/* in-package */
	;

/**
 * 判断一个请求是否 canary 测试请求。
 * @param {*} req 
 */
function isCanaryRequest(req) {
	// HTTP header
	if (req.headers['x-ctrip-canary-req'] == 1) {
		return true;
	}

	// Query string
	let query = querystring.parse(url.parse(req.url).query);
	if (query['isCtripCanaryReq'] == 1) {
		return true;
	}

	// Cookie
	if (req.headers.cookie) {
		let c = cookie.parse(req.headers.cookie);
		if (c['ctrip-canary-req'] == 1) {
			return true;
		}
	}

	return false;
}

module.exports = isCanaryRequest;