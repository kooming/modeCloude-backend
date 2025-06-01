const express = require('express');
const router = express.Router();
const { getEmotionStatsApp, getStreakStatsApp } = require('../controllers/stats.controller');
const authAppMiddleware = require('../middleware/authAppMiddleware');

// 감정 통계
router.get('/app/emotion', authAppMiddleware, getEmotionStatsApp);
// 스트릭 통계
router.get('/app/streak', authAppMiddleware, getStreakStatsApp);

module.exports = router; 