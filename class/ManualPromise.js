'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	
	/* in-package */
	;

class ManualPromise {

	constructor() {
		let resolve, reject;
		let promise = new Promise((resolveReal, rejectReal) => {
			resolve = resolveReal;
			reject = rejectReal;
		});

		this.promise = promise;
		this.resolve = resolve;
		this.reject  = reject;
	}

}

module.exports = ManualPromise;