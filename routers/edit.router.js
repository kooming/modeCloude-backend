const router = require('express').Router();
const { getDiaryForEdit, updateDiary} = require('../controllers/diary.controller')


// 수정 페이지 데이터 불러오기
router.get('/:id/edit', getDiaryForEdit);

// 수정 저장
router.put('/:id', updateDiary);


module.exports = router