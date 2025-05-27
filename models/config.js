const Sequalize = require("sequelize");
const User = require('./user');
const Diary = require('./diaries')
const Emotion = require('./emotion');
const Follow = require('./follow');
const Comment = require('./comment');
const DiaryImg = require('./diaryImg');
const DiaryEmotion = require('./diaryEmotion');

const sequelize = new Sequalize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        host : process.env.DATABASE_HOST,
        port : process.env.DATABASE_PORT,
        dialect : "mysql"
    }
)

const user = User.init(sequelize);          // 가장 먼저 (다른 모델들이 많이 참조함)
const emotion = Emotion.init(sequelize);      // 감정: 독립적
const diary = Diary.init(sequelize);      // User 참조 (user_id)
const follow = Follow.init(sequelize);        // User 참조 (follower_id, following_id)
const comment = Comment.init(sequelize);      // User, Diary 참조
const diaryImg = DiaryImg.init(sequelize);    // Diary 참조
const diaryEmotion = DiaryEmotion.init(sequelize); // Diary, User, Emotion 참조

const db = {
    User: user,
    Emotion: emotion,
    Diary: diary,
    Follow: follow,
    Comment: comment,
    DiaryImg: diaryImg,
    DiaryEmotion: diaryEmotion,
    sequelize
};

// 이렇게 처리안하면 관계성 떄문에 조회 못함 
user.associate(db);        // User -> Diary, Comment, Follow
emotion.associate(db);      // Emotion -> Diary, DiaryEmotion
diary.associate(db);      // Diary -> User, Comment, DiaryImg, DiaryEmotion
follow.associate(db);       // Follow -> User
comment.associate(db);      // Comment -> User, Diary
diaryImg.associate(db);     // DiaryImg -> Diary
diaryEmotion.associate(db); // DiaryEmotion -> User, Emotion, Diary


sequelize.sync( { force : false } ).then(() => {
    console.log("database on~")
}).catch((err) => {
    console.log(err);
})

module.exports = db;

