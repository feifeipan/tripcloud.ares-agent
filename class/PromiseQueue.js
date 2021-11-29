'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	
	/* in-package */
	, ManualPromise = require('./ManualPromise')
	;

class PromiseQueue {

	constructor() {
		this._promises = [];
	}

	/**
	 * 
	 * @param {Function} fn    - a function which returns a promise
	 * @param {...any}   args 
	 */
	async append(fn, ...args) {
		const cp = new ManualPromise();
		const L = this._promises.length;
		this._promises.push(cp.promise);

		for (let i = 0; i < L; i++) {
			await this._promises[i].catch(ex => {});
		}

		fn.apply(null, args).then(cp.resolve, cp.reject);
		await cp.promise;
	}

}

module.exports = PromiseQueue;