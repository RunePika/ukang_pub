define(['core/context', 'core/data-store', 'core/mock-data', 'ukang-constants', 'ukang-sqlite', 'ukang-utils'],
    function (context, dataStore, MockData, CONSTS, sqlite, utils) {
        'use strict';

        function executeCallback(cb) {
            if (cb && $.isFunction(cb)) {
                var args = arguments;
                Array.prototype.shift.apply(args);
                cb.apply(null, args);
            }
        }


        var initCount = 5;

        function stepInit() {
            initCount--;
            if (initCount == 0) context['status'] = 'prepared2';
        }


        if (window.app.inDevice) {


            sqlite.getDB(function (db) {

                //基本数据类型:
                //[
                //     {type: 'LEN', desc: '长度', baseUint: 'CM'},
                //     {type: 'WEIGHT', desc: '重量', baseUint: 'KG'},
                //     {type: 'PERCENT', desc: '比例', baseUint: 'PERCENT'},
                //     {type: 'VOLUMN', desc: '体积', baseUint: 'L'},
                //     {type: 'PRESSURE', desc: '压力', baseUint: 'MMGH'},
                //     {type: 'CONTENT', desc: '含量', baseUint: 'MMOL/L'},
                //     {type: 'RATE', desc: '速率', baseUint: 'CPM'},
                //     {type: 'TIMELONG', desc: '时长', baseUint: 'HOUR'}
                // ]

                db.executeSql("SELECT * FROM " + CONSTS['TB_基本数据类型'], [], function (rs) {
                    var basicTypes = [],
                        dataLen = rs.rows.length;
                    for (var i = 0; i < dataLen; i++) {
                        var record = rs.rows.item(i);
                        basicTypes.push({
                            type: record['d_type'],
                            desc: record['desc'],
                            baseUnit: record['main_unit']
                        });
                    }
                    dataStore.registerItem('基本数据类型', new MockData(basicTypes));
                    stepInit();
                });

                // 数据单位：
                // [
                //     {unit: 'CM', basicType: 'LEN', desc: '厘米', convert: 'linear(1)'},
                //     {unit: 'M', basicType: 'LEN', desc: '米', convert: 'linear(100)'},
                //     {unit: 'KG', basicType: 'WEIGHT', desc: '公斤', convert: 'linear(1)'},
                //     {unit: 'LB', basicType: 'WEIGHT', desc: '磅', convert: 'linear(0.4535924)'},
                //     {unit: 'ST', basicType: 'WEIGHT', desc: '英石', convert: 'linear(6.3502932)'},
                //     {unit: 'PERSENT', basicType: 'PERSENT', desc: '%', convert: 'linear(1)'},
                //     {unit: 'MMOL/L', basicType: 'CONTENT', desc: '毫摩尔/升', convert: 'linear(1)'},
                //     {unit: 'MMHG', basicType: 'PRESSURE', desc: '毫米汞柱', convert: 'linear(1)'},
                //     {unit: 'CPM', basicType: 'RATE', desc: '次/分钟', convert: 'linear(1)'},
                //     {unit: 'HOUR', basicType: 'TIMELONG', desc: '小时', convert: 'linear(1)'},
                //     {unit: 'MINUTE', basicType: 'TIMELONG', desc: '分钟', convert: 'linear(1/60)'},
                //     {unit: 'SEC', basicType: 'TIMELONG', desc: '秒', convert: 'linear(1/60/60)'}
                // ]

                db.executeSql("SELECT * FROM " + CONSTS['TB_数据单位'], [], function (rs) {
                    var units = [],
                        dataLen = rs.rows.length;
                    for (var i = 0; i < dataLen; i++) {
                        var record = rs.rows.item(i);
                        units.push({
                            unit: record['u_ident'],
                            basicType: record['d_type'],
                            desc: record['desc'],
                            convert: record['convert_method']
                        });
                    }
                    dataStore.registerItem('数据单位', new MockData(units));
                    stepInit();
                });


                // 健康数据类型
                // [
                //     {dataName:'身高', basicType: 'LEN', unit:'CM'},
                //     {dataName:'体重', basicType: 'WEIGHT', unit:'KG'},
                //     {dataName:'血糖', basicType: 'CONTENT', unit:'MMOL/L', sampleKind: 'single'},  //<--- sampleKind 如果不指定就是single，单一数据
                //     {dataName:'血压', basicType: 'PRESSURE', unit:'MMGH', sampleKind: 'updown'},
                //     {dataName:'心率', basicType: 'RATE', unit:'CPM'},
                //     {dataName:'体脂率', basicType: 'PERCENT', unit:'PERCENT'},
                //     {dataName:'脱脂体重', basicType: 'WEIGHT', unit:'公斤'},
                //     {dataName:'睡眠', basicType: 'TIMELONG', unit:'HOUR'}
                // ]

                db.executeSql("SELECT * FROM " + CONSTS['TB_健康数据类型'], [], function (rs) {
                    var healthDataTypes = [],
                        dataLen = rs.rows.length;
                    for (var i = 0; i < dataLen; i++) {
                        var record = rs.rows.item(i);
                        healthDataTypes.push({
                            dataName: record['data_name'],
                            basicType: record['basic_type'],
                            unit: record['d_unit'],
                            sampleKind: record['d_kind']
                        });
                    }
                    dataStore.registerItem('健康数据类型', new MockData(healthDataTypes));
                    stepInit();
                });

                db.executeSql("SELECT * FROM " + CONSTS['TB_收藏'], [], function (rs) {
                    var allData = [],
                        dataLen = rs.rows.length;
                    for (var i = 0; i < dataLen; i++) {
                        var record = rs.rows.item(i);
                        allData.push({
                            dataName: record['data_name'],
                            collected: record['collected']
                        });
                    }
                    dataStore.registerItem('收藏', {
                        data: allData,
                        // transform: function(record) {
                        //     return {
                        //         dataName: record['data_name'],
                        //         collected: record['collected']
                        //     };
                        // },
                        // transformRs: function(rs) {
                        //     var dataLen = rs.rows.length, data = [];
                        //     for (var i = 0; i < length; i++) {
                        //         data.push(this.transform(rs.rows.item(i)));
                        //     }
                        //     return data;
                        // },
                        initilized: false,
                        checkInit: function () {
                            if (!this.initilized) {
                                this.indexed = _.indexBy(this.data, 'dataName');
                                this.initilized = true;
                            }
                        },
                        get: function (param) {
                            var filter = param.filter,
                                onData = param.onData;
                            this.checkInit();
                            if ($.isFunction(onData)) {
                                if (filter == null || filter == undefined) {
                                    onData(this.data);
                                } else {
                                    if (_.isObject(filter)) {
                                        if (filter['dataName']) {
                                            filter = filter['dataName'];
                                        } else {
                                            var filtered = _.where(this.data, filter);
                                            onData(filtered);
                                            return;
                                        }
                                    }
                                    if (_.isString(filter)) {
                                        var filtered = [this.indexed[filter]];
                                        onData(filtered);
                                    }
                                }
                            }
                        },
                        set: function (param) {
                            this.checkInit();
                            var key = param.key,
                                data = param.data,
                                onSuccess = param.onSuccess,
                                onFailure = param.onFailure;

                            function persist(dataName, record) {
                                sqlite.getDB(function (db) {
                                    var sql = "UPDATE " + CONSTS['TB_收藏'] + " SET collected = ? WHERE data_name = ?";
                                    db.executeSql(sql, [record['collected'] || 0, dataName], function () {
                                        executeCallback(onSuccess);
                                    }, function (error) {
                                        executeCallback(onFailure);
                                    });
                                });
                            }

                            if (_.isObject(key)) key = key['dataName'];
                            if (_.isString(key) && this.indexed[key]) {
                                this.indexed[key] = data;
                                persist(key, data);
                            }
                        }
                    });
                    stepInit();
                });


            });

            dataStore.registerItem('测量数据', {
                transform: function (record) {
                    return {
                        id: record['data_id'],
                        dataName: record['data_name'],
                        date: record['s_date'],
                        value1: record['value1'],
                        value2: record['value2'],
                        value3: record['value3'],
                        value4: record['value4']
                    };
                },
                transformRs: function (rs) {
                    var dataLen = rs.rows.length,
                        data = [];
                    for (var i = 0; i < dataLen; i++) {
                        data.push(this.transform(rs.rows.item(i)));
                    }
                    return data;
                },
                latestData: function (params, onData) {
                    var self = this;
                    sqlite.getDB(function (db) {
                        var sql = "SELECT * FROM data_samples WHERE data_id IN (\
                        SELECT data_id FROM (\
                        SELECT data_name, data_id, max(s_date) s_date FROM data_samples GROUP BY data_name))";
                        db.executeSql(sql, [], function (rs) {
                            executeCallback(onData, self.transformRs(rs));
                        });
                    });
                },
                get: function (param) {
                    var self = this,
                        filter = param.filter,
                        onData = param.onData;
                    if (filter == null || _.isEmpty(filter)) {
                        //不能使用空的filter
                        executeCallback(onData, []);
                        return;
                    }
                    if (_.isString(filter)) {
                        //如果是字符串，认为是 dataName
                        filter = {
                            dataName: filter
                        };
                    }
                    if (_.isObject(filter)) {
                        //特定方法调用
                        if (filter['function']) {
                            var func = filter['function'];
                            if (this[func] && $.isFunction(this[func])) {
                                this[func].call(this, filter['params'], onData);
                                return;
                            }
                        }


                        //必须是对象，支持：
                        // dataName / id --> dataName 或者 id 必须有一个，有id则忽略其他所有参数
                        // date --> 可选，指定某日，如果有 date 则 忽略 startDate & endDate
                        // startDate & endDate --> 可选，

                        var sql = "SELECT * FROM " + CONSTS['TB_测量数据'],
                            wheres = [],
                            params = [];

                        function pushOption(fieldName, value, op) {
                            if (op != undefined) {
                                wheres.push({
                                    field: fieldName,
                                    op: op
                                });
                            } else
                                wheres.push(fieldName);
                            params.push(value);
                        }

                        function pushDateOption(fieldName, value, op) {
                            var d = utils.DateUtils.parse(value),
                                formated = utils.DateUtils.format(d, 'yyyy-MM-dd');
                            pushOption("strftime('%Y-%m-%d'," + fieldName + ')', formated, op);
                        }

                        if (filter['id']) {
                            pushOption('data_id', filter['id']);
                        } else {
                            if (filter['dataName']) pushOption('data_name', filter['dataName']);
                            if (filter['date']) {
                                pushDateOption('s_date', filter['date']);
                            } else {
                                if (filter['startDate']) pushDateOption('s_date', filter['startDate'], ">=");
                                if (filter['endDate']) pushDateOption('s_date', filter['endDate'], "<=");
                            }
                        }

                        if (wheres.length > 0) {
                            var first = true;
                            for (var i in wheres) {
                                var where = wheres[i];
                                if (first) sql += " WHERE ";
                                else sql += " AND "
                                if (_.isObject(where)) {
                                    sql += "(" + where.field + where.op + "?)";
                                } else {
                                    sql += "(" + where + "=?)";
                                }
                                first = false;
                            }
                        }

                        sqlite.getDB(function (db) {
                            db.executeSql(sql, params, function (rs) {
                                executeCallback(onData, self.transformRs(rs));
                            }, function (error) {
                                console.log('executeSql failure, sql: ' + sql + ", message: " + error.message);
                                executeCallback(onDate, []);
                            });
                        });
                    }
                },
                set: function (param) {
                    var self = this,
                        key = param.key,
                        data = param.data,
                        onSuccess = param.onSuccess,
                        onFailure = param.onFailure,
                        sql,
                        params = [];

                    /**
                     * key:
                     *   空字符串或者空对象，则为新增；
                     *   非空key的话，必须为id,
                     *   data == null时为删除，不支持更新 
                     */

                    if (key == null || _.isEmpty(key)) {
                        //此为新增
                        sql = "INSERT INTO " + CONSTS['TB_测量数据'] + "(data_name,s_date,value1,value2) VALUES (?,?,?,?)";
                        params.push(data['dataName']);
                        params.push(data['date']);
                        params.push(data['value1']);
                        params.push(data['value2']);
                        sqlite.getDB(function (db) {
                            db.executeSql(sql, params, onSuccess, onFailure);
                        });
                    } else {
                        if (!_.isObject(key)) {
                            //转化为对象
                            key = {
                                id: key
                            };
                        }
                        if (_.isObject(key)) {
                            if (data == null || _.isEmpty(data)) {
                                //此为删除
                                if (key.id || key.dataName) {
                                    sql = "DELETE FROM " + CONSTS['TB_测量数据'] + " WHERE ";
                                    if (key.id) {
                                        //删除单一数据
                                        sql += "data_id = ?";
                                        params.push(key.id);
                                    } else {
                                        //删除某种数据
                                        sql += "data_name = ?";
                                        params.push(key.dataName);
                                    }
                                    sqlite.getDB(function (db) {
                                        db.executeSql(sql, params, onSuccess, onFailure);
                                    });
                                }
                            }
                            //TODO 更新支持，可能以后也不需要呢。
                        }
                    }
                }
            });
            stepInit();

        } else {

            //纯浏览器，假数据！

            //基本数据类型:
            var basicTypes = [
                {type: 'LEN', desc: '长度', baseUint: 'CM'},
                {type: 'WEIGHT', desc: '重量', baseUint: 'KG'},
                {type: 'PERCENT', desc: '比例', baseUint: 'PERCENT'},
                {type: 'VOLUMN', desc: '体积', baseUint: 'L'},
                {type: 'PRESSURE', desc: '压力', baseUint: 'MMGH'},
                {type: 'CONTENT', desc: '含量', baseUint: 'MMOL/L'},
                {type: 'RATE', desc: '速率', baseUint: 'CPM'},
                {type: 'TIMELONG', desc: '时长', baseUint: 'HOUR'}
            ];

            dataStore.registerItem('基本数据类型', new MockData(basicTypes));
            stepInit();

                // 数据单位：
            var units = [
                {unit: 'CM', basicType: 'LEN', desc: '厘米', convert: 'linear(1)'},
                {unit: 'M', basicType: 'LEN', desc: '米', convert: 'linear(100)'},
                {unit: 'KG', basicType: 'WEIGHT', desc: '公斤', convert: 'linear(1)'},
                {unit: 'LB', basicType: 'WEIGHT', desc: '磅', convert: 'linear(0.4535924)'},
                {unit: 'ST', basicType: 'WEIGHT', desc: '英石', convert: 'linear(6.3502932)'},
                {unit: 'PERCENT', basicType: 'PERCENT', desc: '%', convert: 'linear(1)'},
                {unit: 'MMOL/L', basicType: 'CONTENT', desc: '毫摩尔/升', convert: 'linear(1)'},
                {unit: 'MMGH', basicType: 'PRESSURE', desc: '毫米汞柱', convert: 'linear(1)'},
                {unit: 'CPM', basicType: 'RATE', desc: '次/分钟', convert: 'linear(1)'},
                {unit: 'HOUR', basicType: 'TIMELONG', desc: '小时', convert: 'linear(1)'},
                {unit: 'MINUTE', basicType: 'TIMELONG', desc: '分钟', convert: 'linear(1/60)'},
                {unit: 'SEC', basicType: 'TIMELONG', desc: '秒', convert: 'linear(1/60/60)'}
            ];

            dataStore.registerItem('数据单位', new MockData(units));
            stepInit();


            // 健康数据类型
            var healthDataTypes = [
                {dataName:'身高', basicType: 'LEN', unit:'CM'},
                {dataName:'体重', basicType: 'WEIGHT', unit:'KG'},
                {dataName:'血糖', basicType: 'CONTENT', unit:'MMOL/L', sampleKind: 'single'},  //<--- sampleKind 如果不指定就是single，单一数据
                {dataName:'血压', basicType: 'PRESSURE', unit:'MMGH', sampleKind: 'updown'},
                {dataName:'心率', basicType: 'RATE', unit:'CPM'},
                {dataName:'体脂率', basicType: 'PERCENT', unit:'PERCENT'},
                {dataName:'脱脂体重', basicType: 'WEIGHT', unit:'KG'},
                {dataName:'睡眠', basicType: 'TIMELONG', unit:'HOUR'}
            ];

            dataStore.registerItem('健康数据类型', new MockData(healthDataTypes));
            stepInit();
            

            var hdHandler = new MockData([], 'data_id');

            hdHandler['latestData'] = function(params, onData) {
                var ret = [], grouped = _.groupBy(this.data, 'dataName');
                for (var dName in grouped) {
                    var group = grouped[dName], 
                        sorted = _.sortBy(group, 'date'),
                        record = _.last(sorted);
                    ret.push(record);
                }
                executeCallback(onData, ret);
            }.bind(hdHandler);

            dataStore.registerItem('测量数据', hdHandler);
            stepInit();

            var collects = [];

            for (var i in healthDataTypes) {
                var ht = healthDataTypes[i];
                collects.push({
                    dataName: ht.dataName,
                    collected: 0
                });
            }

            dataStore.registerItem('收藏', new MockData(collects));
            stepInit();
        }
    });