'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, crypto = require('crypto')
	, http = require('http')
	, path = require('path')
	, url = require('url')
	
	/* NPM */
	// , ctriputil = require('ctriputil')
	, htp = require('htp')
	
	/* in-package */
	, __CONFIG = require('../config')

	/* in-file */
	, md5 = content => crypto.createHash('md5').update(content).digest('hex')
	;

// 定时任务。
let _timer = null;

/**
 * 以标准化 urlname 为键值，标示该对象的元数据是否在更新中。
 */
let _LOADING = {};

/**
 * 以标准化 urlname 为键值的元数据信息映射表。
 */
let _META = {};

const WEAK_ETAG_PATTERN = /^W\/"(.+)"/;
/**
 * 查询 urlname 对应的附加了实体摘要信息的地址。
 * @param {*} urlname - 不含 protocol / querystring / hash 的地址
 *                      e.g. //static.tripcdn.com/locale/zh_CN.js
 */
function loadMeta(urlname, callback) {
	// ctriputil.cat.event('ARES.i18n.urlnames', urlname);

	// 标记该资源正在更新中。
	_LOADING[urlname] = true;
	
	// ---------------------------
	// 首先，尝试从高速缓存中读取数据。
	// @TODO

	// ---------------------------
	// 如果高速缓存读取失败，则从持久化服务中读取。

	// 此时 urlname 已经过标准化处理，无须冗余判断。
	let n = urlname.indexOf('/', 2);
	let hostname = urlname.slice(2, n);
	let pathname = urlname.slice(n);

	// let options = {
	// 	host: __CONFIG['meta.host'],
	// 	path: pathname,
	// 	headers: { 'x-host': hostname },
	// 	method: 'HEAD',
	// };
	// let req = http.request(options, res => {
	// 	// 清除标记。
	// 	delete _LOADING[urlname];

	// 	if (res.statusCode != 200) {
	// 		return callback(new Error(`[ARES] file not found: http://${hostname}${pathname}`));
	// 	}

	// 	if (WEAK_ETAG_PATTERN.test(res.headers.etag)) {
	// 		let meta = {
	// 			etagc: RegExp.$1,
	// 		};
	// 		_META[urlname] = meta;
	// 		return callback(null, meta);
	// 	}
	// 	else {
	// 		return callback(new Error('meta not responsed'));
	// 	}
	// });
	
	// req.on('timeout', () => {
	// 	// 清除标记。
	// 	delete _LOADING[urlname];
	// 	req.abort();
	// 	callback(new Error('connect timeout'));
	// });

	// req.on('error', (ex) => {
	// 	// 清除标记。
	// 	delete _LOADING[urlname];		
	// 	callback(ex);
	// });

	let headers = { 'x-host': hostname };
	htp.head(`http://${__CONFIG['meta.host']}${pathname}`, headers, (err, res) => {
		// 清除标记。
		delete _LOADING[urlname];

		if (err) {
			callback(err);
			return;
		}

		if (res.statusCode != 200) {
			return callback(new Error(`[ARES] file not found: http://${hostname}${pathname}`));
		}

		if (WEAK_ETAG_PATTERN.test(res.headers.etag)) {
			let meta = {
				etagc: RegExp.$1,
			};
			_META[urlname] = meta;
			return callback(null, meta);
		}
		else {
			return callback(new Error('meta not responsed'));
		}
	});
}

/**
 * 刷新本地缓存。
 * 未指定具体的 urlname 时，刷新全部缓存。
 * @param {string} [urlname] 
 */
function reload(urlname) {
	// 执行全量刷新。
	if (arguments.length == 0) {
		for (let urlname in _META) {
			reload(urlname);
		}
	}
	// 执行个别刷新。
	else {
		// 如果该 urlname 已在刷新队列中，则不必重复刷新。
		if (_LOADING[urlname]) {
			return;
		}
		loadMeta(urlname, (err, meta) => {
			if (err) {
				// ctriputil.cat.event('ARES.i18n.error', 'load_url_meta_fail', err);
			}
		});
	}
}

/**
 * 尝试获取指定资源的元信息。
 * 如未获取，则执行加载。
 * @param {string} cacheName 
 * @return {Object | undefined}
 */
function tryMeta(cacheName) {
	let meta = _META[cacheName];
	if (!meta) {
		// 如缓存没有命中，则尽快尝试更新缓存。
		// 异步执行是为避免阻塞 getRealUrl() 方法的响应。
		// 保持一定延时是为了防止某些无法建立缓存的 urlname 连续不断地尝试更新缓存，徒耗资源。
		setTimeout(reload, __CONFIG['urlname.reload.timeout'], cacheName);
	}
	return meta;
}

/**
 * 获取附加了实体摘要信息的 URL。
 * @param {string} urlname 
 * @return {string}
 */
const _PROTOCOL_PATTERN = /^(http:|https:)?\/\//;
function getRealUrl(urlname) {
	// 对于包含 querystring 或 hash 的地址，不予处理，直接原状返回。
	if (urlname.indexOf('?') >= 0 || urlname.indexOf('#') >= 0) {
		return urlname;
	}

	let cacheName = urlname;
	// 不具有合法协议头的 urlname 直接原状返回。
	if (_PROTOCOL_PATTERN.test(urlname)) {
		// 缓存中不区分协议，故先截除协议头。
		cacheName = urlname.slice(RegExp.$1.length);
	}
	else {
		return urlname;
	}
	
	// 如果地址中不含 pathname 部分，也就是只有 host 部分，则直接原状返回。
	if (cacheName.indexOf('/', 2) == -1) {
		return urlname;
	}

	let meta = tryMeta(cacheName);
	if (meta) {
		return urlname + '?etagc=' + meta.etagc;
	}
	else {
		return urlname;
	}
}

/**
 * 获取组合后的 URL。
 * 与 getRealUrl() 相比，这是一个使用上要求较严格的函数，故对参数的兼容性处理较少。
 * @param {Object}     options
 * @param {string}    [options.protocol]
 * @param {string}     options.hostname
 * @param {string[]}   options.pathnames
 * @param {Object}    [extra]
 * @param {boolean}   [extra.doNotFormat]
 * @param {boolean}   [extra.]
 */
function getConcatUrl(options, extra) {
	let names = [];
	let etagcs = [];

	extra = Object.assign({
		noFormat: false,
		noMeta: false,
	}, extra);
	
	const PP = path.posix;
	for (let i = 0, pwd = '/'; i < options.pathnames.length; i++) {
		let pathname = options.pathnames[i];
		// 相对路径 -> 绝对路径
		// 用于检索元数据。
		if (pathname.charAt(0) != '/') {
			pathname = PP.resolve(pwd, pathname);
		}

		let name = pathname;
		// 绝对路径 -> 相对路径
		// 用于生成最终的 URL，减少其长度。
		if (name.startsWith(pwd)) {
			name = PP.relative(pwd, name);
		}
		names.push(name);

		// 某些场景下（特别是来自于 i18n 模块的调用），不需要获取元信息作为附加参数。
		if (!extra.noMeta) {
			let urlname = '//' + options.hostname + pathname;
			let meta = tryMeta(urlname);
			if (meta) {
				etagcs.push(meta.etagc);
			}
		}

		pwd = path.dirname(pathname);
	}

	// 生成基础的拼接资源 URL。
	let f = names.join(',');
	let parsed = {
		protocol: options.protocol,
		hostname: options.hostname,
		pathname: '/ares/api/cc',
		query: { f },
	};

	// 如果所有资源的实体摘要均已获取，则附加之。
	if (etagcs.length == names.length) {
		parsed.query.etagc = md5(etagcs.join(''));
	}

	if (extra.noFormat) {
		return parsed;
	}
	else {
		let urlname = url.format(parsed);
		if (!parsed.protocol) urlname = '//' + urlname;
		return urlname;
	}
}

async function init() {
	if (!_timer) {
		// 定时执行全量刷新。
		_timer = setInterval(reload, __CONFIG['urlname.reload.interval']);
	}
}

async function destroy() {
	if (_timer) {
		clearInterval(_timer);
		_timer = null;
	}
}

// 自动初始化。
init();

module.exports = {
	getConcatUrl,
	getRealUrl,
	loadMeta,
	tryMeta,
	init,
	destroy,
};