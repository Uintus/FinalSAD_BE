const Router = require('koa-router');
const categoryController = require('../controllers/category.controller');

const router = new Router();

// GET /api/category - Get all categories
router.get('/', categoryController.getAll);


module.exports = router;