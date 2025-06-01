const router = require('express').Router();
const settingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middleware/auth'); 
const { upload } = require('../middleware/imgUpload'); 
const followController = require('../controllers/follow.controller'); 


// 내 프로필 정보 조회 API
router.get('/me/profile', authMiddleware, settingsController.getMyProfile);

// 내 자기소개(bio) 수정 API
router.patch('/me/bio', authMiddleware, settingsController.updateMyBio);

// 내 프로필 이미지 수정 API
router.post('/me/profile-image', authMiddleware, upload.single('profileImage'), settingsController.updateMyProfileImage);


router.get('/delete', authMiddleware, settingsController.deleteMyAccount); 

router.get('/lists', authMiddleware, followController.getFollowLists);

// 언팔로우(팔로우 삭제) API 
// :userIdToUnfollow 는 언팔로우할 대상의 ID
router.delete('/:userIdToUnfollow', authMiddleware, followController.unfollowUser); // 또는 deleteFollow 함수 (내용 확인 필요)


module.exports = router;