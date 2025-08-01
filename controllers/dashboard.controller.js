const dashboardModel = require("../models/dashboard.model");
const { RANGE_TYPE } = require("../constants/dashboard");
const { getDateRange } = require("../utils/dashboardUtils");
const { sortParser } = require("../utils/commonUtils");
const { TOP_PRODUCTS_LIMIT } = require("../constants/dashboard");
const { generateChartLabels } = require("../utils/dashboardUtils");

/**
 * @function getAll
 * @description Get all the data for the dashboard
 * @param {Context} ctx - The context of the request
 * @returns {Promise} A promise that resolves to a response object
 */
exports.getAll = async (ctx) => {
  try {
    // Get the range from the query parameter
    // If the range is not provided, use the default range (DA)
    const range = ctx.query.range || RANGE_TYPE.LAST_7_DAYS;
    const { start, end } = getDateRange(range);
    // Generate the labels for the chart
    const labels = generateChartLabels(start, end, range);
    // Determine the format for the group by clause
    const groupFormat =
      range === RANGE_TYPE.YEAR_TO_DATE ? "%Y-%m" : "%Y-%m-%d";

    // Get all the data for the dashboard
    const [summaryTotal, lineChartData, pieChartData, barChartData] =
      await Promise.all([
        // Get the summary total data
        dashboardModel.fetchSummaryTotal(start, end, range),
        // Get the line chart data
        dashboardModel.fetchLineChartData(
          start,
          end,
          range,
          groupFormat,
          labels
        ),
        // Get the pie chart data
        dashboardModel.fetchPieChartData(start, end),
        // Get the bar chart data
        dashboardModel.fetchBarChartData(start, end),
      ]);
    ctx.body = {
      success: true,
      data: {
        summaryTotal,
        lineChartData,
        pieChartData,
        barChartData,
      },
    };
  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: `Internal Server Error`,
    };
  }
};

/**
 * @function getTopProducts
 * @description Get the top products
 * @param {Context} ctx - The context of the request
 * @returns {Promise} A promise that resolves to a response object
 */
exports.getTopProducts = async (ctx) => {
  try {
    const { start, end } = getDateRange(
      ctx.query.range || RANGE_TYPE.LAST_7_DAYS
    );
    const parsedSort = sortParser(ctx.query.sort || "amount-desc");
    const category_id = ctx.query.category_id || null;
    // Get the top products
    const topProducts = await dashboardModel.fetchTopProducts(
      start,
      end,
      parsedSort,
      category_id,
      TOP_PRODUCTS_LIMIT
    );

    // Return the top products in the response
    ctx.body = {
      success: true,
      data: topProducts,
    };
  } catch (error) {
    // Log the error and rethrow it for higher-level error handling
    console.error("Error getting top products:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "Internal Server Error",
    };
  }
};

/**
 * Export the top products data to an Excel file
 * @param {Context} ctx - The context of the request
 * @returns {Promise} A promise that resolves to a response object
 */
exports.exportTopProductsExcel = async (ctx) => {
  try {
    const { start, end } = getDateRange(
      ctx.query.range || RANGE_TYPE.LAST_7_DAYS
    );
    const parsedSort = sortParser(ctx.query.sort || "amount-desc");
    const category_id = ctx.query.category_id || null;

    // Get the top products
    const products = await dashboardModel.fetchTopProducts(
      start,
      end,
      parsedSort,
      category_id,
      TOP_PRODUCTS_LIMIT
    );

    // If there are no products, return a 204 No Content response
    if (!products || products.length === 0) {
      ctx.status = 204;
      ctx.body = null;
      return;
    }

    // Generate the Excel buffer
    const buffer = await dashboardModel.getTopProductsExcelBuffer(products);

    ctx.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    ctx.set("Content-Disposition", "attachment; filename=top_products.xlsx");
    ctx.body = buffer;
  } catch (e) {
    console.error("Error exporting top products:", e);
    ctx.status = 500;
    ctx.body = "Internal Server Error";
  }
};
