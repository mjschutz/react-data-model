"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelWhere = void 0;
const WhereInfoSymbol = Symbol('WhereInfoSymbol');
const PropInfoSymbol = Symbol('WherePropInfoSymbol');
const QuerySymbol = Symbol('QuerySymbol');
class ModelWhere {
    constructor() {
        this[_c] = ModelWhere.AllFields.call(this.constructor, this, 'and');
    }
}
exports.ModelWhere = ModelWhere;
_a = WhereInfoSymbol, _b = PropInfoSymbol, _c = QuerySymbol;
ModelWhere[_a] = { props: {} };
ModelWhere[_b] = {};
ModelWhere.AllFields = function (currentWhere, op) {
    const currentClass = this;
    return ({
        [`$${op}`]: Object.values(currentClass[PropInfoSymbol]).map(value => value.objBuilder(currentWhere))
    });
};
ModelWhere.Class = function (options = {}) {
    let { op } = options;
    op = op || 'and';
    return function (constructor) {
        var _d, _e, _f;
        return _f = class ModelClass extends constructor {
                constructor() {
                    super(...arguments);
                    this[_e] = ModelWhere.AllFields.call(this.constructor, this, op);
                }
            },
            _d = WhereInfoSymbol,
            _e = QuerySymbol,
            _f[_d] = { props: {} },
            _f;
    };
};
ModelWhere.AndOr = (opName, ...fields) => {
    return function (target, propertyKey) {
        const currentClass = target.constructor;
        const WhereInfo = currentClass[PropInfoSymbol];
        const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
        const objBuilder = prop.objBuilder;
        prop.objBuilder = fields.length === 0 ?
            (modelWhere) => (objBuilder(modelWhere)) :
            (modelWhere) => ({
                get [`$${opName}`]() {
                    const obj = objBuilder(modelWhere);
                    return fields.map((key) => ({ [key]: obj[propertyKey] }));
                }
            });
        return {
            set: function (val) {
                prop.valueMap.set(this, val);
            },
            get: function () {
                return prop.valueMap.get(this);
            },
            enumerable: true,
            configurable: true
        };
    };
};
ModelWhere.And = ModelWhere.AndOr.bind(ModelWhere, 'and');
ModelWhere.Or = ModelWhere.AndOr.bind(ModelWhere, 'or');
ModelWhere.Op = (opName) => {
    return function (target, propertyKey) {
        const WhereInfo = Object.getPrototypeOf(target.constructor)[PropInfoSymbol] !== target.constructor[PropInfoSymbol] ?
            target.constructor[PropInfoSymbol] : (target.constructor[PropInfoSymbol] = {});
        const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
        const objBuilder = prop.objBuilder;
        prop.objBuilder = objBuilder === null ? (modelWhere) => ({ [propertyKey]: {
                get [`$${opName}`]() {
                    return prop.valueMap.get(modelWhere);
                }
            } }) : (modelWhere) => {
            const obj = objBuilder(modelWhere);
            return ({ [propertyKey]: {
                    get [`$${opName}`]() { return obj[propertyKey]; }
                } });
        };
        return {
            set: function (val) {
                prop.valueMap.set(this, val);
            },
            get: function () {
                return prop.valueMap.get(this);
            },
            enumerable: true,
            configurable: true
        };
    };
};
ModelWhere.Btw = ModelWhere.Op('btw');
ModelWhere.In = ModelWhere.Op('in');
ModelWhere.Like = ModelWhere.Op('like');
ModelWhere.Eq = ModelWhere.Op('eq');
ModelWhere.Ne = ModelWhere.Op('ne');
ModelWhere.Gt = ModelWhere.Op('gt');
ModelWhere.Lt = ModelWhere.Op('lt');
ModelWhere.Ge = ModelWhere.Op('ge');
ModelWhere.Le = ModelWhere.Op('le');
ModelWhere.Ref = ModelWhere.Op('ref');
ModelWhere.Replace = function (repStr) {
    return function (target, propertyKey) {
        const WhereInfo = Object.getPrototypeOf(target.constructor)[PropInfoSymbol] !== target.constructor[PropInfoSymbol] ?
            target.constructor[PropInfoSymbol] : (target.constructor[PropInfoSymbol] = {});
        const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
        const objBuilder = prop.objBuilder;
        if (objBuilder === null) {
            prop.objBuilder = (modelWhere) => ({ [propertyKey]: repStr.replace(/{value}/g, prop.valueMap.get(modelWhere)) });
        }
        return {
            set: function (val) {
                prop.valueMap.set(this, val);
            },
            get: function () {
                return prop.valueMap.get(this);
            },
            enumerable: true,
            configurable: true
        };
    };
};
ModelWhere.Query = function (target, propertyKey) {
    const WhereInfo = Object.getPrototypeOf(target.constructor)[PropInfoSymbol] !== target.constructor[PropInfoSymbol] ?
        target.constructor[PropInfoSymbol] : (target.constructor[PropInfoSymbol] = {});
    const prop = WhereInfo[propertyKey] || (WhereInfo[propertyKey] = { objBuilder: null, valueMap: new WeakMap() });
    const objBuilder = prop.objBuilder;
    if (objBuilder === null) {
        prop.objBuilder = (modelWhere) => prop.valueMap.get(modelWhere) ? prop.valueMap.get(modelWhere)[QuerySymbol] : {};
    }
    return {
        set: function (val) {
            prop.valueMap.set(this, val);
        },
        get: function () {
            return prop.valueMap.get(this);
        },
        enumerable: true,
        configurable: true
    };
};
ModelWhere.query = function (modelWhere) {
    return modelWhere[QuerySymbol];
};
