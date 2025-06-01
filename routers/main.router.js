const router = require('express').Router();
const { getEmotions } = require('../controllers/emotion.controller');
const { getMyDiaryList, emotionOnly, checkTodayWritten, getTodayDiaryApp, getRandomDiaryApp, getWrittenDatesApp, emotionOnlyApp, getStreakApp } = require('../controllers/diary.controller');
const authMiddleware = require('../middleware/auth');
const { getStreak, getWrittenDates, getWrittenWeekdays,  getFollowedDiaryList, getRichDiaryList, getFollowedDiaryListForApp, getEmotionCalendarDataApp } = require('../controllers/diary.controller')
const authAppMiddleware = require('../middleware/authAppMiddleware');

//  모든 감정
router.get('/emotionAll', getEmotions);
// 나의 최근 일기만
router.get('/mydiary', authMiddleware, getMyDiaryList);
// 팔로우한 사람들 일기
router.get('/diary/followed', authMiddleware, getFollowedDiaryList);
// 감정만 저장
router.post('/emotionOnly', emotionOnly);
// 감정이나 일기쓰면 사라지게 하는 get 요청 
router.get('/checkTodayWritten', authMiddleware , checkTodayWritten);
// 스트릭 
router.get('/streak',authMiddleware, getStreak);
// 요일 작성 
router.get('/written-weekdays',authMiddleware, getWrittenWeekdays);
// 달력 작성요일 
router.get('/written-dates', authMiddleware, getWrittenDates);


//------------ 앱 라우터
router.get('/app/mydiary', authAppMiddleware, getRichDiaryList);
router.get('/app/diary/followed', authAppMiddleware, getFollowedDiaryListForApp);
router.get('/app/calendar-emotions', authAppMiddleware, getEmotionCalendarDataApp);
router.get('/app/todayDiary', authAppMiddleware, getTodayDiaryApp);
router.get('/app/randomDiary', authAppMiddleware, getRandomDiaryApp);
router.get('/app/checkTodayWritten', authAppMiddleware, checkTodayWritten);
router.get('/app/written-dates', authAppMiddleware, getWrittenDatesApp);
router.post('/app/emotionOnly', authAppMiddleware, emotionOnlyApp);
router.get('/app/streak', authAppMiddleware, getStreakApp);

module.exports = router;