import { io } from "../../server";

let clientsData = [];
let socketss = [];

io.on("connection", (socket) => {
  socketss.push(socket);
  // Add client data when a client connects
  clientsData = clientsData.filter((data) => data.socketId !== socket.id);
  clientsData.push({ socketId: socket.id, data: null });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Remove client data when a client disconnects
    clientsData = clientsData.filter((data) => data.socketId != socket.id);
    socketss = socketss.filter((data) => data.id != socket.id);
  });
});
