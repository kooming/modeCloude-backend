const router = require('express').Router();
const {createFollow, checkFollow ,deleteFollow} = require('../controllers/follow.controller')
const { getFollowersListApp, getFollowingsListApp } = require('../controllers/user.controller');
const diaryController = require('../controllers/diary.controller');
const authAppMiddleware = require('../middleware/authAppMiddleware');

router.post('/create', createFollow);
router.get('/status', checkFollow);
router.delete('/delete', deleteFollow);

// --------- 앱
router.get('/app/followers', getFollowersListApp);
router.get('/app/followings', getFollowingsListApp);
router.get('/app/followings/todayDiaries', authAppMiddleware, diaryController.getFollowingsTodayDiariesApp);

module.exports = router;