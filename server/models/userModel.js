const db = require('../config/db');

exports.findByEmail = async (email) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

exports.create = async ({ name, email, password, role }) => {
    const [result] = await db.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
        [name, email, password, role]
    );
    return result.insertId;
};

exports.count = async () => {
    const [rows] = await db.execute('SELECT COUNT(*) as c FROM users');
    return rows[0].c;
};
