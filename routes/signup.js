const express = require('express');
const router = express.Router();
const supabase = require('../utils/supa.js');
const bcrypt = require('bcryptjs');

router.get('/1', function (req, res) {
    res.render('signup/signup1', { title: '회원가입', request: req });
})
router.get('/2', function (req, res) {
    if(!req.session.email)
    res.render('signup/signup2', { title: '회원가입', request: req });
    else
        res.render('signup/signup2', { title: '회원가입', request: req, email: req.session.email });
})
router.get('/3', async function (req, res) {
    console.log("회원가입 3");
    console.log(req.session.email);
    const result = await supabase.from('bank').select('*');
    res.render('signup/signup3', { title: '회원가입', request: req, email: req.session.email, bank:result.data });
})

router.post('/3', async function (req, res) {
    console.log("회원가입 3 post");
    console.log(req.body);
    const { name, phone, email, bank, account_num } = req.body;
    const result1 = await supabase.auth.signUp({ email, password: phone.replaceAll('-','') });
    console.log("result1 = ", result1);

    const pw = await bcrypt.hash(phone.replaceAll('-',''),10);
    const result = await supabase.from('member').upsert({
        nm:name,
        tel:phone,
        mail: email,
        id:email,
        bank,
        account_num:account_num.replaceAll('-',''),
        pw,
        entr_date: new Date(),
        type: 2,
        auth: 2
    });

    if (!result.error) {
        res.json({ success: true });
    } else {
        res.json({ success: false, error: result.error.message });
    }
})


router.get('/email', function (req, res) {
    req.session.email = req.query.email;
    // 이메일 세션 저장, 외부 노출을 없애기 위해서 세션에 저장 만약 다시 들어왔을 때 있다면 다시 입력하지 않게 넣어주기
    res.redirect('/signup/3');
})

router.post('/email', async function (req, res) {
    let result = await supabase.from('member').select("*").eq('mail', req.body.email);
    console.log("중복 확인",result);
    if (result.data?.length > 0) {
        res.json({ success: false });
    } else {
        res.json({ success: true });
    }
})

module.exports = router;