import factory from './factory';
import { baseDao } from './implements/daos/index';

let reObj = factory.getObject('indexedDB', 'persistence.repositories');
let selectOrder = reObj.order;
let selectCondition = reObj.condition;
let repositoryImpl = reObj.repositoryImpl;
let transactionImpl = reObj.transactionImpl;
let actionType = reObj.action;

// 初始化数据库
let initDatabase = () => {
    let dbObj = factory.getObject('indexedDB', 'persistence.database');
    for(let db of dbObj) {
        repositoryImpl.initDb(db.name, { version: db.version }).then(({ isUpgrade, oldTables }) => {
            if(isUpgrade) {
                let tables = db.tables;
                if (!tables || tables === null || tables.length <= 0) {
                    throw  `数据库${db.name}没有关于数据表的配置`;
                }
                let olds = repositoryImpl.compareTables(oldTables, tables.map(n => n.name));
                for (let old of olds) {
                    repositoryImpl.deleteTb(old, db.name);
                }
                for (let table of tables) {
                    if(!table.columns.includes(table.primaryKey)) {
                        table.columns.push(table.primaryKey);
                    }
                    repositoryImpl.createTb(table.name, table.columns, table.primaryKey, db.name);
                }
            }
            repositoryImpl.open(db.name);
        });
    }
};

// 获取dao
let dao = (id) => {
    return factory.getObject(id, 'persistence.dao');
};

export {
    factory,
    initDatabase,
    selectOrder,
    selectCondition,
    repositoryImpl,
    transactionImpl,
    actionType,
    baseDao,
    dao
};

export {
    IRepository,
    ITransaction
} from 'libs-core';

export * from './decorators';