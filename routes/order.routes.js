const Router = require('koa-router');
const orderController = require('../controllers/order.controller');

const router = new Router();

// POST /api/order - Create a new order (FAKE)
router.post('/', orderController.createOrder);


module.exports = router;