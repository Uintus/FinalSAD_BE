const db = require("../config/database");

/**
 * Get all the products for a category
 * @param {number} categoryId - The ID of the category
 * @returns {Promise<Array>} A promise that resolves to an array of products
 */
exports.getProductsByCategory = async (categoryId) => {
  // Query the database to get all the products for the given category
  const [rows] = await db.query(
    // The SQL query to get all the products for the given category
    "SELECT id, name FROM products WHERE category_id = ?",
    // The parameter to pass to the query
    [categoryId]
  );
  // Return the results
  return rows;
};
