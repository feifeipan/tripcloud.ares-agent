#	Change Log

##	v2.0.0 - Sep 25th, 2020

*	New argument `options.company` for `i18n.init()`.

##	v1.4.1 - Jun 29th, 2020

*	Recognise request header `x-ctx-externalclientip`.

##	v1.4.0 - Jun 28th, 2020

*	Offer internet URL for requests from `*.ctripqa.com`.

##	v1.3.0 - May 26th, 2020

*	Add `/CRNWEB/` to (i18n) immutable prefix list.

##	v1.2.2 - Apr 22nd, 2020

*	Fixed bug that will lead to `env should not be reset` error.

##	v1.2.1 - Apr 22nd, 2020

*	`x-ares-agent` added.

##	v1.2.0 - Apr 21st, 2020

*	`x-ares-agent-appid` added in headers when requesting modules' registry info.
*	Option `tryHttp` accepted on invoking `i18n.init()`.
*	Stop sending `ARES.i18n.info` cat-event about modules info.

##	v1.1.1 - Apr 7th, 2020

*	将 /polyfill.js 添加至恒定 URL 列表。
*	接受 x-real-ip 作为客户端 IP。

##	v1.0.6 - Mar 05th, 2020

*	定时发送 domains_version。
*	依赖 ctriputil 替代原来单独依赖 cat / foundation-framework。


##	v1.0.5 - Feb 24th, 2020

*	修正 load_url_meta_fail 误触发的问题。

##	v1.0.1 - Nov 27th, 2019

*	当 `i18n` 模块初始化未完成时（包括未执行、进行中、失败等情形），禁止执行模块中的其他方法，否则抛出异常。

##	v1.0.0 - Nov 25th, 2019

*	里程碑版本
*	getModuleBase()
*	getIntranetModuleBase()

##	v0.9.2 - Nov 14th, 2019

*	更正 i18n/manager/domains 子模块中，针对请求失败的处理逻辑中的 bug，该 bug 会导致程序返回不友好的错误信息。

##	v0.9.1 - Nov 1st, 2019

*	测试环境启用新 Intranet 域名：  
	static.ares.fws.qa.nt.ctripcorp.com  
	static.ares.uat.qa.nt.ctripcorp.com  

##	v0.9.0 - Oct 31st, 2019

*	新增 YMQ-AWS（加拿大中部）节点。

##	v0.8.0 - Sep 25th ,2019

*	启用新的测试环境域名 static-uat.ares.ctripcorp.com 和 static-fws.ares.ctripcorp.com，以解决测试环境存储服务能力不足问题。

##	v0.7.2 - Sep 24th, 2019

*	i18n.info(req)

##	v0.7.1 - Aug 31th, 2019

<!-- *	升级依赖项 @ctrip/ares-ipip 的版本。 -->

##	v0.7.0 - Aug, 2019

*	i18n.getHost()
*	i18n.getManifest()
*	Singapore AWS

##	v0.6.1 - Jul 19th, 20190610

*	捕获定时任务中的异常，避免出现 `unhandled promise rejection`。

##	v0.6.0 - Jul 16th, 2019

<!-- *	针对多次初始化的优化（为此 @ctrip/ares-ipip 亦进行了升级）。 -->

##	v0.5.0 - Jul 1st, 2019

*	新增 `i18n.getIntranetUrl()` 方法，支持生产环境内网静态资源站点。
*	在 CAT 中记录心跳（每分钟一次）。
*	新增 `i18n.info()` 方法，返回当前

##	v0.4.4 - Jun 27, 2019

*	修复测试环境下模块资源 URL 中域名错误的问题。