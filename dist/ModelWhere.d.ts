declare const WhereInfoSymbol: unique symbol;
declare const PropInfoSymbol: unique symbol;
declare const QuerySymbol: unique symbol;
export declare class ModelWhere {
    static [WhereInfoSymbol]: {
        props: {
            [key: string]: any;
        };
    };
    static [PropInfoSymbol]: {
        [key: string]: any;
    };
    [QuerySymbol]: {
        [key: string]: any;
    };
    static AllFields: (this: typeof ModelWhere, currentWhere: ModelWhere, op: string) => {
        [x: string]: any[];
    };
    static Class: (options?: {
        [key: string]: any;
    }) => <T extends new (...args: any[]) => ModelWhere>(constructor: T) => {
        new (...args: any[]): {
            [QuerySymbol]: {
                [key: string]: any;
            };
        };
        [WhereInfoSymbol]: {
            props: {
                [key: string]: any;
            };
        };
    } & T;
    static AndOr: (opName: string, ...fields: string[]) => (target: Object, propertyKey: string) => any;
    static And: (...args: string[]) => (target: Object, propertyKey: string) => any;
    static Or: (...args: string[]) => (target: Object, propertyKey: string) => any;
    static Op: (opName: string) => (target: Object, propertyKey: string) => any;
    static Btw: (target: Object, propertyKey: string) => any;
    static In: (target: Object, propertyKey: string) => any;
    static Like: (target: Object, propertyKey: string) => any;
    static Eq: (target: Object, propertyKey: string) => any;
    static Ne: (target: Object, propertyKey: string) => any;
    static Gt: (target: Object, propertyKey: string) => any;
    static Lt: (target: Object, propertyKey: string) => any;
    static Ge: (target: Object, propertyKey: string) => any;
    static Le: (target: Object, propertyKey: string) => any;
    static Ref: (target: Object, propertyKey: string) => any;
    static Replace: (repStr: string) => (target: Object, propertyKey: string) => any;
    static Query: (target: Object, propertyKey: string) => any;
    static query: (modelWhere: ModelWhere) => {
        [key: string]: any;
    };
}
export {};
