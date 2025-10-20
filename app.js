require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const morgan   = require('morgan');
const cors     = require('cors');

const entriesRouter = require('./routes/entries');

const app  = express();
const PORT = process.env.PORT ?? 3000;

// 공통 미들웨어
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'));

// API 라우트
app.use('/api/entries', entriesRouter);

// 404 핸들러
app.use((req, res) => res.status(404).send('Not Found'));

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  res.status(500).send('서버 오류');
});

// DB 연결 후 서버 시작
(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ .env에 MONGODB_URI가 없습니다.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
    app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
  } catch (e) {
    console.error('❌ DB 연결 실패:', e);
    process.exit(1);
  }
})();
