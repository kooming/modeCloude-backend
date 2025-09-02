const {Diary, DiaryEmotion, DiaryImg, Comment, User, Emotion, Follow } = require('../models/config')
const { Op } = require('sequelize');

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

// 나의 일기 목록 조회  로그인한 유저 대상이라서
const getMyDiaryList = async (req, res) => {
  const userId = req.user.uid;

  try {
    const diaries = await Diary.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['id', 'title', 'content' ,'is_public', 'createdAt'],
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
      content: diary.content, 
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
      content: diary.content, 
      createdAt: diary.createdAt,
      isPublic: diary.is_public,
      emotion: diary.emotionLog?.userEmotionData ?? null,
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
    // 1. 내가 팔로우한 사람들 목록
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
      attributes: ['id', 'title', 'content','is_public', 'createdAt'],
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
      content: diary.content, 
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

    await DiaryEmotion.create({
      diary_id: diary.id,
      user_id: user_id,
      userEmotion: userEmotion,             
      selectEmotion: selectEmotion, 
      date: new Date()
    });

    res.status(201).json({ success: true, diary_id: diary.id });
  } catch (err) {
    console.error('글 저장 실패:', err);
    res.status(500).json({ success: false, message: '글 저장 실패' });
  }
};

// 상세 및 댓글 정보까지 가져오기.
const getDiaryDetail = async (req, res) => {
  try {
    const diary = await Diary.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: User,                    
          as: 'writer',
          attributes: [ 'uid', 'nick_name', 'profile_image']
        },
        {
          model: DiaryImg,
          as: 'images',
          attributes: ['image_url']
        },
        {
          model: DiaryEmotion,
          as: 'emotionLog'
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

// 수정 데이터 조회 가져오기 
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
          as: 'emotionLog'
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
    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    if (!user_id || !userEmotion) {
      return res.status(400).json({ message: '필수값 누락: user_id 또는 userEmotion' });
    }
    await DiaryEmotion.create({
      diary_id: null,               
      user_id,
      userEmotion,
      selectEmotion,
      date: nowKST
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
  const koreaNow = new Date(now.getTime() + KST_OFFSET);

  // 오늘 00:00:00 ~ 23:59:59 (KST)
  const start = new Date(koreaNow);
  start.setHours(0, 0, 0, 0);

  const end = new Date(koreaNow);
  end.setHours(23, 59, 59, 999);

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
        date: start.toISOString().split('T')[0] // YYYY-MM-DD
      }
    });

    const hasWritten = !!diary || !!emotion;
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

//삭제 
const deleteDiary = async (req, res) => {
  try {
    const diaryId = Number(req.params.id);

    const diary = await Diary.findByPk(diaryId);
    if (!diary) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    await diary.destroy(); 
    res.json({ success: true, message: '일기가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('일기 삭제 오류:', error);
    res.status(500).json({ success: false, message: '일기 삭제 중 오류가 발생했습니다.' });
  }
};
 


module.exports = { createDiary, getMyDiaryList, emotionOnly, checkTodayWritten, getStreak ,getWrittenWeekdays, getWrittenDates, getDiaryDetail ,  getDiaryDetail,
  getDiaryForEdit, updateDiary, getFollowedDiaryList, deleteDiary, getPublicDiaryList };
