const { User, Diary, Follow } = require('../models/config');
const { Op } = require('sequelize')

// const saveKakaoUser = async (kakaoId, nickname, profile) => {
//   try {
//     const [user, created] = await User.findOrCreate({
//       where: { uid: kakaoId },                     
//       defaults: { nick_name: nickname, profile_image: profile },
//     });

//     if (
//       !created &&
//       (user.nick_name !== nickname || user.profile_image !== profile)
//     ) {
//       await user.update({ nick_name: nickname, profile_image: profile });
//     }

//     return { ok: true, user };            
//   } catch (err) {
//     console.error(err);
//     return { ok: false, message: 'DB 저장 실패' };
//   }
// };

const saveKakaoUser = async (kakaoId, nickname, profile) => {
  try {
    console.log('================================');
    console.log('=== saveKakaoUser 함수 시작 ===');
    console.log('================================');
    console.log('입력 파라미터:');
    console.log('- kakaoId:', kakaoId, '(타입:', typeof kakaoId, ')');
    console.log('- nickname:', nickname, '(타입:', typeof nickname, ')');
    console.log('- profile:', profile, '(타입:', typeof profile, ')');
    
    console.log('\n--- User.findOrCreate 실행 전 ---');
    console.log('where 조건:', { uid: kakaoId });
    console.log('defaults 값:', { 
      uid: kakaoId,
      nick_name: nickname, 
      profile_image: profile,
    });

    const [user, created] = await User.findOrCreate({
      where: { uid: kakaoId },
      defaults: { 
        uid: kakaoId,
        nick_name: nickname, 
        profile_image: profile,
      },
    });

    console.log('\n--- User.findOrCreate 실행 후 ---');
    console.log('created (신규 생성 여부):', created);
    console.log('user 객체:', {
      uid: user.uid,
      nick_name: user.nick_name,
      profile_image: user.profile_image,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

    if (!created) {
      console.log('\n--- 기존 사용자 정보 비교 ---');
      console.log('기존 nickname:', user.nick_name, '/ 새 nickname:', nickname);
      console.log('기존 profile:', user.profile_image, '/ 새 profile:', profile);
      console.log('nickname 변경 필요:', user.nick_name !== nickname);
      console.log('profile 변경 필요:', user.profile_image !== profile);
      
      if (user.nick_name !== nickname || user.profile_image !== profile) {
        console.log('사용자 정보 업데이트 시작...');
        const updateResult = await user.update({ nick_name: nickname, profile_image: profile });
        console.log('업데이트 결과:', updateResult.dataValues);
      }
    }

    console.log('\n=== saveKakaoUser 성공 ===');
    return { ok: true, user };            
  } catch (err) {
    console.log('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('=== saveKakaoUser 오류 발생 ===');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('오류 이름:', err.name);
    console.log('오류 메시지:', err.message);
    console.log('오류 스택:', err.stack);
    
    if (err.errors) {
      console.log('Sequelize 에러 상세:');
      err.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message} (필드: ${error.path})`);
      });
    }
    
    if (err.original) {
      console.log('원본 DB 오류:', err.original);
    }
    
    return { ok: false, message: `DB 저장 실패: ${err.message}` };
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
