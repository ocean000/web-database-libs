import {implement} from 'libs-core';
import {IRepository} from "libs-core";

let repositoryImpl = implement(IRepository);

let indexedDB = null;
let dataBases = {};
let transaction = null;

let hasDd = (dbId) => {
    return Reflect.has(dataBases, dbId) && dataBases[dbId] !== null;
};

let checkHasDB = (dbId) => {
    if (!hasDd(dbId)) {
        throw `数据库${dbId}不存在`;
    }
};

let checkOpenDb = (dbId) => {
    checkHasDB(dbId);
    let op = dataBases[dbId].open;
    if (!op) {
        throw `数据库${dbId}还没打开`;
    }
};

//比较现有字段与配置的差异，筛选出应该被删除的旧字段
let compareColumns = (olds, news) => {
    let re = [];
    for(let old of olds) {
        if(!news.includes(old)) {
            re.push(old);
        }
    }
    return re;
};

// 实现接口方法
repositoryImpl = {
    /**
     * 初始化数据库
     * @param dbId 数据库标识
     * @param options 选项
     * @return promise对象
     */
    initDb(dbId, options) {
        return new Promise((resolve, reject) => {
                if (hasDd(dbId)) {
                    resolve();
                }
                indexedDB = window.indexedDB || window.webkitIndexedDB || indexedDB || webkitIndexedDB;
                if (!indexedDB || indexedDB === null) {
                    throw '不支持indexedDB';
                }
                // This line should only be needed if it is needed to support the object's constants for older browsers
                window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"};
                if (!window.IDBTransaction || window.IDBTransaction === null) {
                    throw '不支持indexedDB事务处理';
                }
                window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
                if (!window.IDBKeyRange || window.IDBKeyRange === null) {
                    throw '不支持indexedDB范围筛选';
                }
                let request = indexedDB.open(dbId, options.version);
                request.onupgradeneeded = (event) => {
                    let db = event.target.result;
                    dataBases[dbId] = {
                        open: false,
                        db: db
                    };
                    transaction = event.target.transaction;
                    resolve({
                        isUpgrade: true,
                        oldTables: db.objectStoreNames
                    });
                };
                request.onsuccess = (event) => {
                    if (!Reflect.has(dataBases, dbId)) {
                        dataBases[dbId] = {
                            open: false,
                            db: event.target.result
                        };
                    }
                    resolve({
                        isUpgrade: false,
                        oldTables: []
                    })
                };
                request.onerror = (e) => {
                    throw e;
                };
            }
        );
    },

    /**
     * 删除数据库
     * @param dbId 数据库标识
     * @returns promise对象
     */
    deleteDb(dbId) {
        return new Promise((resolve, reject) => {
            let request = indexedDB.deleteDatabase(dbId);
            request.onsuccess = (re) => {
                Reflect.deleteProperty(dataBases, dbId);
                resolve();
            };
            request.onerror = (e) => {
                throw e;
            };
        });
    },

    /**
     * 打开数据库
     * @param dbId 数据库标识
     * @returns promise对象
     */
    open(dbId) {
        return new Promise((resolve, reject) => {
            checkHasDB(dbId);
            dataBases[dbId].open = true;
            resolve();
        });
    },

    /**
     * 关闭数据库
     * @param dbId 数据库标识
     * @returns promise对象
     */
    close(dbId) {
        return new Promise((resolve, reject) => {
            checkHasDB(dbId);
            dataBases[dbId].open = false;
            resolve();
        });
    },

    /**
     * 创建数据表
     * @param table 表名称
     * @param columns 字段对象
     * @param primaryKeys 主键数组
     * @param dbId 数据库标识
     * @returns promise对象
     */
    createTb(table, columns, primaryKeys, dbId) {
        return new Promise((resolve, reject) => {
            checkHasDB(dbId);
            let db = dataBases[dbId].db;
            if (!Array.isArray(columns) || columns.length <= 0) {
                throw `数据库${dbId}的表${table}的字段配置不存在`;
            }
            let store = null;
            if (!db.objectStoreNames.contains(table)) {
                let keys = '';
                if (Array.isArray(primaryKeys) && primaryKeys.length === 1) {
                    keys = primaryKeys[0];
                }
                else {
                    keys = primaryKeys;
                }
                store = db.createObjectStore(table, { keyPath: keys });
            }
            else if(transaction && transaction !== null) {
                store = transaction.objectStore(table);
            }
            if(!store || store === null) {
                throw `数据表${table}不存在`;
            }
            let oldCols = compareColumns(store.indexNames, columns);
            for(let col of oldCols) {
                store.deleteIndex(col);
            }
            for (let column of columns) {
                if(!store.indexNames.contains(column)) {
                    store.createIndex(column, column, {unique: false});
                }
            }
            resolve();
        });
    },

    /**
     * 删除数据表
     * @param table 表名称
     * @param dbId 数据库标识
     * @returns promise对象
     */
    deleteTb(table, dbId) {
        return new Promise((resolve, reject) => {
            checkHasDB(dbId);
            dataBases[dbId].db.deleteObjectStore(table);
            resolve();
        });
    },

    /**
     * 查询记录
     * @param columns 查询的字段
     * @param conditions 查询条件
     * @param order 排序
     * @param start 开始位置
     * @param size 获取的数量
     * @param table 表名称
     * @param dbId 数据库标识
     * @returns promise对象
     */
    select(columns, conditions, order, start, size, table, dbId) {
        return new Promise((resolve, reject) => {
            checkOpenDb(dbId);
            let re = [];
            if (transaction === null || (!Array.isArray(columns) && columns !== '*')) {
                resolve(re);
            }
            if (!start || Number.isNaN(start) || start < 0) {
                start = 0;
            }
            if (!size || Number.isNaN(size) || size <= 0) {
                size = null;
            }
            let opCursor = null;
            let objectStore = transaction.objectStore(table);
            if (conditions && conditions !== null && conditions.range !== 'like') {
                let index = objectStore.index(conditions.column);
                if (order && order !== null) {
                    opCursor = index.openCursor(conditions.range, order.direction);
                }
                else {
                    opCursor = index.openCursor(conditions.range);
                }
            }
            else {
                if (order && order !== null) {
                    let index = objectStore.index(order.column);
                    opCursor = index.openCursor(null, order.direction);
                }
                else {
                    opCursor = objectStore.openCursor();
                }
            }
            // 模糊查询的情况
            if(conditions.range === 'like') {
                opCursor.onsuccess = (event) => {
                    let cursor = event.target.result;
                    if (cursor) {
                        let obj = {};
                        let value = cursor.value;
                        if(columns !== '*') {
                            for (let key in value) {
                                if (columns.includes(key)) {
                                    obj[key] = value[key];
                                }
                            }
                        }
                        else {
                            obj = value;
                        }
                        if(Reflect.has(obj, conditions.column) && obj[conditions.column].indexOf(conditions.value) >= 0){
                            re.push(obj);
                        }
                        cursor.continue();
                    }
                    else {
                        if(size === null || Number.isNaN(size)) {
                            size = re.length - start;
                        }
                        re = re.slice(start, start + size);
                        resolve(re);
                    }
                }
            }
            else {
                let startIndex = 0;
                opCursor.onsuccess = (event) => {
                    let cursor = event.target.result;
                    if (cursor) {
                        if (start > startIndex) {
                            startIndex++;
                            cursor.continue();
                        }
                        else {
                            let obj = {};
                            let value = cursor.value;
                            if(columns !== '*') {
                                for (let key in value) {
                                    if (columns.includes(key)) {
                                        obj[key] = value[key];
                                    }
                                }
                            }
                            else {
                                obj = value;
                            }
                            re.push(obj);
                            if (size === null) {
                                cursor.continue();
                            }
                            else if (size > 1) {
                                cursor.continue();
                                size--;
                            }
                            else {
                                resolve(re);
                            }
                        }
                    }
                    else {
                        resolve(re);
                    }
                };
                opCursor.onerror = (event) => {
                    throw event.target.error;
                };
            }
        });
    },

    /**
     * 计算记录数目
     * @param conditions 查询条件
     * @param table 表名称
     * @param dbId 数据库标识
     * @returns promise对象
     */
    count(conditions, table, dbId) {
        return new Promise((resolve, reject) => {
            checkOpenDb(dbId);
            if (transaction === null) {
                resolve(0);
            }
            let countRqe = null;
            let objectStore = transaction.objectStore(table);
            if (conditions && conditions !== null) {
                let index = objectStore.index(conditions.column);
                countRqe = index.count(conditions.range);
            }
            else {
                countRqe = objectStore.count();
            }
            countRqe.onsuccess = (event) => {
                resolve(event.target.result);
            };
            countRqe.onerror = (event) => {
                resolve(0);
            };
        });
    },

    /**
     * 插入记录
     * @param columns 字段
     * @param values 字段值，顺序与columns对应
     * @param table 表名称
     * @param dbId 数据库标识
     * @returns promise对象
     */
    insert(columns, values, table, dbId) {
        return new Promise((resolve, reject) => {
            checkOpenDb(dbId);
            if (transaction === null || !Array.isArray(columns) || !Array.isArray(values)) {
                resolve(null);
            }
            if (columns.length !== values.length) {
                throw 'columns与values字段数不对应';
            }
            let objectStore = transaction.objectStore(table);
            let obj = {};
            for (let col of columns) {
                obj[col] = values[columns.indexOf(col)];
            }
            let req = objectStore.add(obj);
            req.onsuccess = (event) => {
                resolve(obj[objectStore.keyPath]);
            };
            req.onerror = (event) => {
                throw event.target.error;
            };
        });
    },

    /**
     * 更新记录
     * @param columns 字段
     * @param values 字段值，顺序与columns对应
     * @param conditions 条件
     * @param table 表名称
     * @param dbId 数据库标识
     * @returns promise对象
     */
    update(columns, values, conditions, table, dbId) {
        return new Promise((resolve, reject) => {
            checkOpenDb(dbId);
            if (transaction === null || !Array.isArray(columns) || !Array.isArray(values)) {
                resolve();
            }
            if (columns.length !== values.length) {
                throw 'columns与values字段数不对应';
            }
            let objectStore = transaction.objectStore(table);
            let obj = {};
            for (let col of columns) {
                obj[col] = values[columns.indexOf(col)];
            }
            let req = objectStore.put(obj);
            req.onsuccess = (event) => {
                resolve();
            };
            req.onerror = (event) => {
                throw event.target.error;
            };
        });
    },

    /**
     * 删除记录
     * @param conditions 条件
     * @param table 表名称
     * @param dbId 数据库标识
     * @returns promise对象
     */
    delete(conditions, table, dbId) {
        return new Promise((resolve, reject) => {
            checkOpenDb(dbId);
            if (transaction === null) {
                resolve(null);
            }
            let objectStore = transaction.objectStore(table);
            if (!conditions || conditions === null) {
                throw `缺少删除的条件`;
            }
            objectStore.get(conditions.range).onsuccess = (event) => {
                let re = event.target.result;
                if(re) {
                    let req = objectStore.delete(re[conditions.column]);
                    req.onsuccess = (ev) => {
                        resolve(re);
                    };
                    req.onerror = (event) => {
                        throw event.target.error;
                    };
                }
                else {
                    if(conditions.range.lower === conditions.range.upper) {
                        throw `id为${conditions.range.lower}的记录不存在`;
                    }
                    else {
                        throw `要删除的记录不存在`;
                    }
                }
            };
        });
    }
};

// 获取主键对应的单条数据
repositoryImpl.selectByPrimaryKey = (columns, primaryKey, table, dbId) => {
    return new Promise((resolve, reject) => {
        checkOpenDb(dbId);
        let re = null;
        if (transaction === null || (!Array.isArray(columns) && columns !== '*')) {
            resolve(re);
        }
        let objectStore = transaction.objectStore(table);
        let req = objectStore.get(primaryKey);
        req.onsuccess = (event) => {
            let data = event.target.result;
            if(columns !== '*') {
                re = {};
                for (let key in data) {
                    if (columns.includes(key)) {
                        re[key] = data[key];
                    }
                }
            }
            else {
                re = data;
            }
            resolve(re);
        };
        req.onerror = (event) => {
            throw event.target.error;
        };
    });
};

//比较现有表与配置的差异，筛选出应该被删除的旧表
repositoryImpl.compareTables = (olds, news) => {
    let re = [];
    for(let old of olds) {
        if(!news.includes(old)) {
            re.push(old);
        }
    }
    return re;
};

// 获取数据库
repositoryImpl.getDatabase = (dbId) => {
    return dataBases[dbId].db;
};

// 非接口方法，设置事务对象
repositoryImpl.setTransaction = (tran) => {
    transaction = tran;
};

export default repositoryImpl;