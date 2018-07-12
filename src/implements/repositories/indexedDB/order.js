export default {
    /**
     * 正向排列
     * @param column 排列的列名称
     * @param unique 是否包含重复项
     * @returns
     */
    nextBy(column, unique = false) {
        return {
            column: column,
            direction: unique ? 'nextunique' : 'next'
        }
    },

    /**
     * 反向排列
     * @param column 排列的列名称
     * @param unique 是否包含重复项
     * @returns
     */
    prevBy(column, unique = false){
        return {
            column: column,
            direction: unique ? 'prevunique' : 'prev'
        }
    }
}