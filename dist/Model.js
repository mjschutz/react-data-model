"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const eventemitter3_1 = tslib_1.__importDefault(require("eventemitter3"));
const InfoSymbol = Symbol('Data');
const StoredDataSymbol = Symbol('Data');
const CurrentDataSymbol = Symbol('CurrentData');
const ChangeEventSymbol = Symbol('ChangeEvent');
const PropsInfoSymbol = Symbol('PropsInfo');
const modelBuildData = (model) => {
    return model[CurrentDataSymbol] = model[CurrentDataSymbol] || (model[StoredDataSymbol].length > 0 ? model[StoredDataSymbol][0] : {});
};
class Model {
    constructor() {
        this[_a] = [];
        this[_b] = null;
        this[_c] = new eventemitter3_1.default();
    }
    *[(_a = StoredDataSymbol, _b = CurrentDataSymbol, _c = ChangeEventSymbol, _d = PropsInfoSymbol, Symbol.iterator)]() {
        let value = 0;
        for (let i = value; i < this[StoredDataSymbol].length; value !== undefined ? i = value : i++) {
            const cpObj = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
            cpObj[StoredDataSymbol] = Object.assign({}, this[StoredDataSymbol]);
            cpObj[CurrentDataSymbol] = cpObj[StoredDataSymbol][i];
            cpObj[ChangeEventSymbol] = new eventemitter3_1.default();
            value = yield cpObj;
        }
    }
}
Model.InfoData = InfoSymbol;
Model.StoredData = StoredDataSymbol;
Model.CurrentData = CurrentDataSymbol;
Model.ChangeEvent = ChangeEventSymbol;
Model.PropsInfo = PropsInfoSymbol;
Model[_d] = {};
Model.Props = function (...args) {
    if (args.length == 0) {
        return Object.assign({}, this[PropsInfoSymbol]);
    }
    return Object.fromEntries(args.map((value) => [value, this[PropsInfoSymbol][value]]));
};
Model.Prop = function (propInfo = {}) {
    return function (target, propertyKey, _propertyDescriptor) {
        propInfo = Object.assign({ name: propertyKey }, propInfo);
        const propName = propInfo['name'] !== undefined && typeof propInfo['name'] === 'string' ? propInfo['name'] : propertyKey;
        let props = target.constructor[PropsInfoSymbol];
        if (props === Object.getPrototypeOf(target.constructor)[PropsInfoSymbol]) {
            props = Object.assign({}, props);
            target.constructor[PropsInfoSymbol] = props;
        }
        Object.keys(props).filter(value => value == propertyKey).forEach(value => delete props[value]);
        props[propertyKey] = propInfo;
        return {
            set: function (value) {
                const currentData = modelBuildData(this);
                currentData[propName] = value;
                this[ChangeEventSymbol].emit('change_prop', propertyKey, this);
            },
            get: function () {
                const currentData = modelBuildData(this);
                if (propName in currentData && currentData[propName] !== undefined) {
                    return currentData[propName];
                }
                return propInfo['defaultValue'] !== undefined ? propInfo['defaultValue'] : undefined;
            },
            enumerable: true,
            configurable: true
        };
    };
};
Model.Data = function (data, info) {
    return function (constructor) {
        var _e, _f, _g, _h;
        const storeData = Array.isArray(data) ? data : data();
        const rConstructor = (_h = class extends constructor {
                constructor() {
                    super(...arguments);
                    this[_e] = storeData;
                    this[_f] = storeData.length > 0 ? storeData[0] : null;
                    this[_g] = new eventemitter3_1.default();
                }
            },
            _e = StoredDataSymbol,
            _f = CurrentDataSymbol,
            _g = ChangeEventSymbol,
            _h);
        info && Object.defineProperty(rConstructor.prototype, InfoSymbol, {
            value: info,
            enumerable: false,
            configurable: true
        });
        return rConstructor;
    };
};
