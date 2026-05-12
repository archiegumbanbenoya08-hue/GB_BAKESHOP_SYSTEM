const db = require('../config/db');

exports.findAll = async () => {
    const [rows] = await db.execute('SELECT * FROM products');
    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
};

exports.create = async ({ product_name, category, price, stock_quantity }) => {
    const [result] = await db.execute(
        'INSERT INTO products (product_name, category, price, stock_quantity) VALUES (?,?,?,?)',
        [product_name, category, price, stock_quantity]
    );
    return result.insertId;
};

exports.update = async (id, { product_name, category, price, stock_quantity }) => {
    await db.execute(
        'UPDATE products SET product_name = ?, category = ?, price = ?, stock_quantity = ? WHERE id = ?',
        [product_name, category, price, stock_quantity, id]
    );
};

exports.remove = async (id) => {
    await db.execute('DELETE FROM products WHERE id = ?', [id]);
};
