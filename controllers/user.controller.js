const { User, Follow } = require('../models/config');

// 앱에서 자기소개 수정 요청 처리
const userInfoUpdateApp = async (req, res) => {
  try {
    const { uid, bio } = req.query;
    if (!uid || typeof bio !== 'string') {
      return res.status(400).json({ success: false, message: 'uid와 bio는 필수입니다.' });
    }
    const user = await User.findByPk(uid);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }
    user.bio = bio;
    await user.save();
    res.json({ success: true, message: '자기소개가 성공적으로 수정되었습니다.', bio: user.bio });
  } catch (err) {
    console.error('userInfoUpdateApp 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류로 자기소개 수정에 실패했습니다.' });
  }
};

// 앱용 팔로워 목록
const getFollowersListApp = async (req, res) => {
  const { uid } = req.query;
  try {
    const followers = await Follow.findAll({
      where: { following_id: uid },
      include: [{ model: User, as: 'follower', attributes: ['uid', 'nick_name', 'profile_image'] }]
    });
    res.json(followers.map(f => f.follower));
  } catch (err) {
    res.status(500).json({ message: '팔로워 목록 조회 실패' });
  }
};

// 앱용 팔로잉 목록
const getFollowingsListApp = async (req, res) => {
  const { uid } = req.query;
  try {
    const followings = await Follow.findAll({
      where: { follower_id: uid },
      include: [{ model: User, as: 'following', attributes: ['uid', 'nick_name', 'profile_image'] }]
    });
    res.json(followings.map(f => f.following));
  } catch (err) {
    res.status(500).json({ message: '팔로잉 목록 조회 실패' });
  }
};

module.exports = { userInfoUpdateApp, getFollowersListApp, getFollowingsListApp }; 