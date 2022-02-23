import { Server } from "ws";

const config = {
  port: 5000,
};

const server = new Server(config);

server.on("connection", (ws) => {
  const log = {
    timestamp: new Date().toISOString(),
    message: "new client connected",
  };
  console.log(JSON.stringify(log));
  ws.on("message", (message) => {
    server.clients.forEach((client) => {
      client.send(message.toString());
    });
  });
});
