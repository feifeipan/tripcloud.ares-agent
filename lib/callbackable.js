'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	
	/* in-package */
	;


function callbackable(fn) {
	return function() {
		let args = Array.from(arguments);
		if (typeof args[args.length - 1] == 'function') {
			let callback = args.pop();
			fn.apply(null, args).then(data => callback(null, data), callback);
		}
		else {
			return fn.apply(null, args);
		}
	};
}

module.exports = callbackable;
