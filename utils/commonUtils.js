const { SORT_KEY_MAP } = require("../constants/common");

/**
 * Parse the sort string into an object that can be used to sort the data
 *
 * @param {string} sort - The sort string, e.g. 'amount-desc'
 * @returns {Object} - An object with the following properties:
 *   - sortKey: the column to sort by
 *   - sortOrder: the order to sort in
 */
exports.sortParser = (sort) => {
  const [key, order] = sort.split("-"); // e.g., 'amount-desc' → ['amount', 'desc']

  const sortOrder = order === "asc" ? "ASC" : "DESC";
  const sortColumn = SORT_KEY_MAP[key] || "total_amount"; // default

  return {
    sortKey: sortColumn,
    sortOrder,
  };
};
