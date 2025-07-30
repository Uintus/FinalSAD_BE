// Range type = '7' (last 7 days) | '01' (from the first month of year to today)
export const RANGE_TYPE = {
  LAST_7_DAYS: '7',
  YEAR_TO_DATE: '01',
  MONTH_TO_DATE: '02',
};


// Value type = 'money' | 'rate' | 'number'  
export const VALUE_TYPE = {
  MONEY: 'money',
  RATE: 'rate',
  NUMBER: 'number',
};

// Order status
export const ORDER_STATUS = {
  PENDING: '1',
  COMPLETED: '2',
  CANCELLED: '0',
};

// Top products limit showed in dashboard table
export const TOP_PRODUCTS_LIMIT = 20;
