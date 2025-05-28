const { Emotion } = require('../models/config');

const getEmotions = async (req, res) => {
  try {
    const emotions = await Emotion.findAll({
      attributes: ['id', 'name', 'emoji', 'color'],
      order: [['id', 'ASC']]
    });
    res.json(emotions);
  } catch (err) {
    console.error('감정 리스트 가져오기 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
};

module.exports = { getEmotions };
