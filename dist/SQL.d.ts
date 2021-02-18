export interface SQLValueType {
    typename: string;
    check: (value: any) => boolean;
    fromDatabaseValue: (value: any) => any;
    toDatabaseValue: (value: any) => any;
    key?: boolean;
}
export interface SQLValueProps {
    [keys: string]: SQLValueType;
}
export declare const SQLValue: SQLValueProps;
export declare const SQLBuildWhere: (...args: any[]) => any;
export interface SQLStatement {
    queryStr: string;
}
export declare function SQLOrderByStr(...orderObj: (string | object)[]): string;
export declare class SQLSelect implements SQLStatement {
    $_tableName: string[];
    $_args: string[];
    $_join: {
        type: string;
        table: string;
        where: object[];
    }[];
    $_where: object[];
    $_groupby: string[];
    $_orderby: (string | object)[];
    $_limit: number[];
    constructor(tableName: string[], ...args: string[]);
    join(type: string, table: string, where: object[]): this;
    where(...args: object[]): this;
    groupby(...args: string[]): this;
    orderby(...orderObj: (string | object)[]): this;
    limit(start: any, end?: number): this;
    get queryStr(): string;
}
export declare class SQLInsert implements SQLStatement {
    #private;
    constructor(tableName: string, iObject: object | string[]);
    get queryStr(): string;
}
export declare class SQLUpdate implements SQLStatement {
    #private;
    constructor(tableName: string, data: object);
    where(...args: object[]): this;
    get queryStr(): string;
}
export declare class SQLDelete implements SQLStatement {
    #private;
    constructor(tableName: any);
    where(...args: object[]): this;
    get queryStr(): string;
}
export interface SQLConnection {
    query(query: string): Promise<any[]>;
}
export declare function SQLExecQueryStat<TBase extends {
    new (...args: any[]): {};
}, ResultType = any>(Base: TBase, dbConn?: SQLConnection | null, handleResult?: (rows: any) => ResultType): {
    new (...args: any[]): {
        exec(this: SQLStatement): Promise<ResultType>;
    };
} & TBase;
export declare class SQLConnection {
    connection: any;
    select(handleResult?: (rows: any) => any): {
        new (...args: any[]): {
            exec(this: SQLStatement): Promise<any>;
        };
    } & typeof SQLSelect;
    insert(handleResult?: (rows: any) => any): {
        new (...args: any[]): {
            exec(this: SQLStatement): Promise<any>;
        };
    } & typeof SQLInsert;
    update(handleResult?: (rows: any) => any): {
        new (...args: any[]): {
            exec(this: SQLStatement): Promise<any>;
        };
    } & typeof SQLUpdate;
    remove(handleResult?: (rows: any) => any): {
        new (...args: any[]): {
            exec(this: SQLStatement): Promise<any>;
        };
    } & typeof SQLDelete;
}
