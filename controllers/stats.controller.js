const { Diary, DiaryEmotion, Emotion } = require('../models/config');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');

const getEmotionStatsApp = async (req, res) => {
  try {
    const userId = req.user.uid;
    const startDate = moment().subtract(90, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();
    const userEmotionCounts = await DiaryEmotion.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [startDate, endDate] },
        userEmotion: { [Op.ne]: null }
      },
      attributes: [
        'userEmotion', 
        [Sequelize.fn('COUNT', Sequelize.col('userEmotion')), 'count']
      ],
      group: ['userEmotion', 'userEmotionData.id', 'userEmotionData.name', 'userEmotionData.emoji', 'userEmotionData.color'],
      include: [{
        model: Emotion,
        as: 'userEmotionData',
        attributes: ['id', 'name', 'emoji', 'color']
      }]
    });

    const aiEmotionCounts = await DiaryEmotion.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [startDate, endDate] },
        selectEmotion: { [Op.ne]: null }
      },
      attributes: [
        'selectEmotion', 
        [Sequelize.fn('COUNT', Sequelize.col('selectEmotion')), 'count']
      ],
      group: ['selectEmotion', 'aiEmotionData.id', 'aiEmotionData.name', 'aiEmotionData.emoji', 'aiEmotionData.color'],
      include: [{
        model: Emotion,
        as: 'aiEmotionData',
        attributes: ['id', 'name', 'emoji', 'color']
      }]
    });
    
    const userStats = userEmotionCounts.map(item => {
      const emotion = item.userEmotionData;
      const result = {
        id: emotion?.id || item.userEmotion,
        name: emotion?.name || '알 수 없음',
        emoji: emotion?.emoji || '😐',
        color: emotion?.color || '#999999',
        count: parseInt(item.dataValues.count) || 0
      };
      return result;
    });
    
    const aiStats = aiEmotionCounts.map(item => {
      const emotion = item.aiEmotionData;
      const result = {
        id: emotion?.id || item.selectEmotion,
        name: emotion?.name || '알 수 없음',
        emoji: emotion?.emoji || '🤖',
        color: emotion?.color || '#999999',
        count: parseInt(item.dataValues.count) || 0
      };
      return result;
    });
    
    const responseData = {
      userEmotions: userStats,
      aiEmotions: aiStats,
      totalUserEntries: userStats.reduce((sum, item) => sum + item.count, 0),
      totalAiEntries: aiStats.reduce((sum, item) => sum + item.count, 0)
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: '감정 통계 조회 실패' });
  }
};


const getStreakStatsApp = async (req, res) => {
  try {
    const userId = req.user.uid;
    const startDate = moment().subtract(1, 'year').startOf('day').toDate();
    const diaries = await Diary.findAll({
      where: {
        user_id: userId,
        createdAt: { [Op.gte]: startDate },
      },
      attributes: ['createdAt'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });
    
    const dateSet = new Set(diaries.map(d => moment(d.createdAt).format('YYYY-MM-DD')));
    const dateArr = Array.from(dateSet).sort();
    let bestStreak = 0, currentStreak = 0, totalDays = dateArr.length;
    let prev = null;
    
    for (let i = 0; i < dateArr.length; i++) {
      if (prev) {
        const diff = moment(dateArr[i]).diff(moment(prev), 'days');
        if (diff === 1) {
          currentStreak++;
        } else {
          bestStreak = Math.max(bestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prev = dateArr[i];
    }
    bestStreak = Math.max(bestStreak, currentStreak);
    
    
    const today = moment().format('YYYY-MM-DD');
    if (dateArr.length === 0 || dateArr[dateArr.length - 1] !== today) {
      currentStreak = 0;
    }
    
    const result = { totalDays, bestStreak, currentStreak };
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '스트릭 통계 조회 실패' });
  }
};

module.exports = { getEmotionStatsApp, getStreakStatsApp }; 