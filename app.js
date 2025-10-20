// 📌 .env 파일 읽기
require('dotenv').config();

// 📌 필요한 모듈 가져오기
const express = require('express');
const mongoose = require('mongoose');

// 📌 Express 앱 생성
const app = express();
const PORT = process.env.PORT ?? 3000;

// 📌 미들웨어 설정
app.use(express.static('public'));   // public 폴더의 정적 파일 사용
app.use(express.json());             // JSON 형식 요청 본문 처리

// 📌 MongoDB 연결 함수
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ .env에 MONGODB_URI가 없습니다.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri); // 연결 시도
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB 연결 실패:', err);
    process.exit(1);
  }
}

// 📌 데이터 스키마 & 모델 정의
const entrySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    date: { type: String, required: true } // YYYY-MM-DD 형식
  },
  { timestamps: true } // 자동으로 createdAt, updatedAt 추가
);

const Entry = mongoose.model('Entry', entrySchema);

// 📌 API 라우트
// 모든 일기 목록 가져오기
// GET: 목록 (항상 _id 포함 + 문자열 변환 + 캐시 끄기)
app.get('/api/entries', async (req, res) => {
  try {
    const raw = await Entry.find()
      .sort({ createdAt: -1 })
      .select({ title: 1, content: 1, date: 1, _id: 1 }) // _id 확실히 포함
      .lean();

    const list = raw.map(d => ({
      ...d,
      _id: d?._id?.toString ? d._id.toString() : String(d._id),
    }));

    res.set('Cache-Control', 'no-store');
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).send('목록 조회 실패');
  }
});

// POST: 등록 (DB에 저장)
app.post('/api/entries', async (req, res) => {
  try {
    const { title, content } = req.body || {};
    if (!title || !content) return res.status(400).send('title과 content는 필수입니다.');
    const entry = await Entry.create({
      title,
      content,
      date: new Date().toISOString().split('T')[0],
    });
    res.json({ message: '추가 완료!', entry });
  } catch (err) {
    console.error(err);
    res.status(500).send('등록 실패');
  }
});


// 📌 기존 코드 상단 부분은 그대로 두고 아래쪽에 이 부분 추가

// 일기 삭제
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Entry.findByIdAndDelete(id);
    if (!deleted) return res.status(404).send('삭제할 데이터를 찾을 수 없습니다.');
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error(err);
    res.status(500).send('삭제 실패');
  }
});

// 일기 수정
app.patch('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body || {};
    const updated = await Entry.findByIdAndUpdate(id, { title, content }, { new: true });
    if (!updated) return res.status(404).send('수정할 데이터를 찾을 수 없습니다.');
    res.json({ message: '수정 완료', entry: updated });
  } catch (err) {
    console.error(err);
    res.status(500).send('수정 실패');
  }
});

// 📌 서버 시작 (DB 연결 후)
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 서버 실행 중: http://localhost:${PORT}`));
});
