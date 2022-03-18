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
  roomOf(id: number) {
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
  const clients = space.roomInfo(room);
  const event = { event: "room", id, user, room, clients };
  log(event);
  ws.send(JSON.stringify(event));
  server.clients.forEach((client: WebSocket) => {
    if (client.id === id) return;
    const event = { event: "connection", user, room, id };
    const body = JSON.stringify(event);
    client.send(body);
  });
  ws.onmessage = (message) => {
    const body = JSON.parse(message.data.toString());
    const event = { event: "message", user, room, body };
    log(event);
    const to = body.to as number | undefined;
    server.clients.forEach((client: WebSocket) => {
      if (client.id === id) return;
      if (to !== undefined && client.id !== to) return;
      client.send(JSON.stringify(event));
    });
  };
  ws.onclose = () => {
    const event = { event: "closed", user, room, id };
    server.clients.forEach((client: WebSocket) => {
      client.send(JSON.stringify(event));
    });
    log(event);
    space.delUser(id);
  };
});
