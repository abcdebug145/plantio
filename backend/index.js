const express = require("express");
const path = require("path");
const session = require('express-session');
const authRoutes = require('./api/authApi');
const dataRoutes = require('./api/dataApi');
const potRoutes = require('./api/potApi');
const chatRoutes = require('./api/chatApi');
const routes = require('./routes');
const dbUtils = require('./utils/DbUtils');

const app = express();
const PORT = 3000;

// Middleware for parsing JSON from request body
app.use(express.json());

// Middleware for session
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Serving static files from public directory
app.use(express.static(path.join(__dirname, "..")));

// Sử dụng các routes
app.use(authRoutes);
app.use(dataRoutes);
app.use(potRoutes);
app.use(chatRoutes);
routes(app);

// Kiểm tra kết nối database
dbUtils.testConnection();

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
});

// Xử lý đóng kết nối khi tắt server
process.on('SIGINT', async () => {
    await dbUtils.closePool();
    process.exit(0);
});	