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


module.exports = {createComment};
  

