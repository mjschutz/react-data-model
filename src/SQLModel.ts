import {Model} from './Model';
import {ModelWhere} from './ModelWhere';
import {
	SQLConnection,
	SQLValue,
	SQLValueType,
	SQLValueProps,
	SQLStatement,
	SQLOrderByStr,
	SQLSelect,
	SQLInsert,
	SQLUpdate,
	SQLDelete,
} from './SQL';

interface ModelTableProps {
	tableName?: string[];
	dbConn?: SQLConnection;
	model?: typeof Model;
	appendData?: boolean;
	ignoreStaticFields?: boolean;
}

export function SQLModel<ModelType extends Model>(model: ModelType, options?: ModelTableProps) {
	let infoOpt = model[Model.InfoData];
	
	if (options) {
		const info: object = {};
		
		if ('dbConn' in options)
			info['dbConn'] = options.dbConn;
		
		if ('tableName' in options)
			info['table'] = options.tableName;
		
		if ('appendData' in options)
			info['appendData'] = options.appendData;
			
		if ('ignoreStaticFields' in options)
			info['ignoreStaticFields'] = options.ignoreStaticFields;
		
		const value = Object.assign({},
			'model' in options && options.model!['prototype'][Model.InfoData] ? options.model!['prototype'][Model.InfoData] :
			model[Model.InfoData] ? model[Model.InfoData] : {},
			info
		);
		
		infoOpt = value;
	}
	
	return {
		insert: () => {
			const {dbConn, table} = infoOpt;
			const currentData = model[Model.CurrentData];
			const InsertExecStat = dbConn.insert();
			
			return new InsertExecStat(table[0], currentData);
		},
		
		select: (selectAsTable?: SQLSelect, removePropName: boolean = false) => {
			const {dbConn, table, appendData, ignoreStaticFields} = infoOpt;
			const props = model.constructor[Model.PropsInfo];
			const SelectExecStat = dbConn.select((res: any[]) => {
				const data = model[Model.StoredData];

				if (!appendData) {
					data.length = 0;
				}

				model[Model.StoredData] = res.length > 0 ? data.concat(res) : [];
				model[Model.ChangeEvent].emit('data_change');
				return model; 
			});
			
			const selectExec = new SelectExecStat(selectAsTable? [`(${selectAsTable.queryStr}) AS tmpTable`] : table, ...(Object.values(props as {name:string; selectName: string;}[]).map(({name, selectName}) => selectName !== undefined && !removePropName? selectName : name)));
			
			if (!ignoreStaticFields) {
				const dataModel: typeof Model = model.constructor as typeof Model;
				
				if ('join' in dataModel) {
					(dataModel['join'] as ({type: string; table: string; where: ModelWhere|object;}[])).forEach(({type, table, where}) => selectExec.join(type, table, [where instanceof ModelWhere ? where[ModelWhere.ControlSymbol].query() : where]));
				}
				
				if ('where' in dataModel && (dataModel['where'] as any instanceof ModelWhere)) {
					selectExec.where((dataModel['where'] as ModelWhere)[ModelWhere.ControlSymbol].query());
				}
				
				if ('groupby' in dataModel) {
					selectExec.groupby(...(dataModel['groupby'] as string[]));
				}
			}
			
			return selectExec;
		},
		
		update: () => {
			const {dbConn, table} = infoOpt;
			const currentData = model[Model.CurrentData];
			const UpdateExecStat = dbConn.update();
			return new UpdateExecStat(table[0], currentData);
		},
		
		remove: () => {
			const {dbConn, table} = infoOpt;
			const DeleteExecStat = dbConn.remove();
			return new DeleteExecStat(table[0]);
		}
	};
}