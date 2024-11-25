import { Server } from "socket.io";

let io;

export const initIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.CLIENT, "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A client connected");
    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
