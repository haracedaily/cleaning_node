const express = require('express');
const router = express.Router();
const {supa} = require('../utils/supa');
router.get('/',async function (req, res) {
// 1. 오늘 00:00:00.000 UTC (또는 로컬 시간) 계산
    const today = new Date().toISOString();

    console.log(today.month);
    console.log(today.date);
    console.log(today.day);
    const todayStart = today; // ISO 문자열 필요 :contentReference[oaicite:1]{index=1}

// 2. 내일 00:00:00.000 계산
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString();

// 3. Supabase 쿼리
    const { data, error } = await supa
        .from('reservation')
        .select('*')
        .eq("gisa_email",req.session.user.mail)
        .gte('date', todayStart)
        .lt('date', tomorrowStart);  // < 다음 날 시작
    console.log(data);
    console.log(todayStart);
    console.log(tomorrowStart);
    console.log(req.session);
    if(!error)
        res.render('today',{title: 'ICECARE', request: req, todays:data});
    else
        res.render('today',{title: 'ICECARE', request: req, todays:[]});
})
router.get('/order', async function (req, res) {
    console.log("오더 조회 로그인 계정 확인 : ",req.session.user.mail);
    const {data,error} = await supa.from('reservation').select('*,user:customer!user_email(email,name,phone,addr,image_url)').eq('gisa_email',req.session.user.mail.trim());
    console.log("배정된 예약 건 : ",data);
if(!error)
  res.render('order',{title: 'ICECARE', request: req,orderList:data});
else
    res.render('order',{title: 'ICECARE', request: req,orderList:[]});
})
router.get('/reservation',async function (req, res) {

    const {data, error} = await supa.from('reservation').select('*,user:customer!user_email(email,name,phone,addr,image_url)').eq('state', 3).is('gisa_email',null).order('date', {ascending: false});

    console.log("예약 목록 : ",data);
    if (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).render('reservation',{title: 'ICECARE', request: req, error: 'Failed to fetch reservations.', reservations: [],supabase_url: process.env.SUPABASE_URL, supabase_key: process.env.SUPABASE_KEY});
    }else{
        if(data?.length>0) {
            res.status(200).render('reservation', {title: 'ICECARE', request: req, reservations: data,supabase_url: process.env.SUPABASE_URL, supabase_key: process.env.SUPABASE_KEY});
        }else
            res.status(201).render('reservation', {title: 'ICECARE', request: req, reservations: [],supabase_url: process.env.SUPABASE_URL, supabase_key: process.env.SUPABASE_KEY});
    }
})
router.get('/history', function (req, res) {
    const month = req.query?.month || new Date().getMonth()+1;
    console.log(month);
    res.render('history',{title: 'ICECARE', request: req, month});
})

router.post('/pick',async function (req, res) {
    const result = await supa.from('reservation').update({gisa_email:req.session.user.mail,state:4}).eq("res_no",req.body.res_no);
    console.log("픽업 결과 : ",result);
    res.send(result);
})
module.exports = router;