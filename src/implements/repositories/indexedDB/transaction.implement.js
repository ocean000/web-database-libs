import {implement} from 'libs-core';
import {ITransaction} from "libs-core";
import repositoryImpl from './repository.implement';
import actionType from './actionType';

let transactionImpl = implement(ITransaction);

// 数据库对象
let database = null;

// 事务对象
let transaction = null;

transactionImpl = {
    /**
     * 开始事务
     * @param db 数据库对象
     * @param options 选项
     */
    start(db, options) {
        let tables = options.tables;
        if (!tables || tables === null || !Array.isArray(tables) || tables.length <= 0) {
            throw '事务启动失败';
        }
        database = repositoryImpl.getDatabase(db);
        transaction = database.transaction(tables, "readwrite");
        transaction.onerror = (event) => {
            transaction.abort();
        };
        repositoryImpl.setTransaction(transaction);
    },

    /**
     * 执行事务
     * @param table 表名称
     * @param action 事务操作，一般为数据库的增删查改
     * @param params 操作参数
     * @returns promise 执行结果
     */
    execute(table, action, params) {
        try {
            switch (action) {
                case actionType.select:
                    if(!Reflect.has(params, 'start')) {
                        params['start'] = 0;
                    }
                    if(!Reflect.has(params, 'size')) {
                        params['size'] = null;
                    }
                    return repositoryImpl.select(params.columns, params.conditions, params.order, params.start, params.size, table, database.name);
                    break;
                case actionType.selectByPrimaryKey:
                    return repositoryImpl.selectByPrimaryKey(params.columns, params.primaryKey, table, database.name);
                    break;
                case actionType.count:
                    return repositoryImpl.count(params.conditions, table, database.name);
                    break;
                case actionType.add:
                    return repositoryImpl.insert(params.columns, params.values, table, database.name);
                    break;
                case actionType.update:
                    return repositoryImpl.update(params.columns, params.values, params.conditions, table, database.name);
                    break;
                case actionType.delete:
                    return repositoryImpl.delete(params.conditions, table, database.name);
                    break;
            }
        }
        catch(e) {
            transaction.abort();
            throw e;
        }
    },

    /**
     * 提交事务
     * @param params 操作参数
     * @returns promise 提交结果
     */
    commit(params) {
        return new Promise((resolve, reject) => {

        });
    }
};

transactionImpl.throwExcep = (err) => {
    transaction.abort();
    throw err;
};

transactionImpl.getDatabase = () => {
    return database.name;
};

export default transactionImpl;