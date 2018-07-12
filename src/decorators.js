import factory from './factory';

let Transaction = (tables, db) => {
    return (target, name, descriptor) => {
        let oldValue = descriptor.value;
        descriptor.value = function () {
            let reObj = factory.getObject('indexedDB', 'persistence.repositories');
            let transactionImpl = reObj.transactionImpl;
            let dbObj = factory.getObject('indexedDB', 'persistence.database');
            if(dbObj.length === 1 && !db) {
                db = dbObj[0].name;
            }
            transactionImpl.start(db, {tables: tables});
            return oldValue.apply(null, arguments);
        };
        return descriptor;
    }
};

export {
    Transaction
}