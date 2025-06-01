// controllers/settings.controller.js
const { User, sequelize } = require('../models/config'); // User 모델 및 sequelize 인스턴스 경로 확인

/**
 * 현재 로그인한 사용자의 프로필 정보(닉네임, bio, 프로필 이미지 등)를 조회합니다.
 */
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.uid; // authMiddleware를 통해 주입된 사용자 ID

    if (!userId) {
      return res.status(401).json({ success: false, message: '사용자 인증이 필요합니다.' });
    }

    const userProfile = await User.findOne({
      where: { uid: userId },
      attributes: ['uid', 'nick_name', 'profile_image', 'bio', 'createdAt', 'updatedAt'] // 필요한 필드 선택
    });

    if (!userProfile) {
      return res.status(404).json({ success: false, message: '사용자 프로필을 찾을 수 없습니다.' });
    }

    const responseData = {
        uid: userProfile.uid,
        nickname: userProfile.nick_name,
        profile: userProfile.profile_image,
        bio: userProfile.bio,
    };
     res.status(200).json({
       success: true,
       message: "프로필 정보를 성공적으로 조회했습니다.",
       user: responseData
     });

  } catch (error) {
    console.error('내 프로필 정보 조회 중 오류 발생:', error);
    res.status(500).json({ success: false, message: '서버 오류로 프로필 정보를 조회할 수 없습니다.' });
  }
};

/**
 * 현재 로그인한 사용자의 자기소개(bio)를 업데이트합니다.
 */
exports.updateMyBio = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { bio } = req.body;

    if (bio === undefined) {
      return res.status(400).json({ success: false, message: 'bio 내용이 필요합니다.' });
    }

    const [updatedRows] = await User.update(
      { bio: bio },
      { where: { uid: userId } }
    );

    if (updatedRows > 0) {
      const updatedUser = await User.findOne({
        where: { uid: userId },
        attributes: ['uid', 'nick_name', 'profile_image', 'bio']
      });
      res.status(200).json({
        success: true,
        message: '자기소개가 성공적으로 업데이트되었습니다.',
        user: updatedUser
      });
    } else {
      res.status(404).json({ success: false, message: '사용자 정보를 찾을 수 없거나 변경된 내용이 없습니다.' });
    }
  } catch (error) {
    console.error('자기소개 업데이트 중 오류 발생:', error);
    res.status(500).json({ success: false, message: '서버 오류로 자기소개 업데이트에 실패했습니다.' });
  }
};

/**
 * 현재 로그인한 사용자의 프로필 이미지를 업데이트합니다.
 */
exports.updateMyProfileImage = async (req, res) => {
  try {
    const userId = req.user.uid;

    if (!req.file) {
      return res.status(400).json({ success: false, message: '업로드된 이미지 파일이 없습니다.' });
    }

    // 중요: 실제 운영 환경에서는 파일 저장 경로 및 URL 생성 로직을 환경에 맞게 구성해야 합니다.
    // 예를 들어, S3 등의 클라우드 스토리지를 사용하거나, 정적 파일 제공 설정을 고려해야 합니다.
    const newProfileImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;


    const [updatedRows] = await User.update(
      { profile_image: newProfileImageUrl },
      { where: { uid: userId } }
    );

    if (updatedRows > 0) {
      const updatedUser = await User.findOne({
          where: { uid: userId },
          attributes: ['uid', 'nick_name', 'profile_image', 'bio']
      });
      res.status(200).json({
        success: true,
        message: '프로필 이미지가 성공적으로 업데이트되었습니다.',
        user: updatedUser
      });
    } else {
      res.status(404).json({ success: false, message: '사용자 정보를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('프로필 이미지 업데이트 중 오류 발생:', error);
    res.status(500).json({ success: false, message: '서버 오류로 프로필 이미지 업데이트에 실패했습니다.' });
  }
};

/**
 * 현재 로그인한 사용자의 계정을 삭제합니다.
 * 데이터베이스에 ON DELETE CASCADE 설정이 올바르게 되어 있어야
 * 관련된 모든 데이터(일기, 댓글, 팔로우 관계 등)가 함께 삭제됩니다.
 */
exports.deleteMyAccount = async (req, res) => {
  const userId = req.user.uid; // authMiddleware를 통해 주입된 사용자 ID

  if (!userId) {
    return res.status(401).json({ success: false, message: '사용자 인증이 필요합니다. 다시 로그인해주세요.' });
  }

  // 데이터베이스 트랜잭션 시작
  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ success: false, message: '삭제할 사용자 정보를 찾을 수 없습니다.' });
    }

    // User 레코드 삭제 (ON DELETE CASCADE 설정에 따라 연관 데이터 자동 삭제 기대)
    await user.destroy({ transaction: t });

    // 트랜잭션 커밋
    await t.commit();

    // 세션/토큰 무효화 로직 (인증 방식에 따라 구현)
    // 예: req.session.destroy(...); 또는 토큰 블랙리스트 처리 등
    // 이 부분은 실제 사용하는 인증 메커니즘에 맞춰 구현해야 합니다.
    // 프론트엔드에서 응답을 받고 로그아웃 처리를 수행하도록 합니다.

    res.status(200).json({ success: true, message: '계정이 성공적으로 삭제되었습니다. 자동으로 로그아웃 됩니다.' });

  } catch (error) {
    // 오류 발생 시 트랜잭션 롤백
    await t.rollback();
    console.error('계정 삭제 처리 중 오류 발생:', error);
    res.status(500).json({ success: false, message: '계정 삭제 중 서버 오류가 발생했습니다. 나중에 다시 시도해주세요.' });
  }
};