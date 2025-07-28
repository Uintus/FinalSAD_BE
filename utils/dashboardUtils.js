const dayjs = require("dayjs");
const { RANGE_TYPE } = require("../constants/dashboard");
const { DateTime } = require("luxon");

/**
 * @function getDateRange
 * @description Return the date range based on the given range type
 * @param {string} range - The range type. Accepted values are:
 *   - `RANGE_TYPE.LAST_7_DAYS`: The last 7 days
 *   - `RANGE_TYPE.YEAR_TO_DATE`: From the first day of the year to today
 * @returns {object} An object with `start` and `end` properties, which are
 *   the start and end dates of the range in the form of a `Date` object.
 * @throws {Error} If the range type is invalid
 */

exports.getDateRange = (range) => {
  const today = dayjs().endOf("day");

  if (range === RANGE_TYPE.LAST_7_DAYS) {
    // Get the last 7 days
    const start = today.subtract(6, "day").startOf("day");
    return { start: start.toDate(), end: today.toDate() };
  }

  if (range === RANGE_TYPE.YEAR_TO_DATE) {
    // Get the range from the first day of the year to today
    const start = today.startOf("year"); // Fix: from Jan 1st to today
    return { start: start.toDate(), end: today.toDate() };
  }

  if (range === RANGE_TYPE.MONTH_TO_DATE) {
    // Get the range from the first day of the month to today
    const start = today.startOf("month");
    return { start: start.toDate(), end: today.toDate() };
  }

  // Throw an error if the range type is invalid
  throw new Error("Invalid range type");
};

/**
 * @function getPreviousPeriod
 * @description Get the previous period given a range type and the current period
 * @param {string} range - The range type. Accepted values are:
 *   - `RANGE_TYPE.LAST_7_DAYS`: The last 7 days
 *   - `RANGE_TYPE.YEAR_TO_DATE`: From the first day of the year to today
 * @param {Date} start - The start date of the current period
 * @param {Date} end - The end date of the current period
 * @returns {object} An object with `prevStart` and `prevEnd` properties, which
 *   are the start and end dates of the previous period in the form of a
 *   `Date` object.
 * @throws {Error} If the range type is invalid
 */

exports.getPreviousPeriod = (range, start, end) => {
  if (start instanceof Date) start = start.toISOString();
  if (end instanceof Date) end = end.toISOString();

  const startDate = DateTime.fromISO(start, { zone: "utc" }).setZone(
    "Asia/Ho_Chi_Minh"
  );
  const endDate = DateTime.fromISO(end, { zone: "utc" }).setZone(
    "Asia/Ho_Chi_Minh"
  );

  let prevStart, prevEnd;

  if (range === RANGE_TYPE.LAST_7_DAYS) {
    const referenceDate = startDate.minus({ weeks: 1 });
    prevStart = referenceDate.startOf("week"); // ISO week: Monday
    prevEnd = referenceDate.endOf("week"); // Sunday
  } else if (range === RANGE_TYPE.MONTH_TO_DATE) {
    prevStart = startDate.minus({ months: 1 }).startOf("month");
    const daysCovered = endDate.day;
    prevEnd = prevStart.plus({ days: daysCovered - 1 }).endOf("day");
  } else if (range === RANGE_TYPE.YEAR_TO_DATE) {
    prevStart = startDate.minus({ years: 1 }).startOf("year");
    const daysCovered = endDate.ordinal;
    prevEnd = prevStart.plus({ days: daysCovered - 1 }).endOf("day");
  } else {
    throw new Error("Invalid range value. Use a supported RANGE_TYPE.");
  }

  return {
    prevStart: prevStart.toISO(),
    prevEnd: prevEnd.toISO(),
  };
};

/**
 * @function calcPercentChange
 * @description Calculate the percentage change of a value compared to a base value
 * @param {number} current - The current value
 * @param {number} previous - The base value
 * @returns {number} The percentage change from the base value to the current value
 */
exports.calcPercentChange = (current, previous) => {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return 100;
  // Calculate the percentage change
  // If the previous value is 0, the percentage change is 100%
  // Otherwise, calculate the percentage change as (current - previous) / previous * 100
  return (((current - previous) / previous) * 100).toFixed(2);
};

/**
 * @function generateChartLabels
 * @description Generate an array of labels for a line chart given a start date, end date, and range type
 * @param {Date} startDate - The start date of the period
 * @param {Date} endDate - The end date of the period
 * @param {string} range - The range type. Accepted values are:
 *   - `RANGE_TYPE.LAST_7_DAYS`: The last 7 days
 *   - `RANGE_TYPE.MONTH_TO_DATE`: From the first day of the month to today
 *   - `RANGE_TYPE.YEAR_TO_DATE`: From the first day of the year to today
 * @returns {string[]} An array of labels for the line chart
 */
exports.generateChartLabels = (startDate, endDate, range) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const labels = [];

  if (range === RANGE_TYPE.LAST_7_DAYS || range === RANGE_TYPE.MONTH_TO_DATE) {
    // Iterate each day of the period
    let current = start.startOf('day');
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      labels.push(current.format('DD/MM'));
      current = current.add(1, 'day');
    }
  } else if (range === RANGE_TYPE.YEAR_TO_DATE) {
    // Iterate each month of the period
    let current = start.startOf('month');
    while (current.isBefore(end) || current.isSame(end, 'month')) {
      labels.push(current.format('MM/YYYY'));
      current = current.add(1, 'month');
    }
  }

  return labels;
}
