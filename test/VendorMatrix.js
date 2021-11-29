'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, assert = require('assert')
	
	/* NPM */
	, noda = require('noda')
	
	/* in-package */
	, VendorMatrix = noda.inRequire('class/VendorMatrix')
	;

describe('i18n VendorMatrix', function() {

	it('new, vendor name', () => {
		let vm = new VendorMatrix('ak');
		let expected = new Array(100);
		expected.fill('ak');
		assert.deepEqual(expected, vm._matrix);
	});

	it('new, vendor array (divisible)', () => {
		let vm = new VendorMatrix(['ak', 'aw']);
		let expected = new Array(100);
		expected.fill('ak', 0, 50);
		expected.fill('aw', 50);
		assert.deepEqual(expected, vm._matrix);
	});

	it('new, vendor array (indivisiable 1)', () => {
		let vm = new VendorMatrix(['ak', 'aw', 'bd']);
		let expected = new Array(100);
		expected.fill('ak', 0, 34);
		expected.fill('aw', 34, 67);
		expected.fill('bd', 67);
		assert.deepEqual(expected, vm._matrix);
	});

	it('new, vendor array (indivisiable 2)', () => {
		let vm = new VendorMatrix(['ak', 'aw', 'bd', 'dl', 'ws', 'al']);
		let expected = new Array(100);
		expected.fill('ak', 0, 17);
		expected.fill('aw', 17, 34);
		expected.fill('bd', 34, 51);
		expected.fill('dl', 51, 68);
		expected.fill('ws', 68, 84);
		expected.fill('al', 84);
		assert.deepEqual(expected, vm._matrix);
	});

	it('new, vendor object (only one)', () => {
		let vm = new VendorMatrix({
			'ak' : 1,
		});		
		let expected = new Array(100);
		expected.fill('ak');
		assert.deepEqual(expected, vm._matrix);
	});

	it('new, vendor object (more and divisiable)', () => {
		let vm = new VendorMatrix({
			'ak' : 90, 
			'aw' : 10,
		});		
		let expected = new Array(100);
		expected.fill('ak', 0, 90);
		expected.fill('aw', 90);
		assert.deepEqual(expected, vm._matrix);
	});

	it('new, vendor object (more and indivisiable)', () => {
		let vm = new VendorMatrix({
			'ak' : 900, 
			'aw' : 100,
			'bd' : 1,
		});		
		let expected = new Array(100);
		expected.fill('ak', 0, 90);
		expected.fill('aw', 90, 99);
		expected.fill('bd', 99);
		assert.deepEqual(expected, vm._matrix);
	});


	it('update', () => {
		let vm = new VendorMatrix({
			'ak' : 90, 
			'aw' : 10,
		});
		
		let expected = new Array(100);
		expected.fill('ak', 0, 90);
		expected.fill('aw', 90);
		assert.deepEqual(expected, vm._matrix);

		// 完全替换既有供应商的份额。
		vm.update({
			'ak' : 90,
			'bd' : 10,
		});
		expected.fill('ak', 0, 90);
		expected.fill('bd', 90);
		assert.deepEqual(expected, vm._matrix);

		// 调整现在供应商的份额。
		vm.update({
			'ak' : 80,
			'bd' : 20,
		});
		expected.fill('ak', 0, 80);
		expected.fill('bd', 80);
		assert.deepEqual(expected, vm._matrix);

		// 份额可除尽的情况下，调整供应商顺序不会变动每个份额的归属。
		vm.update({
			'bd' : 20,
			'ak' : 80,
		});
		assert.deepEqual(expected, vm._matrix);

		// 这个情况就有点复杂了。
		vm.update({
			'bd' : 1, // 实际份额 34
			'ak' : 1, // 实际份额 33
			'aw' : 1, // 实际份额 33
		});
		expected.fill('ak', 0, 33);
		expected.fill('bd', 80);
		expected.fill('bd', 33, 47 /* 33 + 34 - 20 */);
		expected.fill('aw', 47, 80);
		assert.deepEqual(expected, vm._matrix);

		// 再复杂一点。
		vm.update({
			'bd' : 80,
			'aw' : 20,
		});
		// aw 保留靠前的 20 个份额，其余的都归 db。
		expected.fill('bd');
		expected.fill('aw', 47, 67);
		assert.deepEqual(expected, vm._matrix);
	});

});