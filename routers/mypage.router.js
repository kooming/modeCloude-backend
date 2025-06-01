const router = require('express').Router();
const { getPublicDiaryList }= require ("../controllers/diary.controller");
const { userInfoUpdateApp } = require("../controllers/user.controller"); // 추가

router.get('/public/:uid', getPublicDiaryList);
router.get('/app/userBio', userInfoUpdateApp); // 추가

module.exports = router;