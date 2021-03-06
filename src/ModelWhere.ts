import {Model} from './Model';

type Constructor<T = {}> = {new (...args: any[]): T};

const WhereInfoSymbol = Symbol('WhereInfoSymbol');
const PropInfoSymbol = Symbol('WherePropInfoSymbol');
const QuerySymbol = Symbol('QuerySymbol');

export class ModelWhere {
	static [WhereInfoSymbol]: { props: {[key:string]: any}; } = { props: {} };
    static [PropInfoSymbol]: { [key:string]: any } = { };
	[QuerySymbol]: { [key:string]: any; } = ModelWhere.AllFields.call(this.constructor as typeof ModelWhere, this, 'and');

	static AllFields = function(this: typeof ModelWhere, currentWhere: ModelWhere, op: string) {
		const currentClass = this;

		return ({
			[`$${op}`]:
				Object.values(currentClass[PropInfoSymbol]).map(value => value.objBuilder(currentWhere))
		});
	}

	static Class = function(options: {[key:string]: any} = {}) {
		let {op} = options;
		op = op || 'and';
		return function <T extends { new (...args: any[]): ModelWhere }>(
			constructor: T
		) {
			return class ModelClass extends constructor {
				static [WhereInfoSymbol]: { props: {[key:string]: any}; } = { props: {} };
				[QuerySymbol]: { [key:string]: any; } = ModelWhere.AllFields.call(this.constructor as typeof ModelWhere, this, op);
			};
		}
	}

	static AndOr = (opName: string, ...fields: string[]) => {
		return function (
			target: Object, 
			propertyKey: string
		): any {
			const currentClass = (target.constructor as typeof ModelWhere);
			const WhereInfo = currentClass[PropInfoSymbol];
			const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
			const objBuilder = prop.objBuilder;
			prop.objBuilder = fields.length === 0 ?
			(modelWhere: ModelWhere) => (objBuilder(modelWhere)) :
			(modelWhere: ModelWhere) => ({
				get [`$${opName}`]() {
					const obj = objBuilder(modelWhere);
					return fields.map((key) => ({[key]: obj[propertyKey]}));
				}
			});

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

	static And = ModelWhere.AndOr.bind(ModelWhere, 'and');
	static Or = ModelWhere.AndOr.bind(ModelWhere, 'or');
	
	static Op = (opName: string) => {
		return function (
			target: Object, 
			propertyKey: string
		): any {
			const WhereInfo = Object.getPrototypeOf(target.constructor)[PropInfoSymbol] !== (target.constructor as typeof ModelWhere)[PropInfoSymbol] ?
								(target.constructor as typeof ModelWhere)[PropInfoSymbol] : ((target.constructor as typeof ModelWhere)[PropInfoSymbol] = {});
			const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
			const objBuilder = prop.objBuilder;
			prop.objBuilder = objBuilder === null ? (modelWhere: ModelWhere) => ({[propertyKey]:{
				get [`$${opName}`]() {
					return prop.valueMap.get(modelWhere)
				}
			}}) : (modelWhere: ModelWhere) => {
				const obj = objBuilder(modelWhere);

				return ({[propertyKey]:{
					get [`$${opName}`]() { return obj[propertyKey] }
				}})
			}

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
	static Ref = ModelWhere.Op('ref');
	
	static Replace = function(repStr: string) {
		return function (
			target: Object, 
			propertyKey: string
		): any {
			const WhereInfo = Object.getPrototypeOf(target.constructor)[PropInfoSymbol] !== (target.constructor as typeof ModelWhere)[PropInfoSymbol] ?
								(target.constructor as typeof ModelWhere)[PropInfoSymbol] : ((target.constructor as typeof ModelWhere)[PropInfoSymbol] = {});
			const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
			const objBuilder = prop.objBuilder;
			
			if (objBuilder === null) {
				prop.objBuilder = (modelWhere: ModelWhere) => ({[propertyKey]:repStr.replace(/{value}/g, prop.valueMap.get(modelWhere))});
			}

			return {
				set: function (val: any) {
					prop.valueMap.set(this, val);
				},
				get: function(): any {
					return prop.valueMap.get(this);
				},
				enumerable: true,
				configurable: true
			};
		};
	}

	static Query = function (
		target: Object, 
		propertyKey: string
	): any {
		const WhereInfo = Object.getPrototypeOf(target.constructor)[PropInfoSymbol] !== (target.constructor as typeof ModelWhere)[PropInfoSymbol] ?
								(target.constructor as typeof ModelWhere)[PropInfoSymbol] : ((target.constructor as typeof ModelWhere)[PropInfoSymbol] = {});
		const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
		const objBuilder = prop.objBuilder;

		if (objBuilder === null) {
			prop.objBuilder = (modelWhere: ModelWhere) => prop.valueMap.get(modelWhere) ? prop.valueMap.get(modelWhere)[QuerySymbol] : {}
		}
		
		return {
			set: function (val: any) {
				prop.valueMap.set(this, val);
			},
			get: function(): any {
				return prop.valueMap.get(this);
			},
			enumerable: true,
			configurable: true
		};
	}
	
	static query = function(modelWhere: ModelWhere) {
		return modelWhere[QuerySymbol];
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