const { getListSearch, getFollowedDiaryList } = require("../controllers/diary.controller")
const authMiddleware = require("../middleware/auth")

const router = require("express").Router()

router.get('/', authMiddleware, getListSearch)

router.get('/followed', authMiddleware, getFollowedDiaryList)

module.exports = router