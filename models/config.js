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

const user = User.init(sequelize);          
const emotion = Emotion.init(sequelize);    
const diary = Diary.init(sequelize);     
const follow = Follow.init(sequelize);       
const comment = Comment.init(sequelize);     
const diaryImg = DiaryImg.init(sequelize);    
const diaryEmotion = DiaryEmotion.init(sequelize); 

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

user.associate(db);       
emotion.associate(db);      
diary.associate(db);     
follow.associate(db);       
comment.associate(db);      
diaryImg.associate(db);     
diaryEmotion.associate(db); 


sequelize.sync( { force : false } ).then(() => {
    console.log("database on~")
}).catch((err) => {
    console.log(err);
})

module.exports = db;

