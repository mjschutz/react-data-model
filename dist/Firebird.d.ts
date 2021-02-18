import { SQLConnection } from './SQL';
export interface FBDBOptions {
    path: string;
    user: string;
    password: string;
    role: string;
}
export declare class FBConnection extends SQLConnection {
    connection: any;
    constructor(connOptions: any, dbOptions: FBDBOptions);
    query(query: string): Promise<Array<any>>;
    select(handleResult?: (rows: any) => any): any;
}
