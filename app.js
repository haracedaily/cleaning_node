// 설치한 npm 패키지들을 불러옵니다.
const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors()); // CORS 설정
app.use(morgan("dev"));
app.use(express.json(), express.urlencoded({ extended: false }));
app.use("/", express.static(path.join(__dirname, "public")));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
    expressSession({
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: false,
            secure: false,
        },
        name: "session-cookie",
    })
);
app.set("port", 4020);
app.set("view engine", "html");
nunjucks.configure("views", {
    express: app,
    watch: true,
});
/*const resRouter = require('./routes/resRouter.js');
const gisaRouter = require('./routes/gisaRouter.js');
app.use("/res",resRouter);
app.use("/gisa", gisaRouter);*/

app.get('/', function (req, res) {
    res.render('index');
})

/* 미들웨어 장착 끝 */
app.use((req,res,next)=>{
    console.log('해당하는 라우터가 없다');
    const error = new Error('해당하는 페이지가 없습니다.');
    next(error); // 에러 미들웨어로 가라
})

app.use((err, req, res, next) => {
    console.log("에러 미들웨어 동작");
    console.error(err);
    console.error(err.message);
    res.send(err.toString()+"<a href='/'>첫페이지로</a>");
});

app.listen(app.get("port"), () => {
    console.log(`서버 ${app.get("port")}시작`);
});