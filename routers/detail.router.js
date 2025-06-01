    const router = require('express').Router();
    const { getDiaryDetail, deleteDiary } = require('../controllers/diary.controller')
    const { createComment, createCommentApp } = require('../controllers/common.controller')
    const { getUserStatsById } = require('../controllers/login.controller') 
    const authMiddleware = require('../middleware/auth');
    const authAppMiddleware = require('../middleware/authAppMiddleware');


    router.get('/:id', getDiaryDetail);
    router.post('/createComment', createComment);
    
    // 앱용 댓글 작성
    router.post('/app/createComment', authAppMiddleware, createCommentApp);
    
    router.get('/stats/:id', getUserStatsById);
    router.delete('/delete/:id', deleteDiary)

    module.exports = router