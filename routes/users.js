// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/user'); // models/user.js 필요

// 디버그용 핑
router.get('/ping', (req, res) => {
  res.json({ ok: true, route: 'users' });
});

// 회원가입
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: '필수 입력 누락' });
    const user = new User({ username, password });
    await user.save();
    res.json({ message: '회원가입 성공!' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: '이미 존재하는 아이디' });
    next(err);
  }
});

// 로그인
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ message: '로그인 실패' });
    res.json({ message: '로그인 성공' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
