const router = require('express').Router();
const { getPublicDiaryList }= require ("../controllers/diary.controller");
const { userInfoUpdateApp, getUserProfileApp } = require("../controllers/user.controller"); 
const  authAppMiddleware  = require('../middleware/authAppMiddleware')

router.get('/public/:uid', getPublicDiaryList);

// 앱용 라우트 (인증 필요)
router.get('/app/userBio', authAppMiddleware, userInfoUpdateApp);
router.get('/app/profile/:uid', authAppMiddleware, getUserProfileApp);

module.exports = router;