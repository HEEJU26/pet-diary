const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  filename: { type: String, required: true },       // 서버에 저장된 파일 이름
  originalname: { type: String, required: true },   // 원래 파일 이름
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Photo', photoSchema);