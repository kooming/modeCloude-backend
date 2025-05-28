const { User, Diary, Follow } = require('../models/config');


 saveKakaoUser = async (kakaoId, nickname, profile) => {
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

    res.json({
      success: true,
      data: { diaryCount, followerCount, followingCount }
    });
  } catch (err) {
    console.error('작성자 통계 조회 실패:', err);
    res.status(500).json({ success: false, message: '조회 실패' });
  }
};




// const getUserStats = async (req, res) => {
//   try {
//     const userId = req.user.uid;
//     console.log('📌 userId:', userId);
//     const diaryCount = await Diary.count({ where: { user_id: userId } });
//     const followerCount = await Follow.count({ where: { following_id: userId } });
//     const followingCount = await Follow.count({ where: { follower_id: userId } });
//     console.log('📊 followerCount:', followerCount);
//     console.log('📊 followingCount:', followingCount);
//     res.json({
//       success: true,
//       data: {
//         diaryCount,
//         followerCount,
//         followingCount,
//       },
//     });
//   } catch (err) {
//     console.error('통계 정보 조회 실패:', err);
//     res.status(500).json({ success: false, message: '정보 조회 실패' });
//   }
// };

module.exports = { saveKakaoUser, getUserStatsById };
