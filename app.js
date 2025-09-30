// app.js (서버)
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = 3000;

// 중요: 데이터 파일 경로
const DATA_FILE = path.join(__dirname, 'data', 'entries.json');

// 미들웨어
app.use(express.json()); // JSON 바디 파싱
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 제공

// 공통 함수
async function readEntries() {
  try {
    const text = await fs.readFile(DATA_FILE, 'utf8');
    const arr = JSON.parse(text);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    if (e.code === 'ENOENT') return []; // 파일 없으면 빈 배열
    throw e;
  }
}

async function writeEntries(list) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// 1) 목록 조회: GET /api/entries
app.get('/api/entries', async (req, res) => {
  try {
    const list = await readEntries();
    // 날짜 기준 최신순 정렬(작성일 date 또는 createdAt 기준)
    list.sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '서버 오류(목록 조회)' });
  }
});

// 2) 작성: POST /api/entries  {title, content, date?}
app.post('/api/entries', async (req, res) => {
  try {
    const { title, content, date } = req.body || {};
    if (!title || !content) {
      return res.status(400).json({ message: 'title과 content는 필수입니다.' });
    }
    const list = await readEntries();
    const entry = {
      id: randomUUID(),
      title: String(title),
      content: String(content),
      date: date ? String(date) : new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      createdAt: new Date().toISOString()
    };
    list.push(entry);
    await writeEntries(list);
    res.status(201).json(entry);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '서버 오류(작성)' });
  }
});

// 3) 삭제: DELETE /api/entries/:id
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const list = await readEntries();
    const next = list.filter(e => e.id !== id);
    if (next.length === list.length) {
      return res.status(404).json({ message: '해당 id가 없습니다.' });
    }
    await writeEntries(next);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '서버 오류(삭제)' });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 서버 실행: http://localhost:${PORT}`);
});
