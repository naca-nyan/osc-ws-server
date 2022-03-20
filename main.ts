import { Server, WebSocket as WebSocketBase } from "ws";

const config = {
  port: 5000,
};

const server = new Server(config);

const log = (obj: object) => {
  const log = {
    timestamp: new Date().toISOString(),
    ...obj,
  };
  console.log(JSON.stringify(log));
};

log({ event: "server started" });

function getParams(url?: string) {
  const res = { user: "unknown user", room: "default" };
  if (url === undefined) return res;
  const base = "ws://localhost";
  const params = new URL(url, base).searchParams;
  res.user = params.get("user") ?? res.user;
  res.room = params.get("room") ?? res.room;
  return res;
}

let globalId = 0;
function getId() {
  return globalId++;
}

class WebSocket extends WebSocketBase {
  id?: number;
}

interface Client {
  id: number;
  user: string;
}

class Room {
  _roomOf = new Map<number, string>();
  _roomInfo = new Map<string, Client[]>();
  roomOf(id?: number) {
    if (id === undefined) return "";
    const room = this._roomOf.get(id);
    return room ?? "";
  }
  roomInfo(room: string) {
    const info = this._roomInfo.get(room);
    return info ?? [];
  }
  addUser(room: string, id: number, user: string) {
    this._roomOf.set(id, room);
    const info = this.roomInfo(room);
    info.push({ id, user });
    this._roomInfo.set(room, info);
  }
  delUser(id: number) {
    const room = this.roomOf(id);
    const info = this.roomInfo(room);
    const filtered = info.filter((c) => c.id !== id);
    this._roomInfo.set(room, filtered);
  }
}

const space = new Room();

server.on("connection", (ws: WebSocket, request) => {
  const { user, room } = getParams(request.url);
  const id = getId();
  ws.id = id;
  space.addUser(room, id, user);
  const roomInfo = space.roomInfo(room);
  const event = { event: "updateRoom", id, roomInfo, user, room };
  log(event);
  ws.send(JSON.stringify(event));
  server.clients.forEach((client: WebSocket) => {
    if (client.id === id) return;
    if (space.roomOf(client.id) !== room) return;
    const event = { event: "updateRoom", roomInfo };
    const body = JSON.stringify(event);
    client.send(body);
  });
  ws.onmessage = (message) => {
    const body = JSON.parse(message.data.toString());
    const event = { event: "message", id, user, room, body };
    log(event);
    const to = body.to as number | undefined;
    server.clients.forEach((client: WebSocket) => {
      if (space.roomOf(client.id) !== room) return;
      if (to !== undefined && client.id !== to) return;
      client.send(JSON.stringify(event));
    });
  };
  ws.onclose = () => {
    space.delUser(id);
    const roomInfo = space.roomInfo(room);
    log({ event: "close", id });
    const event = { event: "updateRoom", room, roomInfo };
    server.clients.forEach((client: WebSocket) => {
      if (space.roomOf(client.id) !== room) return;
      client.send(JSON.stringify(event));
    });
  };
});
