import SQLite from 'react-native-sqlite-storage';
import {SQLConnection, SQLExecQueryStat} from './SQL';

export class SQLiteConnection extends SQLConnection {
	connection: any;
	
	constructor(options: object) {
		super();

		this.connection = SQLite.openDatabase(options, () => {},(err) => console.log(err.message));
	}

	query(qStr: string): Promise<any[]> {
		let result: any[] = [];
		return new Promise((resolve, reject) => this.connection.transaction((tx) => {
			//console.log(qStr);
			tx.executeSql(
				qStr,
				[],
				(_tx, results) => result = result.concat(results.rows.raw().slice(0,results.rows.length))
			);
		}, reject, () => resolve(result)));
	}
}
