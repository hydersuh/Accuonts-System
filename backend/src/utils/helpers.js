import moment from "moment";

export const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (number, decimals = 2) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

export const formatDate = (date, format = "DD-MM-YYYY") => {
  return moment(date).format(format);
};

export const formatDateTime = (date, format = "DD-MM-YYYY HH:mm:ss") => {
  if (!date) return "-";
  return moment(date).format(format);
};

export const generateVoucherNumber = (prefix, number, suffix, padding = 6) => {
  const paddedNumber = String(number).padStart(padding, "0");
  return `${prefix || ""}${paddedNumber}${suffix || ""}`;
};

export const calculateRunningBalance = (
  transactions,
  openingBalance = 0,
  balanceType = "Dr",
) => {
  let balance = openingBalance;
  return transactions.map((transaction) => {
    if (balanceType === "Dr") {
      balance += (transaction.debit || 0) - (transaction.credit || 0);
    } else {
      balance += (transaction.credit || 0) - (transaction.debit || 0);
    }
    return { ...transaction, runningBalance: balance };
  });
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

export const validateAccountingEquation = (assets, liabilities, equity) => {
  const totalAssets = assets.reduce(
    (sum, item) => sum + (item.balance || 0),
    0,
  );
  const totalLiabilities = liabilities.reduce(
    (sum, item) => sum + (item.balance || 0),
    0,
  );
  const totalEquity = equity.reduce(
    (sum, item) => sum + (item.balance || 0),
    0,
  );
  return Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const validateAccountingEquation = (assets, liabilities, equity) => {
  const totalAssets = assets.reduce(
    (sum, item) => sum + (item.balance || 0),
    0,
  );
  const totalLiabilities = liabilities.reduce(
    (sum, item) => sum + (item.balance || 0),
    0,
  );
  const totalEquity = equity.reduce(
    (sum, item) => sum + (item.balance || 0),
    0,
  );
  return Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
