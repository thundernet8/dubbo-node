"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
function isLoopbackAddr(addr) {
    return (/^(::f{4}:)?127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/.test(addr) ||
        /^fe80::1$/.test(addr) ||
        /^::1$/.test(addr) ||
        /^::$/.test(addr));
}
exports.isLoopbackAddr = isLoopbackAddr;
function getIP() {
    var interfaces = os.networkInterfaces();
    return Object.keys(interfaces)
        .map(function (key) {
        var addrs = interfaces[key].filter(function (infos) {
            return (infos.family.toLowerCase() === "ipv4" &&
                !isLoopbackAddr(infos.address));
        });
        return addrs.length ? addrs[0].address : "";
    })
        .filter(function (addr) { return !!addr; })[0];
}
exports.getIP = getIP;
