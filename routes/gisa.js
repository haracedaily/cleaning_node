const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
    res.render('today.html',{title: 'ICECARE', request: req});
})
router.get('/order', function (req, res) {
  res.render('order.html',{title: 'ICECARE', request: req});
})
router.get('/payment', function (req, res) {
    res.render('payment.html',{title: 'ICECARE', request: req});
})
router.get('/history', function (req, res) {
    res.render('history.html',{title: 'ICECARE', request: req});
})

module.exports = router;