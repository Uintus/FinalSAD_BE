const db = require("../config/database");

/**
 * @function getAll
 * @description Fetch all categories from the database
 * @returns {Promise<Array>} A promise that resolves to an array of category objects
 */
exports.getAll = async () => {
  // Execute the SQL query to retrieve category id and name
  const [rows] = await db.query("SELECT id, name FROM categories");
  
  // Return the result set
  return rows;
};
