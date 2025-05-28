const router = require('express').Router();
const { createDiary } = require('../controllers/diary.controller')
const {upload }= require('../middleware/imgUpload');
const OpenAI = require('openai');


// 글 생성
router.post('/', createDiary)

// 업로드 
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '파일이 없음' });
      
    const fileUrl = `http://localhost:4000/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
  }); 


  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // AI 임 
  router.post('/analyze', async (req, res) => {
    const { content } = req.body;
  
    if (!content) {
      return res.status(400).json({ message: '일기 내용이 필요합니다.' });
    }
  
    const textOnly = content.replace(/!\[.*?\]\(.*?\)/g, '');
    const truncatedContent = textOnly.slice(0, 3000);
  
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: `
  다음 일기 내용에서 괄호안에 9개의 감정중 하나의 단어로 알려줘. (행복, 슬픔, 분노, 평온, 불안, 피곤, 신남, 혼란)
  일기 내용: "${truncatedContent}"
  감정:`,
          },
        ],
        temperature: 0.5,
        max_tokens: 10,
      });
  
      const choice = response.choices?.[0]?.message?.content;
      
      if (!choice) {
        return res.status(500).json({ message: 'AI 응답이 비어 있습니다.' });
      }
  
      const emotion = choice.trim();
      res.json({ emotion });
  
    } catch (error) {
      console.error('감정 분석 오류:', error.response?.data || error.message || error);
      res.status(500).json({
        message: '감정 분석 실패',
        error: error.response?.data || error.message || 'Unknown error'
      });
    }
  });
  
  

module.exports = router