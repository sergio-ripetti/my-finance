import { getFromLocalStorage, saveToLocalStorage } from "./localStorage";

const PAY_CYCLES_KEY = "payCycles";
const EXPENSES_KEY = "expenses";
const SALARY_KEY = "salary";
const USER_INFO_KEY = "userInfo";

// Calculates the end date based on payment frequency.
function calculateEndDate(startDate, paymentFrequency) {
  const date = new Date(startDate);

  if (Number.isNaN(date.getTime())) return "";

  if (paymentFrequency === "weekly") {
    date.setDate(date.getDate() + 6);
  } else if (paymentFrequency === "fortnightly") {
    date.setDate(date.getDate() + 13);
  } else if (paymentFrequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString().split("T")[0];
}

// Returns the next cycle start date.
function calculateNextStartDate(endDate) {
  const date = new Date(endDate);

  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + 1);

  return date.toISOString().split("T")[0];
}

// Gets all saved pay cycles.
export function getPayCycles() {
  return getFromLocalStorage(PAY_CYCLES_KEY, []);
}

// Returns the current active pay cycle.
export function getActivePayCycle() {
  const payCycles = getPayCycles();

  return payCycles.find((cycle) => cycle.status === "active") || null;
}

// Creates the first pay cycle when the app is initialized.
export function createInitialPayCycle(userInfo, salary) {
  const existingPayCycles = getPayCycles();

  if (existingPayCycles.length > 0) {
    return existingPayCycles;
  }

  if (!userInfo?.dateInitial || !userInfo?.paymentFrequency || !salary) {
    return [];
  }

  const newCycle = {
    id: Date.now(),
    startDate: userInfo.dateInitial,
    endDate: calculateEndDate(userInfo.dateInitial, userInfo.paymentFrequency),
    salaryAmount: Number(salary),
    paymentFrequency: userInfo.paymentFrequency,
    status: "active",
  };

  const payCycles = [newCycle];

  saveToLocalStorage(PAY_CYCLES_KEY, payCycles);

  return payCycles;
}

// Closes the current cycle and creates a new one.
export function createNextPayCycle(salaryAmount) {
  const payCycles = getPayCycles();

  const activeCycle = payCycles.find((cycle) => cycle.status === "active");

  if (!activeCycle) {
    return {
      success: false,
      message: "No active pay cycle found.",
    };
  }

  const nextStartDate = calculateNextStartDate(activeCycle.endDate);

  if (!nextStartDate) {
    return {
      success: false,
      message: "Could not calculate the next cycle start date.",
    };
  }

  const updatedCycles = payCycles.map((cycle) =>
    cycle.id === activeCycle.id ? { ...cycle, status: "closed" } : cycle,
  );

  const newCycle = {
    id: Date.now(),
    startDate: nextStartDate,
    endDate: calculateEndDate(nextStartDate, activeCycle.paymentFrequency),
    salaryAmount: Number(salaryAmount),
    paymentFrequency: activeCycle.paymentFrequency,
    status: "active",
  };

  const finalCycles = [...updatedCycles, newCycle];

  saveToLocalStorage(PAY_CYCLES_KEY, finalCycles);

  return {
    success: true,
    message: "New pay cycle created successfully.",
    payCycles: finalCycles,
  };
}

// Updates only the salary amount of a cycle.
export function updatePayCycleSalary(cycleId, salaryAmount) {
  const parsedSalary = Number(salaryAmount);

  if (!parsedSalary || parsedSalary <= 0) {
    return {
      success: false,
      message: "Please enter a valid salary amount.",
    };
  }

  const payCycles = getPayCycles();

  const updatedCycles = payCycles.map((cycle) =>
    cycle.id === cycleId
      ? {
          ...cycle,
          salaryAmount: parsedSalary,
        }
      : cycle,
  );

  saveToLocalStorage(PAY_CYCLES_KEY, updatedCycles);

  return {
    success: true,
    message: "Salary updated successfully.",
    payCycles: updatedCycles,
  };
}

// Deletes a cycle and reassigns active status if needed.
export function deletePayCycle(cycleId) {
  const payCycles = getPayCycles();

  const cycleToDelete = payCycles.find((cycle) => cycle.id === cycleId);

  if (!cycleToDelete) {
    return {
      success: false,
      message: "Pay cycle not found.",
    };
  }

  removeExpensesByCycleId(cycleId);

  const remainingCycles = payCycles.filter((cycle) => cycle.id !== cycleId);

  // Resets app data if no cycles remain.
  if (remainingCycles.length === 0) {
    saveToLocalStorage(PAY_CYCLES_KEY, []);
    saveToLocalStorage(EXPENSES_KEY, []);
    saveToLocalStorage(SALARY_KEY, 0);

    saveToLocalStorage(USER_INFO_KEY, {
      name: "",
      paymentFrequency: "",
      dateInitial: "",
    });

    return {
      success: true,
      message: "All pay cycles were deleted. The app has been reset.",
      payCycles: [],
    };
  }

  const hasActiveCycle = remainingCycles.some(
    (cycle) => cycle.status === "active",
  );

  if (hasActiveCycle) {
    saveToLocalStorage(PAY_CYCLES_KEY, remainingCycles);

    return {
      success: true,
      message: "Pay cycle deleted successfully.",
      payCycles: remainingCycles,
    };
  }

  // Activates the latest cycle if the active one was deleted.
  const latestCycle = [...remainingCycles].sort((a, b) => b.id - a.id)[0];

  const updatedCycles = remainingCycles.map((cycle) =>
    cycle.id === latestCycle.id
      ? {
          ...cycle,
          status: "active",
        }
      : cycle,
  );

  saveToLocalStorage(PAY_CYCLES_KEY, updatedCycles);

  return {
    success: true,
    message: "Pay cycle deleted. Previous cycle is now active.",
    payCycles: updatedCycles,
  };
}

// Removes all expenses linked to one cycle.
function removeExpensesByCycleId(cycleId) {
  const expenses = getFromLocalStorage(EXPENSES_KEY, []);

  const updatedExpenses = expenses.filter(
    (expense) => expense.cycleId !== cycleId,
  );

  saveToLocalStorage(EXPENSES_KEY, updatedExpenses);
}
