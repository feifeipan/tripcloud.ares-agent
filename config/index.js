'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, if2 = require('if2')
	, aresUtil = require('@tripcloud/ares-util')
	
	/* in-package */
	, IDC_REGIONS = require('./idc_regions')
	;

// 该环境名称是经 ARES 项目调谐之后的名称。
const systemEnv = aresUtil.env.current();
const systemIdcRaw = aresUtil.idc.currentRaw();

// 注意：此处 region 遵循 ARES.i18n 项目定义。
// IDC 名称未经调谐，系原始的值。
const systemI18nRegion = if2(IDC_REGIONS[systemIdcRaw], 'others');

let configurations = require(`./configurations`);

/**
 * 全局基础配置。
 */
let __CONFIG = { 
	company  : 'ctrip.com',
	protocol : 'https:',
	env      : systemEnv,
	idc      : systemIdcRaw,
	region   : systemI18nRegion,
};

/**
 * @param {string} [options.env]
 * @param {string} [options.idc]
 * @param {string} [options.region]
 */
function reset(options) {
	if (!options) options = {};

	// .env
	if (options.env) {
		__CONFIG.env = aresUtil.env.parse(options.env);
	}

	// .region
	if (options.region) {
		__CONFIG.region = options.region;
	}

	// .idc
	if (options.idc) {
		__CONFIG.idc = options.idc;
	}

	// basic
	Object.assign(__CONFIG, configurations['basic']);

	// env related
	if (__CONFIG.env) {
		Object.assign(__CONFIG, configurations[`env.${__CONFIG.env}`]);
	}

	// idc related
	if (__CONFIG.idc) {
		Object.assign(__CONFIG, configurations[`idc.${__CONFIG.idc}`]);
	}

	// intranet host
	if (!__CONFIG['intranet.host']) {
		__CONFIG['intranet.host'] = __CONFIG['intranet.hostname'] + __CONFIG['intranet.domain'];
	}

	// others
	Object.assign(__CONFIG, {
		'meta.host'           : __CONFIG['meta.hostname'] + __CONFIG['intranet.domain'],
		'config.host'         : __CONFIG['config.hostname'] + __CONFIG['intranet.domain'],
		'i18n.registry.host'  : __CONFIG['i18n.registry.hostname'] + __CONFIG['intranet.domain'],
		'i18n.domains.url'    : 'http://' + __CONFIG['config.hostname'] + __CONFIG['intranet.domain'] + __CONFIG['i18n.domains.pathname'],
		'i18n.vendors.url'    : 'http://' + __CONFIG['config.hostname'] + __CONFIG['intranet.domain'] + __CONFIG['i18n.vendors.pathname'],
	});
}

Object.defineProperty(__CONFIG, 'reset', {
	enumerable: false, 
	value: reset,
});

reset();

module.exports = __CONFIG;