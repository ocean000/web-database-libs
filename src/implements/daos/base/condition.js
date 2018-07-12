
let condition = null;

export default {
    /**
     * 解析条件
     * @param rule 规则字符串
     * @return 条件对象
     */
    parseCondition(rule) {
        let rs = rule.split(' ');
        if(rs.length < 3) {
            return null;
        }
        switch(rs[1]) {
            case '=':
                return condition.eql(rs[0], rs[2]);
                break;
            case '>':
                return condition.upper(rs[0], rs[2]);
                break;
            case '>=':
                return condition.upperEql(rs[0], rs[2]);
                break;
            case '<':
                return condition.lower(rs[0], rs[2]);
                break;
            case '<=':
                return condition.lowerEql(rs[0], rs[2]);
                break;
            case 'like':
                return condition.like(rs[0], rs[2]);
                break;
        }
        if(rs.length >= 5) {
            if(rs[1] === '<' && rs[3] === '<') {
                return condition.bettwen(rs[2], rs[0], rs[4]);
            }
            else if(rs[1] === '<=' && rs[3] === '<') {
                return condition.bettwenLeftEql(rs[2], rs[0], rs[4]);
            }
            else if(rs[1] === '<' && rs[3] === '<=') {
                return condition.bettwenRightEql(rs[2], rs[0], rs[4]);
            }
            else if(rs[1] === '<=' && rs[3] === '<=') {
                return condition.bettwenEql(rs[2], rs[0], rs[4]);
            }
        }
    },

    /**
     * 设置持久化的条件逻辑
     */
    setCondition(con) {
        condition = con;
    }
}