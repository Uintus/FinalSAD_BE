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

/**
 * Get the products with the given IDs
 * @param {Promise<import("mysql2").Connection>} conn - The database connection
 * @param {number[]} ids - The IDs of the products to retrieve
 * @returns {Promise<Array<{id: number, price: number}>>} A promise that resolves to an array of objects with the following properties:
 *   - `id`: The ID of the product
 *   - `price`: The price of the product
 */
exports.getProductsByIds = async (conn, ids) => {
  // Query the database to get the products with the given IDs
  const [rows] = await conn.query(
    // The SQL query to get the products with the given IDs
    `SELECT id, price FROM products WHERE id IN (?)`,
    // The parameter to pass to the query
    [ids]
  );
  // Return the results
  return rows;
};


/**
 * Get all the products
 * @returns {Promise<Array>} A promise that resolves to an array of products
 */
exports.getAll = async () => {
  // Query the database to get all the products
  const [rows] = await db.query("SELECT id, name FROM products");
  // Return the results
  return rows;
};
