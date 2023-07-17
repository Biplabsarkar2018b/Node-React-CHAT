import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";

const app = express();

app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origins: [
      "http://127.0.0.1:5173",
      "https://node-react-chat-25v6.vercel.app/",
    ],
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Working Fine");
});
const onlineUsers = {};
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("join", (user) => {
    onlineUsers[socket.id] = {
      id: socket.id,
      name: user.name,
      status: "active",
    };
    socket.broadcast.emit("user_join", onlineUsers[socket.id]);
  });
  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    socket.broadcast.emit("user_leave", socket.id);
  });
  socket.on("send_private_message", ({ message, to }) => {
    const receiver = onlineUsers[to];
    if (receiver) {
      io.to(to).emit("receive_private_message", { message, from: socket.id });
    }
  });
  socket.on("send_message", (data) => {
    // console.log(data);
    socket.broadcast.emit("receive_message", data);
  });
});

server.listen(3000, () => {
  console.log("Server is running at 3000");
});
