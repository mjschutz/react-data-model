import EventEmitter from 'eventemitter3';

type Constructor<T = {}> = {new (...args: any[]): T};

interface GenericObject {
	[key:string]: any;
}

const InfoSymbol = Symbol('Data');
const StoredDataSymbol = Symbol('Data');
const CurrentDataSymbol = Symbol('CurrentData');
const ChangeEventSymbol = Symbol('ChangeEvent');
const PropsInfoSymbol = Symbol('PropsInfo');

const modelBuildData = (model: Model): GenericObject => {
	return model[CurrentDataSymbol] = model[CurrentDataSymbol] || (model[StoredDataSymbol].length > 0 ? model[StoredDataSymbol][0] : {});
}

class Model {
	static InfoData = InfoSymbol;
	static StoredData = StoredDataSymbol;
	static CurrentData = CurrentDataSymbol;
	static ChangeEvent = ChangeEventSymbol;
	static PropsInfo = PropsInfoSymbol;

	[StoredDataSymbol]: object[] = [];
	[CurrentDataSymbol]: object|null = null;
	[ChangeEventSymbol]: EventEmitter = new EventEmitter();

    static [PropsInfoSymbol]: GenericObject = {};
	
	*[Symbol.iterator]() {
		let value: number|undefined = 0;
		for (let i = value; i < this[StoredDataSymbol].length; value !== undefined ? i = value : i++) {
			const cpObj = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
			cpObj[StoredDataSymbol] = Object.assign({}, this[StoredDataSymbol]);
			cpObj[CurrentDataSymbol] = cpObj[StoredDataSymbol][i];
			cpObj[ChangeEventSymbol] = new EventEmitter();
			value = yield cpObj;
		}
	}
	
	static Props = function(this: typeof Model, ...args: string[]) {
		if (args.length == 0) {
			return Object.assign({}, this[PropsInfoSymbol]);
		}
		
		return Object.fromEntries(args.map((value: string) => [value, this[PropsInfoSymbol][value]]));
	}
	
	static Prop = function (propInfo: GenericObject = {}): any {
		return function (
			target: Object,
			propertyKey: string,
			_propertyDescriptor: PropertyDescriptor
		): PropertyDescriptor {
			propInfo = Object.assign({name: propertyKey}, propInfo);
			const propName = propInfo['name'] !== undefined && typeof propInfo['name'] === 'string' ? propInfo['name'] : propertyKey;
			
			let props = (target.constructor as typeof Model)[PropsInfoSymbol];
			
			if (props === Object.getPrototypeOf(target.constructor)[PropsInfoSymbol]) {
				props = Object.assign({}, props);
				(target.constructor as typeof Model)[PropsInfoSymbol] = props;
			}
			
			Object.keys(props).filter(value => value == propertyKey).forEach(value => delete props[value]);
			props[propertyKey] = propInfo;
			
			return {
				set: function (this: Model, value) {
					const currentData = modelBuildData(this);
					currentData[propName] = value;
					this[ChangeEventSymbol].emit('change_prop', propertyKey, this);
				},
				get: function(this: Model) {
					const currentData = modelBuildData(this);

                    if (propName in currentData && currentData[propName] !== undefined) {
                        return currentData[propName];
					}

					return propInfo['defaultValue'] !== undefined? propInfo['defaultValue'] : undefined;
				},
				enumerable: true,
				configurable: true
			}
		}
	}
	
	static Data = function(data: any[]|((filter?: object) => any[]), info?: object) {
		return function<T extends Constructor>(
			constructor: T
		) {
			const storeData = Array.isArray(data) ? data : data();
			const rConstructor = class extends constructor {
				[StoredDataSymbol]: object[] = storeData;
				[CurrentDataSymbol]: object|null = storeData.length > 0 ? storeData[0] : null;
				[ChangeEventSymbol]: EventEmitter = new EventEmitter();
			};
			
			info && Object.defineProperty(rConstructor.prototype, InfoSymbol, {
				value: info,
				enumerable: false,
				configurable: true
			});
			
			return rConstructor;
		}
	}
}
