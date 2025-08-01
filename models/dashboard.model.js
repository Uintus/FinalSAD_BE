const db = require("../config/database");
const { getPreviousPeriod } = require("../utils/dashboardUtils");
const { calcPercentChange } = require("../utils/dashboardUtils");
const { ORDER_STATUS } = require("../constants/dashboard");
const { RANGE_TYPE } = require("../constants/dashboard");

/**
 * @function fetchSummaryTotal
 * @description Get the summary total data for the given range
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @param {string} range - The range type. Accepted values are:
 *   - `RANGE_TYPE.YEAR_TO_DATE`: From the first day of the year to today
 *   - `RANGE_TYPE.MONTH_TO_DATE`: From the first day of the month to today
 *   - `RANGE_TYPE.LAST_7_DAYS`: The last 7 days
 * @returns {Promise} A promise that resolves to an object with the following properties:
 *   - `totalSales`: The total sales for the period (e.g. 10000)
 *   - `totalOrders`: The total orders for the period (e.g. 4)
 *   - `totalRevenue`: The total revenue for the period (e.g. 2500)
 *   - `fulfillmentRate`: The fulfillment rate for the period (e.g. 80%)
 *   - `comparisons`: An object with the following properties:
 *     - `salesChange`: The percentage change of total sales compared to the previous period
 *     - `ordersChange`: The percentage change of total orders compared to the previous period
 *     - `revenueChange`: The percentage change of total revenue compared to the previous period
 *     - `fulfillmentRateChange`: The percentage change of fulfillment rate compared to the previous period
 */
exports.fetchSummaryTotal = async (start, end, range) => {
  const [totalSales, totalOrders, totalRevenue, fulfillmentRate] =
    await Promise.all([
      countTotalSales(start, end),
      countTotalOrders(start, end),
      calculateTotalRevenue(start, end),
      calculateFulfillmentRate(start, end),
    ]);

  const comparisons = await compareWithPreviousPeriod({
    start,
    end,
    range,
    totalSales,
    totalOrders,
    totalRevenue,
    fulfillmentRate,
  });

  return {
    totalSales,
    totalOrders,
    totalRevenue,
    fulfillmentRate,
    comparisons,
  };
};

/**
 * @function fetchLineChartData
 * @description Get the line chart data for the given range
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @param {string} range - The range type. Accepted values are:
 *   - `RANGE_TYPE.YEAR_TO_DATE`: From the first day of the year to today
 *   - `RANGE_TYPE.MONTH_TO_DATE`: From the first day of the month to today
 *   - `RANGE_TYPE.LAST_7_DAYS`: The last 7 days
 * @returns {Promise} A promise that resolves to an array of objects with the following properties:
 *   - `name`: The label for the data point (e.g. "01/2025")
 *   - `pv`: The total revenue for the period (e.g. 10000)
 *   - `uv`: The average revenue for the period (e.g. 2500)
 */
exports.fetchLineChartData = async (start, end, range, groupFormat, labels) => {
  // Query the database to get the total and average revenue for each period
  const [rows] = await db.query(
    `
    SELECT
      DATE_FORMAT(created_at, ?) AS period,
      SUM(total_amount) AS total,
      AVG(total_amount) AS avg
    FROM orders
    WHERE status = ? AND created_at BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period
    `,
    [groupFormat, ORDER_STATUS.COMPLETED, start, end]
  );

  // Map the data from the query to an object for easier label matching
  const dataMap = {};
  for (const row of rows) {
    let label = "";
    if (range === RANGE_TYPE.YEAR_TO_DATE) {
      const [y, m] = row.period.split("-");
      label = `${m}/${y}`; // 07/2025
    } else {
      const [y, m, d] = row.period.split("-");
      label = `${d}/${m}`; // 27/07
    }

    dataMap[label] = {
      total_revenue: parseFloat(row.total),
      avg_revenue: parseFloat(row.avg),
    };
  }

  // Create the final result array
  const lineChartData = labels.map((label) => ({
    label: label,
    total: Math.round(dataMap[label]?.total_revenue) || 0,
    avg: Math.round(dataMap[label]?.avg_revenue) || 0,
  }));

  return lineChartData;
};

/**
 * Get the pie chart data for the given range
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @returns {Promise<{name: string, value: number}[]>} A promise that resolves to an array of objects with the following properties:
 *   - `name`: The name of the data point (e.g. "pending", "completed", "cancelled")
 *   - `value`: The percentage of the data point (e.g. 20.5)
 */
exports.fetchPieChartData = async (start, end) => {
  // Query the database to get the count of each status for the given period
  const [rows] = await db.query(
    `
    SELECT status, COUNT(*) as count
    FROM orders
    WHERE created_at BETWEEN ? AND ?
    GROUP BY status
    `,
    [start, end]
  );

  // Calculate the total count to calculate the percentage
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  // Map the data to the desired format
  const pieChartData = rows.map((row) => ({
    // The name of the data point
    label: row.status,
    // The percentage of the data point
    value: total === 0 ? 0 : parseFloat(((row.count / total) * 100).toFixed(2)),
  }));

  return pieChartData;
};

/**
 * Get the bar chart data for the given range
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @param {string} range - The range type. Accepted values are:
 *   - `RANGE_TYPE.LAST_7_DAYS`: The last 7 days
 *   - `RANGE_TYPE.YEAR_TO_DATE`: From the first day of the year to today
 * @returns {Promise<{label: string, total_revenue: number}[]>} A promise that resolves to an array of objects with the following properties:
 *   - `label`: The name of the category
 *   - `total_revenue`: The total revenue for the category
 */
exports.fetchBarChartData = async (start, end) => {
  // Query the database to get the total revenue for each category
  // for the given period
  const [rows] = await db.query(
    `
    SELECT
      c.name AS label, 
      SUM(oi.price * oi.quantity) AS total_revenue 
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE o.status = ? AND o.created_at BETWEEN ? AND ?
    GROUP BY c.name 
    ORDER BY total_revenue DESC 
    `,
    [ORDER_STATUS.COMPLETED, start, end]
  );

  return rows.map((row) => ({
    label: row.label,
    total: parseFloat(row.total_revenue),
  }));
};

/**
 * Count the total sales for the given period
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @returns {Promise<number>} The total sales for the period
 */
async function countTotalSales(start, end) {
  // Count the total sales for the given period
  // Join orders and order items tables and filter by completed orders
  // and the given period
  const [rows] = await db.query(
    `SELECT SUM(oi.quantity) as totalSales
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.status = ? AND o.created_at BETWEEN ? AND ?`,
    [ORDER_STATUS.COMPLETED, start, end]
  );

  // Return the total sales or 0 if it's null
  return rows[0].totalSales || 0;
}

/**
 * Count the total number of orders for the given period
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @returns {Promise<number>} The total number of orders for the period
 */
async function countTotalOrders(start, end) {
  try {
    // Query the database to count the total number of orders
    // within the specified date range
    const [rows] = await db.query(
      `SELECT COUNT(*) AS totalOrders
       FROM orders
       WHERE created_at BETWEEN ? AND ?`,
      [start, end]
    );

    // Return the total number of orders or 0 if no orders are found
    return rows[0].totalOrders || 0;
  } catch (error) {
    // Log the error and rethrow it for higher-level error handling
    console.error("Error counting total orders:", error);
    throw error;
  }
}

/**
 * Calculate the total revenue for the given period
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @returns {Promise<number>} The total revenue for the period
 */
async function calculateTotalRevenue(start, end) {
  try {
    // Query the database to sum up the total_amount of orders
    // within the specified date range and with status = 'completed'
    const [rows] = await db.query(
      `SELECT SUM(total_amount) AS totalRevenue
       FROM orders
       WHERE status = ? AND created_at BETWEEN ? AND ?`,
      [ORDER_STATUS.COMPLETED, start, end]
    );

    // Return the total revenue or 0 if no orders are found
    return rows[0].totalRevenue || 0;
  } catch (error) {
    // Log the error and rethrow it for higher-level error handling
    console.error("Error calculating total revenue:", error);
    throw error;
  }
}

/**
 * Calculate the fulfillment rate for the given period
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @returns {Promise<number>} The fulfillment rate for the period
 */
async function calculateFulfillmentRate(start, end) {
  try {
    // Query the database to get the count of total and completed orders
    const [totalOrdersResult, completedOrdersResult] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS totalOrders
         FROM orders
         WHERE created_at BETWEEN ? AND ?`,
        [start, end]
      ),
      db.query(
        `SELECT COUNT(*) AS completedOrders
         FROM orders
         WHERE status = ? AND created_at BETWEEN ? AND ?`,
        [ORDER_STATUS.COMPLETED, start, end]
      ),
    ]);

    // Extract the total orders and completed orders count from the results
    const totalOrders = totalOrdersResult[0][0].totalOrders;
    const completedOrders = completedOrdersResult[0][0].completedOrders;

    // Calculate the fulfillment rate as a percentage
    const fulfillmentRate =
      totalOrders === 0 ? 0 : (completedOrders / totalOrders) * 100;

    // Return the fulfillment rate rounded to two decimal places
    return parseFloat(fulfillmentRate.toFixed(2));
  } catch (error) {
    // Log the error and rethrow it for higher-level error handling
    console.error("Error calculating fulfillment rate:", error);
    throw error;
  }
}

/**
 * Compare with previous period.
 * Calculates the percentage change in sales, orders, revenue, and fulfillment rate
 * compared to the previous period.
 * @param {Object} params - The parameters.
 * @param {Date} params.start - The start date of the current period.
 * @param {Date} params.end - The end date of the current period.
 * @param {string} params.range - The range type.
 * @param {number} params.totalSales - Total sales in the current period.
 * @param {number} params.totalOrders - Total orders in the current period.
 * @param {number} params.totalRevenue - Total revenue in the current period.
 * @param {number} params.fulfillmentRate - Fulfillment rate in the current period.
 * @returns {Promise<Object>} An object with percentage changes.
 */
async function compareWithPreviousPeriod({
  start,
  end,
  range,
  totalSales,
  totalOrders,
  totalRevenue,
  fulfillmentRate,
}) {
  // Get the previous period based on the given range
  const { prevStart, prevEnd } = getPreviousPeriod(range, start, end);

  // Retrieve the relevant metrics for the previous period
  const [prevSales, prevOrders, prevRevenue, prevFulfillmentRate] =
    await Promise.all([
      countTotalSales(prevStart, prevEnd),
      countTotalOrders(prevStart, prevEnd),
      calculateTotalRevenue(prevStart, prevEnd),
      calculateFulfillmentRate(prevStart, prevEnd),
    ]);

  // Calculate the percentage change for each metric
  return {
    salesChange: parseFloat(calcPercentChange(totalSales, prevSales)),
    ordersChange: parseFloat(calcPercentChange(totalOrders, prevOrders)),
    revenueChange: parseFloat(calcPercentChange(totalRevenue, prevRevenue)),
    fulfillmentRateChange: parseFloat(
      calcPercentChange(fulfillmentRate, prevFulfillmentRate)
    ),
  };
}

/**
 * Fetch the top products within a specified date range, sorted by the given criteria.
 * 
 * @param {Date} start - The start date of the period
 * @param {Date} end - The end date of the period
 * @param {Object} parsedSort - An object containing sortKey and sortOrder
 * @param {string} category - The category ID to filter by (optional)
 * @param {number} limit - The maximum number of products to return
 * @returns {Promise<Array>} A promise that resolves to an array of top products
 */
exports.fetchTopProducts = async (start, end, parsedSort, category_id, limit) => {
  const { sortKey, sortOrder } = parsedSort;

  // Initialize query parameters with order status and date range
  const params = [ORDER_STATUS.COMPLETED, start, end];
  let categoryFilter = "";

  // If a category is specified, add it to the query and parameters
  if (category_id) {
    categoryFilter = "AND p.category_id = ?";
    params.push(category_id);
  }

  // Add limit to parameters
  params.push(limit);

  // Map sort keys to actual database columns or expressions
  const sortColumnMap = {
    amount: "SUM(oi.quantity * oi.price)",
    quantity: "SUM(oi.quantity)",
    price: "p.price",
    name: "p.name",
    category: "c.name",
  };

  // Determine the column to sort by, defaulting to total amount
  const orderBy = sortColumnMap[sortKey] || "SUM(oi.quantity * oi.price)";
  
  // SQL query to fetch top products with filtering, grouping, and ordering
  const sql = `
    SELECT 
      p.name AS product_name,
      p.price,
      c.name AS category_name,
      SUM(oi.quantity) AS total_quantity,
      SUM(oi.quantity * oi.price) AS total_amount
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE o.status = ?
      AND o.created_at BETWEEN ? AND ?
      ${categoryFilter}
    GROUP BY p.id, p.name, p.price, c.name
    ORDER BY ${orderBy} ${sortOrder}
    LIMIT ?
  `;

  // Execute the query with the provided parameters
  const [rows] = await db.query(sql, params);

  // Map the result rows to an array of product objects
  return rows.map((row) => ({
    name: row.product_name,
    price: parseFloat(row.price),
    category: row.category_name,
    quantity: parseInt(row.total_quantity),
    amount: parseFloat(row.total_amount),
  }));
};
