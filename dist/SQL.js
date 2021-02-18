"use strict";
var _qStr, _qStr_1, _qStr_2;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLConnection = exports.SQLExecQueryStat = exports.SQLDelete = exports.SQLUpdate = exports.SQLInsert = exports.SQLSelect = exports.SQLOrderByStr = exports.SQLBuildWhere = exports.SQLValue = void 0;
const tslib_1 = require("tslib");
const SQLEscapeString_1 = require("./SQLEscapeString");
exports.SQLValue = {
    Real: {
        typename: 'REAL',
        check: (value) => typeof value == 'number',
        fromDatabaseValue: (value) => value === null ? null : Number(value),
        toDatabaseValue: (value) => Number(value)
    },
    Integer: {
        typename: 'INTEGER',
        check: (value) => typeof value == 'number' && Number.isInteger(value),
        fromDatabaseValue: (value) => value === null ? null : typeof value == 'string' ? parseInt(value) : Number(value),
        toDatabaseValue: (value) => typeof value == 'string' ? parseInt(value) : Number(value)
    },
    Null: {
        typename: 'NULL',
        check: (value) => value == null,
        fromDatabaseValue: (_value) => null,
        toDatabaseValue: (_value) => 'NULL'
    },
    Text: {
        typename: 'TEXT',
        check: (value) => typeof value === 'string' || value instanceof String,
        fromDatabaseValue: (value) => value,
        toDatabaseValue: (value) => SQLEscapeString_1.sqlEscapeString(value)
    },
    Boolean: {
        typename: 'BOOLEAN',
        check: (value) => typeof value === 'boolean',
        fromDatabaseValue: (value) => value,
        toDatabaseValue: (value) => value === false || value == 'false' ? false : true === value || value == 'true' || value != null || value != undefined
    },
    Date: {
        typename: 'DATE',
        check: (value) => typeof value == 'string' || value instanceof Date,
        fromDatabaseValue: (value) => value === null ? null : (value instanceof Date ? value : new Date(value)),
        toDatabaseValue: (value) => SQLEscapeString_1.sqlEscapeString(value instanceof Date ? value.toISOString().replace('T', ' ').replace(/\.[0-9]{3}Z/, '') : String(value))
    },
    Any: {
        typename: 'TEXT',
        check: (_value) => true,
        fromDatabaseValue: (value) => value,
        toDatabaseValue: (value) => SQLEscapeString_1.sqlEscapeString(String(value))
    }
};
const toSQLValue = (...args) => {
    const sqlValues = Object.values(exports.SQLValue);
    return args.map(value => sqlValues.find(sqlVal => sqlVal.check(value)).toDatabaseValue(value));
};
const SQLBuildWhere = (...args) => {
    const parser = {
        _op: {
            $btw: (val) => `BETWEEN ${val.join(' AND ')}`,
            $in: (val) => `IN (${val.join(',')})`,
            $notin: (val) => `NOT IN (${val.join(',')})`,
            $like: (val) => `LIKE ${val}`,
            $eq: (val) => `${val === 'NULL' ? 'IS' : '='} ${val}`,
            $ne: (val) => `${val === 'NULL' ? 'IS NOT' : '<>'} ${val}`,
            $gt: (val) => `> ${val}`,
            $lt: (val) => `< ${val}`,
            $ge: (val) => `>= ${val}`,
            $le: (val) => `<= ${val}`,
            $and: (val) => { return `(${typeof val == 'string' ? val : val.join(' AND ')})`; },
            $or: (val) => { return `(${typeof val == 'string' ? val : val.join(' OR ')})`; },
            $p: (val) => `(${val})`,
            $ref: (val) => `${["'", '"'].includes(val[0]) ? val.substring(1, val.length - 1).replace(/\'\'/g, "'") : val}`
        },
        _func: {
            value: (val) => val == null || typeof val == 'number' || typeof val == 'boolean' ? `${val}`.toUpperCase() : SQLEscapeString_1.sqlEscapeString(val),
            arrValue: (arr) => arr.map(parser._func.sqlValue),
            objValue: (obj) => Object.entries(obj).map(([key, value]) => key in parser._op ? parser._op[key](parser._func.sqlValue(value)) : `${key} ${typeof value == 'object' ? parser._func.objValue(value) : parser._op.$eq(parser._func.sqlValue(value))}`),
            sqlValue: (value) => value == null ? parser._func.value(value) : Array.isArray(value) ? parser._func.arrValue(value) : typeof (value) == 'object' ? parser._func.objValue(value) : parser._func.value(value),
        }
    };
    const value = parser._func.sqlValue(args);
    Object.defineProperty(value, "$and", {
        get() { return value.map((val) => parser._op.$and(val)).join(' AND '); }
    });
    Object.defineProperty(value, "$or", {
        get() { return value.map((val) => parser._op.$or(val)).join(' OR '); }
    });
    return value;
};
exports.SQLBuildWhere = SQLBuildWhere;
function SQLOrderByStr(...orderObj) {
    let desc = [];
    let asc = [];
    if (!orderObj.length) {
        return ` ORDER BY NULL`;
    }
    for (let i = 0; i < orderObj.length; i++) {
        if (typeof orderObj[i] === 'string') {
            desc.push(orderObj[i]);
        }
        else {
            const orderob = orderObj[i];
            if ('desc' in orderob)
                desc = desc.concat(orderob['desc']);
            if ('asc' in orderob)
                asc = asc.concat(orderob['asc']);
        }
    }
    return ` ORDER BY ${desc.join(',')}${desc.length ? (' DESC' + (asc.length ? ', ' : '')) : ''}${asc.join(',')}${asc.length ? ' ASC' : ''}`;
}
exports.SQLOrderByStr = SQLOrderByStr;
class SQLSelect {
    constructor(tableName, ...args) {
        this.$_join = [];
        this.$_where = [];
        this.$_groupby = [];
        this.$_orderby = [];
        this.$_limit = [];
        this.$_tableName = tableName;
        this.$_args = args;
    }
    join(type, table, where) {
        this.$_join.push({ type, table, where });
        return this;
    }
    where(...args) {
        this.$_where = this.$_where.concat(args);
        return this;
    }
    groupby(...args) {
        this.$_groupby = this.$_groupby.concat(args);
        return this;
    }
    orderby(...orderObj) {
        this.$_orderby = this.$_orderby.concat(orderObj);
        return this;
    }
    limit(start, end) {
        this.$_limit = [start];
        if (end !== undefined) {
            this.$_limit.push(end);
        }
        return this;
    }
    get queryStr() {
        let qStr = `SELECT ${this.$_args.join(',')} FROM ${this.$_tableName.join(',')}`;
        if (this.$_join.length)
            qStr += this.$_join.map(({ type, table, where }) => ` ${type} JOIN ${table} ON ${exports.SQLBuildWhere(...where).$and}`).join('');
        if (this.$_where.length)
            qStr += ` WHERE ${exports.SQLBuildWhere(...this.$_where).$and}`;
        if (this.$_groupby.length)
            qStr += ` GROUP BY ${this.$_groupby.join(',')}`;
        if (this.$_orderby.length)
            qStr += SQLOrderByStr(...this.$_orderby);
        if (this.$_limit.length) {
            const [start, end] = this.$_limit;
            qStr += ` LIMIT ${start}`;
            if (end !== undefined)
                qStr += ` OFFSET ${end}`;
        }
        return qStr;
    }
}
exports.SQLSelect = SQLSelect;
class SQLInsert {
    constructor(tableName, iObject) {
        _qStr.set(this, '');
        let keys = [];
        let values = [];
        if (Array.isArray(iObject)) {
            values = iObject;
        }
        else {
            keys = Object.keys(iObject);
            values = Object.values(iObject);
        }
        values = toSQLValue(...values);
        tslib_1.__classPrivateFieldSet(this, _qStr, `INSERT INTO ${tableName} ${keys.length ? '(' + keys.join(',') + ')' : ''} VALUES(${values.join(',')})`);
    }
    get queryStr() {
        return tslib_1.__classPrivateFieldGet(this, _qStr);
    }
}
exports.SQLInsert = SQLInsert;
_qStr = new WeakMap();
class SQLUpdate {
    constructor(tableName, data) {
        _qStr_1.set(this, '');
        tslib_1.__classPrivateFieldSet(this, _qStr_1, `UPDATE ${tableName} SET ${Object.entries(data).map(([key, value]) => `${key} = ${toSQLValue(value)[0]}`).join(',')}`);
    }
    where(...args) {
        tslib_1.__classPrivateFieldSet(this, _qStr_1, tslib_1.__classPrivateFieldGet(this, _qStr_1) + ` WHERE ${exports.SQLBuildWhere(...args).$and}`);
        return this;
    }
    get queryStr() {
        return tslib_1.__classPrivateFieldGet(this, _qStr_1);
    }
}
exports.SQLUpdate = SQLUpdate;
_qStr_1 = new WeakMap();
class SQLDelete {
    constructor(tableName) {
        _qStr_2.set(this, '');
        tslib_1.__classPrivateFieldSet(this, _qStr_2, `DELETE FROM ${tableName}`);
    }
    where(...args) {
        tslib_1.__classPrivateFieldSet(this, _qStr_2, tslib_1.__classPrivateFieldGet(this, _qStr_2) + ` WHERE ${exports.SQLBuildWhere(...args).$and}`);
        return this;
    }
    get queryStr() {
        return tslib_1.__classPrivateFieldGet(this, _qStr_2);
    }
}
exports.SQLDelete = SQLDelete;
_qStr_2 = new WeakMap();
function SQLExecQueryStat(Base, dbConn = null, handleResult = res => res) {
    return class ExecQuery extends Base {
        exec() {
            if (dbConn) {
                return dbConn.query(this.queryStr).then(handleResult);
            }
            return Promise.reject('Database not initialized');
        }
    };
}
exports.SQLExecQueryStat = SQLExecQueryStat;
class SQLConnection {
    select(handleResult = res => res) {
        return SQLExecQueryStat(SQLSelect, this, handleResult);
    }
    insert(handleResult = res => res) {
        return SQLExecQueryStat(SQLInsert, this, handleResult);
    }
    update(handleResult = res => res) {
        return SQLExecQueryStat(SQLUpdate, this, handleResult);
    }
    remove(handleResult = res => res) {
        return SQLExecQueryStat(SQLDelete, this, handleResult);
    }
}
exports.SQLConnection = SQLConnection;
