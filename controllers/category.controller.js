const categoryModel = require("../models/category.model");

/**
 * @function getAll
 * @description Get all categories from the database
 * @returns {Promise} A promise that resolves to a response object
 */
exports.getAll = async (ctx) => {
  try {
    // Fetch all categories from the database
    const categories = await categoryModel.getAll();
    // Return the result set
    ctx.body = {
      success: true,
      data: categories,
    };
  } catch (err) {
    // Log the error and rethrow it for higher-level error handling
    console.error("Error getting categories:", err);
    // Return a 500 error and the error message
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "Failed to get categories",
      error: err.message,
    };
  }
};
