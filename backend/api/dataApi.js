const express = require('express');
const router = express.Router();
const dbUtils = require('../utils/DbUtils');

// Route GET /data
router.get("/data", async (req, res) => {
    try {
        const results = await dbUtils.getMany("SELECT * FROM information");
        res.status(200).json(results);
    } catch (error) {
        console.error('Lỗi lấy dữ liệu:', error);
        res.status(500).json({ error: "Database error" });
    }
});

// Route POST /data
router.post("/data", async (req, res) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: "Missing 'content' field in request body" });
    }

    try {
        const insertId = await dbUtils.insert('information', { moisture_percent: content });
        res.status(200).json({
            message: "Data added successfully!",
            insertId
        });
    } catch (error) {
        console.error('Lỗi thêm dữ liệu:', error);
        res.status(500).json({ error: "Database error" });
    }
});

module.exports = router; 