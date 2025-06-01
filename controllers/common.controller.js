const { Comment, User } = require('../models/config');

const createComment = async (req, res) => {

  try {
    const { diary_id, user_id, content } = req.body;

    if (!diary_id || !user_id || !content?.trim()) {
      return res.status(400).json({ success: false, message: '부족합니다.' });
    }

    const comment = await Comment.create({
      diary_id,
      user_id,
      content
    });
    
    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [
        {
          model: User,
          as: 'writer',
          attributes: ['nick_name', 'profile_image']
        }
      ]
    });

    res.status(201).json({ success: true, comment: fullComment });
  } catch (err) {
    console.error('댓글 생성 실패:', err);
    res.status(500).json({ success: false, message: '댓글 생성 중 오류 발생' });
  }
};

// 앱용 댓글 작성
const createCommentApp = async (req, res) => {
  try {
    const { diary_id, content } = req.body;
    const user_id = req.user.uid;

    if (!diary_id || !content?.trim()) {
      return res.status(400).json({ success: false, message: '일기 ID와 댓글 내용이 필요합니다.' });
    }

    const comment = await Comment.create({
      diary_id,
      user_id,
      content
    });
    
    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [
        {
          model: User,
          as: 'writer',
          attributes: ['uid', 'nick_name', 'profile_image']
        }
      ]
    });

    res.status(201).json({ success: true, comment: fullComment });
  } catch (err) {
    console.error('앱 댓글 생성 실패:', err);
    res.status(500).json({ success: false, message: '댓글 생성 중 오류 발생' });
  }
};


module.exports = {createComment, createCommentApp};
  

