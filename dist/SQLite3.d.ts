import { SQLConnection } from './SQL';
export declare class SQLiteConnection extends SQLConnection {
    connection: any;
    constructor(options: object);
    query(qStr: string): Promise<any[]>;
}
