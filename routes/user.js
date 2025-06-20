const express = require('express');
const router = express.Router();
const {supa} = require('../utils/supa.js');

router.post('/login', async function (req, res) {
    console.log("로그인 바디 : ",req.body);

    supa.auth.signInWithPassword({
        email: req.body.id.trim(),
        password: req.body.pw.trim()
    }).then(async ({data, error}) => {
        if (error) {
            console.error('로그인 에러:', error);
            res.status(401).json({status: 'error', message: error.message});
        } else {
            console.log('로그인 성공:', data);
            if(req.body.endpoint){
            const result = await supa.from('member').update({p256dh:req.body.p256dh,alarm_auth:req.body.auth,endpoint:req.body.endpoint}).eq('mail',req.body.id).select();
            console.log('업데이트 결과 : ',result);
            }
                const result = await supa.from('member').select('*').eq('mail', req.body.id).single();
                req.session.user = result.data;
            if (req.body.autoLogin) {
                console.log('조회 내용', req.body.id);
                console.log('조회 내용',result.data);
                console.log(req.session);
            }
            req.session.user.nm = result.data.nm;
            res.status(200).json({status: 'success', user: data.user});
        }
    });
});

router.get('/logout', async function (req, res) {
    if (req.session.user) {
        const { error } = await supa.auth.signOut();
        return req.session.destroy(err => {
            res.clearCookie('session-cookie');
            if (err) {
                console.error('세션 삭제 중 오류:', err);
            } else {
                console.log('세션 삭제 성공');
            }
            console.log('logout error:', error);
            return res.redirect('/');
        });
    }
    // 세션이 없으면 바로 리디렉션
    return res.redirect('/');
});

router.get('/profile', async function (req, res) {
    const {data:bank,err} = await supa.from('bank').select();
    console.log(req.session.user);
    if(req.session.user) {
        res.render('user/profile',{title:'프로필수정',request: req ,bank});
    }else{
        res.redirect('/');
    }
})
module.exports = router;