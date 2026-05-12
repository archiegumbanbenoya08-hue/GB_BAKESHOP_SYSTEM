const db = require('../config/db');

// place a new order with items and adjust stock/transactions
exports.createOrder = async (staffId, items) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [orderRes] = await conn.execute(
            'INSERT INTO orders (staff_id, total_amount) VALUES (?,?)',
            [staffId, 0]
        );
        const orderId = orderRes.insertId;
        let total = 0;
        for (const item of items) {
            const subtotal = parseFloat(item.price) * item.quantity;
            total += subtotal;
            await conn.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, subtotal) VALUES (?,?,?,?)',
                [orderId, item.product_id, item.quantity, subtotal]
            );
            // decrement stock
            await conn.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
            // record inventory transaction
            await conn.execute(
                'INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_note) VALUES (?,?,?,?)',
                [item.product_id, 'OUT', item.quantity, `order #${orderId}`]
            );
        }
        await conn.execute('UPDATE orders SET total_amount = ? WHERE id = ?', [total, orderId]);
        await conn.commit();
        return orderId;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

exports.findAll = async () => {
    const [rows] = await db.execute(
        `SELECT o.id, o.order_date, o.total_amount, o.status, u.name AS staff
         FROM orders o
         LEFT JOIN users u ON o.staff_id = u.id
         ORDER BY o.order_date DESC`
    );
    return rows;
};

// fetch single order including its items
exports.findById = async (id) => {
    const [orders] = await db.execute(
        `SELECT o.id, o.order_date, o.total_amount, o.status, u.name AS staff
         FROM orders o
         LEFT JOIN users u ON o.staff_id = u.id
         WHERE o.id = ?`,
        [id]
    );
    if (orders.length === 0) return null;
    const order = orders[0];
    const [items] = await db.execute(
        `SELECT oi.product_id, p.product_name, oi.quantity, oi.subtotal
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [id]
    );
    order.items = items;
    return order;
};
