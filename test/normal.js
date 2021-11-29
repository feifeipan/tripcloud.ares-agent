'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, assert = require('assert')
	, http = require('http')
	
	/* NPM */
	, noda = require('noda')
	
	/* in-package */
	, normal = noda.inRequire('normal')
	;

describe('normal', function() {
	let PATHNAMES = [
		'/locale/new-100014219-en-US.js', 'new-100005449-en-GB.js'
	];
	
	it('getRealUrl(urlname)', () => {
		let urlname = 'http://foo.com/';
		assert.equal(urlname, normal.getRealUrl(urlname));
	});

	it('getRealUrl(urlname)', () => {
		let urlname = '//static.tripcdn.com/';
		assert.equal(urlname, normal.getRealUrl(urlname));
	});
});