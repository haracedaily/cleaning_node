const express = require('express');
const router = express.Router();
const {supa} = require('../utils/supa');
const webpush = require('web-push');

router.post('/send',async(req,res)=>{
    const {gisa_data,phone,res_data} = req.body;
    const {data:user_push,err} = await supa.from("push_subscribe").select().eq('phone',phone).single();
    if(user_push){
        try{
            const pushSubscription = {
                endpoint: user_push.endpoint,
                keys: {
                    p256dh: user_push.p256dh,
                    auth: user_push.auth
                }
            }

            await webpush.sendNotification(
                pushSubscription,
                JSON.stringify({
                    title: '청소기사가 배정되었습니다.',
                    body: '예약하신 청소 건에 청소기사가 배정 되었습니다',
                    url: `https://port-0-icemobile-manaowvf213a09cd.sel4.cloudtype.app/reservation/${res_data.res_no}`
                })
            );
            await webpush.sendNotification(
                {
                    endpoint:gisa_data.endpoint,
                    keys:{
                        p256dh: gisa_data.p256dh,
                        auth: gisa_data.alarm_auth
                    }
                },
                JSON.stringify({
                    title: '청소예약이 배정되었습니다.',
                    body: `${res_data.date} 처리해야할 예약이 배정 되었습니다`,
                    url: `/`
                })
            );
            console.log('푸시 알림 전송 성공');

        }catch (e) {
            
        }
    }
})

module.exports = router;