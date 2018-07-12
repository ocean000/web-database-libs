import factory from '../../../factory';
import condition from './condition';
import order from './order';

export default class baseDao {
    reObj = null;
    table = null;
    primaryKey = null;
    columns = [];
    tran = null;
    action = null;
    condition = null;
    s4 = () => {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };

    constructor(tb) {
        this.reObj = factory.getObject('indexedDB', 'persistence.repositories');
        this.table = tb;
        this.tran = this.reObj.transactionImpl;
        this.action = this.reObj.actionType;
        this.condition = this.reObj.condition;
        let database = factory.getObject('indexedDB', 'persistence.database');
        let tableObj = database.filter(n => n.name === this.tran.getDatabase())[0].tables.filter(n => n.name === tb)[0];
        this.columns = tableObj.columns;
        this.primaryKey = tableObj.primaryKey;

        condition.setCondition(this.condition);
        order.setOrder(this.reObj.order);
    }

    /**
     * 根据标识获取记录
     * @param id 标识
     * @returns 字符串id值
     */
    getById(id) {
        if(!id || id === null) {
            this.tran.throwExcep('查询记录：id的值不合法');
        }
        return this.tran.execute(this.table, this.action.selectByPrimaryKey, {
            columns: '*',
            primaryKey: id
        });
    }

    /**
     * 根据条件获取列表记录
     * @param conditions 条件
     * @param order 排序
     * @param start 开始位置
     * @param size 数量
     * @returns 数组列表
     */
    getListByConditions(conStr, orderStr, start, size) {
        return this.tran.execute(this.table, this.action.select, {
            columns: '*',
            conditions: typeof(conStr) === 'string' ? condition.parseCondition(conStr) : conStr,
            order: typeof(orderStr) === 'string' ? order.parseOrder(orderStr) : orderStr,
            start: start,
            size: size
        });
    }

    /**
     * 获取所有记录
     * @param order 排序
     * @returns 数组列表
     */
    getAllList(orderStr) {
        return this.tran.execute(this.table, this.action.select, {
            columns: '*',
            conditions: null,
            order: typeof(orderStr) === 'string' ? order.parseOrder(orderStr) : orderStr,
        });
    }

    /**
     * 根据条件获取列表数目
     * @param conditions 条件
     * @returns 数目
     */
    getCountByConditions(conStr) {
        return this.tran.execute(this.table, this.action.count, {
            conditions: typeof(conStr) === 'string' ? condition.parseCondition(conStr) : conStr,
        });
    }

    /**
     * 获取所有记录数目
     * @returns 数目
     */
    getAllCount() {
        return this.tran.execute(this.table, this.action.count, {
           conditions: null
        });
    }

    /**
     * 添加纪录
     * @param data 记录
     * @returns 记录添加后的id字符串
     */
    add(data) {
        let columns = [];
        let values = [];
        if(!Reflect.has(data, this.primaryKey)) {
            data[this.primaryKey] = this.guid();
        }
        for(let key in data) {
            if(!this.columns.includes(key)) {
                this.tran.throwExcep(`表${this.table}不包含字段${key}的定义`);
            }
            columns.push(key);
            values.push(data[key]);
        }
        return this.tran.execute(this.table, this.action.add, {
            columns: columns,
            values: values
        });
    }

    /**
     * 更新记录
     * @param data 记录
     */
    update(data) {
        return new Promise((resolve, reject) => {
            if(!Reflect.has(data, this.primaryKey)) {
                this.tran.throwExcep('需更新的数据没有包含主键');
            }
            let columns = [];
            let values = [];
            for(let key in data) {
                if(!this.columns.includes(key)) {
                    this.tran.throwExcep(`表${this.table}不包含字段${key}的定义`);
                }
                columns.push(key);
                values.push(data[key]);
            }
            return this.tran.execute(this.table, this.action.update, {
                columns: columns,
                values: values,
                conditions: this.condition.eql(this.primaryKey, data[this.primaryKey])
            });
        });
    }

    /**
     * 删除记录
     * @param id 记录标识
     * @returns 删除的记录数据
     */
    delete(id) {
        if(!id || id === null) {
            this.tran.throwExcep('删除记录：id的值不合法');
        }
        return this.tran.execute(this.table, this.action.delete, {
            conditions: this.condition.eql(this.primaryKey, id)
        })
    }

    /**
     * 生成id
     */
    guid() {
        return this.s4() + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + "-" + this.s4() + this.s4() + this.s4();
    }
}
