import { getFromLocalStorage, saveToLocalStorage } from "./localStorage";
import { getActivePayCycle } from "./payCycles";

// Gets all saved expenses from localStorage.
export function getExpenses() {
  return getFromLocalStorage("expenses", []);
}

// Returns expenses linked to a specific pay cycle.
export function getExpensesByCycleId(cycleId) {
  const expenses = getExpenses();

  return expenses.filter((expense) => expense.cycleId === cycleId);
}

// Creates a new expense using the current active cycle.
export function createExpense({ name, amount, category }) {
  const activeCycle = getActivePayCycle();

  if (!activeCycle) {
    return {
      success: false,
      message: "No active pay cycle found.",
    };
  }

  if (!category) {
    return {
      success: false,
      message: "Please select a category.",
    };
  }

  const now = new Date();

  const newExpense = {
    id: Date.now(),
    name: name.trim(),
    amount: Number(amount),
    category,
    cycleId: activeCycle.id,
    createdAt: now.toISOString(),
  };

  const currentExpenses = getExpenses();
  const updatedExpenses = [...currentExpenses, newExpense];

  saveToLocalStorage("expenses", updatedExpenses);

  return {
    success: true,
    expense: newExpense,
    expenses: updatedExpenses,
  };
}

// Removes one expense by id.
export function removeExpenseById(expenseId) {
  const expenses = getExpenses();

  const updatedExpenses = expenses.filter(
    (expense) => expense.id !== expenseId,
  );

  saveToLocalStorage("expenses", updatedExpenses);

  return updatedExpenses;
}

// Calculates total spent for a selected cycle.
export function getTotalSpentByCycleId(cycleId) {
  const expenses = getExpensesByCycleId(cycleId);

  return expenses.reduce((total, expense) => {
    return total + Number(expense.amount || 0);
  }, 0);
}

// Returns how many expenses exist in a cycle.
export function getExpenseCountByCycleId(cycleId) {
  return getExpensesByCycleId(cycleId).length;
}

// Gets all unique categories used in expenses.
export function getAllExpenseCategories() {
  const expenses = getExpenses();

  return [...new Set(expenses.map((expense) => expense.category || "other"))];
}

// Combines each expense with pay cycle details.
export function getExpensesWithCycleInfo() {
  const expenses = getExpenses();
  const payCycles = getFromLocalStorage("payCycles", []);

  return expenses.map((expense) => {
    const cycle = payCycles.find((item) => item.id === expense.cycleId);

    return {
      ...expense,
      cycleStartDate: cycle?.startDate || "Unknown",
      cycleEndDate: cycle?.endDate || "Unknown",
      cycleStatus: cycle?.status || "unknown",
      cycleFrequency: cycle?.paymentFrequency || "unknown",
    };
  });
}

// Groups totals by category for one cycle.
export function getCategoryTotalsByCycleId(cycleId) {
  const expenses = getExpensesByCycleId(cycleId);

  const totals = expenses.reduce((acc, expense) => {
    const category = expense.category || "other";
    const amount = Number(expense.amount || 0);

    acc[category] = (acc[category] || 0) + amount;

    return acc;
  }, {});

  return Object.entries(totals).map(([category, total]) => ({
    category,
    total,
  }));
}

// Groups totals by category across all cycles.
export function getCategoryTotalsAcrossAllCycles() {
  const expenses = getExpenses();

  const totals = expenses.reduce((acc, expense) => {
    const category = expense.category || "other";
    const amount = Number(expense.amount || 0);

    acc[category] = (acc[category] || 0) + amount;

    return acc;
  }, {});

  return Object.entries(totals).map(([category, total]) => ({
    category,
    total,
  }));
}

// Groups totals by category using selected cycle ids.
export function getCategoryTotalsByCycleIds(cycleIds) {
  const expenses = getExpenses().filter((expense) =>
    cycleIds.includes(expense.cycleId),
  );

  const totals = expenses.reduce((acc, expense) => {
    const category = expense.category || "other";
    const amount = Number(expense.amount || 0);

    acc[category] = (acc[category] || 0) + amount;

    return acc;
  }, {});

  return Object.entries(totals).map(([category, total]) => ({
    category,
    total,
  }));
}

// Updates an existing expense.
export function updateExpenseById(expenseId, updatedData) {
  const expenses = getExpenses();

  const updatedExpenses = expenses.map((expense) => {
    if (expense.id !== expenseId) return expense;

    return {
      ...expense,
      name: updatedData.name.trim(),
      amount: Number(updatedData.amount),
      category: updatedData.category,
    };
  });

  saveToLocalStorage("expenses", updatedExpenses);

  return updatedExpenses;
}

// Returns the largest expense in one cycle.
export function getLargestExpenseByCycleId(cycleId) {
  const expenses = getExpensesByCycleId(cycleId);

  if (expenses.length === 0) return null;

  return expenses.reduce((largest, current) => {
    return Number(current.amount || 0) > Number(largest.amount || 0)
      ? current
      : largest;
  });
}

// Finds the category with the highest spending.
export function getTopCategoryByCycleId(cycleId) {
  const expenses = getExpensesByCycleId(cycleId);

  if (expenses.length === 0) return null;

  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || "other";
    const amount = Number(expense.amount || 0);

    acc[category] = (acc[category] || 0) + amount;

    return acc;
  }, {});

  const topCategoryEntry = Object.entries(categoryTotals).reduce(
    (top, current) => {
      return current[1] > top[1] ? current : top;
    },
  );

  return {
    category: topCategoryEntry[0],
    total: topCategoryEntry[1],
  };
}

// Calculates the average expense amount for a cycle.
export function getAverageExpenseByCycleId(cycleId) {
  const expenses = getExpensesByCycleId(cycleId);

  if (expenses.length === 0) return 0;

  const total = expenses.reduce((sum, expense) => {
    return sum + Number(expense.amount || 0);
  }, 0);

  return total / expenses.length;
}
