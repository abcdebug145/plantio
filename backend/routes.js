const path = require('path');
const express = require('express');

module.exports = function (app) {
    // Route trả về index.html
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../pages/index.html'));
    });

    // Cấu hình phục vụ file tĩnh
    app.use('/assets', express.static(path.join(__dirname, '../assets')));
    app.use('/pages', express.static(path.join(__dirname, '../pages')));
};