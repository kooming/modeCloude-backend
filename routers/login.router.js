// routes/auth.js
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { saveKakaoUser, searchUsersByNickname, getUserById } = require('../controllers/login.controller');
const { Users } = require('../models/config');
const authMiddleware = require('../middleware/auth');

router.get('/kakao', (req, res) => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}`;
  res.json({ url: kakaoAuthUrl });
});

router.get('/kakao_login', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenRes = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
        client_secret: process.env.KAKAO_CLIENT_SECRET_KEY || undefined,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = userRes.data;
    const kakaoId = Number(kakaoUser.id);
    const nickname = kakaoUser.properties?.nickname ?? ''; 
    const profile = kakaoUser.properties?.profile_image ?? ''; 


    const { ok, user, message } = await saveKakaoUser(kakaoId, nickname, profile);
    if (!ok) return res.status(500).json({ message });

    const token = jwt.sign({ userId: user.uid }, process.env.JWT_SECRET, {
      expiresIn: '7d', 
    });

    res.cookie('token', token, {
      httpOnly: true,  
      secure: false,   
      sameSite: 'Lax', 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    // res.redirect('http://localhost:3000/main'); 
       res.redirect('https://cuekim.shop/main'); 
  } catch (err) {
    console.error('카카오 로그인 실패:', err.message);
    res.status(500).json({ success: false, message: '카카오 로그인 실패' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  // res.redirect('http://localhost:3000/'); 
  res.redirect('https://cuekim.shop/'); 
});

router.get('/user', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    nickname: user.nick_name,
    profile: user.profile_image,
    uid: user.uid,
    bio: user.bio
  });
});

router.post('/kakaoapp', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ message: 'access_token 누락' });
  }

  try {
    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const kakaoUser = userRes.data;
    const kakaoId = Number(kakaoUser.id);
    const nickname = kakaoUser.properties?.nickname ?? '';
    const profile = kakaoUser.properties?.profile_image ?? '';
    // 요 라인이 DB저장쪽임 
    const { ok, user, message } = await saveKakaoUser(kakaoId, nickname, profile);
    if (!ok) return res.status(500).json({ message });

    const token = jwt.sign({ userId: user.uid }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        uid: user.uid,
        nickname: user.nick_name,
        profile: user.profile_image,
      },
    });
  } catch (err) {
    console.error('앱 카카오 로그인 실패:', err.message);
    res.status(500).json({ message: '카카오 로그인 실패' });
  }
});

router.get('/search/users', searchUsersByNickname);

router.get('/:id', getUserById); 

module.exports = router;
