// Centralized formatting utilities for consistent currency and date display across app

/**
 * Formats a value as NZD currency using Intl.NumberFormat
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(Number(value || 0));

/**
 * Formats a date string to "2-digit MMM YYYY" format (e.g., "15 Jul 2026")
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string or "Not available" if invalid
 */
export const formatDate = (date) => {
  if (!date) return "Not available";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Invalid date";

  return parsedDate.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Formats a date string with optional year (for responsive displays)
 * @param {string|Date} dateString - Date to format
 * @param {boolean} isMobile - If true, omits year for compact display
 * @returns {string} Formatted date string
 */
export const formatCycleDate = (dateString, isMobile = false) => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short",
    ...(isMobile ? {} : { year: "numeric" }),
  });
};

/**
 * Formats a date with time for expense creation timestamps
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted datetime string (e.g., "15 Jul 2026, 3:45 PM")
 */
export const formatExpenseDate = (dateString) => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/**
 * Formats a date with time (compact version for mobile displays)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted datetime string without year (e.g., "15 Jul, 3:45 PM")
 */
export const formatExpenseDateShort = (dateString) => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-NZ", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

/**
 * Capitalizes the first letter of a string
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeFirst = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Formats payment frequency for display
 * @param {string} frequency - Frequency key (weekly, fortnightly, monthly)
 * @returns {string} Formatted frequency display text
 */
export const formatFrequency = (frequency) => {
  if (!frequency) return "Cycle";
  return capitalizeFirst(frequency);
};
