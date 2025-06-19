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
                const result = await supa.from('member').select('*').eq('mail', req.body.id).single();
            if (req.body.autoLogin) {
                console.log('조회 내용', req.body.id);
                console.log('조회 내용',result.data);
                req.session.user = result.data;
                console.log(req.session);
            }
            req.session.user.nm = result.data.nm;
            res.status(200).json({status: 'success', user: data.user});
        }
    });
});


module.exports = router;