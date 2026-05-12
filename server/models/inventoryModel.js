const db = require('../config/db');

// get aggregated inventory with last transaction date
exports.getInventoryOverview = async () => {
    const [rows] = await db.execute(
        `SELECT p.id, p.product_name, p.stock_quantity,
                MAX(t.transaction_date) AS last_transaction
         FROM products p
         LEFT JOIN inventory_transactions t ON p.id = t.product_id
         GROUP BY p.id`
    );
    return rows;
};

// insert a transaction entry (IN or OUT)
exports.recordTransaction = async ({ product_id, transaction_type, quantity, reference_note }) => {
    await db.execute(
        'INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_note) VALUES (?,?,?,?)',
        [product_id, transaction_type, quantity, reference_note]
    );
};
