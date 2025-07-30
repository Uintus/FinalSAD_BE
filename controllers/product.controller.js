const productModel = require("../models/product.model");

/**
 * Get all products for a given category
 * @param {Context} ctx - The context of the request
 * @returns {Promise} A promise that resolves to a response object
 */
exports.getProductsByCategory = async (ctx) => {
    try {
        const { category_id } = ctx.params;
        const products = await productModel.getProductsByCategory(category_id);
        // Return the products in the response
        ctx.body = {
            success: true,
            data: products,
        };
    } catch (err) {
        // Log the error and rethrow it for higher-level error handling
        console.error("Error getting products by category:", err);
        ctx.status = 500;
        ctx.body = {
            success: false,
            message: "Failed to get products by category",
            error: err.message,
        };
    }
};
