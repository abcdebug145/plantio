const express = require('express');
const router = express.Router();
const session = require('express-session');
const bcrypt = require('bcrypt');
const dbUtils = require('../utils/DbUtils');

// Middleware xử lý session
router.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

router.post('/api/chat', async (req, res) => {
    // console.log(req);
    // const { message } = req.body;
    res.status(200).json({ message: "Success", data: { content: "Hello, how are you?" } });
});
module.exports = router;