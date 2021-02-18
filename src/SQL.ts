import {sqlEscapeString} from './SQLEscapeString';

export interface SQLValueType {
	typename: string;
	check: (value) => boolean;
	fromDatabaseValue: (value) => any;
	toDatabaseValue: (value) => any;
	key?: boolean;
}

export interface SQLValueProps {
	[keys:string]: SQLValueType;
}

export const SQLValue: SQLValueProps = {
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
		toDatabaseValue: (value) => sqlEscapeString(value)
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
		toDatabaseValue: (value) => sqlEscapeString(value instanceof Date ? value.toISOString().replace('T', ' ').replace(/\.[0-9]{3}Z/, '') : String(value))
	},
	
	Any: {
		typename: 'TEXT',
		check: (_value) => true,
		fromDatabaseValue: (value) => value,
		toDatabaseValue: (value) => sqlEscapeString(String(value))
	}
};

const toSQLValue = (...args: any[]) => {
	const sqlValues = Object.values(SQLValue);

	return args.map(value => sqlValues.find(sqlVal => sqlVal.check(value))!.toDatabaseValue(value));
}

export const SQLBuildWhere = (...args) => {
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
			$and: (val) => { return `(${typeof val == 'string' ? val : val.join(' AND ')})`},
			$or: (val) => { return `(${typeof val == 'string' ? val : val.join(' OR ')})`},
			$p: (val) => `(${val})`,
			$ref: (val) => `${["'", '"'].includes(val[0]) ? val.substring(1, val.length-1).replace(/\'\'/g, "'") : val}`
		},
		_func: {
			value: (val) => val == null || typeof val == 'number' || typeof val == 'boolean' ? `${val}`.toUpperCase() : sqlEscapeString(val),
			arrValue: (arr) => arr.map(parser._func.sqlValue),
			objValue: (obj) => Object.entries(obj).map(([key, value]) => key in parser._op ? parser._op[key](parser._func.sqlValue(value)) : `${key} ${typeof value == 'object' ? parser._func.objValue(value) : parser._op.$eq(parser._func.sqlValue(value))}`),
			sqlValue: (value) => value == null ? parser._func.value(value) : Array.isArray(value) ? parser._func.arrValue(value) : typeof(value) == 'object' ? parser._func.objValue(value) : parser._func.value(value),
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
}

export interface SQLStatement {
	queryStr: string;
}

export function SQLOrderByStr(...orderObj: (string|object)[]) {
	let desc: Array<string>=[];
	let asc: Array<string>=[];
	
	if (!orderObj.length) {
		return ` ORDER BY NULL`;
	}

	for (let i = 0; i < orderObj.length; i++) {
		if (typeof orderObj[i] === 'string') {
			desc.push(orderObj[i] as string);
		} else {
			const orderob = orderObj[i] as object;
			if ('desc' in orderob) desc = desc.concat(orderob['desc']);
			if ('asc' in orderob) asc = asc.concat(orderob['asc']);
		}
	}
	
	return ` ORDER BY ${desc.join(',')}${desc.length? (' DESC'+(asc.length?', ':'')) : ''}${asc.join(',')}${asc.length?' ASC':''}`;
}

export class SQLSelect implements SQLStatement {
	$_tableName: string[];
	$_args: string[];
	$_join: {type: string; table: string; where: object[];}[] = [];
	$_where: object[] = [];
	$_groupby: string[] = [];
	$_orderby: (string|object)[] = [];
	$_limit: number[] = [];
	
	
	constructor(tableName: string[], ...args: string[]) {
		this.$_tableName = tableName;
		this.$_args = args;
	}
	
	join(type: string, table: string, where: object[]) {
		this.$_join.push({type, table, where});
		return this;
	}
	
	where(...args: object[]): this {
		this.$_where = this.$_where.concat(args);
		return this;
	}
	
	groupby(...args: string[]): this {
		this.$_groupby = this.$_groupby.concat(args);
		return this;
	}
	
	orderby(...orderObj: (string|object)[]): this {
		this.$_orderby = this.$_orderby.concat(orderObj);
		return this;
	}
	
	limit(start, end?: number) {
		this.$_limit = [start];
		
		if (end !== undefined) {
			this.$_limit.push(end);
		}
		return this;
	}
	
	get queryStr(): string {
		let qStr = `SELECT ${this.$_args.join(',')} FROM ${this.$_tableName.join(',')}`;
		if (this.$_join.length) qStr+= this.$_join.map(({type, table, where}) => ` ${type} JOIN ${table} ON ${SQLBuildWhere(...where).$and}`).join('');
		if (this.$_where.length) qStr += ` WHERE ${SQLBuildWhere(...this.$_where).$and}`;
		if (this.$_groupby.length) qStr += ` GROUP BY ${this.$_groupby.join(',')}`;
		if (this.$_orderby.length) qStr += SQLOrderByStr(...this.$_orderby);
		if (this.$_limit.length) {
			const [start, end] = this.$_limit;
			qStr += ` LIMIT ${start}`;
			
			if (end !== undefined) qStr += ` OFFSET ${end}`;
		}
		return qStr;
	}
}

export class SQLInsert implements SQLStatement {
	#qStr = '';

	constructor(tableName: string, iObject: object|string[]) {
		let keys: string[] = [];
		let values: string[] = [];
		
		if (Array.isArray(iObject)) {
			values = iObject as string[];
		} else {
			keys = Object.keys(iObject);
			values = Object.values(iObject);
		}
		
		values = toSQLValue(...values);

		this.#qStr = `INSERT INTO ${tableName} ${keys.length ? '(' + keys.join(',') + ')' : ''} VALUES(${values.join(',')})`
	}
	
	get queryStr(): string {
		return this.#qStr;
	}
}

export class SQLUpdate implements SQLStatement {
	#qStr = '';
	
	constructor(tableName: string, data: object) {
		this.#qStr = `UPDATE ${tableName} SET ${Object.entries(data).map(([key, value]) => `${key} = ${toSQLValue(value)[0]}`).join(',')}`;
	}
	
	where(...args: object[]): this {
		this.#qStr += ` WHERE ${SQLBuildWhere(...args).$and}`;
		return this;
	}
	
	get queryStr(): string {
		return this.#qStr;
	}
}

export class SQLDelete implements SQLStatement {
	#qStr = '';
	
	constructor(tableName) {
		this.#qStr = `DELETE FROM ${tableName}`;
	}
	
	where(...args: object[]): this {
		this.#qStr += ` WHERE ${SQLBuildWhere(...args).$and}`;
		return this;
	}
	
	get queryStr(): string {
		return this.#qStr;
	}
}

export interface SQLConnection {
	query(query: string): Promise<any[]>;
}

export function SQLExecQueryStat<TBase extends {new (...args: any[]): {}}, ResultType = any>(Base: TBase, dbConn: SQLConnection|null = null, handleResult: (rows: any) => ResultType = res => res as ResultType) {
	return class ExecQuery extends Base {
		exec(this: SQLStatement): Promise<ResultType> {
			if (dbConn) {
				return dbConn.query(this.queryStr).then(handleResult);
			}
			
			return Promise.reject('Database not initialized');
		}
	};
}

export class SQLConnection {
	connection: any;
	
	select(handleResult: (rows: any) => any = res => res) {
		return SQLExecQueryStat(SQLSelect, this, handleResult);
	}
	
	insert(handleResult: (rows: any) => any = res => res) {
		return SQLExecQueryStat(SQLInsert, this, handleResult);
	}
	
	update(handleResult: (rows: any) => any = res => res) {
		return SQLExecQueryStat(SQLUpdate, this, handleResult);
	}
	
	remove(handleResult: (rows: any) => any = res => res) {
		return SQLExecQueryStat(SQLDelete, this, handleResult);
	}
}
