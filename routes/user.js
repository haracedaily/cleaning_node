const express = require('express');
const router = express.Router();
const {supa} = require('../utils/supa.js');
const bcrypt = require('bcryptjs');

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
});

router.post('/profileUpdate', async function (req, res) {
    console.log("프로필 수정 : ",req.session);
    console.log(req.body);
    const {name, phone, addr, bank, account_num, confirmPassword, pushNotification,file} = req.body;
    const pw = confirmPassword ? await bcrypt.hash(confirmPassword,10) : req.session.user.pw;
    if(confirmPassword){
        const result = await supa.auth.updateUser({
            password: confirmPassword
        })
        console.log("auth 비밀번호 변경 : ",result);
    }
    const changeData = {
        nm: name,
        tel: phone,
        addr,
        bank,
        account_num,
        pw,
        alarm_yn: pushNotification==='on',
    }
    if(file?.name) {
        const fileName = `work-${Date.now()}-${Math.round(Math.random() * 1E9)}.${file.type.split('/')[1]}`;

        // Base64 데이터를 Buffer로 변환
        //문자열을 binary 0,1 값으로 변경
        //파일은 2가지 타입 => 문자열 타입, 0101010110 binary파일
        const base64Data = file.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        let remove_file = req.session.user.file_url;
        if(remove_file) {
            remove_file = remove_file.split('/');

            await supa.storage.from('icecarebucket').remove(['profile/' + remove_file[remove_file.length - 1]]);
        }
        // Supabase Storage에 업로드
        const {data: uploadData, error: uploadError} = await supa.storage
            .from('icecarebucket')
            .upload(`profile/${fileName}`, buffer, {
                contentType: file.type,
                cacheControl: '3600'
            });

        if (uploadError) {
            console.error('파일 업로드 오류:', uploadError);
            return res.json({status: 'error', message: '파일 업로드 중 오류가 발생했습니다.'});
        }

        // 공개 URL 생성
        const {data: urlData} = supa.storage
            .from('icecarebucket')
            .getPublicUrl(`profile/${fileName}`);
        changeData.file_url = urlData.publicUrl;


    }
    console.log("업데이트 값 : ",changeData)
    const {data:updateData, error: updateError} = await supa.from('member').update(changeData).eq('id',req.session.user.id).select();
    if(updateError) {
        console.log(updateError);
        res.status(201).json({status: 'error', message: updateError});
    }else{
        console.log(updateData);
        req.session.user = updateData[0];
        res.status(200).json(updateData);
    }

})
module.exports = router;