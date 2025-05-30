const router = require('express').Router();
const { getPublicDiaryList }= require ("../controllers/diary.controller");

router.get('/public/:uid', getPublicDiaryList);

module.exports = router;