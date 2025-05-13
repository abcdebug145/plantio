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

// API đăng ký
router.post("/api/auth/register", async (req, res) => {
    try {
        const { password, email, username } = req.body;

        // Kiểm tra user đã tồn tại
        const existingUser = await dbUtils.exists('users', 'email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const userId = await dbUtils.insert('users', {
            id: crypto.randomUUID(),
            email,
            username,
            password: hashedPassword
        });

        res.status(201).json({ message: 'Đăng ký thành công', data: userId });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API đăng nhập
router.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm user
        const user = await dbUtils.getOne('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ message: 'Email không tồn tại' });
        }

        // Kiểm tra password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Mật khẩu không đúng' });
        }

        // Lưu thông tin user vào session
        req.session.user = {
            id: user.id,
            email: user.email,
            username: user.username
        };

        res.json({
            message: 'Đăng nhập thành công',
            user: req.session.user
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API đăng xuất
router.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Lỗi khi đăng xuất' });
        }
        res.json({ message: 'Đăng xuất thành công' });
    });
});

// API kiểm tra trạng thái đăng nhập
router.get("/api/auth/check-auth", (req, res) => {
    if (req.session.user) {
        res.json({
            isAuthenticated: true,
            user: req.session.user
        });
    } else {
        res.json({ isAuthenticated: false });
    }
});

module.exports = router;