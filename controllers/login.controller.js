const { User, Diary, Follow } = require('../models/config');
const { Op } = require('sequelize')

const saveKakaoUser = async (kakaoId, nickname, profile) => {
  try {
    const [user, created] = await User.findOrCreate({
      where: { uid: kakaoId },                     
      defaults: { nick_name: nickname, profile_image: profile },
    });

    if (
      !created &&
      (user.nick_name !== nickname || user.profile_image !== profile)
    ) {
      await user.update({ nick_name: nickname, profile_image: profile });
    }

    return { ok: true, user };            
  } catch (err) {
    console.error(err);
    return { ok: false, message: 'DB 저장 실패' };
  }
};

const getUserStatsById = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const diaryCount = await Diary.count({ where: { user_id: userId } });
    const followerCount = await Follow.count({ where: { following_id: userId } });
    const followingCount = await Follow.count({ where: { follower_id: userId } });

      const user = await User.findByPk(userId, {
        attributes: ['bio'] 
      });

    res.json({
      success: true,
      data: { diaryCount, followerCount, followingCount }
    });
  } catch (err) {
    console.error('작성자 통계 조회 실패:', err);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};

// 검색
 const searchUsersByNickname = async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.findAll({
      where: {
        nick_name: { [Op.like]: `%${q}%` }
      },
      attributes: ['uid', 'nick_name', 'profile_image']
    });
    res.json({ users });
  } catch (err) {
    console.error('유저 검색 실패:', err);
    res.status(500).json({ message: '검색 실패' });
  }
};

 const getUserById = async (req, res) => {
  try {
    const uid = Number(req.params.id);
    const user = await User.findByPk(uid, {
      attributes: ['uid', 'nick_name', 'profile_image', 'bio']
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' });
    }

    res.json(user);
  } catch (err) {
    console.error('유저 조회 실패:', err);
    res.status(500).json({ success: false, message: '유저 조회 중 오류 발생' });
  }
};


module.exports = { saveKakaoUser, getUserStatsById, searchUsersByNickname, getUserById };
