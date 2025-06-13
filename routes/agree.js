const express = require('express');
const router = express.Router();

router.get('/service', function (req, res) {
    res.render('agreement/service_agree', { title: '서비스 이용약관', request: req, today: new Date().toLocaleDateString().replaceAll(" ", "").slice(0, -1).replaceAll(".", "-") });
});

router.get('/personalInfo', function (req, res) {
    res.render('agreement/personal_info', { title: '개인정보 수집 및 이용 동의', request: req, today: new Date().toLocaleDateString().replaceAll(" ", "").slice(0, -1).replaceAll(".", "-") });
})

router.get('/personalPrivacy', function (req, res) {
    res.render('agreement/personal_privacy', { title: '개인정보 처리방침', request: req, today: new Date().toLocaleDateString().replaceAll(" ", "").slice(0, -1).replaceAll(".", "-") });
})

module.exports = router;