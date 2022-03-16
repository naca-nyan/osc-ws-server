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
log({ event: "server started" });
function getParams(url) {
    var _a, _b;
    var res = { user: "unknown user", room: "default" };
    if (url === undefined)
        return res;
    var base = "ws://localhost";
    var params = new URL(url, base).searchParams;
    res.user = (_a = params.get("user")) !== null && _a !== void 0 ? _a : res.user;
    res.room = (_b = params.get("room")) !== null && _b !== void 0 ? _b : res.room;
    return res;
}
server.on("connection", function (ws, request) {
    var _a = getParams(request.url), user = _a.user, room = _a.room;
    var event = { event: "connection", user: user, room: room };
    log(event);
    server.clients.forEach(function (client) {
        var body = JSON.stringify(event);
        client.send(body);
    });
    ws.onmessage = function (message) {
        var body = JSON.parse(message.data.toString());
        var event = { event: "message", user: user, room: room, body: body };
        log(event);
        server.clients.forEach(function (client) {
            client.send(JSON.stringify(body));
        });
    };
    ws.onclose = function () {
        log({ event: "closed", user: user, room: room });
    };
});
