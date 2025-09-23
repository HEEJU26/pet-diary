// app.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// 데이터 파일 경로
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'entries.json');

// 데이터 폴더/파일 보장 생성
if (!fsSync.existsSync(DATA_DIR)) {
  fsSync.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fsSync.existsSync(DATA_FILE)) {
  fsSync.writeFileSync(DATA_FILE, '[]');
}

app.use(express.json({ limit: '1mb' }));

// 정적 파일 제공 (public/index.html 자동 서빙)
app.use(express.static(path.join(__dirname, 'public')));

// 유틸: 파일 읽기/쓰기
async function readEntries() {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(text);
  } catch (e) {
    return [];
  }
}
async function writeEntries(entries) {
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

// API: 일기 목록 조회
app.get('/api/entries', async (req, res) => {
  const entries = await readEntries();
  // 최신 작성 순으로 정렬
  entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(entries);
});

// API: 일기 추가
app.post('/api/entries', async (req, res) => {
  const { date, petName, title, content, mood } = req.body || {};
  // 간단 검증
  if (!date || !petName || !title || !content) {
    return res.status(400).json({ error: 'date, petName, title, content는 필수입니다.' });
  }

  const newEntry = {
    id: randomUUID(),
    date,        // 사용자가 적은 날짜 (YYYY-MM-DD)
    petName,
    title,
    content,
    mood: mood || 'normal',
    createdAt: new Date().toISOString()
  };

  const entries = await readEntries();
  entries.push(newEntry);
  await writeEntries(entries);

  res.status(201).json(newEntry);
});

// (선택) 일기 삭제
app.delete('/api/entries/:id', async (req, res) => {
  const { id } = req.params;
  const entries = await readEntries();
  const next = entries.filter(e => e.id !== id);
  if (next.length === entries.length) {
    return res.status(404).json({ error: '해당 ID의 일기가 없습니다.' });
  }
  await writeEntries(next);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✅ Pet Diary server running: http://localhost:${PORT}`);
});
