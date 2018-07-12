export default {
    /**
     * column = value
     * @param column 字段名称
     * @param value 比较的值
     */
    eql(column, value) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.only(value)
        }
    },

    /**
     * column > value
     * @param column 字段名称
     * @param value 比较的值
     */
    upper(column, value) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.lowerBound(value, true)
        }
    },

    /**
     * column >= value
     * @param column 字段名称
     * @param value 比较的值
     */
    upperEql(column, value) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.lowerBound(value, false)
        }
    },

    /**
     * column < value
     * @param column 字段名称
     * @param value 比较的值
     */
    lower(column, value) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.upperBound(value, true)
        }
    },

    /**
     * column <= value
     * @param column 字段名称
     * @param value 比较的值
     */
    lowerEql(column, value) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.upperBound(value, false)
        }
    },

    /**
     * value1 < name < value2
     * @param column 字段名称
     * @param value1 较小的值
     * @param value2 较大的值
     */
    between(column, value1, value2) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.bound(value1, value2, true, true)
        }
    },

    /**
     * value1 <= name < value2
     * @param column 字段名称
     * @param value1 较小的值
     * @param value2 较大的值
     */
    betweenLeftEql(column, value1, value2) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.bound(value1, value2, false, true)
        }
    },

    /**
     * value1 < name <= value2
     * @param column 字段名称
     * @param value1 较小的值
     * @param value2 较大的值
     */
    betweenRightEql(column, value1, value2) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.bound(value1, value2, true, false)
        }
    },

    /**
     * value1 <= name <= value2
     * @param column 字段名称
     * @param value1 较e小的值
     * @param value2 较大的值
     */
    betweenEql(column, value1, value2) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            range: IDBKeyRange.bound(value1, value2, false, false)
        }
    },

    /**
     * column like value
     * @param column
     * @param value
     */
    like(column, value) {
        if(!column || column === null || column === '') {
            throw '查询条件的字段名称不合法';
        }
        if(!value || value === null) {
            throw '查询条件的值不合法';
        }
        return {
            column: column,
            value: value,
            range: 'like'
        }
    }
}



