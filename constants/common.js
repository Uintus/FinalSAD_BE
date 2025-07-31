// Sort key map in sortParser utils
exports.SORT_KEY_MAP = {
  name: "product_name", // p.name AS product_name
  price: "p.price", // p.price
  category: "category_name", // c.name AS category_name
  quantity: "total_quantity", // SUM(oi.quantity)
  amount: "total_amount", // SUM(oi.quantity * oi.price)
};
