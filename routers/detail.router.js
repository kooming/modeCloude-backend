    const router = require('express').Router();
    const { getDiaryDetail} = require('../controllers/diary.controller')
    const { createComment } = require('../controllers/common.controller')
    const { getUserStatsById } = require('../controllers/login.controller') 
    const authMiddleware = require('../middleware/auth');


    router.get('/:id', getDiaryDetail);


    router.post('/createComment', createComment);

    // 로그인한 사람의 팔로우 통계할때
    // router.get('/stats', authMiddleware, getUserStats);

    // 이건 작성자의 통계 
    router.get('/stats/:id', getUserStatsById);

    module.exports = router