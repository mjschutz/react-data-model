"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLModel = void 0;
const Model_1 = require("./Model");
const ModelWhere_1 = require("./ModelWhere");
function SQLModel(model, options) {
    let infoOpt = model[Model_1.Model.InfoData];
    if (options) {
        const info = {};
        if ('dbConn' in options)
            info['dbConn'] = options.dbConn;
        if ('tableName' in options)
            info['table'] = options.tableName;
        if ('appendData' in options)
            info['appendData'] = options.appendData;
        if ('ignoreStaticFields' in options)
            info['ignoreStaticFields'] = options.ignoreStaticFields;
        const value = Object.assign({}, 'model' in options && options.model['prototype'][Model_1.Model.InfoData] ? options.model['prototype'][Model_1.Model.InfoData] :
            model[Model_1.Model.InfoData] ? model[Model_1.Model.InfoData] : {}, info);
        infoOpt = value;
    }
    return {
        insert: () => {
            const { dbConn, table } = infoOpt;
            const currentData = model[Model_1.Model.CurrentData];
            const InsertExecStat = dbConn.insert();
            return new InsertExecStat(table[0], currentData);
        },
        select: (selectAsTable, removePropName = false) => {
            const { dbConn, table, appendData, ignoreStaticFields } = infoOpt;
            const props = model.constructor[Model_1.Model.PropsInfo];
            const SelectExecStat = dbConn.select((res) => {
                const data = model[Model_1.Model.StoredData];
                if (!appendData) {
                    data.length = 0;
                }
                model[Model_1.Model.StoredData] = res.length > 0 ? data.concat(res) : [];
                model[Model_1.Model.ChangeEvent].emit('data_change');
                return model;
            });
            const selectExec = new SelectExecStat(selectAsTable ? [`(${selectAsTable.queryStr}) AS tmpTable`] : table, ...(Object.values(props).map(({ name, selectName }) => selectName !== undefined && !removePropName ? selectName : name)));
            if (!ignoreStaticFields) {
                const dataModel = model.constructor;
                if ('join' in dataModel) {
                    dataModel['join'].forEach(({ type, table, where }) => selectExec.join(type, table, [where instanceof ModelWhere_1.ModelWhere ? where[ModelWhere_1.ModelWhere.ControlSymbol].query() : where]));
                }
                if ('where' in dataModel && (dataModel['where'] instanceof ModelWhere_1.ModelWhere)) {
                    selectExec.where(dataModel['where'][ModelWhere_1.ModelWhere.ControlSymbol].query());
                }
                if ('groupby' in dataModel) {
                    selectExec.groupby(...dataModel['groupby']);
                }
            }
            return selectExec;
        },
        update: () => {
            const { dbConn, table } = infoOpt;
            const currentData = model[Model_1.Model.CurrentData];
            const UpdateExecStat = dbConn.update();
            return new UpdateExecStat(table[0], currentData);
        },
        remove: () => {
            const { dbConn, table } = infoOpt;
            const DeleteExecStat = dbConn.remove();
            return new DeleteExecStat(table[0]);
        }
    };
}
exports.SQLModel = SQLModel;
