'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, Locator = require('@ctrip/ares-ipip/Locator')
	
	/* in-package */
	;

module.exports = {
	getRegion: ()=>{
		return 'oversea'
	}
};