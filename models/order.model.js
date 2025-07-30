const db = require("../config/database");

/**
 * Create a new order with the given items
 * @param {string} customer_name - The name of the customer
 * @param {string} status - The status of the order
 * @param {Object[]} items - An array of objects with the product ID, quantity and price
 * @param {Date} created_at - The date the order was created
 * @returns {Promise<number>} A promise that resolves to the ID of the newly created order
 */
exports.createOrderWithItems = async (customer_name, status, items, created_at) => {
    const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insert the order into the orders table
    const [orderResult] = await conn.query(
      `INSERT INTO orders (customer_name, status, created_at) VALUES (?, ?, ?)`,
      [customer_name, status, created_at]
    );
    const orderId = orderResult.insertId;

    let totalAmount = 0;

    // Insert the order items into the order_items table
    for (const item of items) {
      const [productRows] = await conn.query(
        `SELECT price FROM products WHERE id = ?`,
        [item.product_id]
      );

      if (productRows.length === 0)
        throw new Error(`Product ID ${item.product_id} not found`);

      // Calculate the total amount
      const price = productRows[0].price;
      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;

      // Insert the order item into the order_items table
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, price]
      );
    }

    // Update the total amount of the order
    await conn.query(`UPDATE orders SET total_amount = ? WHERE id = ?`, [
      totalAmount,
      orderId,
    ]);

    await conn.commit();
    conn.release();
    return orderId;
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
};
