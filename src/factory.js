import repositoriesConfig from './configs/repositories.config';

let instances = [];
let configs = [repositoriesConfig];

export default {
    /**
     * 初始化对象工厂
     * @param configs 配置文件数组
     */
    init(configs) {
        if(!Array.isArray(configs)) {
            throw '初始化对象工厂失败，传递的配置参数不是数组。';
        }
        for(let config of configs) {
            addConfig(config);
        }
    },

    /**
     * 获取实例
     * @param id 标识
     * @param namespace 命名空间
     * @return object 实例
     */
    getObject(id, namespace) {
        let re = null;
        let configs = chooseConfig(namespace);
        if(!configs || configs === null) {
            throw `命名空间${namespace}的配置不存在`;
        }
        let config = configs.filter(n => n.id === id)[0];
        if(!config || config === null) {
            throw `id为${id}的配置不存在`;
        }

        let obj = config.object;
        if(obj instanceof Function) {
            let instance = instances.filter(n => n.id === id)[0];
            if(!instance || instance === null) {
                re = new obj();
                instances.push({
                    id: id,
                    obj: re
                });
            }
            else {
                re = instance.obj;
            }
        }
        else {
            re = obj;
        }
        return re;
    }
}

/**
 * 添加配置文件
 * @param config 配置文件
 */
let addConfig = (config) => {
    if(!Reflect.has(config, 'namespace')) {
        throw '添加的配置文件没有命名空间的定义';
    }
    if(!Reflect.has(config, 'configs')) {
        throw '添加的配置文件没有配置项的定义';
    }
    let existCf = configs.filter(n => n.namespace === config.namespace)[0];
    if(!existCf) {
        configs.push(config);
    }
    else {
        for(let cf of config.configs) {
            let existId = existCf.configs.filter(n => n.id === cf.id)[0];
            if(existId) {
                throw `已存在id为${cf.id}的配置`;
            }
            existCf.configs.push(cf);
        }
    }
};

/**
 * 选择配置文件
 * @param namespace 命名空间
 * @returns 配置对象
 */
let chooseConfig = (namespace) => {
    return configs.filter(n => n.namespace === namespace)[0].configs;
};