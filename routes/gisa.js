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
    // console.log("오더 조회 로그인 계정 확인 : ",req.session.user.mail);
    const {data,error} = await supa.from('reservation').select('*,user:customer!user_email(email,name,phone,addr,image_url)').eq('gisa_email',req.session.user.mail.trim());
    // console.log("배정된 예약 건 : ",data);
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
router.get('/history',async function (req, res) {
    const month = req.query?.month || new Date().getMonth()+1;
    console.log(month);
    console.log("오늘",new Date());
    console.log('날짜 문자화',new Date().toISOString());

    if(!req.session?.user) res.redirect('/');
    // await supa.from('reservation').eq('gisa_email',req.session.user.mail)
    res.render('history',{title: 'ICECARE', request: req, month});
})

router.post('/pick',async function (req, res) {
    const result = await supa.from('reservation').update({gisa_email:req.session.user.mail,state:4}).eq("res_no",req.body.res_no);
    console.log("픽업 결과 : ",result);
    res.send(result);
})

router.post('/complete',async function (req, res) {
    console.log('청소완료 처리 요청');
    console.log(req.session.user);

    if (!req.session.user) {
        return res.json({status: 'fail', message: '로그인이 필요합니다.'});
    }

    try {
        const { res_no, memo, files } = req.body;
        // console.log("넘어온 데이터 : ",req.body);
        // 파일들을 Supabase Storage에 업로드
        const uploadedFilePaths = [];

        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileName = `work-${Date.now()}-${Math.round(Math.random() * 1E9)}.${file.type.split('/')[1]}`;

                // Base64 데이터를 Buffer로 변환
                //문자열을 binary 0,1 값으로 변경
                //파일은 2가지 타입 => 문자열 타입, 0101010110 binary파일
                const base64Data = file.data.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');

                // Supabase Storage에 업로드
                const { data: uploadData, error: uploadError } = await supa.storage
                    .from('icecarebucket')
                    .upload(`work/${fileName}`, buffer, {
                        contentType: file.type,
                        cacheControl: '3600'
                    });

                if (uploadError) {
                    console.error('파일 업로드 오류:', uploadError);
                    return res.json({status: 'error', message: '파일 업로드 중 오류가 발생했습니다.'});
                }

                // 공개 URL 생성
                const { data: urlData } = supa.storage
                    .from('icecarebucket')
                    .getPublicUrl(`work/${fileName}`);

                uploadedFilePaths.push(urlData.publicUrl);
            }
        }
        console.log('upload된 파일 처리 : ',uploadedFilePaths);
        // 청소 기사 테이블 수정 데이터를 데이터베이스에 저장
        const {data: completeData, error: completeError} = await supa
            .from('ice_work')
            .insert([{
                memo: memo,
                images_url: uploadedFilePaths.join(','), // public image 주소
                gisa_id : req.session.user.id,
                res_no
            }])
            .select();

        if (completeError) {
            console.error('청소완료 데이터 저장 오류:', completeError);
            return res.json({status: 'error', message: '데이터 저장 중 오류가 발생했습니다.'});
        }

        // 예약 상태를 '청소완료'로 업데이트
        const {error: updateError} = await supa
            .from('reservation')
            .update({'state': 5})
            .eq('res_no', res_no)
        .eq('gisa_email',req.session.user.id);

        if (updateError) {
            console.error('예약 상태 업데이트 오류:', updateError);
            return res.json({status: 'error', message: '상태 업데이트 중 오류가 발생했습니다.'});
        }

        return res.json({status: 'success', message: '청소완료 처리가 성공적으로 완료되었습니다.'});

    } catch (error) {
        console.error('청소완료 처리 오류:', error);
        return res.json({status: 'error', message: '서버 오류가 발생했습니다.'});
    }
})
module.exports = router;