const { Follow, User } = require('../models/config');

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
// 전체 팔로우 조회
getFollowLists = async (req, res) => {
  try {
    const currentUserId = req.user.uid;

    if (!currentUserId) {
      return res.status(401).json({ message: '사용자 인증이 필요합니다.' });
    }


    const userWithFollowData = await User.findByPk(currentUserId, {
      attributes: ['uid'],
      include: [
        {
          model: Follow,
          as: 'Followings',
          attributes: ['id'],
          include: {
            model: User,
            as: 'following',
            attributes: ['uid', 'nick_name', 'profile_image'],
          },
        },
        {
          model: Follow,
          as: 'Followers',
          attributes: ['id'],
          include: {
            model: User,
            as: 'follower',
            attributes: ['uid', 'nick_name', 'profile_image'],
          },
        },
      ],
    });

    const followingsList = userWithFollowData.Followings
      ? userWithFollowData.Followings.map(f => f.following).filter(user => user !== null)
      : [];

    const followersList = userWithFollowData.Followers
      ? userWithFollowData.Followers.map(f => f.follower).filter(user => user !== null)
      : [];

    res.status(200).json({
      success: true,
      followings: followingsList,
      followers: followersList,
    });

  } catch (error) {
    console.error('팔로우/팔로워 목록 조회 중 오류 발생:', error);
    res.status(500).json({ success: false, message: '서버 오류로 팔로우/팔로워 목록을 조회할 수 없습니다.' });
  }
};
unfollowUser = async (req, res) => { // 또는 exports.deleteFollow = async (req, res) => {
  const currentUserId = req.user.uid; // 현재 로그인한 사용자 (팔로우를 취소하는 주체)
  const userIdToUnfollow = req.params.userIdToUnfollow; // URL 파라미터에서 언팔로우 대상 ID

  if (!userIdToUnfollow) {
    return res.status(400).json({ success: false, message: '언팔로우할 사용자 ID가 전달되지 않았습니다.' });
  }

  // 자기 자신을 대상으로 하는 요청 방지 (선택 사항)
  if (String(currentUserId) === String(userIdToUnfollow)) {
    return res.status(400).json({ success: false, message: '자기 자신을 대상으로 팔로우/언팔로우 할 수 없습니다.' });
  }

  try {
    // Follow 테이블에서 해당 관계 삭제
    const deletedRowCount = await Follow.destroy({
      where: {
        follower_id: currentUserId,
        following_id: userIdToUnfollow
      }
    });

    if (deletedRowCount > 0) {
      res.status(200).json({ success: true, message: '성공적으로 언팔로우했습니다.' });
    } else {
      // 삭제할 레코드가 없는 경우 (이미 언팔로우했거나, 애초에 팔로우 관계가 아니었음)
      res.status(404).json({ success: false, message: '해당 사용자를 팔로우하고 있지 않거나 이미 언팔로우한 상태입니다.' });
    }
  } catch (error) {
    console.error('언팔로우 처리 중 오류 발생:', error);
    res.status(500).json({ success: false, message: '언팔로우 처리 중 서버 오류가 발생했습니다.' });
  }
};


module.exports = { createFollow, checkFollow, deleteFollow, getFollowLists, unfollowUser }