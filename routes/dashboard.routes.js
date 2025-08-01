const Router = require('koa-router');
const dashboardController = require('../controllers/dashboard.controller');

const router = new Router();
// GET /api/dashboard - Get all the data for the dashboard
router.get('/', dashboardController.getAll);

// GET /api/dashboard/top-products - Get the top products data for the dashboard
router.get('/top-products', dashboardController.getTopProducts);

// GET /api/dashboard/export-top-products - Export the top products data to an Excel file
router.get('/export-top-products', dashboardController.exportTopProductsExcel);

module.exports = router;