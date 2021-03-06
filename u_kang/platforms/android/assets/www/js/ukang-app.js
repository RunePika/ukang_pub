/***
 * APP数据逻辑处理 
 **/
define(['core/context', 'core/data-store', 'ukang-utils', 'ukang-constants', 'prepare-db'],
    function (context, dataStore, UTILS, CONSTS, prepareDb) {
        'use strict';

        var appDataReady = false,
            DateUtils = UTILS.DateUtils,
            contains = function (all, sample) {
                return _.isEmpty(all) ? false : !_.isEmpty(_.where(all, sample));
            },
            /**
             * 应用数据处理
             */
            dataHandler = {
                collectTypes: function (params, onData) {
                    dataStore.get('收藏', params, onData);
                },
                allTypes: function (params, onData) {
                    dataStore.get('健康数据类型', params, onData);
                },
                basicTypes: function (params, onData) {
                    dataStore.get('基本数据类型', params, onData);
                },
                units: function (params, onData) {
                    dataStore.get('数据单位', params, onData);
                },
                /**
                 * 最后的数据
                 */
                latestRecord: function (params, onData) {
                    // var self = this;
                    dataStore.get('测量数据', {
                        function: 'latestData',
                        params: params
                    }, onData);
                    // if (!_.isObject(params) || !!!(params.dataName)) return;
                    // dataStore.get('测量数据', params, function (data) {
                    //     if (data && _.isArray(data)) {
                    //         if (_.isEmpty(data)) {
                    //             onData({
                    //                 dataName: params.dataName,
                    //                 isEmpty: true
                    //             });
                    //         } else {
                    //             var got = data[0].data,
                    //                 sorted = _.sortBy(got, 'date'),
                    //                 record = _.last(sorted);
                    //             record.dataName = params.dataName;
                    //             onData(record);
                    //         }
                    //     }
                    // });
                },
                setCollect: function (params, onSuccess) {
                    var self = this;
                    if (onSuccess && $.isFunctioni(onSuccess)) params.onSuccess = onSuccess;
                    dataStore.set('收藏', params.key, params.data, params.onSuccess);
                },
                /**
                 * 获取highligh数据
                 */
                highlights: function (params, onData) {
                    var self = this,
                        info = {
                            cache: {},
                            data: {},
                            rests: []
                        },
                        onLatestRecord = function (record) {
                            var noRecord = !!(record.isEmpty),
                                filter = {
                                    dataName: record.dataName
                                },
                                type = ukApp.cache['types'][record.dataName];
                            if (type) {
                                var inCollects = _.where(info.cache['collects'], filter);
                                if (!_.isEmpty(inCollects)) {
                                    info.data['collected'] = info.data['collected'] || [];
                                    var dt = '',
                                        highlightRecord = {
                                            dataName: record.dataName,
                                            d: '',
                                            t: '',
                                            value: '',
                                            unit: '--'
                                        };
                                    if (!noRecord) {
                                        dt = UTILS.getSampleTimeDisplay(record.date);
                                        highlightRecord = {
                                            dataName: record.dataName,
                                            d: dt.d,
                                            t: dt.t,
                                            value: record.value1, //TODO 处理 updown 等不同格式内容
                                            unit: type.unitDisp
                                        };
                                    }
                                    info.data['collected'].push(highlightRecord);
                                } else {
                                    if (noRecord) {
                                        info.rests.push(type);
                                    } else {
                                        var dt = UTILS.getSampleTimeDisplay(record.date),
                                            highlightRecord = {
                                                dataName: record.dataName,
                                                d: dt.d,
                                                t: dt.t,
                                                value: record.value1,
                                                unit: type.unitDisp
                                            };
                                        if (type.type) highlightRecord.type = type.type;
                                        info.data['specified'] = info.data['specified'] || [];
                                        var container = info.data['specified'];
                                        switch (dt.kind) {
                                            case CONSTS.DT_SAMEDAY:
                                                info.data['today'] = info.data['today'] || [];
                                                container = info.data['today'];
                                                break;
                                            case CONSTS.DT_SAMEWEEK:
                                                info.data['thisweek'] = info.data['thisweek'] || [];
                                                container = info.data['thisweek'];
                                                break;
                                            case CONSTS.DT_SAMEYEAR:
                                                info.data['thisyear'] = info.data['thisyear'] || [];
                                                container = info.data['thisyear'];
                                                break;
                                        }
                                        container.push(highlightRecord);
                                    }

                                }
                            }
                        },
                        // onAllTypes = function (allTypes) {
                        //     info.cache['allTypes'] = allTypes;
                        //     for (var i in allTypes) {
                        //         self.latestRecord({
                        //             dataName: allTypes[i].dataName
                        //         }, onLatestRecord);
                        //     }
                        //     onData({
                        //         hasData: info.data,
                        //         rests: info.rests
                        //     });
                        // },
                        onCollectTypes = function (collectTypes) {
                            info.cache['collects'] = collectTypes;
                            self.latestRecord(null, function (data) {
                                var indexed = {};
                                if (!_.isEmpty(data)) indexed = _.indexBy(data, 'dataName');
                                for (var i in ukApp.cache['types']) {
                                    var record = indexed[i];
                                    if (_.isEmpty(record)) {
                                        record = {
                                            dataName: i,
                                            isEmpty: true
                                        }
                                    }
                                    onLatestRecord(record);
                                }
                                onData({
                                    hasData: info.data,
                                    rests: info.rests
                                });
                            });

                        };
                    this.collectTypes({
                        collected: 1
                    }, onCollectTypes);
                },
                getData: function (params, onData) {
                    dataStore.get('测量数据', params, onData);
                },
                addData: function (params, onSuccess) {
                    dataStore.set('测量数据', {}, params, onSuccess);
                },
                delData: function (params, onSuccess) {
                    dataStore.set('测量数据', params, null, onSuccess);
                }
            },
            callDataHandler = function (type, params, onData) {
                var handler = dataHandler[type];
                if (handler && $.isFunction(handler)) handler.call(dataHandler, params, onData);
            },
            ukApp = {
                cache: {},
                /**
                 * 初始化
                 */
                initialize: function () {
                    if (window.app.inDevice) prepareDb.execute();
                    else context['status'] = 'prepared';

                    var self = this,
                        doneTypes = function (data) {
                            for (var i in data) {
                                data[i].unitDisp = self.cache['units'][data[i].unit].desc;
                            }
                            self.cache['types'] = _.indexBy(data, 'dataName');
                            appDataReady = true;
                            context['status'] = 'running';
                        },
                        doneUnits = function (data) {
                            self.cache['units'] = _.indexBy(data, 'unit');
                            callDataHandler('allTypes', null, doneTypes);
                        },
                        doneBasicTypes = function (data) {
                            self.cache['basicTypes'] = _.indexBy(data, 'type');
                            callDataHandler('units', null, doneUnits);
                        },
                        waitAppDatas = function () {
                            if (context['status'] == 'prepared2') {
                                callDataHandler('basicTypes', null, doneBasicTypes);
                            } else {
                                setTimeout(waitAppDatas, 300);
                            }
                        },
                        waitPrepared = function () {
                            if (context['status'] == 'prepared') {
                                require(['app-datas'], function () {
                                    waitAppDatas();
                                });
                            } else {
                                setTimeout(waitPrepared, 300);
                            }
                        };
                    waitPrepared();
                },
                /**
                 * 数据是否ready
                 */
                isDataReady: function () {
                    return appDataReady;
                },
                get: function (type, params, onData) {
                    if (!appDataReady) return null;
                    callDataHandler(type, params, onData);
                },
                do: function () {
                    this.get.apply(this, arguments);
                },
                currentModule: function() {
                    return context['current_module'];
                }
            };

        return ukApp;
    });