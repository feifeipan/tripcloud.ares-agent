const PREFIXES = [
	'/NFES/',
	'/CRNWEB/',
	'/modules/',
	'/polyfill.js',
];

/**
 * 某些永久性资源，内容不会改变，也无须不断获取元数据以支持强制更新。
 * @param {string} pathname 
 */
function immutable(pathname) {
	return PREFIXES.find(prefix => pathname.startsWith(prefix));
}

module.exports = immutable;