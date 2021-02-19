import {Model} from './Model';

type Constructor<T = {}> = {new (...args: any[]): T};

const WhereInfoSymbol = Symbol('WhereInfoSymbol');
const QuerySymbol = Symbol('QuerySymbol');

class ModelWhere {
	static [WhereInfoSymbol]: { props: {[key:string]: any}; } = { props: {} };
	[QuerySymbol]: { [key:string]: any; } = { $and: {} };
	
	function Op(opName: string) {
		return function (
			target: Object, 
			propertyKey: string
		): any {
			const WhereInfo = (target.constructor as typeof ModelWhere)[WhereInfoSymbol];
			const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
			const objBuilder = prop.objBuilder;
			prop.objBuilder = (test: Test) => ({
				get [`$${opName}`]() {
					return objBuilder === null ? prop.valueMap.get(test) : objBuilder(test);
				}
			})

			return {
				set: function (val: any) {
					prop.valueMap.set(this, val);
				},
				get: function(): any {
					return prop.valueMap.get(this);
				},
				enumerable: true,
				configurable: true
			}
		}
	}
	
	static Btw = ModelWhere.Op('btw');
	static In = ModelWhere.Op('in');
	static Like = ModelWhere.Op('like');
	static Eq = ModelWhere.Op('eq');
	static Ne = ModelWhere.Op('ne');
	static Gt = ModelWhere.Op('gt');
	static Lt = ModelWhere.Op('lt');
	static Ge = ModelWhere.Op('ge');
	static Le = ModelWhere.Op('le');
	
	static And = function(...model: Model[]) {
		return function<T extends Constructor>(
			constructor: T
		) {
			return class extends constructor {
				static [WhereInfoSymbol] = {
					props: model.reduce((retObj: object, currentModel: Model) => Object.assign(retObj, currentModel[Model.PropsInfo]), {})
				}
				
				[QuerySymbol]: { [key:string]: any; } = { $and: {} };
			}
		}
	}
	
	static Or = function(...model: Model[]) {
		return function<T extends Constructor>(
			constructor: T
		) {
			return class extends constructor {
				static [WhereInfoSymbol] = {
					props: model.reduce((retObj: object, currentModel: Model) => Object.assign(retObj, currentModel[Model.PropsInfo]), {})
				}
				
				[QuerySymbol]: { [key:string]: any; } = { $or: {} };
			}
		}
	}
	
	static query = function(modelWhere: ModelWhere) {
		return modelWhere[MainQuerySymbol];
	}
}

/*
const _WhereInfoSymbol = Symbol('_where_info');

const _Where = function <ModelType>(model: ModelType, query?: object) {
	return function<T extends Constructor>(
		constructor: T
	) {
		constructor.prototype[_WhereInfoSymbol] || Object.defineProperty(constructor.prototype, _WhereInfoSymbol, {
			value: {
				props: model[Model.PropsInfo],
				query
			},
			enumerable: false,
			configurable: true
		});
		
		return constructor;
	}
};

_Where.Symbol = Symbol("_where_data");

const ModelWhereControlSymbol = Symbol("ModelWhereControlSymbol");

export class ModelWhere {
	static ControlSymbol = ModelWhereControlSymbol;
	
	get [ModelWhereControlSymbol]() {
		const modelWhere = this;
		const field = (propertyName: string): object => {
			const getters = modelWhere[_Where.Symbol][propertyName];
			
			if (!getters)
				return {};
			
			let value = modelWhere[propertyName];
			
			for (const getter of getters) {
				value = getter(value);
			}
			
			return value;
		};
		const op = (name, args: (object|string)[]) => {
			let result = { [name]: [] as object[] };
			
			if (args.length > 0) {
				for (const prop of args) {
					result[name].push(typeof prop === 'string' ? field(prop) : Object.entries(prop).reduce((qObj, [key, value]) => Object.assign(qObj, op(key, value)), {}))
					//Object.assign(result[name], typeof prop === 'string' ? field(prop) : Object.entries(prop).reduce((qObj, [key, value]) => Object.assign(qObj, op(key, value)), {}));
				}
			} else {
				const tProto = Object.getPrototypeOf(modelWhere);
				Object.getOwnPropertyNames(tProto).forEach((propertyName) => {
					const descriptor = Object.getOwnPropertyDescriptor(tProto, propertyName);
					if (descriptor && typeof descriptor.get === 'function') {
						result[name].push(field(propertyName));
						//Object.assign(result[name], field(propertyName));
					}
				});
			}
			
			return result;
		}
		
		return {
			query: () => {
				const queryObj: {[key:string]: (object|string)[]} = modelWhere[_WhereInfoSymbol]['query'];
				
				if (!queryObj) {
					return { $and: op('$and', []) };
				}
				
				return Object.entries(queryObj).reduce((qObj, [key, value]) => Object.assign(qObj, op(key, value)), {});
			},
			
			field,
			
			fieldName: (propertyName: string): string => {
				return modelWhere[_WhereInfoSymbol]['props'][propertyName].name;
			},
			
			fieldNames: (propertyName: string[]): object => {
				return Object.entries(modelWhere[_WhereInfoSymbol]['props'] as {[key: string]: {name:string}})
								.filter(([key, _value]) => propertyName.includes(key))
								.reduce((obj, [key, value]) => Object.assign(obj, { [key]: value.name }), {});
			},
			
			or: (...args: (object|string)[]) => {
				return op('$or', args);
			},
			
			and: (...args: (object|string)[]) => {
				return op('$and', args);
			}
		}
	}
};

const createWhereInfo = (target) => target[_Where.Symbol] || Object.defineProperty(target, _Where.Symbol, {
	value: {},
	enumerable: false,
	configurable: true
})[_Where.Symbol]

_Where.Op = function(opName) {
	return function (
		target: Object, 
		propertyKey: string, 
		propertyDescriptor?: PropertyDescriptor
	): any {
		let valueMap = new WeakMap();
		let whereInfo = createWhereInfo(target);
		
		(whereInfo[propertyKey] = whereInfo[propertyKey] || []).push(value => {
			const propInfo: object = target[_WhereInfoSymbol]['props'][propertyKey];
			return {
				[`${propInfo['table'] ? propInfo['table'] + '.' : ''}${propInfo['name']}`]: { [`\$${opName}`]: value }
			};
		});
		
		return {
			set: function (val) {
				let value: any =
						!valueMap.has(this) ?
							valueMap.set(this, propertyDescriptor ? Object.defineProperty({}, 'prop', propertyDescriptor) : { prop: undefined }).get(this) :
							valueMap.get(this);

				value.prop = val;
			},
			get: function() {
				let value: any =
						!valueMap.has(this) ?
							valueMap.set(this, propertyDescriptor ? Object.defineProperty({}, 'prop', propertyDescriptor) : { prop: undefined }).get(this) :
							valueMap.get(this);

				return value.prop;
			},
			enumerable: true,
			configurable: true
		}
	};
}

_Where.Btw = _Where.Op('btw');
_Where.In = _Where.Op('in');
_Where.Like = _Where.Op('like');
_Where.Eq = _Where.Op('eq');
_Where.Ne = _Where.Op('ne');
_Where.Gt = _Where.Op('gt');
_Where.Lt = _Where.Op('lt');
_Where.Ge = _Where.Op('ge');
_Where.Le = _Where.Op('le');

_Where.Ref = function (
	target: Object, 
	propertyKey: string, 
	propertyDescriptor?: PropertyDescriptor
): any {
	let valueMap = new WeakMap();
	let whereInfo = createWhereInfo(target);

	(whereInfo[propertyKey] = whereInfo[propertyKey] || []).push(value => ({ $ref: value }));
	
	return {
		set: function (val) {
			let value: any =
						!valueMap.has(this) ?
							valueMap.set(this, propertyDescriptor ? Object.defineProperty({}, 'prop', propertyDescriptor) : { prop: undefined }).get(this) :
							valueMap.get(this);

			value.prop = val;
		},
		get: function() {
			let value: any =
						!valueMap.has(this) ?
							valueMap.set(this, propertyDescriptor ? Object.defineProperty({}, 'prop', propertyDescriptor) : { prop: undefined }).get(this) :
							valueMap.get(this);

			return value.prop;
		},
		enumerable: true,
		configurable: true
	}
};

_Where.Replace = function(repStr) {
	
	return function (
		target: Object, 
		propertyKey: string, 
		propertyDescriptor?: PropertyDescriptor
	): any {
		let valueMap = new WeakMap();
		let whereInfo = createWhereInfo(target);

		(whereInfo[propertyKey] = whereInfo[propertyKey] || []).push(value => repStr.replace(/{value}/g, value));
		
		return {
			set: function (val) {
				let value: any =
						!valueMap.has(this) ?
							valueMap.set(this, propertyDescriptor ? Object.defineProperty({}, 'prop', propertyDescriptor) : { prop: undefined }).get(this) :
							valueMap.get(this);

				value.prop = val;
			},
			get: function() {
				let value: any =
						!valueMap.has(this) ?
							valueMap.set(this, propertyDescriptor ? Object.defineProperty({}, 'prop', propertyDescriptor) : { prop: undefined }).get(this) :
							valueMap.get(this);
				
				return value.prop;
			},
			enumerable: true,
			configurable: true
		}
	};
}

type _WhereQueryOpType = 'query'|'or'|'and';
_Where.Query = function(opType: _WhereQueryOpType = 'query', orAndVal: (object|string)[] = []) {
	
	return function (
		target: Object, 
		propertyKey: string, 
		propertyDescriptor?: PropertyDescriptor
	): any {
		let valueMap = new WeakMap();
		let whereInfo = createWhereInfo(target);

		(whereInfo[propertyKey] = whereInfo[propertyKey] || []).push((value: ModelWhere) => opType == 'query' ? value[ModelWhere.ControlSymbol].query() : opType == 'or' ? value[ModelWhere.ControlSymbol].or(orAndVal) : value[ModelWhere.ControlSymbol].and(orAndVal));
		
		return {
			set: function (val) {
				let value: any =
						!valueMap.has(this) ?
							valueMap.set(this, propertyDescriptor ? Object.defineProperty({}, 'prop', propertyDescriptor) : { prop: undefined }).get(this) :
							valueMap.get(this);

				value.prop = val;
			},
			get: function() {
				let value: any =
						!valueMap.has(this) ?
							valueMap.set(this, propertyDescriptor ? Object.defineProperty({}, 'prop', propertyDescriptor) : { prop: undefined }).get(this) :
							valueMap.get(this);
				
				return value.prop;
			},
			enumerable: true,
			configurable: true
		}
	};
}
*/