const { getProductsByIds } = require("./product.model");

/**
 * Insert the given items into the order_items table and calculate the total amount.
 * @param {Promise<import("mysql2").Connection>} conn - The database connection
 * @param {number} orderId - The ID of the order
 * @param {Object[]} items - An array of objects with the product ID, quantity and price
 * @returns {Promise<number>} The total amount of the order
 */
exports.insertItemsAndCalculateTotal = async (conn, orderId, items) => {
  const productIds = items.map((i) => i.product_id);
  const productRows = await getProductsByIds(conn, productIds);

  // Create a price map to quickly look up the price of a product
  const priceMap = new Map();
  productRows.forEach((p) => priceMap.set(p.id, p.price));

  // Initialize the total amount to 0
  let totalAmount = 0;

  // Iterate over the items and calculate the total amount
  for (const item of items) {
    const price = priceMap.get(item.product_id);
    if (!price) throw new Error(`Product ID ${item.product_id} not found`);

    // Calculate the total amount
    totalAmount += price * item.quantity;

    // Insert the order item into the order_items table
    await conn.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES (?, ?, ?, ?)`,
      [orderId, item.product_id, item.quantity, price]
    );
  }

  // Return the total amount
  return totalAmount;
};
