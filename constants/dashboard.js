// Range type = '7' (last 7 days) | '01' (from the first month of year to today)
exports.RANGE_TYPE = {
  LAST_7_DAYS: '7',
  YEAR_TO_DATE: '01',
  MONTH_TO_DATE: '02',
};


// Value type = 'money' | 'rate' | 'number'  
exports.VALUE_TYPE = {
  MONEY: 'money',
  RATE: 'rate',
  NUMBER: 'number',
};

// Order status
exports.ORDER_STATUS = {
  PENDING: '1',
  COMPLETED: '2',
  CANCELLED: '0',
};

// Top products limit showed in dashboard table
exports.TOP_PRODUCTS_LIMIT = 20;
