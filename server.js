const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('لاعب متصل:', socket.id);

    socket.on('join-room', ({ roomId, playerName, role }) => {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.playerName = playerName;
        
        // إذا كان اللاعب مافيا، ينضم لغرفة سرية خاصة بهم
        if (role === 'mafia') {
            socket.join(`${roomId}_mafia`);
        }

        // إبلاغ الغرفة بانضمام لاعب جديد
        io.to(roomId).emit('player-joined', { name: playerName, id: socket.id });
        console.log(`${playerName} انضم للغرفة: ${roomId}`);
    });

    socket.on('send-msg', ({ roomId, msg, type, sender }) => {
        // التحقق من نوع المحادثة
        if (type === 'mafia') {
            io.to(`${roomId}_mafia`).emit('receive-msg', { msg, sender, type });
        } else if (type === 'global') {
            io.to(roomId).emit('receive-msg', { msg, sender, type });
        }
    });

    socket.on('sync-game', (data) => {
        // مزامنة توزيع الأدوار وبدء المراحل
        io.to(data.roomId).emit('update-game', data);
    });

    socket.on('disconnect', () => {
        console.log('لاعب غادر');
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));