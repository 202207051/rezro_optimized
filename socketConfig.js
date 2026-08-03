import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middleware/socketMiddleware.js";
import { registerSocketHandlers } from "../sockets/socketController.js";

export const socketConfig = Object.freeze({
  maxMessageLength: 500,
  recentMessageLimit: 50,
  defaultRoom: "room_lobby",
});

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => registerSocketHandlers(io, socket));

  return io;
}