module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: true,
      message: err.message || "Internal Server Error",
    };
    console.error("🔥 Error:", {
      status: ctx.status,
      method: ctx.method,
      path: ctx.url,
      message: err.message,
      stack: err.stack,
    });
  }
};
