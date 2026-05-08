// EMI Utility functions for EMI calculations and tracking

export const EMI_CONFIG = {
  MIN_AMOUNT_FOR_EMI: 4000,
  DEFAULT_EMI_MONTHS: 3,
  MAX_EMI_MONTHS: 24,
  EMI_MONTHS_OPTIONS: [3, 6, 12, 18, 24]
};

/**
 * Calculate monthly EMI amount
 * @param {number} principal - Total amount
 * @param {number} months - Number of months
 * @returns {number} Monthly EMI amount
 */
export const calculateEMIAmount = (principal, months) => {
  if (months <= 0 || principal <= 0) return 0;
  return Math.ceil((principal / months) * 100) / 100;
};

/**
 * Check if EMI is eligible for plan
 * @param {number} price - Plan price
 * @returns {boolean}
 */
export const isEMIEligible = (price) => {
  return price > EMI_CONFIG.MIN_AMOUNT_FOR_EMI;
};

/**
 * Calculate all EMI payment details
 * @param {number} principal - Total amount
 * @param {number} months - Number of months
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @returns {Array} Array of payment schedules
 */
export const calculateEMISchedule = (principal, months, startDate) => {
  const schedule = [];
  const emiAmount = calculateEMIAmount(principal, months);
  const start = new Date(startDate);

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i);

    let amount = emiAmount;
    if (i === months) {
      // Last payment - adjust for rounding
      const totalPaid = emiAmount * (months - 1);
      amount = principal - totalPaid;
    }

    schedule.push({
      installmentNumber: i,
      amount: amount,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'pending',
      isOverdue: false
    });
  }

  return schedule;
};

/**
 * Format EMI display text
 * @param {number} amount - Monthly amount
 * @param {number} months - Number of months
 * @returns {string}
 */
export const formatEMIText = (amount, months) => {
  return `₹${amount.toFixed(2)} x ${months} months`;
};

/**
 * Get EMI status summary
 * @param {Array} payments - Array of EMI payment objects
 * @returns {Object} Status summary
 */
export const getEMIStatusSummary = (payments) => {
  const total = payments.length;
  const completed = payments.filter(p => p.status === 'completed').length;
  const pending = payments.filter(p => p.status === 'pending').length;
  const overdue = payments.filter(p => p.status === 'overdue').length;

  return {
    total,
    completed,
    pending,
    overdue,
    progress: Math.round((completed / total) * 100)
  };
};

/**
 * Check if payment is overdue
 * @param {string} dueDate - Due date in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isOverdue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  return due < today;
};

/**
 * Get days until payment due
 * @param {string} dueDate - Due date in YYYY-MM-DD format
 * @returns {number} Number of days
 */
export const getDaysTillDue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Format date to readable format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string}
 */
export const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export default {
  EMI_CONFIG,
  calculateEMIAmount,
  isEMIEligible,
  calculateEMISchedule,
  formatEMIText,
  getEMIStatusSummary,
  isOverdue,
  getDaysTillDue,
  formatDate
};
