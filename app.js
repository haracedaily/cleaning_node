// 설치한 npm 패키지들을 불러옵니다.
const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const cors = require('cors');
const {supa} = require('./utils/supa.js'); // supabase 유틸리티 모듈 불러오기
const webpush = require('web-push');


webpush.setVapidDetails(
    'https://port-0-cleaning-node-managdgo41797b84.sel4.cloudtype.app/',
    'BBAM2GOE13h59ZDNqToC23HdNafs2eypet_bh6sRh0wvxIbZknpiVijBqrSealSwYBkBLyTE_DTQmzmp8yTDCZE',
    'MPrJJYxypgckCHa45ylTc_2z71QUfpy58NOMWf2E2OQ'
)
// webpush.setVapidDetails(
//     'https://localhost:4020',
//     "BBAM2GOE13h59ZDNqToC23HdNafs2eypet_bh6sRh0wvxIbZknpiVijBqrSealSwYBkBLyTE_DTQmzmp8yTDCZE",
//     "MPrJJYxypgckCHa45ylTc_2z71QUfpy58NOMWf2E2OQ"
// );
require('dotenv').config();

const app = express();

app.use(cors({
    // origin: "https://port-0-cleaning-node-managdgo41797b84.sel4.cloudtype.app", // CORS 허용할 도메인
    credentials: true, // 쿠키를 포함한 요청을 허용
    methods: ["GET", "POST", "PUT", "DELETE"], // 허용할 HTTP 메소드
})); // CORS 설정
app.use(morgan("dev"));
app.use(express.json({limit:'50mb'}), express.urlencoded({ limit:'50mb',extended: false }));
app.use("/", express.static(path.join(__dirname, "public")));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // HTTPS를 사용할 때 true로 설정
        maxAge: 1000 * 60 * 60 * 24, // 쿠키 유효기간 1일
        httpOnly: true // 클라이언트 측 스크립트에서 쿠키 접근 방지
    },
    name: "session-cookie", // 쿠키 이름 설정
}));

app.set("port", 4020);
app.set("view engine", "html");
nunjucks.configure("views", {
    express: app,
    watch: true,
});
const gisaRouter = require('./routes/gisa');
const signupRouter = require('./routes/signup');
const agreeRouter = require('./routes/agree');
const userRouter = require('./routes/user');
const subscribeRouter = require('./routes/subscribe');

app.use("/gisa", gisaRouter);
app.use("/signup", signupRouter);
app.use('/agree', agreeRouter);
app.use('/user', userRouter);
app.use('/subscribe',subscribeRouter );

app.get('/', function (req, res) {
    console.log('초기 페이지 : ', req.session);
    if(req.session.user) {
        // 로그인 상태
        res.render('today',{title: 'ICECARE', request: req});
    }else{
        res.clearCookie('session-cookie');
    res.render('user/login',{title: '로그인', request: req});
    }
})
app.post('/card-toggle',async (req,res)=>{
    const {card_height} = req.body;
    if(card_height)
    req.session.card_height = card_height;
    res.send('ok');
})

/* 미들웨어 장착 끝 */
app.use((req,res,next)=>{
    console.log(req.originalUrl);
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