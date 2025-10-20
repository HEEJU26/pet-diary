const express = require('express');
const Entry = require('../models/entry');
const asyncH = require('../utils/async');

const router = express.Router();

// 목록(최신순) + 검색/페이지네이션 옵션
router.get('/', asyncH(async (req, res) => {
  const { q, limit = 0, skip = 0 } = req.query;
  const filter = q
    ? { $or: [{ title: new RegExp(q, 'i') }, { content: new RegExp(q, 'i') }] }
    : {};
  const docs = await Entry.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip(Number(skip))
    .lean();

  const list = docs.map(d => ({ ...d, _id: d._id.toString() }));
  res.set('Cache-Control', 'no-store');
  res.json(list);
}));

// 등록
router.post('/', asyncH(async (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).send('title과 content는 필수입니다.');
  const entry = await Entry.create({
    title,
    content,
    date: new Date().toISOString().split('T')[0],
  });
  res.json({ message: '추가 완료!', entry });
}));

// 수정
router.patch('/:id', asyncH(async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).send('title과 content는 필수입니다.');
  const updated = await Entry.findByIdAndUpdate(id, { title, content }, { new: true });
  if (!updated) return res.status(404).send('수정할 데이터를 찾을 수 없습니다.');
  res.json({ message: '수정 완료', entry: updated });
}));

// 삭제
router.delete('/:id', asyncH(async (req, res) => {
  const { id } = req.params;
  const deleted = await Entry.findByIdAndDelete(id);
  if (!deleted) return res.status(404).send('삭제할 데이터를 찾을 수 없습니다.');
  res.json({ message: '삭제 완료' });
}));

module.exports = router;
