const mysql = require('mysql2/promise');

// Cấu hình kết nối database
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "123456",
    database: "plantio",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Tạo pool connection
const pool = mysql.createPool(dbConfig);

// Hàm kiểm tra kết nối
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Database connected successfully!");
        connection.release();
        return true;
    } catch (error) {
        console.error("❌ Database connection error:", error);
        return false;
    }
}

// Hàm thực thi query với tham số
async function executeQuery(query, params = []) {
    try {
        const [results] = await pool.execute(query, params);
        return results;
    } catch (error) {
        console.error("❌ Query execution error:", error);
        throw error;
    }
}

// Hàm lấy một bản ghi
async function getOne(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows[0] || null;
    } catch (error) {
        console.error("❌ Get one record error:", error);
        throw error;
    }
}

// Hàm lấy nhiều bản ghi
async function getMany(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error("❌ Get many records error:", error);
        throw error;
    }
}

// Hàm thêm bản ghi mới
async function insert(table, data) {
    try {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);

        const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        const [result] = await pool.execute(query, values);

        return result.insertId;
    } catch (error) {
        console.error("❌ Insert record error:", error);
        throw error;
    }
}

// Hàm cập nhật bản ghi
async function update(table, data, whereClause, whereParams = []) {
    try {
        const setClause = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(data), ...whereParams];

        const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        const [result] = await pool.execute(query, values);

        return result.affectedRows;
    } catch (error) {
        console.error("❌ Update record error:", error);
        throw error;
    }
}

// Hàm xóa bản ghi
async function remove(table, whereClause, params = []) {
    try {
        const query = `DELETE FROM ${table} WHERE ${whereClause}`;
        const [result] = await pool.execute(query, params);

        return result.affectedRows;
    } catch (error) {
        console.error("❌ Delete record error:", error);
        throw error;
    }
}

// Hàm kiểm tra bản ghi tồn tại
async function exists(table, whereClause, params = []) {
    try {
        const query = `SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${whereClause}) as exists_flag`;
        const [rows] = await pool.execute(query, params);
        return rows[0].exists_flag === 1;
    } catch (error) {
        console.error("❌ Check existence error:", error);
        throw error;
    }
}

// Hàm đóng kết nối pool
async function closePool() {
    try {
        await pool.end();
        console.log("✅ Database connection pool closed");
    } catch (error) {
        console.error("❌ Error closing connection pool:", error);
        throw error;
    }
}

module.exports = {
    testConnection,
    executeQuery,
    getOne,
    getMany,
    insert,
    update,
    remove,
    exists,
    closePool
};
