const express = require('express');
const router = express.Router();
const {supa} = require('../utils/supa');
const webpush = require('web-push');
router.get('/',async function (req, res) {
// 1. 오늘 00:00:00.000 UTC (또는 로컬 시간) 계산
    if(!req.session.user)return res.redirect('/');
    const offset = new Date().getTimezoneOffset() * 60000;

    const today = new Date(Date.now() - offset); // 예: 2025‑06‑19T...
    const dateOnly = today.toISOString().slice(0,10); // "2025-06-19"
    const start = dateOnly + 'T00:00:00Z';
    const end   = dateOnly + 'T23:59:59Z';

    let prevMonth = new Date(today.getFullYear(), today.getMonth()-1, 0);
    const month_start = prevMonth.toISOString().slice(0,8)+'01T00:00:00Z';
    const month_last = new Date(today.getFullYear(), today.getMonth()-1, 0).toISOString().slice(0,10)+'T23:59:59Z';

    const {data:payData,error:payError} = await supa.from('reservation').select('price.sum()').gte('state',5).neq('state',6).gte('date',month_start).lte('date',month_last);
    console.log("정산 합계 : ",payData);
    if(!payError)
    req.session.payed = payData[0].sum? parseInt(payData[0].sum*0.7).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 0;
    else
        req.session.payed = 0;
    console.log(payError);
    const { data, error } = await supa
        .from('reservation')
        .select('*,user:customer!user_email(email,name,phone,addr,image_url)')
        .eq('gisa_email', req.session.user.mail)
        .gte('date', start)
        .lte('date', end)
        .order('state', { ascending: true }).order('date', { ascending: false });
    console.log("검색 기간 : ",month_start,month_last,prevMonth);
    console.log("지난달 기반 : ",prevMonth);
    console.log("말일 기간 : ",new Date(today.getFullYear(), today.getMonth()-1, 0));
    console.log("???시작 기간 : ",new Date(today.getFullYear(), today.getMonth()-1, 1));
    console.log("today 값 : ",today);
    console.log("today 달 출력 : ", today.getMonth());
    console.log("today 달 -1 출력 : ", today.getMonth()-1);
    console.log("new 생성자로 달 출력 : ",new Date().getMonth());
    console.log("new 생성자 : ",new Date());
    console.log("offset제거 : ",new Date(Date.now() - offset));
    console.log("offset제거 달 출력 : ",new Date(Date.now() - offset).getMonth());
    console.log("??:",today.toISOString().slice(5,7));
    console.log("지난달 말일? : ",new Date(today.getFullYear(), today.getMonth(), 0));
    console.log("today : ",data);
    console.log(req.session);
    if(!error){

        req.session.objCnt = data.reduce((a,b)=>{
            if(b.state !== 5){
                a[1]+=1;
            }
            else {
                a[0] += 1;
                a[1] += 1;
            }
            return a;
        },[0,0]);
        res.render('today',{title: 'ICECARE', request: req, todays:data});
    }
    else{
        req.session.objCnt =[0,0];
            res.render('today',{title: 'ICECARE', request: req, todays:[]});
    }
})
router.get('/order', async function (req, res) {
    if(!req.session.user) return res.redirect('/');
    const offset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(Date.now() - offset); // 예: 2025‑06‑19T...
    const dateOnly = today.toISOString().slice(0,8)+'01'; // "2025-06-"
    const start = dateOnly + 'T00:00:00Z';
    // console.log("오더 조회 로그인 계정 확인 : ",req.session.user.mail);
    const {data,error} = await supa.from('reservation').select('*,user:customer!user_email(email,name,phone,addr,image_url)').eq('gisa_email',req.session.user.mail.trim()).gte('date', start).order('state', { ascending: true }).order('date', { ascending: false });
    // console.log("배정된 예약 건 : ",data);
    const cnt = [...data].filter(el=>el.state!==5)?.length;
if(!error)
  res.render('order',{title: 'ICECARE', request: req,orderList:data,cnt});
else
    res.render('order',{title: 'ICECARE', request: req,orderList:[],cnt});
})
router.get('/reservation',async function (req, res) {
    if(!req.session.user) return res.redirect('/');
    const {data, error} = await supa.from('reservation').select('*,user:customer!user_email(email,name,phone,addr,image_url)').eq('state', 3).is('gisa_email',null).order('date', {ascending: false});
    console.log("예약 목록 : ",data);
    if (error) {
        console.error('Error fetching reservations:', error);
        return res.status(500).render('reservation',{title: 'ICECARE', request: req, error: 'Failed to fetch reservations.', reservations: [],supabase_url: process.env.SUPABASE_URL, supabase_key: process.env.SUPABASE_KEY});
    }else{
        if(data?.length>0) {
            return res.status(200).render('reservation', {title: 'ICECARE', request: req, reservations: data,supabase_url: process.env.SUPABASE_URL, supabase_key: process.env.SUPABASE_KEY});
        }else
            return res.status(201).render('reservation', {title: 'ICECARE', request: req, reservations: [],supabase_url: process.env.SUPABASE_URL, supabase_key: process.env.SUPABASE_KEY});
    }
})
router.get('/history',async function (req, res) {
    if(!req.session.user) return res.redirect('/');
    const month = req.query?.month || new Date().getMonth()+1;
    const offset = new Date().getTimezoneOffset() * 60000;
    const today = new Date(new Date(new Date().getFullYear(),month-1,3) - offset);
    // console.log(today.getMonth()+1, today.getDate(), today.getFullYear(),today.getUTCFullYear());
    // console.log(month);
    // console.log("오늘",new Date());
    // console.log('날짜 문자화',new Date().toISOString());
    const start = today.toISOString().slice(0,8)+'01T00:00:00Z';
    const last = new Date(today.getFullYear(), month, 0).toISOString().slice(0,10)+'T23:59:59Z';
    if(!req.session?.user) res.redirect('/');
    const {data:history,error} = await supa.from('reservation').select('*,user:customer!user_email(email,name,phone,addr,image_url),work:ice_work!res_no(memo,images_url)').eq('state',5).eq('gisa_email',req.session.user.mail).gte('date',start).lte('date',last).order('date', { ascending: false });
    const {data:totalPrice,err} = await supa.from('reservation').select('price.sum()').eq('state',5).eq('gisa_email',req.session.user.mail).gte('date',start).lte('date',last);
    if(!error&&history?.length>0)
    res.render('history',{title: 'ICECARE', request: req, month,history,payment:parseInt(totalPrice[0].sum*0.7).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')});
    else
        res.render('history',{title: 'ICECARE', request: req, month,history:[],payment:0});
})

router.post('/pick',async function (req, res) {
    const result = await supa.from('reservation').update({gisa_email:req.session.user.mail,state:4}).eq("res_no",req.body.res_no).select();
    const {data:end_data} = await supa.from('push_subscribe').select('*').in('phone',[req.body.phone,'admin']);
    if(end_data.length>0){
        end_data.map(async el=>{
            const pushSubscription = {
                endpoint: el.endpoint,
                keys: {
                    p256dh: el.p256dh,
                    auth: el.auth
                }
            }
            try {
                console.log("배정된 결과 : ",result);
                await webpush.sendNotification(
                    pushSubscription,
                    JSON.stringify({
                        title: '청소기사가 배정되었습니다.',
                        body: el.phone==='admin'?`${result.data[0].res_no}번 예약에 청소기사가 배정되었습니다.`:'예약하신 청소 건에 청소기사가 배정 되었습니다',
                        url: el.phone==='admin'?'https://mini-project06-ice-admin.vercel.app/': `https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app/reservation/${result.data[0].res_no}`
                    })
                );
                console.log('푸시 알림 전송 성공');
            }catch(e) {
                console.error('푸시 알림 전송 실패:', e);
            }
        });
    }
    if(req.session.user.alarm_yn) {
        const pushSubscription = {
            endpoint: req.session.user.endpoint,
            keys: {
                p256dh: req.session.user.p256dh,
                auth: req.session.user.alarm_auth
            }
        }
        try {

        await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
                title: '청소 배정',
                body: '새로운 청소가 배정 되었습니다',
                url: '/'
            })
        );
            console.log('푸시 알림 전송 성공');
        }catch(e) {
            console.error('푸시 알림 전송 실패:', e);
        }
    }
    console.log("픽업 결과 : ",result);
    const offset = new Date().getTimezoneOffset() * 60000;

    const today = new Date(Date.now() - offset); // 예: 2025‑06‑19T...
    const dateOnly = today.toISOString().slice(0,10);
    if(result.data[0]?.date.slice(0,10)===dateOnly) {
        req.session.objCnt[1]+=1;
    }
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
            .upsert([{
                memo: memo,
                images_url: uploadedFilePaths.join(','), // public image 주소
                gisa_id : req.session.user.id,
                res_no
            }],{ onConflict: 'res_no' })
            .select();

        if (completeError) {
            console.error('청소완료 데이터 저장 오류:', completeError);
            return res.json({status: 'error', message: '데이터 저장 중 오류가 발생했습니다.'});
        }

        // 예약 상태를 '청소완료'로 업데이트
        const {data:updateData,error: updateError} = await supa
            .from('reservation')
            .update({'state': 5})
            .eq('res_no', res_no)
        .eq('gisa_email',req.session.user.id).select();

        if (updateError) {
            console.error('예약 상태 업데이트 오류:', updateError);
            return res.json({status: 'error', message: '상태 업데이트 중 오류가 발생했습니다.'});
        }
        else{
            console.log("청소 완료 업데이트 값 : ",updateData);
            const {data:end_data} = await supa.from('push_subscribe').select('*').in('phone',[req.body.phone,'admin']);
            if(end_data.length>0){
                end_data.map(async el=>{
                    const pushSubscription = {
                        endpoint: el.endpoint,
                        keys: {
                            p256dh: el.p256dh,
                            auth: el.auth
                        }
                    }

                    try {

                        await webpush.sendNotification(
                            pushSubscription,
                            JSON.stringify({
                                title: '청소가 완료되었습니다.',
                                body: el.phone==='admin'?(req.body.phone?`${updateData[0].res_no}번 예약의 청소가 완료되었습니다.`:`${updateData[0].res_no}번 예약의 보고가 수정되었습니다.`):'예약하신 청소 건의 청소가 완료되었습니다',
                                url: el.phone==='admin'?'https://mini-project06-ice-admin.vercel.app/': `https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app/reservation/${updateData[0].res_no}`
                            })
                        );
                        console.log('푸시 알림 전송 성공');
                    }catch(e) {
                        console.error('푸시 알림 전송 실패 사용자 및 관리자 :', e);
                    }
                });
            }


                console.log("배송기사 알람 여부 : ",req.session.user.alarm_yn);
                if(req.session.user.alarm_yn) {
                    const pushSubscription = {
                        endpoint: req.session.user.endpoint,
                        keys: {
                            p256dh: req.session.user.p256dh,
                            auth: req.session.user.alarm_auth
                        }
                    }
                    console.log("배송기사 알람 데이터 : ",pushSubscription);
                    await webpush.sendNotification(
                        pushSubscription,
                        JSON.stringify({
                            title: '청소 완료',
                            body: '배정한 청소가 완료처리되었습니다',
                            url: '/'
                        })
                    ).then(res=>console.log('알림 성공')).catch(e=>console.log("알림 실패",e));
                }
        return res.json({status: 'success', message: '청소완료 처리가 성공적으로 완료되었습니다.'});
        }

    } catch (error) {
        console.error('청소완료 처리 오류:', error);
        return res.json({status: 'error', message: '서버 오류가 발생했습니다.'});
    }
})
module.exports = router;