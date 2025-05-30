    const router = require('express').Router();
    const { getDiaryDetail, deleteDiary } = require('../controllers/diary.controller')
    const { createComment } = require('../controllers/common.controller')
    const { getUserStatsById } = require('../controllers/login.controller') 
    const authMiddleware = require('../middleware/auth');


    router.get('/:id', getDiaryDetail);
    router.post('/createComment', createComment);
    router.get('/stats/:id', getUserStatsById);
    router.delete('/delete/:id', deleteDiary)

    module.exports = router