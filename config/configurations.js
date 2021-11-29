/**
 * ATTENTION: Here are ONLY configurations related with enviroment.
 * More configurations, see /config/index.js.
 * 注意：此处并非全部的配置，仅仅是与环境相关的配置。
 * 在 /config/index.js 中还有部分全局配置。
 */

module.exports = {
	"basic": {
		"i18n.multiHosts.enabled" : false,
		
		"i18n.domains.pathname"   : "/i18n/domains.json",
		"i18n.vendors.pathname"   : "/i18n/vendors.json",

		"meta.hostname"           : "meta",
		"config.hostname"         : "config",
		"i18n.registry.hostname"  : "registry",
		"i18n.host"               : "static.tripcdn.com",

		"urlname.reload.timeout"  : 5000,
		"urlname.reload.interval" : 15000,

		"i18n.domains.interval"   : 10000,
		"i18n.vendors.interval"   : 10000,
		"i18n.modules.interval"   : 10000,
		"i18n.heartbeat.interval" : 60000,

		"intranet.hostname"       : "static",
		"intranet.domain"         : ".ares.ctripcorp.com",
	},

	// 生产环境
	"env.PROD": {
		"intranet.domain"         : ".ares.ctripcorp.com",

		// @deprecated 由 meta.hostname + intranet.domain 取代。
		// "urlname.proxy.hostname"  : "meta.ares.ctripcorp.com",
		
		// @deprecated 由 i18n.multiHosts.enabled 取代。
		// "i18n"                    : true,

		"i18n.multiHosts.enabled" : true,
		"i18n.host"               : "static.tripcdn.com",
		
		// @deprecated 由 i18n.registry.hostname + intranet.domain 取代。
		// "i18n.registry.hostname"  : "registry.ares.ctripcorp.com",

		// @deprecated 由 config.hostname + intranet.domain + i18n.*.pathname 取代。
		// "i18n.domains.url"        : "http://meta.ares.ctripcorp.com/i18n.config/domains.json",
		// "i18n.vendors.url"        : "http://meta.ares.ctripcorp.com/i18n.config/vendors.json",
	},

	// UAT 环境
	"env.UAT": {
		"intranet.domain"         : ".ares.uat.qa.nt.ctripcorp.com",
		"i18n.host"               : "static-uat.ares.ctripcorp.com",
		
		/**
		 * 内网地址必须确保服务端可访问，因此不能使用跨环境域的域名。切记！
		 * @tag 2020-08-31
		 */
		// "intranet.host"           : "static-uat.ares.ctripcorp.com",
		
		"i18n.internet.host"      : "uat-s.tripcdn.com",
	},

	// FAT/FWS 环境
	"env.FAT": {
		"intranet.domain"         : ".ares.fws.qa.nt.ctripcorp.com",
		"i18n.host"               : "static-fws.ares.ctripcorp.com",

		// @tag 2020-08-31
		// "intranet.host"           : "static-fws.ares.ctripcorp.com",

		"i18n.internet.host"      : "fat-s.tripcdn.com",
	},

	// 法兰克福
	"idc.FRA-AWS": {
		"intranet.domain"         : ".ares.fraaws.tripws.com",
	},

	// 旧金山
	"idc.SFO-AWS": {
		"intranet.domain"         : ".ares.sfoaws.tripws.com",
	},

	// 新加坡
	"idc.SIN-AWS": {
		"intranet.domain"         : ".ares.sinaws.tripws.com",
	},

	// 蒙特利尔
	"idc.YMQ-AWS": {
		"intranet.domain"         : ".ares.ymqaws.tripws.com",
	},
};