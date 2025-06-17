const express = require('express');
const router = express.Router();
const {supa} = require('../utils/supa');
router.get('/', function (req, res) {
    res.render('today',{title: 'ICECARE', request: req});
})
router.get('/order', function (req, res) {
  res.render('order',{title: 'ICECARE', request: req});
})
router.get('/reservation',async function (req, res) {
    const {data, error} = await supa.from('reservation').select('*').eq('state', 3).order('date', {ascending: false});
    console.log(data);
    if (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).render('reservation',{title: 'ICECARE', request: req, error: 'Failed to fetch reservations.', reservations: []});
    }else{
        if(data?.length>0) {
            res.status(200).render('reservation', {title: 'ICECARE', request: req, reservations: data});
        }else
            res.status(201).render('reservation', {title: 'ICECARE', request: req, reservations: []});
    }
})
router.get('/history', function (req, res) {
    res.render('history',{title: 'ICECARE', request: req});
})

module.exports = router;