const jwt = require('jsonwebtoken');
const { User } = require('../models/config');

const authAppMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '로그인이 필요합니다. 토큰오류' });
    }

    const token = authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: '로그인이 필요합니다. 토큰없어' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
        return res.status(401).json({ message: '유효하지 않은 사용자입니다.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('JWT 앱 인증 실패:', err.message);
        if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: '토큰이 만료되었습니다. 다시 로그인해주세요.' });
        }
        if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: '유효하지 않은 토큰입니다. (서명 오류 또는 변조)' });
        }
        return res.status(401).json({ message: '인증에 실패했습니다.' });
    }
};

module.exports = authAppMiddleware;