import { getFromLocalStorage, saveToLocalStorage } from "./localStorage";
import { STORAGE_KEYS } from "./constants";

// Calculates the end date based on payment frequency.
// Validates input and handles edge cases.
function calculateEndDate(startDate, paymentFrequency) {
  if (!startDate || !paymentFrequency) {
    console.warn("calculateEndDate: Missing required parameters");
    return "";
  }

  const date = new Date(startDate);

  if (Number.isNaN(date.getTime())) {
    console.warn(`calculateEndDate: Invalid date format: ${startDate}`);
    return "";
  }

  if (paymentFrequency === "weekly") {
    date.setDate(date.getDate() + 6);
  } else if (paymentFrequency === "fortnightly") {
    date.setDate(date.getDate() + 13);
  } else if (paymentFrequency === "monthly") {
    date.setMonth(date.getMonth() + 1);
    date.setDate(date.getDate() - 1);
  } else {
    console.warn(`calculateEndDate: Unknown frequency: ${paymentFrequency}`);
    return "";
  }

  return date.toISOString().split("T")[0];
}

// Returns the next cycle start date.
// Validates input and handles invalid dates.
function calculateNextStartDate(endDate) {
  if (!endDate) {
    console.warn("calculateNextStartDate: Missing endDate parameter");
    return "";
  }

  const date = new Date(endDate);

  if (Number.isNaN(date.getTime())) {
    console.warn(`calculateNextStartDate: Invalid date format: ${endDate}`);
    return "";
  }

  date.setDate(date.getDate() + 1);

  return date.toISOString().split("T")[0];
}

// Gets all saved pay cycles.
export function getPayCycles() {
  return getFromLocalStorage(STORAGE_KEYS.PAY_CYCLES, []);
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

  saveToLocalStorage(STORAGE_KEYS.PAY_CYCLES, payCycles);

  return payCycles;
}

// Validates and checks for overlapping cycles.
// Returns { isValid, error } where error is only set if invalid.
function validateCycleDates(startDate, endDate, existingCycles) {
  if (!startDate || !endDate) {
    return { isValid: false, error: "Start date and end date are required." };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { isValid: false, error: "Invalid date format." };
  }

  if (end < start) {
    return { isValid: false, error: "End date must be on or after start date." };
  }

  // Check for overlaps with existing cycles
  for (const cycle of existingCycles) {
    const cycleStart = new Date(cycle.startDate);
    const cycleEnd = new Date(cycle.endDate);

    // Overlap exists if: new start <= cycle end AND new end >= cycle start
    if (start <= cycleEnd && end >= cycleStart) {
      return {
        isValid: false,
        error: `New cycle overlaps with existing cycle (${cycle.startDate} to ${cycle.endDate}).`,
      };
    }
  }

  return { isValid: true, error: null };
}

// Gets suggested dates for the next cycle based on the active cycle.
export function getSuggestedDates() {
  const payCycles = getPayCycles();
  const activeCycle = payCycles.find((cycle) => cycle.status === "active");

  if (!activeCycle) {
    return { suggestedStartDate: "", suggestedEndDate: "" };
  }

  const suggestedStartDate = calculateNextStartDate(activeCycle.endDate);
  const suggestedEndDate = calculateEndDate(
    suggestedStartDate,
    activeCycle.paymentFrequency,
  );

  return { suggestedStartDate, suggestedEndDate };
}

// Closes the current cycle and creates a new one with custom dates.
// Accepts optional startDate and endDate; uses calculated defaults if not provided.
export function createNextPayCycle(salaryAmount, customStartDate, customEndDate) {
  const payCycles = getPayCycles();

  const activeCycle = payCycles.find((cycle) => cycle.status === "active");

  if (!activeCycle) {
    return {
      success: false,
      message: "No active pay cycle found.",
    };
  }

  let startDate = customStartDate;
  let endDate = customEndDate;

  // Use calculated defaults if custom dates not provided
  if (!startDate || !endDate) {
    startDate = calculateNextStartDate(activeCycle.endDate);

    if (!startDate) {
      return {
        success: false,
        message: "Could not calculate the next cycle start date.",
      };
    }

    endDate = calculateEndDate(startDate, activeCycle.paymentFrequency);
  }

  // Validate the dates
  const validation = validateCycleDates(startDate, endDate, payCycles);

  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error,
    };
  }

  const updatedCycles = payCycles.map((cycle) =>
    cycle.id === activeCycle.id ? { ...cycle, status: "closed" } : cycle,
  );

  const newCycle = {
    id: Date.now(),
    startDate,
    endDate,
    salaryAmount: Number(salaryAmount),
    paymentFrequency: activeCycle.paymentFrequency,
    status: "active",
  };

  const finalCycles = [...updatedCycles, newCycle];

  saveToLocalStorage(STORAGE_KEYS.PAY_CYCLES, finalCycles);

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

  saveToLocalStorage(STORAGE_KEYS.PAY_CYCLES, updatedCycles);

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
    saveToLocalStorage(STORAGE_KEYS.PAY_CYCLES, []);
    saveToLocalStorage(STORAGE_KEYS.EXPENSES, []);
    saveToLocalStorage(STORAGE_KEYS.SALARY, 0);

    saveToLocalStorage(STORAGE_KEYS.USER_INFO, {
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
    saveToLocalStorage(STORAGE_KEYS.PAY_CYCLES, remainingCycles);

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

  saveToLocalStorage(STORAGE_KEYS.PAY_CYCLES, updatedCycles);

  return {
    success: true,
    message: "Pay cycle deleted. Previous cycle is now active.",
    payCycles: updatedCycles,
  };
}

// Removes all expenses linked to one cycle.
function removeExpensesByCycleId(cycleId) {
  const expenses = getFromLocalStorage(STORAGE_KEYS.EXPENSES, []);

  const updatedExpenses = expenses.filter(
    (expense) => expense.cycleId !== cycleId,
  );

  saveToLocalStorage(STORAGE_KEYS.EXPENSES, updatedExpenses);
}
