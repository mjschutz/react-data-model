import { Model } from './Model';
import { SQLConnection, SQLSelect } from './SQL';
interface ModelTableProps {
    tableName?: string[];
    dbConn?: SQLConnection;
    model?: typeof Model;
    appendData?: boolean;
    ignoreStaticFields?: boolean;
}
export declare function SQLModel<ModelType extends Model>(model: ModelType, options?: ModelTableProps): {
    insert: () => any;
    select: (selectAsTable?: SQLSelect | undefined, removePropName?: boolean) => any;
    update: () => any;
    remove: () => any;
};
export {};
