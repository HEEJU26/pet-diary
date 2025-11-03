// ==============================
// [1] 기본 설정
// ==============================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Express & HTTP 서버
const app = express();
const server = http.createServer(app);

// Socket.IO (CORS: 3000/3001 허용)
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }
});

// ==============================
// [2] 미들웨어
// ==============================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 정적 파일 (이 서버가 3000에서 chat.html도 서비스함)
app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// [3] MongoDB 연결
// ==============================
const MONGODB_URI = process.env.MONGODB_URI;
(async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ MongoDB 연결 성공');
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err.message);
  }
})();

// ==============================
// [4] 사용자 라우터 (로그인/회원가입 등)
// ==============================
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// ==============================
// [5] 기본 라우팅
// ==============================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// ==============================
// [6] Socket.IO 이벤트
// ==============================
io.on('connection', (socket) => {
  console.log('👋 새로운 유저 접속');

  socket.on('chat message', (msg) => {
    // 받은 메시지를 모든 클라이언트에 브로드캐스트
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('❌ 유저 나감');
  });
});

// ==============================
// [7] 서버 시작
// ==============================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

// (옵션) 포트 충돌 시 친절 로그
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ 포트 ${PORT} 이미 사용 중입니다.`);
  } else {
    console.error(err);
  }
});
