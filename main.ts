import { Server } from "ws";

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

server.on("connection", (ws, request) => {
  const { user, room } = getParams(request.url);
  const event = { event: "connection", user, room };
  log(event);
  server.clients.forEach((client) => {
    const body = JSON.stringify(event);
    client.send(body);
  });
  ws.onmessage = (message) => {
    const body = JSON.parse(message.data.toString());
    const event = { event: "message", user, room, body };
    log(event);
    server.clients.forEach((client) => {
      client.send(JSON.stringify(body));
    });
  };
  ws.onclose = () => {
    log({ event: "closed", user, room });
  };
});
