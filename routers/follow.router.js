const router = require('express').Router();
const {createFollow, checkFollow ,deleteFollow} = require('../controllers/follow.controller')

router.post('/create', createFollow);
router.get('/status', checkFollow);
router.delete('/delete', deleteFollow);

module.exports = router;