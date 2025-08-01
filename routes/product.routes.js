const Router = require('koa-router');
const productController = require('../controllers/product.controller');

const router = new Router();

// GET /api/product/:category_id - Get all products for a category
router.get('/:category_id', productController.getProductsByCategory);

// GET /api/product - Get all products
router.get('/', productController.getAll);


module.exports = router;