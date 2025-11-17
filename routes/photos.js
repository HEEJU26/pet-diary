// routes/photos.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Photo = require('../models/photo');

// 저장 방식 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 업로드 폴더
  },
  filename: (req, file, cb) => {
    // 겹치지 않게 현재 시간 + 원본이름
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

// 📸 사진 업로드
// POST /api/photos
router.post('/', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '파일이 없습니다.' });
    }

    const doc = await Photo.create({
      filename: req.file.filename,
      originalname: req.file.originalname
    });

    res.json({ message: '업로드 성공', photo: doc });
  } catch (err) {
    next(err);
  }
});

// 📸 사진 목록 조회
// GET /api/photos
router.get('/', async (req, res, next) => {
  try {
    const list = await Photo.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
