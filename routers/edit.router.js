const router = require('express').Router();
const { getDiaryForEdit, updateDiary} = require('../controllers/diary.controller')

router.get('/:id/edit', getDiaryForEdit);
router.put('/:id', updateDiary);
module.exports = router