const express = require('express');
const router = express.Router();
// const supabase = require('../utils/supa.js');

router.get('/1', function (req, res) {
    res.render('signup/signup1', { title: '회원가입', request: req, today: new Date().toLocaleDateString().replaceAll(" ", "").slice(0, -1).replaceAll(".", "-") });
})
router.get('/2', function (req, res) {
    res.render('signup/signup2', { title: '회원가입', request: req, today: new Date().toLocaleDateString().replaceAll(" ", "").slice(0, -1).replaceAll(".", "-") });
})
router.get('/3', function (req, res) {
    res.render('signup/signup3', { title: '회원가입', request: req, today: new Date().toLocaleDateString().replaceAll(" ", "").slice(0, -1).replaceAll(".", "-") });
})

module.exports = router;