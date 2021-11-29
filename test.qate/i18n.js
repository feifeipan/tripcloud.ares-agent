'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, assert = require('assert')
	, http = require('http')
	
	/* NPM */
	, noda = require('noda')
	
	/* in-package */
	, i18n = noda.inRequire('i18n')
	;

describe('i18n.qate', function() {
	let PATHNAMES = [
		'/locale/new-100014219-en-US.js', 'new-100005449-en-GB.js'
	];
	
	it('init()', done => {
		let env = 'UAT';
		i18n.init({ env }).then(done);
	});

	it('getUrl(pathname)', () => {
		let urlname = i18n.getUrl(PATHNAMES[0]);
		assert(urlname);
	});

	it('getUrl(pathname_1, pathname_2)', () => {
		let urlname = i18n.getUrl(PATHNAMES[0], PATHNAMES[1]);
		assert(urlname);
	});

	it('getUrl(pathname_1, req)', () => {
		let req = new http.IncomingMessage();
		let urlname = i18n.getUrl(PATHNAMES[0], req);
		assert(urlname);
	});

	it('getUrl(pathname_1, req), Request from ctripqa', () => {
		let req = new http.IncomingMessage();
		req.headers.host = 'example.ctripqa.com';
		let urlname = i18n.getUrl(PATHNAMES[0], req);
		assert(urlname.includes('uat-s.tripcdn.com'));
	});

	it('getIntranetUrl(pathname)', () => {
		let urlname = i18n.getUrl(PATHNAMES[0]);
		assert(urlname);
	});

	it('getIntranetUrl(pathname_1, pathname_2)', () => {
		let urlname = i18n.getUrl(PATHNAMES[0], PATHNAMES[1]);
		assert(urlname);
	});

	it('getUrgetIntranetUrll(pathname_1, req)', () => {
		let req = new http.IncomingMessage();
		let urlname = i18n.getUrl(PATHNAMES[0], req);
		assert(urlname);
	});

	it('init({ modules })', done => {
		let modules = {
			'demo19': '@ares/demo2019@1.0.0',
			'demo20': '@ares/demo2020@*',
		};
		let env = 'UAT';
		i18n.init({ env, modules }).then(done);
	});

	it('getUrl(modulePath', () => {
		let urlname = i18n.getUrl('module://demo19/README.md');
		assert(urlname);
	});

	it('getIntranetUrl(modulePath', () => {
		let urlname = i18n.getIntranetUrl('module://demo19/README.md');
		assert(urlname);
	});

	it('getManifest(moduleAlias)', () => {
		let manifest = i18n.getManifest('demo20');
		assert(manifest);
	});

	it('getModuleBase(moduleAlias)', () => {
		let base = i18n.getModuleBase('demo20');
		let pattern = new RegExp(`^https:\/\/[^/]+\/modules\/ares\/demo2020\/$`);
		assert(pattern.test(base));
	});

	it('getIntranetModuleBase(moduleAlias)', () => {
		let base = i18n.getIntranetModuleBase('demo20');
		let pattern = new RegExp(`^https:\/\/[^/]+\/modules\/ares\/demo2020\/$`);
		assert(pattern.test(base));
	});
});