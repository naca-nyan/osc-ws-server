"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var globalId = 0;
function getId() {
    return globalId++;
}
var WebSocket = /** @class */ (function (_super) {
    __extends(WebSocket, _super);
    function WebSocket() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return WebSocket;
}(ws_1.WebSocket));
server.on("connection", function (ws, request) {
    var _a = getParams(request.url), user = _a.user, room = _a.room;
    var id = getId();
    ws.id = id;
    var event = { event: "connection", user: user, room: room, id: id };
    ws.send(JSON.stringify({ event: "id", id: id, user: user, room: room }));
    log(event);
    server.clients.forEach(function (client) {
        if (client.id === id)
            return;
        var body = JSON.stringify(event);
        client.send(body);
    });
    ws.onmessage = function (message) {
        var body = JSON.parse(message.data.toString());
        var event = { event: "message", user: user, room: room, body: body };
        log(event);
        var to = body.to;
        server.clients.forEach(function (client) {
            if (client.id === id)
                return;
            if (to !== undefined && client.id !== to)
                return;
            client.send(JSON.stringify(event));
        });
    };
    ws.onclose = function () {
        var event = { event: "closed", user: user, room: room, id: id };
        server.clients.forEach(function (client) {
            if (client.id === id)
                return;
            client.send(JSON.stringify(event));
        });
        log(event);
    };
});
