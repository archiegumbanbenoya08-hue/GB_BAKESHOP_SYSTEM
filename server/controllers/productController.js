const productModel = require('../models/productModel');

exports.getAll = async (req, res) => {
    console.log('API: GET /api/products');
    try {
        const products = await productModel.findAll();
        res.json(products);
    } catch (err) {
        console.error('getAll products error', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const prod = await productModel.findById(req.params.id);
        if (!prod) return res.status(404).json({ message: 'Not found' });
        res.json(prod);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    const { product_name, category, price, stock_quantity } = req.body;
    if (!product_name || !category || price == null || stock_quantity == null) {
        return res.status(400).json({ message: 'All product fields are required.' });
    }
    try {
        const id = await productModel.create({ product_name, category, price, stock_quantity });
        res.status(201).json({ message: 'Product created.', id });
    } catch (err) {
        console.error('create product:', err);
        res.status(500).json({ error: 'Failed to create product.' });
    }
};

exports.update = async (req, res) => {
    const id = req.params.id;
    const { product_name, category, price, stock_quantity } = req.body;
    if (!product_name || !category || price == null || stock_quantity == null) {
        return res.status(400).json({ message: 'All product fields are required.' });
    }
    try {
        await productModel.update(id, { product_name, category, price, stock_quantity });
        res.json({ message: 'Product updated.' });
    } catch (err) {
        console.error('update product:', err);
        res.status(500).json({ error: 'Failed to update product.' });
    }
};

exports.remove = async (req, res) => {
    const id = req.params.id;
    try {
        await productModel.remove(id);
        res.json({ message: 'Product deleted.' });
    } catch (err) {
        console.error('delete product:', err);
        res.status(500).json({ error: 'Failed to delete product.' });
    }
};
