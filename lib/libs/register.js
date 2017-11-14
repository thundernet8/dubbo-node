/**
 * Created by panzhichao on 16/6/30.
 */
"use strict";
var url = require("url");
var os = require("os");
var Path = require("path");
function consumer() {
    var self = this;
    var paths = [];
    var host = ip();
    var dependencies = self.dependencies;
    var serv; //临时存储服务
    var info = {
        protocol: "consumer",
        slashes: "true",
        host: "",
        query: {
            application: self.application.name,
            category: "consumers",
            check: "false",
            dubbo: self.dubboVer,
            interface: "",
            revision: "",
            version: "",
            side: "consumer",
            timestamp: new Date().getTime()
        }
    };
    for (var s in dependencies) {
        if (dependencies.hasOwnProperty(s)) {
            serv = dependencies[s];
        }
        info.host = host + "/" + serv.interface;
        info.query.interface = serv.interface;
        info.query.revision = serv.version;
        info.query.version = serv.version;
        info.query.group = serv.group;
        paths.push("/" + self._root + "/" + serv.interface + "/consumers/" + encodeURIComponent(url.format(info)));
    }
    for (var i = 0, l = paths.length; i < l; i++) {
        (function (path) {
            //检查consumers目录状态，确保存在之后再创建consumers目录下面的节点
            createConsumers(self.client, path)
                .then(function () {
                self.client.exists(path, function (err, stat) {
                    if (err) {
                        console.error("Reg consumer failed:" + err.stack);
                        return;
                    }
                    if (stat) {
                        console.log("Node exists.");
                        return;
                    }
                    self.client.create(path, CREATE_MODES.EPHEMERAL, function (err, node) {
                        if (err) {
                            console.error("Reg consumer failed:" + err.stack);
                        }
                    });
                });
            })
                .catch(function (err) {
                //创建consumers失败
                console.error("Create consumer node failed: " + err.stack);
            });
        })(paths[i]);
    }
}
exports.consumer = consumer;
