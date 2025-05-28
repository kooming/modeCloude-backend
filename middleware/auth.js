// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models/config');

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    req.user = user;  
    next();
  } catch (err) {
    console.error('JWT 인증 실패:', err.message);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = authMiddleware;
