"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteConnection = void 0;
const tslib_1 = require("tslib");
const react_native_sqlite_storage_1 = tslib_1.__importDefault(require("react-native-sqlite-storage"));
const SQL_1 = require("./SQL");
class SQLiteConnection extends SQL_1.SQLConnection {
    constructor(options) {
        super();
        this.connection = react_native_sqlite_storage_1.default.openDatabase(options, () => { }, (err) => console.log(err.message));
    }
    query(qStr) {
        let result = [];
        return new Promise((resolve, reject) => this.connection.transaction((tx) => {
            tx.executeSql(qStr, [], (_tx, results) => result = result.concat(results.rows.raw().slice(0, results.rows.length)));
        }, reject, () => resolve(result)));
    }
}
exports.SQLiteConnection = SQLiteConnection;
