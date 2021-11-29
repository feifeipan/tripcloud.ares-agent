'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	
	/* in-package */
	;

const LENGTH = 100;

/**
 * 将配置信息规范化成两个一一对应的数组
 * @return { vendors, shares }
 */ 
function format(group) {
	let vendors, shares;

	// 如供应商组合中仅有一个名字，则认为此时由单一供应商提供服务。			
	if (typeof group == 'string') {
		vendors = [ group ];
		shares = [ LENGTH ];
	}

	// 如果供应商组合为一个数组，则该数组必须全部由则认为份额由这些供应商均摊。
	else if (group instanceof Array) {
		vendors = group.slice(0);
		shares = new Array(vendors.length);

		let each = Math.floor(LENGTH / group.length);
		shares.fill(each);

		// 如果份额不能整除，则余数优先平摊给排在前面的供应商。			
		let remainder = LENGTH % each;
		for (let i = 0; i < remainder; i++) {
			shares[i] += 1;
		}
	}

	// 也可以为每个供应商指定份额。
	else {
		// 将份额列表分解成两个数组。
		vendors = Object.keys(group);
		shares = vendors.map(vendor => group[vendor]);
		
		// 先计算总的份额数。
		let total = 0;
		shares.forEach(share => { total += share; });

		// 按基数调整份额至整数（份额最少不能低于1）。
		shares = shares.map(share => Math.max(1, Math.floor(LENGTH * share / total)));

		// 计算余数, 并优先平摊给排在前面的供应商。
		total = 0;
		shares.forEach(share => { total += share; });
		for (let i = 0, remainder = LENGTH - total; i < remainder; i++) {
			shares[i] += 1;
		}
	}

	return { vendors, shares };
}

class VendorMatrix {
	constructor(group) {
		let matrix = new Array(LENGTH);
		let { vendors, shares } = format(group);
		for (let i = 0, start = 0, end; i < vendors.length; i++) {
			end = start + shares[i];
			matrix.fill(vendors[i], start, end);
			start = end;
		}
		
		this._matrix  = matrix;
		this._vendors = vendors;
		this._shares  = shares;
		this._findHoldingVendor();
	}

	_findHoldingVendor() {
		let max = 0;
		for (let i = 0; i < this._shares.length; i++) {
			if (this._shares[i] > max) {
				max = this._shares[i];
			}
		}
		let i = this._shares.indexOf(max);
		this._holdingVendor = this._vendors[i];
	}

	// 如配置有变更，则更新内部矩阵以调整份额分配策略。
	update(group) {
		let { vendors, shares } = format(group);

		let addingQueue = [], removingVendorShares = {};
		
		// 获取新供应商的份额差额。
		for (let i = 0; i < vendors.length; i++) {
			let vendor = vendors[i];

			// 定位供应商的当前序号。
			let oldi = this._vendors.indexOf(vendors[i]);

			let diffShare = shares[i];
			
			// 如果该供应商之前存在，则计算新份额和旧份额之间的差额。
			if (oldi >= 0) {
				diffShare -= this._shares[oldi];
				delete this._shares[oldi];
			}

			if (diffShare == 0) {
				// DO NOTHING.
			}
			else if (diffShare > 0) {
				// diffShare 为正，说明需要增加份额。
				let patch = new Array(diffShare).fill(vendor);
				addingQueue = addingQueue.concat(patch);
			}
			else if (diffShare < 0) {
				// diffShare 为负，说明需要削减份额。
				removingVendorShares[vendor] = -diffShare;
			}
		}

		// 若当前供应商中，有不在新供应商列表中的，其份额应该被清退。
		for (let i = 0; i < this._vendors.length; i++) {
			if (this._shares[i]) {
				let vendor = this._vendors[i];
				removingVendorShares[vendor] = this._shares[i];
			}
		}

		// 调整份额。
		// 从尾部开始调整。
		// 理论上，i >= 0 条件是多余的。
		for (let i = LENGTH - 1; i >= 0 && addingQueue.length; i--) {
			// 获取矩阵格子中当前的供应商。
			let vendor = this._matrix[i];

			// 如果该供应商需要削减份额，则将份额转予待增加份额的供应商。
			if (removingVendorShares[vendor] > 0) {
				this._matrix[i] = addingQueue.pop();
				removingVendorShares[vendor] -= 1;
			}
		}

		this._vendors = vendors;
		this._shares = shares;
		
		return this;
	}
	
	// 根据用户编号（数字）确定其对应的供应商名称。
	// 如未提供用户编号，则返回最大的供应商。
	getVendor(percents) {
		if (percents === undefined) {
			return this._holdingVendor;
		}
		else {
			percents = parseInt(percents) % 100;
			return  this._matrix[percents];
		}
	}
}

module.exports = VendorMatrix;
