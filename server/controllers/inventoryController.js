const inventoryModel = require('../models/inventoryModel');

exports.getAll = async (req, res) => {
    console.log('API: GET /api/inventory');
    try {
        const data = await inventoryModel.getInventoryOverview();
        res.json(data);
    } catch (err) {
        console.error('inventory error:', err);
        res.status(500).json({ error: 'Failed to fetch inventory.' });
    }
};
