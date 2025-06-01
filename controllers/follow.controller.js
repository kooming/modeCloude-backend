const { Follow } = require('../models/config');
    
// 팔로우 생성 
createFollow = async (req, res) => {
  const { follower_id, following_id } = req.body;

  try {
    if (!follower_id || !following_id) {
      return res.status(400).json({ message: '필수 정보 누락' });
    }

    if (follower_id === following_id) {
      return res.status(400).json({ message: '자기 자신은 팔로우할 수 없습니다.' });
    }

    const existing = await Follow.findOne({
      where: { follower_id, following_id },
    });

    if (existing) {
      return res.status(400).json({ message: '이미 팔로우 중입니다.' });
    }

    await Follow.create({ follower_id, following_id });
    res.status(201).json({ message: '팔로우 성공' });
  } catch (err) {
    console.error('팔로우 에러', err);
    res.status(500).json({ message: '서버 에러' });
  }
};

  // 팔로우 체크
  checkFollow = async (req, res) => {
    const { follower, following } = req.query;
  
    try {
      const isFollow = await Follow.findOne({ where: { follower_id: follower, following_id: following } });
      res.json({ isFollowed: !!isFollow });
    } catch (err) {
      res.status(500).json({ message: '서버 에러' });
    }
  };
  
  // 팔로우 삭제 
  deleteFollow = async (req, res) => {
    const { follower_id, following_id } = req.body;
  
    try {
      const deleted = await Follow.destroy({ where: { follower_id, following_id } });
      if (deleted) {
        res.json({ message: '언팔로우 완료' });
      } else {
        res.status(404).json({ message: '팔로우 정보 없음' });
      }
    } catch (err) {
      res.status(500).json({ message: '서버 에러' });
    }
  };

  module.exports = {createFollow, checkFollow ,deleteFollow}