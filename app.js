const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
require('dotenv').config();

const app = new Koa();
const router = new Router();

// Middlewares
const errorHandler = require('./middlewares/errorHandler');

// Routes
const dashboardRoutes = require('./routes/dashboard.routes');
const orderRoutes = require('./routes/order.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');

// Use middlewares
app.use(bodyParser());
app.use(errorHandler);

// Use routes
router.use('/api/dashboard', dashboardRoutes.routes());
router.use('/api/order', orderRoutes.routes());
router.use('/api/category', categoryRoutes.routes());
router.use('/api/product', productRoutes.routes());


app.use(router.routes()).use(router.allowedMethods());

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
