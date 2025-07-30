const orderModel = require("../models/order.model");

/**
 * Controller for creating a new order.
 *
 * @param {Context} ctx - The context of the request
 * @returns {Promise} A promise that resolves to a response object
 */
exports.createOrder = async (ctx) => {
  const { customer_name, status, items, created_at } = ctx.request.body;

  // Check if the items array is valid
  if (!items || !Array.isArray(items) || items.length === 0) {
    ctx.status = 400;
    ctx.body = { success: false, message: "Items are required" };
    return;
  }

  try {
    // Create the order with the given items
    const orderId = await orderModel.createOrderWithItems(
      customer_name,
      status,
      items,
      created_at
    );
    // Return the newly created order ID
    ctx.body = {
      success: true,
      message: "Order created successfully",
      order_id: orderId,
    };
  } catch (err) {
    // Log any errors
    console.error(err);
    // Return a 500 error and the error message
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "Failed to create order",
      error: err.message,
    };
  }
};
