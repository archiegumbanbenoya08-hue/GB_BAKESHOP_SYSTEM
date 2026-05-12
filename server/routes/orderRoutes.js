const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getAll);
// fetch single order with items
router.get('/:id', orderController.getById);
router.post('/', orderController.create);

module.exports = router;
