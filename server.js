// npm i express ejs mysql2 jsonwebtoken dotenv bcrypt multer
require('dotenv').config();
const cors = require('cors')
require('./models/config')
const express = require("express");
const app = express();
const path = require("path");
const LoginRouter = require('./routers/login.router')
const MainRouter = require('./routers/main.router')
const WriteRouter = require('./routers/write.router')
const DetailRouter = require('./routers/detail.router')
const EditRouter = require('./routers/edit.router')
const MypageRouter = require('./routers/mypage.router')
const FollowRouter = require('./routers/follow.router')

const cookieParser = require('cookie-parser');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
app.set ("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/upload")));
app.use(express.json());
app.use(express.urlencoded({extended : false}))
app.use(cors({
    origin: 'http://localhost:3000',  // React 서버 주소
    credentials: true  // 이거 해줘야 쿠기값 전달됌 중요!! 그리고 위에 * 이걸로 보내면안됌...
  }));
app.use(cookieParser());

app.use('/login', LoginRouter);
app.use('/main',  MainRouter);
app.use('/write', WriteRouter);
app.use('/detail', DetailRouter)
app.use('/edit', EditRouter)
app.use('/mypage', MypageRouter);
app.use('/follow', FollowRouter);

app.listen(4000, (req,res)=> {
    console.log("server on")
})