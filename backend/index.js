const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const cors = require("cors"); // Add CORS package

const app = express();
const PORT = 3000;

// Middleware for parsing JSON from request body
app.use(express.json());

// Configure CORS
app.use(cors()); // Enable CORS for all routes

// Serving static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "plantio",
});

connection.connect((err) => {
    if (err) {
        console.error("❌ MySQL connection error:", err);
        return;
    }
    console.log("✅ MySQL connected successfully!");
});

// Import routes
require('./routes')(app);

// Route GET /login
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Route GET /data
app.get("/data", (req, res) => {
    const query = "SELECT * FROM information";
    connection.query(query, (error, results) => {
        if (error) {
            res.status(500).json({ error: "Database error" });
        } else {
            res.status(200).json(results);
        }
    });
});

// Route POST /data
app.post("/data", (req, res) => {
    const { content } = req.body; // Get data from request body
    if (!content) {
        return res.status(400).json({ error: "Missing 'content' field in request body" });
    }

    const query = `INSERT INTO information (moisture_percent) VALUES (?)`; // Use placeholder to prevent SQL injection
    connection.query(query, [content], (error, results) => {
        if (error) {
            console.error("❌ Error adding data to MySQL:", error);
            res.status(500).json({ error: "Database error" });
        } else {
            res.status(200).json({ message: "Data added successfully!", results });
        }
    });
});

app.post("/login", (req, res) => {
    console.log("Login request received:", req.body); // Log the request body for debugging
    const data = req.body; // Get data from request body

    var email = data.email;
    var password = data.password;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing 'username' or 'password' field in request body" });
    }

    if (email === "admin@gmail.com" && password === "1") {
        return res.status(200).json({
            message: "Login successful!",
            role: "teacher",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"
        });
    }

    if (email === "scamqn145@gmail.com" && password === "1") {
        return res.status(200).json({
            message: "Login successful!",
            role: "student",
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30"
        });
    }

    return res.status(401).json({ error: "Invalid username or password" });
})

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
});	