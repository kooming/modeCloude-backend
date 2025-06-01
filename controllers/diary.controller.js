const { Diary, DiaryEmotion, DiaryImg, Comment, User, Emotion, Follow } = require('../models/config')
const { Op } = require('sequelize');
const moment = require('moment-timezone');

const KST_OFFSET = 9 * 60 * 60 * 1000;

const extractImageUrls = (markdown) => {
  const regex = /!\[.*?\]\((.*?)\)/g;
  const urls = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    urls.push(match[1]);
  }
  return urls;
};

// 나의 일기 목록 조회  로그인한 유저 대상이라서 // 일기내용을 안가져와서 수정했음
const getMyDiaryList = async (req, res) => {
  const userId = req.user.uid;

  try {
    const diaries = await Diary.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'title','content', 'is_public', 'createdAt'],
      include: [
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            }
          ]
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        },
        {
          model: DiaryImg,
          as: 'images',
          attributes: ['image_url']
        }
      ]
    });

    const result = diaries.map((diary) => ({
      id: diary.id,
      title: diary.title,
      createdAt: diary.createdAt,
      isPublic: diary.is_public,
      emotion: diary.emotionLog?.userEmotionData ?? null,  // 감정 정보 전체
      commentCount: diary.comments.length,
      images: diary.images?.map(img => img.image_url) ?? []
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '일기 목록 불러오기 실패' });
  }
};

// 이건 그 마이페이지 공개된 일기 보여줄때 쓸거 
const getPublicDiaryList = async (req, res) => {
  const targetUid = Number(req.params.uid);

  try {
    const diaries = await Diary.findAll({
      where: { user_id: targetUid, is_public: true },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'title', 'content', 'is_public', 'createdAt'],
      include: [
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',
              attributes: ['id', 'name', 'emoji', 'color'],
            },
            {
              model: Emotion,
              as: 'aiEmotionData',
              attributes: ['id', 'name', 'emoji', 'color'],
            },
          ],
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id'],
        },
        {
          model: DiaryImg,
          as: 'images',
          attributes: ['image_url'],
        },
      ],
    });

    const result = diaries.map((diary) => ({
      id: diary.id,
      title: diary.title,
      createdAt: diary.createdAt,
      isPublic: diary.is_public,
      content: diary.content,
      emotion: diary.emotionLog?.userEmotionData ?? null,
      aiEmotion: diary.emotionLog?.aiEmotionData ?? null,
      commentCount: diary.comments.length,
      images: diary.images?.map((img) => img.image_url) ?? [],
    }));

    res.json(result);
  } catch (error) {
    console.error('공개 일기 조회 실패:', error);
    res.status(500).json({ message: '공개 일기 조회 실패' });
  }
};

// 이건 팔로우 상대 보기 
const getFollowedDiaryList = async (req, res) => {
  const userId = req.user.uid;

  try {
    const follows = await Follow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    });

    const followingIds = follows.map(f => f.following_id);

    if (followingIds.length === 0) {
      return res.json([]);
    }

    const diaries = await Diary.findAll({
      where: {
        user_id: followingIds,
        is_public: true
      },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'title', 'is_public', 'createdAt'],
      include: [
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            }
          ]
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        },
        {
          model: User,
          as: 'writer',
          attributes: ['uid', 'nick_name', 'profile_image']
        }
      ]
    });

    const result = diaries.map((diary) => ({
      id: diary.id,
      title: diary.title,
      createdAt: diary.createdAt,
      isPublic: diary.is_public,
      emotion: diary.emotionLog?.userEmotionData ?? null,
      commentCount: diary.comments.length,
      writer: diary.writer
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '팔로우한 사람들의 일기 조회 실패' });
  }
};

// 일기 생성
const createDiary = async (req, res) => {
  try {
    const { title, content, user_id, userEmotion, diary_img, selectEmotion, is_public } = req.body;
    const diary = await Diary.create({
      title,
      content,
      user_id,
      is_public: is_public === 1 ? true : false
    });

    // 2. 이미지 저장
    const imageUrls = Array.isArray(diary_img) ? diary_img : extractImageUrls(content);
    if (imageUrls.length > 0) {
      const imgRows = imageUrls.map((url) => ({
        diary_id: diary.id,
        image_url: url
      }));
      await DiaryImg.bulkCreate(imgRows);
    }

    const data = await DiaryEmotion.create({
      diary_id: diary.id,
      user_id: user_id,
      userEmotion: userEmotion,
      selectEmotion: selectEmotion,
      date: new Date()
    });
    console.log("data", data)
    res.status(201).json({ success: true, diary_id: diary.id });
  } catch (err) {
    console.error('글 저장 실패:', err);
    res.status(500).json({ success: false, message: '글 저장 실패' });
  }
};

// 상세 및 댓글 정보까지 가져오기. // 앱때문에 추가
const getDiaryDetail = async (req, res) => {
  try {
    const diary = await Diary.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: User,
          as: 'writer',
          attributes: ['uid', 'nick_name', 'profile_image']
        },
        {
          model: DiaryImg,
          as: 'images',
          attributes: ['image_url']
        },
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',  
              attributes: ['id', 'name', 'emoji', 'color']
            },
            {
              model: Emotion,
              as: 'aiEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            }
          ]
        },  
        {
          model: Comment,
          as: 'comments',
          include: [
            {
              model: User,
              as: 'writer',
              attributes: ['nick_name', 'profile_image']
            }
          ],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!diary) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다' });
    }

    res.json({ success: true, diary });
  } catch (err) {
    console.error('상세 조회 실패:', err);
    res.status(500).json({ success: false, message: '상세 조회 실패' });
  }
};

// 수정 데이터 조회 가져오기 // 앱때문에 추가
const getDiaryForEdit = async (req, res) => {
  try {
    const diary = await Diary.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: DiaryImg,
          as: 'images',
          attributes: ['image_url']
        },
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',  
              attributes: ['id', 'name', 'emoji', 'color']
            },
            {
              model: Emotion,
              as: 'aiEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            }
          ]
        }
      ]
    });

    if (!diary) {
      return res.status(404).json({ success: false, message: '수정할 일기가 없습니다' });
    }

    res.json({ success: true, diary });
  } catch (err) {
    console.error('수정용 일기 조회 실패:', err);
    res.status(500).json({ success: false, message: '일기 조회 실패' });
  }
};


// 수정 데이터 바꾼 데이터 저장 
const updateDiary = async (req, res) => {
  try {
    const diaryId = Number(req.params.id);

    // diary가 실제로 존재하는지 확인
    const diary = await Diary.findByPk(diaryId);
    if (!diary) {
      return res.status(404).json({ success: false, message: '해당 일기를 찾을 수 없습니다.' });
    }

    const {
      title,
      content,
      is_public,
      userEmotion,
      selectEmotion
    } = req.body;

    await Diary.update(
      {
        title,
        content,
        is_public: is_public === 1 || is_public === true
      },
      { where: { id: diaryId } }
    );

    await DiaryImg.destroy({ where: { diary_id: diaryId } });

    const imageUrls = extractImageUrls(content);

    if (imageUrls.length > 0) {
      const imgRows = imageUrls.map((url) => ({
        diary_id: diaryId,
        image_url: url
      }));

      try {
        await DiaryImg.bulkCreate(imgRows);
        console.log('DiaryImg 저장 완료');
      } catch (err) {
        console.error(' DiaryImg 저장 실패:', err);
      }
    }

    // 4. 감정 로그 수정
    await DiaryEmotion.update(
      {
        userEmotion,
        selectEmotion,
      },
      { where: { diary_id: diaryId } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('일기 수정 실패:', err);
    res.status(500).json({ success: false, message: '일기 수정 실패' });
  }
};

// 감정만 저장
const emotionOnly = async (req, res) => {
  try {
    const { user_id, userEmotion, selectEmotion } = req.body;

    if (!user_id || !userEmotion) {
      return res.status(400).json({ message: '필수값 누락: user_id 또는 userEmotion' });
    }
    await DiaryEmotion.create({
      diary_id: null,
      user_id,
      userEmotion,
      selectEmotion,
      date: new Date()
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('감정 기록 실패:', error);
    res.status(500).json({ success: false, message: '감정 기록 실패' });
  }
};

// 그날 일기 or 감정 체크리스트 
const checkTodayWritten = async (req, res) => {
  const excludeId = Number(req.query.excludeId);
  const userId = req.user.uid;

  const now = new Date();
  const KST_OFFSET = 9 * 60 * 60 * 1000;
  
  // 한국 시간으로 오늘의 시작과 끝 계산
  const koreaNow = new Date(now.getTime() + KST_OFFSET);
  const koreaDateStr = koreaNow.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 한국 시간 00:00:00를 UTC로 변환
  const start = new Date(`${koreaDateStr}T00:00:00+09:00`);
  // 한국 시간 23:59:59를 UTC로 변환  
  const end = new Date(`${koreaDateStr}T23:59:59+09:00`);

  try {
    const diary = await Diary.findOne({
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [start, end]
        },
        ...(excludeId && { id: { [Op.ne]: excludeId } })
      }
    });

    const emotion = await DiaryEmotion.findOne({
      where: {
        user_id: userId,
        date: koreaDateStr // YYYY-MM-DD
      }
    });

    const hasWritten = !!diary || !!emotion;
    console.log('checkTodayWritten:', { userId, koreaDateStr, diary: !!diary, emotion: !!emotion, hasWritten });
    return res.json({ hasWritten });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '작성 여부 확인 실패' });
  }
};


// 스트림 
const getStreak = async (req, res) => {
  const userId = Number(req.query.uid);
  const KST_OFFSET = 9 * 60 * 60 * 1000;

  if (!userId) {
    return res.status(400).json({ message: 'uid 쿼리 파라미터가 필요합니다.' });
  }


  try {
    const records = await Diary.findAll({
      where: { user_id: userId },
      attributes: ['createdAt'],
      order: [['createdAt', 'DESC']],
    });

    const dateSet = new Set(
      records.map(r =>
        new Date(r.createdAt.getTime() + KST_OFFSET).toISOString().split('T')[0]
      )
    );

    let current = new Date();
    current.setHours(0, 0, 0, 0);
    current = new Date(current.getTime() + KST_OFFSET);

    let streak = 0;

    while (true) {
      const ymd = current.toISOString().split('T')[0];
      if (dateSet.has(ymd)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({ streak });
  } catch (error) {
    console.error('error', error);
    res.status(500).json({ message: '스트릭 계산 실패' });
  }
};


// 요일 
const getWrittenWeekdays = async (req, res) => {
  const userId = Number(req.query.uid);
  const KST_OFFSET = 9 * 60 * 60 * 1000;

  if (!userId) {
    return res.status(400).json({ message: 'uid 쿼리 파라미터가 필요합니다.' });
  }


  const today = new Date();
  const end = new Date(today.getTime() + KST_OFFSET);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  try {
    const records = await Diary.findAll({
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      attributes: ['createdAt'],
    });

    const weekdays = [...new Set(
      records.map(r => {
        const kstDate = new Date(r.createdAt.getTime() + KST_OFFSET);
        const ymd = kstDate.toISOString().slice(0, 10);
        const localDate = new Date(ymd);
        return localDate.getDay();
      })
    )];

    res.json({ weekdays });
  } catch (err) {
    console.error('error:', err);
    res.status(500).json({ message: '요일별 기록 조회 실패' });
  }
};


// 날짜 
const getWrittenDates = async (req, res) => {
  const userId = Number(req.query.uid);
  const { month } = req.query;
  const KST_OFFSET = 9 * 60 * 60 * 1000;

  if (!userId || !month) {
    return res.status(400).json({ message: 'uid와 month 쿼리 파라미터가 필요합니다.' });
  }

  const startDate = new Date(`${month}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + 1);

  try {
    const records = await Diary.findAll({
      where: {
        user_id: userId,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      attributes: ['createdAt'],
    });

    const dates = records.map(r =>
      new Date(r.createdAt.getTime() + KST_OFFSET).toISOString().split('T')[0]
    );

    res.json(dates);
  } catch (err) {
    console.error('error:', err);
    res.status(500).json({ message: '작성일 조회 실패' });
  }
};


const deleteDiary = async (req, res) => {
  try {
    const diaryId = Number(req.params.id);

    const diary = await Diary.findByPk(diaryId);
    if (!diary) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    // DiaryEmotion의 diary_id를 null로 업데이트
    await DiaryEmotion.update(
      { diary_id: null },
      { where: { diary_id: diaryId } }
    );
    
    // 일기 삭제
    await diary.destroy(); 
    
    res.json({ success: true, message: '일기가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('일기 삭제 오류:', error);
    res.status(500).json({ success: false, message: '일기 삭제 중 오류가 발생했습니다.' });
  }
};

// ------------ 앱용 컨트롤러

// 내 일기
const getRichDiaryList = async (req, res) => {
  const userId = req.user.uid; 

  try {
    const diaries = await Diary.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 20, 
      attributes: ['id', 'title', 'content', 'is_public', 'createdAt'],
      include: [
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',  
              attributes: ['id', 'name', 'emoji', 'color']
            },
            {
              model: Emotion,
              as: 'aiEmotionData', 
              attributes: ['id', 'name', 'emoji', 'color']
            },
          ]
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        },
        {
          model: DiaryImg,                
          as: 'images',
          attributes: ['image_url']
        },
        { 
            model: User,
            as: 'writer',
            attributes: ['uid', 'nick_name', 'profile_image']
        }
      ]
    });

    const result = diaries.map((diary) => ({
      id: diary.id,
      title: diary.title,
      content: diary.content,
      createdAt: diary.createdAt,
      isPublic: diary.is_public,
      userEmotion: diary.emotionLog?.userEmotionData ?? null, 
      aiEmotion: diary.emotionLog?.aiEmotionData ?? null,     
      commentCount: diary.comments.length,
      images: diary.images?.map(img => img.image_url) ?? [],
      writer: diary.writer ? { 
          uid: diary.writer.uid,
          nick_name: diary.writer.nick_name,
          profile_image: diary.writer.profile_image
      } : null
    }));

    res.json(result);
  } catch (error) {
    console.error('getRichDiaryList 실패:', error);
    res.status(500).json({ message: '일기 목록 불러오기 실패' });
  }
};

// 팔로워 일기
const getFollowedDiaryListForApp = async (req, res) => {
  const userId = req.user.uid;

  try {
    const follows = await Follow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    });

    const followingIds = follows.map(f => f.following_id);

    if (followingIds.length === 0) {
      return res.json([]); 
    }

    const diaries = await Diary.findAll({
      where: {
        user_id: followingIds,
        is_public: true
      },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'title', 'content', 'is_public', 'createdAt'],
      include: [
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            },
            {
              model: Emotion,
              as: 'aiEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            },
          ]
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        },
        {
          model: DiaryImg,                
          as: 'images',
          attributes: ['image_url']
        },
        {
          model: User,
          as: 'writer',
          attributes: ['uid', 'nick_name', 'profile_image']
        }
      ]
    });

    const result = diaries.map((diary) => ({
      id: diary.id,
      title: diary.title,
      content: diary.content,
      createdAt: diary.createdAt,
      isPublic: diary.is_public,
      userEmotion: diary.emotionLog?.userEmotionData ?? null,
      aiEmotion: diary.emotionLog?.aiEmotionData ?? null,
      commentCount: diary.comments.length,
      images: diary.images?.map(img => img.image_url) ?? [],
      writer: diary.writer ? { 
          uid: diary.writer.uid,
          nick_name: diary.writer.nick_name,
          profile_image: diary.writer.profile_image
      } : null
    }));

    res.json(result);
  } catch (error) {
    console.error('getFollowedDiaryListForApp 실패:', error);
    res.status(500).json({ message: '팔로우한 사람들의 일기 조회 실패' });
  }
};

// 일기 저장
const createDiaryApp = async (req, res) => {
  try {
    const { title, content, user_id, userEmotion, diary_img, selectEmotion, is_public } = req.body;
    
    const diary = await Diary.create({
      title,
      content,
      user_id,
      is_public: is_public === 1 ? true : false
    }); 

    const imageUrls = Array.isArray(diary_img) ? diary_img : []; 
    if (imageUrls.length > 0) {
      const imgRows = imageUrls.map((url) => ({
        diary_id: diary.id,
        image_url: url
      }));
      await DiaryImg.bulkCreate(imgRows);
    }

    const emotionData = await DiaryEmotion.create({
      diary_id: diary.id,
      user_id: user_id,
      userEmotion: userEmotion,             
      selectEmotion: selectEmotion, 
      date: new Date()
    });
    console.log("감정 데이터 저장 완료:", emotionData);

    res.status(201).json({ success: true, diary_id: diary.id });
  } catch (err) {
    console.error('글 저장 실패:', err);
    res.status(500).json({ success: false, message: '글 저장 실패' });
  }
};

// 앱용 일기 수정
const updateDiaryApp = async (req, res) => {
  try {
    const diaryId = Number(req.params.id); 

    const diary = await Diary.findByPk(diaryId);
    if (!diary) {
      return res.status(404).json({ success: false, message: '해당 일기를 찾을 수 없습니다.' });
    }

    const {
      title,
      content,
      is_public,
      userEmotion,
      selectEmotion,
      diary_img
    } = req.body;

    console.log("=== updateDiaryApp 백엔드 수신 데이터 ===");
    console.log("diary_img:", diary_img);
    console.log("diary_img 타입:", typeof diary_img);
    console.log("diary_img는 배열:", Array.isArray(diary_img));

    await Diary.update(
      {
        title,
        content,
        is_public: is_public === 1 || is_public === true
      },
      { where: { id: diaryId } }
    );

    await DiaryImg.destroy({ where: { diary_id: diaryId } });

    if (diary_img && Array.isArray(diary_img) && diary_img.length > 0) {
      const imageUrls = diary_img.map(img => {
        return typeof img === 'object' && img.image_url ? img.image_url : img;
      });
      
      console.log("처리된 이미지 URLs:", imageUrls);

      const imgRows = imageUrls.map((url) => ({
        diary_id: diaryId,
        image_url: url
      }));

      try {
        await DiaryImg.bulkCreate(imgRows);
        console.log('DiaryImg 저장 완료:', imgRows);
      } catch (err) {
        console.error('DiaryImg 저장 실패:', err);
      }
    } else {
      console.log("저장할 이미지가 없음");
    }

    await DiaryEmotion.update(
      {
        userEmotion,
        selectEmotion,
      },
      { where: { diary_id: diaryId } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('앱 일기 수정 실패:', err);
    res.status(500).json({ success: false, message: '일기 수정 실패' });
  }
};

const getFollowingsTodayDiariesApp = async (req, res) => {
  try {
    const userId = req.user.uid;
    const follows = await Follow.findAll({
      where: { follower_id: userId },
      attributes: ['following_id']
    });
    const followingIds = follows.map(f => f.following_id);
    if (followingIds.length === 0) {
      return res.json([]);
    }
    const start = moment().tz('Asia/Seoul').startOf('day').toDate();
    const end = moment().tz('Asia/Seoul').endOf('day').toDate();
    const diaries = await Diary.findAll({
      where: {
        user_id: followingIds,
        is_public: true,
        createdAt: { [Op.between]: [start, end] }
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'content', 'is_public', 'createdAt'],
      include: [
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            { model: Emotion, as: 'userEmotionData', attributes: ['id', 'name', 'emoji', 'color'] },
            { model: Emotion, as: 'aiEmotionData', attributes: ['id', 'name', 'emoji', 'color'] },
          ]
        },
        { model: Comment, as: 'comments', attributes: ['id'] },
        { model: DiaryImg, as: 'images', attributes: ['image_url'] },
        { model: User, as: 'writer', attributes: ['uid', 'nick_name', 'profile_image'] }
      ]
    });
    const result = diaries.map((diary) => ({
      id: diary.id,
      title: diary.title,
      content: diary.content,
      createdAt: diary.createdAt,
      isPublic: diary.is_public,
      userEmotion: diary.emotionLog?.userEmotionData ?? null,
      aiEmotion: diary.emotionLog?.aiEmotionData ?? null,
      commentCount: diary.comments.length,
      images: diary.images?.map(img => img.image_url) ?? [],
      writer: diary.writer ? {
        uid: diary.writer.uid,
        nick_name: diary.writer.nick_name,
        profile_image: diary.writer.profile_image
      } : null
    }));
    res.json(result);
  } catch (error) {
    console.error('getFollowingsTodayDiariesApp 실패:', error);
    res.status(500).json({ message: '팔로잉한 사람들의 오늘 일기 조회 실패' });
  }
};

// 앱용 달력 감정 데이터 조회
const getEmotionCalendarDataApp = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { month } = req.query; 
    
    if (!month) {
      return res.status(400).json({ message: 'month 파라미터가 필요합니다.' });
    }
    
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);
    const emotionData = await DiaryEmotion.findAll({
      where: {
        user_id: userId,
        date: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      include: [
        {
          model: Emotion,
          as: 'userEmotionData',
          attributes: ['id', 'name', 'emoji', 'color']
        },
        {
          model: Diary,
          as: 'diary',
          attributes: ['id', 'title']
        }
      ],
      order: [['date', 'ASC']]
    });
    
    const calendarData = emotionData.map(item => ({
      date: item.date,
      userEmotion: item.userEmotionData,
      hasDiary: !!item.diary,
      diaryId: item.diary?.id || null
    }));
    
    res.json({ 
      success: true, 
      data: calendarData 
    });
    
  } catch (error) {
    console.error('달력 감정 데이터 조회 실패:', error);
    res.status(500).json({ message: '달력 감정 데이터 조회 실패' });
  }
};

const getTodayDiaryApp = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const now = new Date();
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const koreaNow = new Date(now.getTime() + KST_OFFSET);
    
    const start = new Date(koreaNow);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(koreaNow);
    end.setHours(23, 59, 59, 999);
    
    const diary = await Diary.findOne({
      where: {
        user_id: userId,
        createdAt: {
          [Op.between]: [start, end]
        }
      },
      include: [
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            },
            {
              model: Emotion,
              as: 'aiEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            },
          ]
        }
      ]
    });
    
    if (!diary) {
      return res.json({ success: false, message: '오늘 작성한 일기가 없습니다.' });
    }
    
    res.json({
      success: true,
      diary: {
        id: diary.id,
        title: diary.title,
        userEmotion: diary.emotionLog?.userEmotionData,
        aiEmotion: diary.emotionLog?.aiEmotionData,
        createdAt: diary.createdAt
      }
    });
    
  } catch (error) {
    console.error('오늘 일기 조회 실패:', error);
    res.status(500).json({ message: '오늘 일기 조회 실패' });
  }
};

// 앱용 랜덤 일기 가져오기
const getRandomDiaryApp = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const count = await Diary.count({
      where: { user_id: userId }
    });
    
    if (count === 0) {
      return res.json({ success: false, message: '작성한 일기가 없습니다.' });
    }
    
    const randomOffset = Math.floor(Math.random() * count);
    
    const diary = await Diary.findOne({
      where: { user_id: userId },
      offset: randomOffset,
      include: [
        {
          model: DiaryEmotion,
          as: 'emotionLog',
          include: [
            {
              model: Emotion,
              as: 'userEmotionData',
              attributes: ['id', 'name', 'emoji', 'color']
            }
          ]
        },
        {
          model: DiaryImg,
          as: 'images',
          attributes: ['image_url']
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id']
        }
      ]
    });
    
    res.json({
      success: true,
      diary: {
        id: diary.id,
        title: diary.title,
        content: diary.content.substring(0, 100) + '...', 
        createdAt: diary.createdAt,
        userEmotion: diary.emotionLog?.userEmotionData,
        images: diary.images?.map(img => img.image_url) || [],
        commentCount: diary.comments?.length || 0
      }
    });
    
  } catch (error) {
    console.error('랜덤 일기 조회 실패:', error);
    res.status(500).json({ message: '랜덤 일기 조회 실패' });
  }
};

// 앱용 월간 작성일 조회
const getWrittenDatesApp = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { month } = req.query;
    
    if (!month) {
      return res.status(400).json({ message: 'month 파라미터가 필요합니다.' });
    }
    
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);
    
    const records = await Diary.findAll({
      where: {
        user_id: userId,
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      attributes: ['createdAt'],
    });
    
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const dates = records.map(r =>
      new Date(r.createdAt.getTime() + KST_OFFSET).toISOString().split('T')[0]
    );
    
    res.json(dates);
  } catch (err) {
    console.error('월간 작성일 조회 실패:', err);
    res.status(500).json({ message: '작성일 조회 실패' });
  }
};

// 앱용 감정만 저장
const emotionOnlyApp = async (req, res) => {
  try {
    const { userEmotion, selectEmotion } = req.body;
    const userId = req.user.uid; 
    
    if (!userId || !userEmotion) {
      return res.status(400).json({ message: '필수값 누락: userId 또는 userEmotion' });
    }

    // 한국 시간으로 오늘 날짜 계산
    const now = new Date();
    const KST_OFFSET = 9 * 60 * 60 * 1000;
    const koreaNow = new Date(now.getTime() + KST_OFFSET);
    const koreaDateStr = koreaNow.toISOString().split('T')[0];

    await DiaryEmotion.create({
      diary_id: null,               
      user_id: userId,
      userEmotion,
      selectEmotion,
      date: koreaDateStr
    });

    console.log('앱용 감정 기록 완료:', { user_id: userId, userEmotion, date: koreaDateStr });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('앱용 감정 기록 실패:', error);
    res.status(500).json({ success: false, message: '감정 기록 실패' });
  }
};

// 앱용 스트릭 
const getStreakApp = async (req, res) => {
  const userId = req.user.uid;
  const KST_OFFSET = 9 * 60 * 60 * 1000;

  try {
    const diaryRecords = await Diary.findAll({
      where: { user_id: userId },
      attributes: ['createdAt'],
      order: [['createdAt', 'DESC']],
    });

    const emotionRecords = await DiaryEmotion.findAll({
      where: { user_id: userId },
      attributes: ['date'],
      order: [['date', 'DESC']],
    });

    const dateSet = new Set();

    diaryRecords.forEach(r => {
      const kstDate = new Date(r.createdAt.getTime() + KST_OFFSET);
      const dateStr = kstDate.toISOString().split('T')[0];
      dateSet.add(dateStr);
    });

    emotionRecords.forEach(r => {
      let dateStr;
      if (typeof r.date === 'string') {
        dateStr = r.date;
      } else {
        dateStr = r.date.toISOString().split('T')[0];
      }
      dateSet.add(dateStr);
    });

    let current = new Date();
    current.setHours(0, 0, 0, 0);
    current = new Date(current.getTime() + KST_OFFSET);

    let streak = 0;

    while (true) {
      const ymd = current.toISOString().split('T')[0];
      if (dateSet.has(ymd)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    console.log('앱용 스트릭 계산 완료:', { userId, streak, totalDates: dateSet.size });
    res.json({ streak });
  } catch (error) {
    console.error('앱용 스트릭 계산 실패:', error);
    res.status(500).json({ message: '스트릭 계산 실패' });
  }
};


// 조회 로직 전문
const getListSearch = async (req, res) => {
  const userId = req.user.uid;
  const { emotion, order, public: publicQuery, title } = req.query;

  console.log('User ID:', userId);
  console.log('Query Params:', req.query);

  try {
    const diaryWhereClause = { user_id: userId };

    if (publicQuery !== undefined && publicQuery !== null && publicQuery !== '') {
      diaryWhereClause.is_public = publicQuery === 'true';
    }
    if (title && title.length > 0) { 
      diaryWhereClause.title = {
        [Op.like]: `${title}%` 
      };
    }
    const includeClauses = [
      {
        model: Comment,
        as: 'comments',
        attributes: ['id'],
      },
      {
        model: DiaryImg,
        as: 'images',
        attributes: ['image_url'],
      },
    ];
    const emotionLogInclude = {
      model: DiaryEmotion,
      as: 'emotionLog',
      include: [
        {
          model: Emotion,
          as: 'userEmotionData',
          attributes: ['id', 'name', 'emoji', 'color'],
        },
        {
          model: Emotion,
          as: 'aiEmotionData', // diaryEmotion.js에 정의된 별칭 사용
          attributes: ['id', 'name', 'emoji', 'color'],
          required: false // 데이터가 없을 수도 있으므로 LEFT JOIN
        },
      ],
    };

    if (emotion) {
      emotionLogInclude.where = { userEmotion: emotion };

      emotionLogInclude.required = true;
    } else {

      emotionLogInclude.required = false;
    }
    includeClauses.unshift(emotionLogInclude);


    const sortOrder = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    const diaries = await Diary.findAll({
      where: diaryWhereClause,
      order: [['createdAt', sortOrder]],
      include: includeClauses,
    });

    const result = diaries.map((diary) => ({
      id: diary.id,
      title: diary.title,
      content: diary.content,
      createdAt: diary.createdAt,
      isPublic: diary.is_public,
      emotion: diary.emotionLog?.userEmotionData ?? null,
      selectEmotion: diary.emotionLog?.aiEmotionData ?? null,
      commentCount: diary.comments ? diary.comments.length : 0,
      images: diary.images?.map(img => img.image_url) ?? [],
    }));

    res.json(result);
  } catch (error) {
    console.error('일기 목록 불러오기 중 에러 발생:', error);
    res.status(500).json({ message: '일기 목록 불러오기 실패' });
  }
};


module.exports = {
  createDiary, getMyDiaryList, emotionOnly, checkTodayWritten, getStreak, getWrittenWeekdays, getWrittenDates, getDiaryDetail, getDiaryDetail,
  getDiaryForEdit, updateDiary, getFollowedDiaryList, deleteDiary, getPublicDiaryList, getListSearch
};
