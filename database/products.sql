-- Tạo bảng products
CREATE TABLE IF NOT EXISTS products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Chèn dữ liệu sản phẩm
INSERT INTO products (id, name, price, image_path) VALUES
(UUID(), 'Smart Pot Mini', 19.99, 'backend/uploads/pot1.webp'),
(UUID(), 'My Pot Classic', 24.99, 'backend/uploads/cpot1.webp'),
(UUID(), 'Cactus Pot', 14.99, 'backend/uploads/pot2.webp'),
(UUID(), 'Plantio Premium', 39.99, 'backend/uploads/cpot2.webp'),
(UUID(), 'Cactus Pot', 14.99, 'backend/uploads/pot3.webp'),
(UUID(), 'Cactus Pot', 14.99, 'backend/uploads/cpot3.webp'),
(UUID(), 'Cactus Pot', 14.99, 'backend/uploads/pot4.webp'),
(UUID(), 'Cactus Pot', 14.99, 'backend/uploads/cpot4.webp'); 