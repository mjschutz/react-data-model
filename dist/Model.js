"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
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
    *[(_a = StoredDataSymbol, _b = CurrentDataSymbol, _c = ChangeEventSymbol, Symbol.iterator)]() {
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
exports.Model = Model;
Model.InfoData = InfoSymbol;
Model.StoredData = StoredDataSymbol;
Model.CurrentData = CurrentDataSymbol;
Model.ChangeEvent = ChangeEventSymbol;
Model.PropsInfo = PropsInfoSymbol;
Model.Prop = function (propInfo = {}) {
    return function (target, propertyKey, _propertyDescriptor) {
        propInfo = Object.assign({ name: propertyKey }, propInfo);
        const propName = propInfo['name'] !== undefined && typeof propInfo['name'] === 'string' ? propInfo['name'] : propertyKey;
        let props = target.constructor[PropsInfoSymbol] || Object.defineProperty(target.constructor, PropsInfoSymbol, {
            value: {},
            enumerable: false,
            configurable: true,
            writable: true,
        })[PropsInfoSymbol];
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
                return currentData[propName] || (propInfo['defaultValue'] !== undefined ? propInfo['defaultValue'] : undefined);
            },
            enumerable: true,
            configurable: true
        };
    };
};
Model.Data = function (data, info) {
    return function (constructor) {
        var _d, _e, _f, _g;
        const storeData = Array.isArray(data) ? data : data();
        const rConstructor = (_g = class extends constructor {
                constructor() {
                    super(...arguments);
                    this[_d] = storeData;
                    this[_e] = storeData.length > 0 ? storeData[0] : null;
                    this[_f] = new eventemitter3_1.default();
                }
            },
            _d = StoredDataSymbol,
            _e = CurrentDataSymbol,
            _f = ChangeEventSymbol,
            _g);
        info && Object.defineProperty(rConstructor.prototype, InfoSymbol, {
            value: info,
            enumerable: false,
            configurable: true
        });
        return rConstructor;
    };
};
