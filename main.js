"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var ws_1 = require("ws");
var config = {
    port: 5000
};
var server = new ws_1.Server(config);
var log = function (obj) {
    var log = __assign({ timestamp: new Date().toISOString() }, obj);
    console.log(JSON.stringify(log));
};
function getUser(url) {
    var unknown = "unknown user";
    if (url === undefined)
        return unknown;
    var base = "https://example.com";
    var u = new URL(url, base);
    var user = u.searchParams.get("user");
    return user !== null && user !== void 0 ? user : unknown;
}
server.on("connection", function (ws, request) {
    var user = getUser(request.url);
    log({ event: "new connection", user: user });
    ws.onmessage = function (message) {
        var body = message.data;
        log({ event: "message", user: user, body: body });
        server.clients.forEach(function (client) {
            client.send(body);
        });
    };
    ws.onclose = function () {
        log({ event: "closed", user: user });
    };
});
