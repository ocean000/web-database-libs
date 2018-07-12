let order = null;

export default {
    /**
     * 解析排序规则
     * @param rule 规则字符串
     * @return 排序对象
     */
    parseOrder(rule) {
        let rs = rule.split(' ');
        if (rs.length < 2) {
            return null;
        }
        switch (rs[1]) {
            case 'asc':
                return order.nextBy(rs[0]);
                break;
            case 'desc':
                return order.prevBy(rs[0]);
                break;
        }
    },

    /**
     * 设置持久化的排序逻辑
     */
    setOrder(or) {
        order = or;
    }
}