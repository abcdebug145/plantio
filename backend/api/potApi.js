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

// link pot
router.post('/link-pot', async (req, res) => {
    const { potCode } = req.body;
    const userId = req.session.user.id;
    const potId = await dbUtils.insert('pots', { code: potCode, user_id: userId });
    res.status(200).json({ message: 'Chậu cây đã được liên kết', potId });
});

//get all pot for display
router.get('/api/pots', async (req, res) => {
    const pots = await dbUtils.getMany('SELECT * FROM pots');
    res.status(200).json({ message: 'Lấy danh sách chậu cây thành công', data: pots });
});

module.exports = router;