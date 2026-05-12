const orderModel = require('../models/orderModel');

exports.create = async (req, res) => {
    console.log('API: POST /api/orders', req.body);
    const { staff_id, items } = req.body;
    if (!staff_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Staff ID and at least one item required.' });
    }
    try {
        const orderId = await orderModel.createOrder(staff_id, items);
        res.status(201).json({ message: 'Order created.', orderId });
    } catch (err) {
        console.error('create order:', err);
        res.status(500).json({ error: 'Failed to create order.' });
    }
};

exports.getAll = async (req, res) => {
    console.log('API: GET /api/orders');
    try {
        const orders = await orderModel.findAll();
        res.json(orders);
    } catch (err) {
        console.error('fetch orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
};

// get specific order with items
exports.getById = async (req, res) => {
    const id = req.params.id;
    try {
        const order = await orderModel.findById(id);
        if (!order) return res.status(404).json({ error: 'Order not found.' });
        res.json(order);
    } catch (err) {
        console.error('get order by id:', err);
        res.status(500).json({ error: 'Failed to fetch order.' });
    }
};
