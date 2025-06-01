const router = require('express').Router();
const { getDiaryForEdit, updateDiary, updateDiaryApp} = require('../controllers/diary.controller')
const authAppMiddleware = require('../middleware/authAppMiddleware');

router.get('/:id/edit', getDiaryForEdit);
router.put('/:id', updateDiary);

// 앱용 수정 엔드포인트
router.put('/app/:id', authAppMiddleware, updateDiaryApp);

module.exports = router