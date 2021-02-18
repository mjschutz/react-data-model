const Firebird = require('firebird');
import {SQLConnection, SQLExecQueryStat, SQLSelect, SQLOrderByStr, SQLBuildWhere} from './SQL';

export interface FBDBOptions {
	path: string;
	user: string;
	password: string;
	role: string;
}

class FBSQLSelect extends SQLSelect {
	get queryStr(): string {
		let limitStr = '';
		if (this.$_limit.length) {
			const [start, end] = this.$_limit;
			limitStr += `FIRST ${start}`;
			
			if (end !== undefined) limitStr += ` SKIP ${end} `;
		}
		
		let qStr = `SELECT ${limitStr}${this.$_args.join(',')} FROM ${this.$_tableName.join(',')}`;
		if (this.$_join.length) qStr+= this.$_join.map(({type, table, where}) => ` ${type} JOIN ${table} ON ${SQLBuildWhere(...where).$and}`).join('');
		if (this.$_where.length) qStr += ` WHERE ${SQLBuildWhere(...this.$_where).$and}`;
		if (this.$_groupby.length) qStr += ` GROUP BY ${this.$_groupby.join(',')}`;
		if (this.$_orderby.length) qStr += SQLOrderByStr(...this.$_orderby);
		return qStr;
	}
}

export class FBConnection extends SQLConnection {
	connection: any;
	
	constructor(connOptions: any, dbOptions: FBDBOptions) {
		super();
		
		this.connection = Firebird.createConnection(connOptions);
		this.connection.connectSync(dbOptions.path, dbOptions.user, dbOptions.password, dbOptions.role);
	}
	
	query(query: string): Promise<Array<any>> {
		console.log(query);
	  return new Promise ((resolve, reject) =>
			this.connection.query(
				query,
				(err, res) => {
					if (err) {
						reject(err);
						return;
					}
					
					let rows: Array<any> = [];
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
				}
			)
		);
	}
	
	select(handleResult: (rows: any) => any = res => res) {
		return SQLExecQueryStat(FBSQLSelect, this, handleResult);
	}
}
