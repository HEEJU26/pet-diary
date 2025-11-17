// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/user'); // models/user.js 필요

// 디버그용 핑
router.get('/ping', (req, res) => {
  res.json({ ok: true, route: 'users' });
});

// 회원가입
// 로그인
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 로그인 요청 body:', req.body);   // ⭐️ 추가
    console.log('username:', username, 'password:', password); // ⭐️ 추가

    if (!username || !password) {
      return res.status(400).json({ message: '아이디/비밀번호를 입력하세요.' });
    }

    const user = await User.findOne({ username, password });
    console.log('찾은 user:', user); // ⭐️ 추가

    if (!user) return res.status(401).json({ message: '로그인 실패: 아이디 또는 비밀번호가 틀렸습니다.' });

    res.json({ message: '로그인 성공' });
  } catch (err) {
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
