#   @tripcloud/ares-agent
__ARES 云端(AWS)静态资源应用程序接口（服务端）__


##	Table of Contents

* [Get Started](#get-started)
* [API](#apis)
	* [i18n.init()](#i18ninit)
	* [i18n.getUrl()](#i18ngeturl)
	* [i18n.getIntranetUrl()](#i18ngetintraneturl)
	* [i18n.getHost()](#i18ngethost)
	* [i18n.getManifest()](#i18ngetmanifest)
	* [i18n.getModuleBase()](#i18ngetmodulebase)
	* [i18n.getIntranetModuleBase()](#i18ngetintranetmodulebase)
	* [i18n.info()](#i18ninfo)

##  Get Started

Node.js 应用可通过 [@ctrip/ares-agent](http://npm.release.ctripcorp.com/package/@ctrip/ares-agent) 获得静态资源 Module（模块）中的资源文件的 URL。

```sh
npm i @ctrip/ares-agent
```

该包需要初始化之后，才可使用相关功能。为了提升性能及确保可用性，__请在应用点火过程中完成初始化。如初始化失败，应当强制中断应用点火。__ 自 1.0.1 版本起，如未成功完成初始化（包括未执行、进行中或失败等情形），调用其他方法时均会强制抛出异常。

```javascript {4-6}
const i18n = require('@ctrip/ares-agent/i18n');

i18n.init({
	modules: {
		demo: '@ares/demo2019@*',
	}
}).then(() => {
	// 初始化成功，可正常使用。
}).catch(ex => {
	// 初始化失败。
});
```

### `init()`参数的形式：

![pesudo-url](/img/module/pesudo-url.png)  

:::info
*	`.init()` 方法必须在应用点火阶段执行，并确保执行成功。如果初始化失败，必须强制终止点火，以阻止应用带病启动。

*	`.init()` 方法可以多次调用（在 Java SDK 中将返回同一个 `AresAgent` 实例），以完成对针对不同资源的初始化。需要注意：参数中的使用模块别名不能重复，以免产生歧义。

*	初始化时，需要指定应用中将要使用的 Module 的名称（name）、所属群组（group）以及版本。
初始化时定义的别名，将在后续获取资源 URL 时使用。 版本可以是版本号（version）、版本范围（version range）或者版本标签（version tag），相关细节，请阅读 [模块的版本](/docs/module/version) 一节。
:::

初始化成功后，可正常使用。

```javascript
const i18n = require('@ctrip/ares-agent/i18n');

// ...
// 在 HTTP 监听方法中调用，需要将请求对象作为参数传递。
// 为提升性能，该方法可能会在 req 对象上附着一个特定属性。
let urlname = i18n.getUrl('/local/zh_CN.js', req);
```

##	APIs

:::warning
本模块中，`i18n.get<Name>()` 系列方法所返回的结果，均可能与当前时点的运维策略及请求的上下文相关。任何将返回值缓存并试图在针对不同请求的响应中复用的方式，都是错误的！
:::

### i18n.init()

执行初始化。

调用方式：
*   Promise __i18n.init__()
*   Promise __i18n.init__( Object *options* )
*   void __i18n.init__( Function *callback* )
*   void __i18n.init__( Object *options*, Function *callback* )

__i18n.init()__ 是一个异步方法，未提供回调函数时，初始化方法将返回一个 Promise 实例。

参数说明：
*   *options* Object

*	*options.company* string DEFAULT `"ctrip.com"`  
	Since 2.0.0  
	声明宿主应用所属的公司组织。这一选项将影响 ARES.i18n 在分配静态资源域名时的选择。  
	面向海外业务的应用，建议填写 `"trip.com"`。

*   *options.tryHttp* boolean DEFAULT `false`  
	Since 1.2.0  
	尝试使用 HTTP 协议。  
	返回的 URL 中默认使用 HTTPS 协议。开启此参数后，测试环境下返回的 URL 中将使用 HTTP 协议。

*   *options.pathnames* Array(string) OPTIONAL  
	需要预热的资源数组，每一项应为一个代表 pathname 的字符串。  
	预热是为了排除可能存在的缓存残留的影响，确保后面每一个 __i18n.getUrl()__ 方法得到的 URL 均可以加载到最新的资源。

*   *options.modules* Object  
	需要加载的资源模块别名及其完整的名称。形如：
	```javascript
	{
		'demo' : '@ares/demo2019@1.0.0',
	}
	```
	
### i18n.getUrl()

根据当前环境和上下文，获取当前可用且较优的静态资源 URL。

调用方式：
*   string __i18n.getUrl__( string *pathname*, http.IncomingMessage *req* )
*   string __i18n.getUrl__( string *pathname_1*, string *pathname_2*, ..., http.IncomingMessage *req* )

参数说明：
*   *pathname* string  
	这里 pathname 可以是 __以下格式之一__ ：

	*   符合 POSIX 标准的资源绝对路径，即以斜杠 / 为分隔符且以斜杠 / 起始。举例如下：  
		正确 /foo/bar.js  
		错误 <del>foo/bar.js</del>  
		错误 <del>//static.tripcdn.com/foo/bar.js</del>   
		错误 <del>http://static.tripcdn.com/foo/bar.js</del>  

	*   代表模块中的资源的伪地址，形如：  
		module://&lt;模块别名&gt;/&lt;模块内原始路径&gt;

	如果参数中提供了多个 pathname，则返回的是合并后的 URL。当存在多个 pathname 时，第二个及以后的 pathname 参数可以是相对路径。

*   *req* http.IncomingMessage  
	请求对象。  
	此参数是必须的，否则域名 DR、堡垒发布等功能均无法实现。

注意：__返回 URL 一律为 https 地址__，不再是传统模式下省略协议头的形式。

### i18n.getIntranetUrl()

该方法与 `i18n.getUrl()` 方法同构，返回的 URL 属于内网静态资源站点，该站点通常在当前应用同侧（即在同一 IDC 内）。

import SafetyWarning from '/docs/module/template/_SafetyWarning.md'

<SafetyWarning/>

### i18n.getHost()

根据当前环境和上下文，获取当前可用且较优的静态资源域名。

调用方式：
*   string __i18n.getHost__( http.IncomingMessage *req* )

参数说明：
*   *req* http.IncomingMessage  
	请求对象。  
	此参数是必须的，否则域名 DR、堡垒发布等功能均无法实现。

### i18n.getManifest()

根据当前环境和上下文，获取指定模块的资源清单。该资源清单以键值对的形式提供，键名为该资源在模块源代码目录中的相对路径名，键值为对应的构建输出目录下的相对路径名。

调用方式：
*   JSON __i18n.getManifest__( string *moduleAlias*, http.IncomingMessage *req* )

参数说明：
*   *moduleAlias* string  
	模块别名。

*   *req* http.IncomingMessage  
	请求对象。  
	此参数是必须的，否则域名 DR、堡垒发布等功能均无法实现。

### i18n.getModuleBase()

获取指定模块的基础路径，包含协议头、域名和路径前缀。

调用方式：
*   string __i18n.getModuleBase__( string *moduleAlias* , http.IncomingMessage *req* )

参数说明：
*   *moduleAlias* string  
	模块别名。

*   *req* http.IncomingMessage  
	请求对象。  
	此参数是必须的，否则域名 DR、堡垒发布等功能均无法实现。

### i18n.getIntranetModuleBase()

该方法与 `i18n.getModuleBase()` 方法同构，返回的基础路径属于内网静态资源站点，该站点通常在当前应用同侧（即在同一 IDC 内）。

<SafetyWarning/>

### i18n.info()

获取运行时的部分信息。

调用方式：
*   Object __i18n.info__()

注意：该方法返回的信息仅供调试使用，其内容和格式均有可能在未经通知的情况下变更。