const db = require("../config/database");
const orderItemModel = require("./order_items.model");


/**
 * Create a new order with items and calculate the total amount
 * @param {string} customerName - The name of the customer
 * @param {string} status - The status of the order
 * @param {Object[]} items - An array of objects with the following properties:
 *   - `product_id`: The ID of the product
 *   - `quantity`: The quantity of the product
 *   - `price`: The price of the product
 * @param {Date} createdAt - The date and time when the order is created
 * @returns {Promise<number>} The ID of the newly created order
 */
exports.createOrderWithItems = async (
  customerName,
  status,
  items,
  createdAt
) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // B1. Insert order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (customer_name, status, created_at) VALUES (?, ?, ?)`,
      [customerName, status, createdAt]
    );
    const orderId = orderResult.insertId;

    // B2. Insert order_items and calculate total_amount
    const totalAmount = await orderItemModel.insertItemsAndCalculateTotal(
      conn,
      orderId,
      items
    );

    // B3. Update total_amount
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
