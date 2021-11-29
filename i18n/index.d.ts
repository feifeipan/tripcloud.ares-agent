/// <reference types="node" />

import { IncomingMessage } from 'http';

/** i18n初始化信息的module */

/** i18初始化信息 */
export interface initModuleInfo {
    /** 指定环境 
     * @default 当前应用所在环境
    */
    env?: string,

    /** 需要预热的资源文件，每一项应为一个代表 pathname 的字符串。 
     * @default []
    */
    pathnames?: string[],

    /** 需要加载的资源模块别名及其完整的名称。
     * @example ``` {demo:'@ares/testpackage@1.0.0} ```
    */
    modules: object,

    /** 尝试启用 HTTP 协议。
     * @default false
    */
    tryHttp?: boolean,

    /** 限定当前业务所属公司。
     * @default ctrip.com 
    */
    company?: string
}

/** 当前模块信息 */
interface moduleInfo {
    config: object,
    modules: object
}

/** 执行初始化 
 * @link https://books.ctripcorp.com/docares/docs/api/module/nodejs#i18ninit
*/
declare function init(info: initModuleInfo): Promise<void>;

/** 根据当前环境和上下文，获取当前可用且较优的静态资源 URL 
 * @link https://books.ctripcorp.com/docares/docs/api/module/nodejs#i18ngeturl
*/
declare function getUrl(resourceName: string, req: IncomingMessage): string;

/** 该方法与 i18n.getUrl() 方法同构，返回的 URL 属于内网静态资源站点，该站点通常在当前应用同侧（即在同一 IDC 内）。 
 * @link https://books.ctripcorp.com/docares/docs/api/module/nodejs#i18ngetintraneturl
*/
declare function getIntranetUrl(resourceName: string, req: IncomingMessage): string;

/** 根据当前环境和上下文，获取当前可用且较优的静态资源域名
 * @link https://books.ctripcorp.com/docares/docs/api/module/nodejs#i18ngethost
 */
declare function getHost(req: IncomingMessage): string;

/** 根据当前环境和上下文，获取指定模块的资源清单。该资源清单以键值对的形式提供，键名为该资源在模块源代码目录中的相对路径名，键值为对应的构建输出目录下的相对路径名。
 * @link https://books.ctripcorp.com/docares/docs/api/module/nodejs#i18ngetmanifest
 */
declare function getManifest(moduleAlias: string, req: IncomingMessage): string;

/** 获取指定模块的基础路径，包含协议头、域名和路径前缀。
 * @link https://books.ctripcorp.com/docares/docs/api/module/nodejs#i18ngetmodulebase
*/
declare function getModuleBase(moduleAlias: string, req: IncomingMessage): string;

/** 该方法与 i18n.getModuleBase() 方法同构，返回的基础路径属于内网静态资源站点，该站点通常在当前应用同侧（即在同一 IDC 内）。
 * @link https://books.ctripcorp.com/docares/docs/api/module/nodejs#i18ngetintranetmodulebase
*/
declare function getIntranetModuleBase(moduleAlias: string, req: IncomingMessage): string;

/** 获取运行时的部分信息。
 * @link https://books.ctripcorp.com/docares/docs/api/module/nodejs#i18ninfo
*/
declare function info(info: IncomingMessage): moduleInfo;
