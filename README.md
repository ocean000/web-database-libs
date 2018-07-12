# web-database-libs

> 前端数据库操作接口，采用IndexedDB技术，可用于离线方案和数据持久化，可扩展。

web-database-libs定义了操作前端数据库的接口规范，基于现有的前端数据库技术(如：IndexedDB、Web SQL等)封装了一些通用操作方法，可轻松实现
对数据库的增、删、查、改。

web-database-libs通过配置文件管理关键对象，如：数据库表结构、数据库操作对象等。

web-database-libs暴露了操作数据库的底层方法和接口，可以轻松扩展。

## Installation
npm install web-database-libs

## Usage

web-database-libs默认采用IndexedDB技术实现了一些通用方法，采用其它技术可根据规范自行扩展。

使用默认方法时请注意IndexedDB的兼容性：

![IndexedDB兼容性][img1]

注：IOS微信X5内核不支持IndexedDB

### 快速起步
* 定义配置文件：
   * 表结构配置：__database.config.js__：
   
    ```
        export default {
            namespace: 'persistence.database',
            configs: [
                {
                    id: 'indexedDB',
                    object: [{
                        name: 'demoDatabase',
                        version: 1,
                        tables: [
                            {
                                name: 'test',
                                primaryKey: 'id',
                                columns: ['id', 'aa', 'bb']
                            },
                            {
                                name: 'demo',
                                primaryKey: 'id',
                                columns: ['id', 'cc', 'dd']
                            }
                        ]
                    }]
                }
            ]
        }
    ```
   * 操作对象配置：__dao.config.js__：

    ```
        import { baseDao } from 'web-database-libs';

        class testDao extends baseDao {
            constructor() {
                super('test'); // 对应表test
            }
        }

        class demoDao extends baseDao {
            constructor() {
                super('demo'); // 对应表demo
            }
        }

        export default {
            namespace: 'persistence.dao',
            configs: [
                { id: 'test', object: testDao },
                { id: 'demo', object: demoDao }
            ]
        }
    ```
* 在项目中初始化：

    ```
        import { factory, initDatabase } from 'web-database-libs';
        import databaseConfig from './database.config.js';
        import daoConfig from './dao.config.js';

        // 初始化配置
        factory.init([databaseConfig, daoConfig]);

        // 初始化数据库
        initDatabase();
    ```
* 在项目中使用：
   * __test.js__:

    ```
        import { dao, Transaction } from 'web-database-libs';

        export default {
            // 指定这次会操作到的表
            @Transaction(['test'])
            getDbData() {
                // 获取表 test 中 aa 字段含有 1 且按 aa 字段倒序的前 10 条记录
                dao('test').getListByConditions('aa like 1', 'aa desc', 0 , 10).then((data) => {
                    console.log(data);
                });
            }
        }
    ```
* 调试中查看数据库：

    ![查看数据库][img2]

       
### 表结构配置
* 配置项：
     
    ```
        {
            namespace: 'persistence.database',    // 命名空间，目前规定为 persistence.database
            configs: [
                {
                    id: 'indexedDB',    // 配置标识
                    object: [{
                        name: 'demoDatabase',    // 数据库名称
                        version: 1,    // 数据库版本
                        tables: [
                            {
                                name: 'test',    // 表名称
                                primaryKey: 'id',    // 主键，可为数组
                                columns: ['id', 'aa', 'bb']    // 字段
                            },
                            {
                                name: 'demo',
                                primaryKey: 'id',
                                columns: ['id', 'cc', 'dd']
                            }
                        ]
                    }]
                }
            ]
        }
    ```
* 表结构更新

    表结构改变后，IndexedDB需更新版本号*version*后才会更新表结构。*version*的值只能递增，递减不会触发更新。

    
### 数据库操作对象

对数控库的增、删、查、改都交由叫做*dao*的对象处理，每张表都要有各自的*dao*对象，如表*test*对应*testDao*，表*demo*对应*demoDao*等。
*dao*对象需配置后才能使用，使用时通过标识*id*获取。
        
* 定义对象：

    数据库操作对象默认都要继承*baseDao*，并在定义时指定对应的表名称。*baseDao*封装了通用的数据库操作方法，也可以为自己的
    *dao*对象定义自己的方法，只要调用底层的数据库操作方法实现逻辑即可。通用的数据库操作方法和底层的方法可参考下方的API说明。

    ```
        // 导入baseDao
        import { baseDao } from 'web-database-libs';

        // 继承baseDao
        class testDao extends baseDao {
            constructor() {
                super('test'); // 指定对应的表，这里是表test
            }

            // 自定义操作方法
            getByName() {

                // 调用底层操作方法
                ......
            }
        }
    ```

* 配置

    ```
        {
            namespace: 'persistence.dao',    // 命名空间，目前规定为 persistence.dao
            configs: [
                {
                    id: 'test',    // 标识
                    object: testDao    // 对象类型
                }
            ]
        }
    ```

* 使用对象

    操作对象都通过接口*dao()*获取，只要传入*id*就能获取定义的*dao*对象。*id*对应配置中的*id*值。
    调用操作方法时，要先启动事务，可通过装饰器的方式启动，也可通过调用底层方法启动，推荐使用装饰器方式。

    ```
        import { dao, Transaction } from 'web-database-libs';

        export default {

            // 通过装饰器启动事务，参数指定将要操作的表
            @Transaction(['test', 'demo'])
            addData() {
                // 向表 test 添加一条记录
                dao('test').add({
                    aa: 11,
                    bb: 22
                });

                // 获取表 demo 的全部记录
                dao('demo').getAllList().then((data) => {
                    console.log(data);
                });
            }
        }
    ```
    或：

    ```
        import { dao, transactionImpl } from 'web-database-libs';

        // 底层方法启动事务，tables指定将要操作的表
        transactionImpl.start('demoDatabase', { tables: ['test', 'demo'] });

        // 向表 test 添加一条记录
        dao('test').add({
            aa: 11,
            bb: 22
        });

        // 获取表 demo 的全部记录
        dao('demo').getAllList().then((data) => {
            console.log(data);
        });
    ```


### 扩展

web-database-libs默认是基于IndexedDB技术的，当IndexedDB不再适合你的项目，或者想用其他的数据库技术时，可根据接口规范进行扩展。

* 实现接口：

    ```
        // 引入规范接口
        import { IRepository, ITransaction } from 'web-database-libs';
        import { implement } from 'libs-core';

        // 实现接口
        let repositoryImpl = implement(IRepository);

        let transactionImpl = implement(ITransaction);

        // 实现接口方法
        repositoryImpl.initDb = (dbId, options) => {
            ......
        }

        repositoryImpl.createTb = (table, columns, primaryKeys, dbId) => {
            ......
        }

        transactionImpl.start = (database, options) => {
            ......
        }

    ```

* 配置：
   * 创建配置文件*repositories.config.js*

   * 配置你用到的数据库技术：

   ```
     import indexedDb from '../implements/repositories/indexedDB/index';
     import webSql from '../repositories/webSql/index';

     export default {
         namespace: 'persistence.repositories', // 命名空间，默认规定为 persistence.repositories
         configs: [
             { id: 'indexedDB', object: indexedDb },
             { id: 'webSql', object: webSql }
         ]
     }

   ```

   初始化配置：

   ```
    import { factory } from 'web-database-libs';
    import databaseConfig from './database.config.js';
    import daoConfig from './dao.config.js';
    // 导入配置文件
    import repositoriesConfig from './repositories.config.js';

    // 初始化配置
    factory.init([databaseConfig, daoConfig, repositoriesConfig]);

   ```

* 使用：

  通过*factory*获取数据库对象，调用接口方法实现自己的通用方法。

  ```
    import { factory } from 'web-database-libs';

    let repository = factory.getObject('webSql', 'persistence.repositories');

    // 实现通用方法
    ......

  ```

## API
> baseDao
> -----------------------------------------------------
> dao对象父类，需通过其子类dao实例调用里面的通用方法

* __getById(id): promise__

    <p>根据标识获取某条记录</p>

    * 参数
        <p><i> [string]: 记录标识，一般id为主键</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例
    
    ```
        dao('test').getById(id).then((data) => {
            ......
        });
    ```
* __getListByConditions(conStr, orderStr, start, size): promise__

    <p>根据查询条件、排序规则查询某些记录</p>

    * 参数
        <p><i>conStr [string | object]: 查询条件，没有查询条件时，传入null</i></p>
        <p><i>orderStr [string | object]: 排序规则，默认为正序，可以传入null</i></p>
        <p><i>start [Number]: 开始查询位置，默认为 0 </i></p>
        <p><i>size [Number]: 查询数目，可出入null，此时查询到最后一条记录</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 说明
        <p>
            1. <i>conStr</i>与<i>orderStr</i>参数既可以传入<i>字符串规则</i>也可以传入<i>规则对象</i>，
            <i>字符串规则</i>有：</br>
                <i>col = value</i>：字段等于某个值；</br>
                <i>col > value</i>：字段大于某个值；</br>
                <i>col >= value</i>：字段大于等于某个值；</br>
                <i>col < value</i>：字段小于某个值；</br>
                <i>col <= value</i>：字段小于等于某个值；</br>
                <i>value1 < col < value2</i>：字段介于<i>value1</i>与<i>value2</i>之间，但不包含<i>value1</i>与<i>value2</i>；</br>
                <i>value1 <= col < value2</i>：字段介于<i>value1</i>与<i>value2</i>之间，但不包含<i>value2</i>；</br>
                <i>value1 < col <= value2</i>：字段介于<i>value1</i>与<i>value2</i>之间，但不包含<i>value1</i>；</br>
                <i>value1 <= col <= value2</i>：字段介于<i>value1</i>与<i>value2</i>之间，包含<i>value1</i>与<i>value2</i>；</br>
                <i>col like value</i>：字段中包含<i>value</i>；</br>
                </br>
                <i>col asc</i>：按字段正序排列；</br>
                <i>col desc</i>：按字段反序排列；</br>
            <i>规则对象</i>可以通过对象<i>selectCondition</i>与<i>selectOrder</i>获得，详细可参考这两个对象的API介绍。
            2. 由于IndexedDB技术限制，当<i>conStr</i>与<i>orderStr</i>参数的值都为非null时，不按<i>orderStr</i>参数
            中指定的字段排序，而是按<i>conStr</i>参数中的指定的字段排序。
        </p>
    * 示例

    ```
        dao('test').getListByConditions('aa >= 11', 'aa desc', 0, null).then((data) => {
            ......
        });

        或：

        import { selectCondition, selectOrder } from 'web-database-libs';

        dao('test').getListByConditions(selectCondition.upperEql('aa', '11'), selectOrder.prevBy('aa'), 0, null).then((data) => {
            ......
        });
    ```
* __getAllList(orderStr): promise__

    <p>获取全部记录，可排序</p>

    * 参数
        <p><i>orderStr [string | Object]: 排序规则，默认为正序，可以传入null</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        dao('test').getAllList().then((data) => {
            ......
        });
    ```
* __getCountByConditions(conStr): promise__

    <p>获取满足条件的记录数目</p>

    * 参数
        <p><i>conStr [string | object]: 查询条件，可传入null</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        dao('test').getCountByConditions().then((count) => {
            ......
        });
    ```
* __getAllCount(): promise__

    <p>获取全部记录数目</p>

    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        dao('test').getAllCount().then((count) => {
            ......
        });

* __add(data): promise__

    <p>向数据表添加一条记录</p>

    * 参数
        <p><i>data [object]: 记录数据</i></p>
    * 返回
        <p><i>promise对象，包含新增记录的标识id</i></p>
    * 示例

    ```
        dao('test').add({ aa: '11', bb: '22' }).then((id) => {
            console.log(id);
        });
    ```
* __update(data): promise__

    <p>更新一条记录</p>

    * 参数
         <p><i>data [object]: 记录数据</i></p>
    * 返回
         <p><i>promise对象</i></p>
    * 示例

    ```
        dao('test').update({ id: '0581d8f7-6a2b-ef43-1dd4-d5fa766e8a2c', aa: '33', bb: 'ff' }).then(() => {
            ......
        });
    ```
* __delete(id): promise__

    <p>删除一条记录</p>

    * 参数
        <p><i>id [string]: 数据表标识</i></p>
    * 返回
         <p><i>promise对象，包含被删除的数据</i></p>
    * 示例

    ```
        dao('test').delete(id).then((data) => {
            console.log(data);
        });
    ```
* __guid(): string__

    <p>生成唯一标识id值</p>

    * 返回
        <p><i>标识值</i></p>
    * 示例

    ```
        let id = guid();
    ```

> selectCondition
> -----------------------------------------------------
> 生成查询条件

* __eql(column, value): object__

    <p>字段等于某个值，对应字符串规则'col = value'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value [string]: 值</i></p>
    * 示例

    ```
        selectCondition.eql('aa', '11');
    ```
* __upper(column, value): object__

    <p>字段大于某个值，对应字符串规则'col > value'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value [string]: 值</i></p>
    * 示例

    ```
        selectCondition.upper('aa', '11');
    ```
* __upperEql(column, value): object__

    <p>字段大于等于某个值，对应字符串规则'col >= value'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value [string]: 值</i></p>
    * 示例

    ```
        selectCondition.upperEql('aa', '11');
    ```
* __lower(column, value): object__

    <p>字段小于某个值，对应字符串规则'col < value'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value [string]: 值</i></p>
    * 示例

    ```
        selectCondition.lower('aa', '11');
    ```
* __lowerEql(column, value): object__

    <p>字段小于等于某个值，对应字符串规则'col <= value'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value [string]: 值</i></p>
    * 示例

    ```
        selectCondition.lowerEql('aa', '11');
    ```
* __between(column, value1, value2): object__

    <p>字段介于两个值之间，但不包括边界，对应字符串规则'value1 < col < value2'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value1 [string]: 较小的值</i></p>
        <p><i>value2 [string]: 较大的值</i></p>
    * 示例

    ```
        selectCondition.between('aa', '11'， '33');
    ```
* __betweenLeftEql(column, value1, value2): object__

    <p>字段介于两个值之间，但不包括右边界，对应字符串规则'value1 <= col < value2'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value1 [string]: 较小的值</i></p>
        <p><i>value2 [string]: 较大的值</i></p>
    * 示例

    ```
        selectCondition.betweenLeftEql('aa', '11'， '33');
    ```
* __betweenRightEql(column, value1, value2): object__

    <p>字段介于两个值之间，但不包括左边界，对应字符串规则'value1 < col <= value2'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value1 [string]: 较小的值</i></p>
        <p><i>value2 [string]: 较大的值</i></p>
    * 示例

    ```
        selectCondition.betweenRightEql('aa', '11'， '33');
    ```
* __betweenEql(column, value1, value2): object__

    <p>字段介于两个值之间，包括边界，对应字符串规则'value1 <= col <= value2'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value1 [string]: 较小的值</i></p>
        <p><i>value2 [string]: 较大的值</i></p>
    * 示例

    ```
        selectCondition.betweenEql('aa', '11'， '33');
    ```
* __like(column, value): object__

    <p>字段包含某个值，对应字符串规则'col like value'</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>value [string]: 值</i></p>
    * 示例

    ```
        selectCondition.like('aa', '1');
    ```

> selectOrder
> -----------------------------------------------------
> 生成排序规则

* __nextBy(column, unique): object__

    <p>正序排列</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>unique [string]: 是否包含重复项，默认为不重复</i></p>
    * 示例

    ```
        selectOrder.nextBy('aa');
    ```
* __prevBy(column, unique): object__

    <p>反序排列</p>

    * 参数
        <p><i>column [string]: 字段名称</i></p>
        <p><i>unique [string]: 是否包含重复项，默认为不重复</i></p>
    * 示例

    ```
        selectOrder.prevBy('aa');
    ```

> transactionImpl
> -----------------------------------------------------
> 底层数据库方法，事务操作相关

* __start(db, options)__

    <p>开始事务</p>

    * 参数
        <p><i>db [string]: 数据库名称</i></p>
        <p><i>options [object]: 选项对象，基于IndexedDB技术需包含tables属性</i></p>
    * 示例

    ```
        transactionImpl.start('demoDatabase', { tables: ['test'] });
    ```

* __execute(table, action, params): promise__

    <p>执行事务</p>

    * 参数
        <p><i>table [string]: 数据表名称</i></p>
        <p><i>action [object]: 数据库操作类型，对应actionType对象中的值，详情参照actionType的API</i></p>
        <p><i>params [object]: 操作参数</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        import { actionType } from 'web-database-libs';

        transactionImpl.execute('test', actionType.select, {}).then(() => {
            ......
        });
    ```
* __commit(params)__

    <p>提交事务</p>

    * 参数
        <p><i>params [object]: 提交时需要的参数</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        transactionImpl.commit({});
    ```

> repositoryImpl
> -----------------------------------------------------
> 底层数据库方法，持久化操作相关

* __initDb(dbId, options): promise__

    <p>初始化数据库</p>

    * 参数
        <p><i>dbId [string]: 数据库名称</i></p>
        <p><i>options [object]: 初始化时需要的参数，IndexedDB技术需包含version属性</i></p>
    * 返回
        <p><i>promise对象，IndexedDB技术返回{ isUpgrade：是否为更新状态，oldTables：现有的数据表名称 }</i></p>
    * 示例

    ```
        repositoryImpl.initDb('demoDatabase', { version: 1 }).then(({ isUpgrade, oldTables }) => {
            ......
        });
    ```
* __deleteDb(dbId): promise__

    <p>删除数据库</p>

    * 参数
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        repositoryImpl.deleteDb('demoDatabase').then(() => {
            ......
        });
    ```
* __open(dbId): promise__

    <p>打开数据库</p>

    * 参数
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        repositoryImpl.open('demoDatabase').then(() => {
            ......
        });
    ```
* __close(dbId): promise__

    <p>关闭数据库</p>

    * 参数
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        repositoryImpl.close('demoDatabase').then(() => {
            ......
        });
    ```
* __createTb(table, columns, primaryKeys, dbId): promise__

    <p>创建数据表</p>

    * 参数
        <p><i>table [string]: 表名称</i></p>
        <p><i>columns [array]: 字段</i></p>
        <p><i>primaryKeys [string | array]: 主键，可为数组</i></p>
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        repositoryImpl.createTb('test', ['aa', 'bb'], 'id', 'demoDatabase').then(() => {
            ......
        });
    ```
* __deleteTb(table, dbId): promise__

    <p>删除数据表</p>

    * 参数
        <p><i>table [string]: 表名称</i></p>
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        repositoryImpl.deleteTb('test', 'demoDatabase').then(() => {
            ......
        });
    ```
* __select(columns, conditions, order, start, size, table, dbId): promise__

    <p>查询记录</p>

    * 参数
        <p><i>columns [array | string]: 要查询的字段，全部字段传'*'</i></p>
        <p><i>conditions [object]: 查询条件, IndexedDB技术使用selectCondition对象生成值</i></p>
        <p><i>order [object]: 排序规则, IndexedDB技术使用selectOrder对象生成值</i></p>
        <p><i>start [number]: 查询开始位置</i></p>
        <p><i>size [number]: 查询数目</i></p>
        <p><i>table [string]: 表名称</i></p>
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        import { selectCondition, selectOrder } from 'web-database-libs';

        repositoryImpl.select(['aa', 'bb'], selectCondition.eql('aa', '11'), selectOrder.prevBy('aa'), 0, 10, 'test', 'demoDatabase').then((data) => {
            console.log(data);
        });
    ```
* __count(conditions, table, dbId): promise__

    <p>计算记录数目</p>

    * 参数
        <p><i>conditions [object]: 查询条件, IndexedDB技术使用selectCondition对象生成值</i></p>
        <p><i>table [string]: 表名称</i></p>
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        import { selectCondition, selectOrder } from 'web-database-libs';

        repositoryImpl.count(selectCondition.eql('aa', '11'), 'test', 'demoDatabase').then((count) => {
            console.log(count);
        });
    ```
* __insert(columns, values, table, dbId): promise__

    <p>插入记录</p>

    * 参数
        <p><i>columns [array]: 字段</i></p>
        <p><i>values [array]: 值，顺序与columns对应</i></p>
        <p><i>table [string]: 表名称</i></p>
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象，包含新增记录的主键值</i></p>
    * 示例

    ```
        repositoryImpl.insert(['aa', 'bb'], ['11', '22'], 'test', 'demoDatabase').then((id) => {
            console.log(id);
        });
    ```
* __update(columns, values, conditions, table, dbId): promise__

    <p>更新记录</p>

    * 参数
        <p><i>columns [array]: 字段</i></p>
        <p><i>values [array]: 值，顺序与columns对应</i></p>
        <p><i>conditions [object]: 查询条件, IndexedDB技术使用selectCondition对象生成值，没有条件可传null</i></p>
        <p><i>table [string]: 表名称</i></p>
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        import { selectCondition, selectOrder } from 'web-database-libs';

        repositoryImpl.update(['aa', 'bb'], ['33', 'ff'], selectCondition.eql('aa', '11'), 'test', 'demoDatabase').then(() => {
            .....
        });
    ```
* __delete(conditions, table, dbId): promise__

    <p>删除记录</p>

    * 参数
        <p><i>conditions [object]: 查询条件, IndexedDB技术使用selectCondition对象生成值</i></p>
        <p><i>table [string]: 表名称</i></p>
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象，包含被删除的记录</i></p>
    * 示例

    ```
        import { selectCondition, selectOrder } from 'web-database-libs';

        repositoryImpl.delete(selectCondition.eql('aa', '11'), 'test', 'demoDatabase').then((data) => {
            console.log(data);
        });
    ```

* __selectByPrimaryKey(columns, primaryKey, table, dbId): promise__

    <p>IndexedDB技术独有，获取主键对应的单条数据</p>

    * 参数
        <p><i>columns [array]: 要查询的字段，全部字段传'*'</i></p>
        <p><i>primaryKey [string]: 主键</i></p>
        <p><i>table [string]: 表名称</i></p>
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>promise对象</i></p>
    * 示例

    ```
        repositoryImpl.selectByPrimaryKey('*', 'id', 'test', 'demoDatabase').then((data) => {
            console.log(data);
        });
    ```
* __getDatabase(dbId): object__

    <p>获取数据库对象</p>

    * 参数
        <p><i>dbId [string]: 数据库名称</i></p>
    * 返回
        <p><i>数据库对象</i></p>
    * 示例

    ```
        let db = repositoryImpl.getDatabase('demoDatabase');
    ```
* __setTransaction(tran)__

    <p>设置事务对象</p>

    * 参数
        <p><i>tran [object]: 事务对象</i></p>
    * 示例

    ```
        repositoryImpl.setTransaction(transaction);
    ```

> actionType
> -----------------------------------------------------
> 生成事务操作类型

* __select__

    <p>查询操作</p>

    * 示例

    ```
        actionType.select
    ```
* __selectByPrimaryKey__

    <p>根据主键查询的操作</p>

    * 示例

    ```
        actionType.selectByPrimaryKey
    ```
* __count__

    <p>获取数目操作</p>

    * 示例

    ```
        actionType.count
    ```
* __add__

    <p>添加操作</p>

    * 示例

    ```
        actionType.add
    ```
* __update__

    <p>更新操作</p>

    * 示例

    ```
        actionType.update
    ```
* __delete__

    <p>删除操作</p>

    * 示例

    ```
        actionType.delete
    ```

> factory
> -----------------------------------------------------
> web-database-libs对象工厂，封装了获取对象的方法

* __init(configs)__

    <p>初始化对象工厂</p>

    * 参数
        <p><i>configs [array]: 配置文件数组</i></p>
    * 示例

    ```
        factory.init([databaseConfig, daoConfig, ...]);
    ```
* __getObject(id, namespace): object__

    <p>获取实例</p>

    * 参数
        <p><i>id [string]: 对象标识</i></p>
        <p><i>namespace [string]: 命名空间</i></p>
    * 返回
        <p><i>对象实例</i></p>
    * 示例

    ```
        let dbObj = factory.getObject('indexedDb', 'persistence.repositories');
    ```





[img1]:data:image/png;base64,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
[img2]:data:image/png;base64,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