"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FBConnection = void 0;
const Firebird = require('firebird');
const SQL_1 = require("./SQL");
class FBSQLSelect extends SQL_1.SQLSelect {
    get queryStr() {
        let limitStr = '';
        if (this.$_limit.length) {
            const [start, end] = this.$_limit;
            limitStr += `FIRST ${start}`;
            if (end !== undefined)
                limitStr += ` SKIP ${end} `;
        }
        let qStr = `SELECT ${limitStr}${this.$_args.join(',')} FROM ${this.$_tableName.join(',')}`;
        if (this.$_join.length)
            qStr += this.$_join.map(({ type, table, where }) => ` ${type} JOIN ${table} ON ${SQL_1.SQLBuildWhere(...where).$and}`).join('');
        if (this.$_where.length)
            qStr += ` WHERE ${SQL_1.SQLBuildWhere(...this.$_where).$and}`;
        if (this.$_groupby.length)
            qStr += ` GROUP BY ${this.$_groupby.join(',')}`;
        if (this.$_orderby.length)
            qStr += SQL_1.SQLOrderByStr(...this.$_orderby);
        return qStr;
    }
}
class FBConnection extends SQL_1.SQLConnection {
    constructor(connOptions, dbOptions) {
        super();
        this.connection = Firebird.createConnection(connOptions);
        this.connection.connectSync(dbOptions.path, dbOptions.user, dbOptions.password, dbOptions.role);
    }
    query(query) {
        console.log(query);
        return new Promise((resolve, reject) => this.connection.query(query, (err, res) => {
            if (err) {
                reject(err);
                return;
            }
            let rows = [];
            res.fetch("all", true, row => rows.push(row), (err, eof) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (eof) {
                    resolve(rows);
                    return;
                }
            });
        }));
    }
    select(handleResult = res => res) {
        return SQL_1.SQLExecQueryStat(FBSQLSelect, this, handleResult);
    }
}
exports.FBConnection = FBConnection;
