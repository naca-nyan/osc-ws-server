import { RawData, Server } from "ws";

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

function getUser(url?: string): string {
  const unknown = "unknown user";
  if (url === undefined) return unknown;
  const base = "https://example.com";
  const u = new URL(url, base);
  const user = u.searchParams.get("user");
  return user ?? unknown;
}

server.on("connection", (ws, request) => {
  const user = getUser(request.url);
  log({ event: "new connection", user });
  ws.onmessage = (message) => {
    const body = message.data;
    console.log(body);
    log({ event: "message", user, body });
    server.clients.forEach((client) => {
      client.send(body);
    });
  };
  ws.onclose = () => {
    log({ event: "closed", user });
  };
});
