import EventEmitter from 'eventemitter3';
declare type Constructor<T = {}> = {
    new (...args: any[]): T;
};
declare const StoredDataSymbol: unique symbol;
declare const CurrentDataSymbol: unique symbol;
declare const ChangeEventSymbol: unique symbol;
export declare class Model {
    static InfoData: symbol;
    static StoredData: symbol;
    static CurrentData: symbol;
    static ChangeEvent: symbol;
    static PropsInfo: symbol;
    [StoredDataSymbol]: object[];
    [CurrentDataSymbol]: object | null;
    [ChangeEventSymbol]: EventEmitter;
    [Symbol.iterator](): Generator<any, void, number | undefined>;
    static Prop: (propInfo?: object) => any;
    static Data: (data: any[] | ((filter?: object | undefined) => any[]), info?: object | undefined) => <T extends Constructor<{}>>(constructor: T) => {
        new (...args: any[]): {
            [StoredDataSymbol]: object[];
            [CurrentDataSymbol]: object | null;
            [ChangeEventSymbol]: EventEmitter;
        };
    } & T;
}
export {};
