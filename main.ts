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

server.on("connection", (ws: WebSocket, request) => {
  const { user, room } = getParams(request.url);
  const id = getId();
  ws.id = id;
  const event = { event: "connection", user, room, id };
  ws.send(JSON.stringify({ event: "id", id, user, room }));
  log(event);
  server.clients.forEach((client: WebSocket) => {
    if (client.id === id) return;
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
      if (client.id === id) return;
      client.send(JSON.stringify(event));
    });
    log(event);
  };
});
