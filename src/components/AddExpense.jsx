import { useEffect, useMemo, useState } from "react";
import {
  createExpense,
  getExpensesByCycleId,
  removeExpenseById,
} from "../utils/expenses";
import { createInitialPayCycle, getActivePayCycle } from "../utils/payCycles";
import "./AddExpense.css";


export default function AddExpense() {
  // Loads the saved salary from localStorage.
  const [salary, setSalary] = useState(() => {
    const savedSalary = localStorage.getItem("salary");
    return savedSalary ? JSON.parse(savedSalary) : 0;
  });

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    


  // Loads the saved user profile from localStorage.
  const [userInfo, setUserInfo] = useState(() => {
    const savedUserInfo = localStorage.getItem("userInfo");
    return savedUserInfo
      ? JSON.parse(savedUserInfo)
      : {
          name: "",
          dateInitial: "",
          paymentFrequency: "0",
        };
  });
  
  // Refreshes cycle and expense data after changes.
  const [refreshKey, setRefreshKey] = useState(0);

  // Stores all form values for profile and expenses.
  const [formData, setFormData] = useState({
    name: userInfo.name || "",
    dateInitial: userInfo.dateInitial || "",
    paymentFrequency: userInfo.paymentFrequency || "0",
    salaryInput: salary > 0 ? String(salary) : "",
    expenseName: "",
    expenseAmount: "",
    expenseCategory: "food",
  });

  // Saves salary changes to localStorage.
  useEffect(() => {
    localStorage.setItem("salary", JSON.stringify(salary));
  }, [salary]);

  // Saves user profile changes to localStorage.
  useEffect(() => {
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
  }, [userInfo]);

  // Gets the current active pay cycle.
  const activePayCycle = useMemo(() => {
    return getActivePayCycle();
  }, [refreshKey]);

  // Gets expenses linked to the active cycle.
  const expenses = useMemo(() => {
    if (!activePayCycle) return [];
    return getExpensesByCycleId(activePayCycle.id);
  }, [activePayCycle, refreshKey]);

  // Validates numeric input: allows only numbers and one decimal point.
  // Max 10 integer digits and 2 decimal places.
  function validateNumber(e) {
    const { name, value } = e.target;

    // Remove any non-numeric characters except decimal point
    let cleanValue = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    if ((cleanValue.match(/\./g) || []).length > 1) {
      cleanValue = cleanValue.slice(0, -1);
    }

    // Limit to 10 digits before decimal and 2 after
    const parts = cleanValue.split(".");
    if (parts[0].length > 10) {
      cleanValue = parts[0].slice(0, 10) + (parts[1] ? "." + parts[1] : "");
    }
    if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + "." + parts[1].slice(0, 2);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: cleanValue,
    }));
  }

  // Updates text, date, and select inputs.
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Saves profile data and creates the first pay cycle.
  function handleAddSalary() {
    const parsedSalary = parseFloat(formData.salaryInput);

    if (isNaN(parsedSalary) || parsedSalary <= 0) {
      alert("Please enter a valid salary.");
      return;
    }

    if (!formData.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!formData.dateInitial) {
      alert("Please select your initial payment date.");
      return;
    }

    if (formData.paymentFrequency === "0") {
      alert("Please select a payment frequency.");
      return;
    }

    const userInfoData = {
      name: formData.name.trim(),
      dateInitial: formData.dateInitial,
      paymentFrequency: formData.paymentFrequency,
    };

    setSalary(parsedSalary);
    setUserInfo(userInfoData);

    createInitialPayCycle(userInfoData, parsedSalary);
    setIsEditingProfile(false);
    setRefreshKey((prev) => prev + 1);
    const payCycles = JSON.parse(localStorage.getItem("payCycles")) || [];
    const activeCycleId = localStorage.getItem("activePayCycleId");

    const updatedCycles = payCycles.map((cycle) =>
      String(cycle.id) === String(activeCycleId) || cycle.status === "active"
        ? { ...cycle, salaryAmount: Number(formData.salaryInput) }
        : cycle,
    );

    localStorage.setItem("payCycles", JSON.stringify(updatedCycles));
  }

  // Adds a new expense to the active cycle.
  function handleAddExpense() {
    const parsedAmount = Number(formData.expenseAmount);

    if (!activePayCycle) {
      alert("No active pay cycle found. Please create your first pay cycle.");

      return;
    }

    if (!formData.expenseName.trim()) {
      alert("Please enter an expense name.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    if (!formData.expenseCategory) {
      alert("Please select a category.");
      return;
    }

    // Warns the user if the new expense exceeds the current balance.
    const newTotalExpenses = totalExpenses + parsedAmount;

    if (newTotalExpenses > currentSalary) {
      const confirmOverBudget = window.confirm(
        "This expense will exceed your current balance. Do you want to continue?",
      );

      if (!confirmOverBudget) return;
    }

    const result = createExpense({
      name: formData.expenseName,
      amount: parsedAmount,
      category: formData.expenseCategory,
    });

    if (!result.success) {
      alert(result.message);
      return;
    }

    // Clears only the expense fields after saving.
    setFormData((prev) => ({
      ...prev,
      expenseName: "",
      expenseAmount: "",
      expenseCategory: "food",
    }));

    setRefreshKey((prev) => prev + 1);
  }

  // Removes an expense from the active cycle.
  function handleRemoveExpense(id) {
    removeExpenseById(id);
    setRefreshKey((prev) => prev + 1);
  }

  // Formats payment frequency for display.
  function formatFrequency(frequency) {
    switch (frequency) {
      case "weekly":
        return "Weekly";
      case "fortnightly":
        return "Fortnightly";
      case "monthly":
        return "Monthly";
      default:
        return "Not selected";
    }
  }

  // Calculates total expenses for the active cycle.
  const totalExpenses = useMemo(() => {
    return expenses.reduce(
      (acc, expense) => acc + Number(expense.amount || 0),
      0,
    );
  }, [expenses]);

  // Gets the salary from the active cycle or fallback salary.
  const currentSalary = useMemo(() => {
    return Number(activePayCycle?.salaryAmount || salary || 0);
  }, [activePayCycle, salary]);

  // Calculates the remaining balance.
  const remainingSalary = useMemo(() => {
    return currentSalary - totalExpenses;
  }, [currentSalary, totalExpenses]);

  // Calculates the progress percentage for the circle.
  const progressPercentage = useMemo(() => {
    if (currentSalary <= 0) return 0;
    return Math.min((totalExpenses / currentSalary) * 100, 100);
  }, [currentSalary, totalExpenses]);

  // Values used to draw the SVG progress circle.
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPercentage / 100) * circumference;

  const hasUserInfo =
    userInfo?.name?.trim() !== "" &&
    userInfo?.paymentFrequency !== "" &&
    userInfo?.paymentFrequency !== "0" &&
    userInfo?.dateInitial !== "";

  const hasSalary = Number(currentSalary) > 0;

  const showProfileForm = !hasUserInfo || !hasSalary || isEditingProfile;
  return (
    <>
      {/* Initial setup and edit profile form */}
      <div
          className={`profile-form-wrapper ${showProfileForm ? "show" : ""}`}>
          <div className="profile-setup-card">
            <div className="container">
              <div className="mb-3">
                <label htmlFor="nameInput" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  id="nameInput"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="dateInicial" className="form-label">
                  Date Initial Payment
                </label>
                <input
                  type="date"
                  id="dateInicial"
                  name="dateInitial"
                  className="form-control"
                  value={formData.dateInitial}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="paymentSelect" className="form-label">
                  Payment Frequency
                </label>
                <select
                  id="paymentSelect"
                  name="paymentFrequency"
                  className="form-select"
                  value={formData.paymentFrequency}
                  onChange={handleChange}>
                  <option value="0">Select frequency</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <label htmlFor="salary" className="form-label h4 text-center">
                Enter your salary
              </label>

              <div id="addSalary" className="d-flex align-items-center gap-4">
                <input
                  type="text"
                  id="salary"
                  name="salaryInput"
                  className="form-control form-control-lg w-50"
                  placeholder="Enter amount"
                  value={formData.salaryInput}
                  onChange={validateNumber}
                />

                <button
                  className="btn btn-primary btn-lg"
                  id="add-salary"
                  onClick={handleAddSalary}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className="container-fluid py-4">
        <div className="text-center mb-4">
          <h1 className="mb-2">
            My Finances {userInfo.name ? `- ${userInfo.name}` : ""}
          </h1>

          <p className="mb-1">
            <strong>Payment frequency:</strong>{" "}
            {formatFrequency(userInfo.paymentFrequency)}
          </p>

          {userInfo.dateInitial && (
            <p className="mb-2">
              <strong>Start date:</strong> {userInfo.dateInitial}
            </p>
          )}

          {/* Active pay cycle info (only shown if exists) */}
          {activePayCycle && (
            <>
              {/* Cycle date range */}
              <p className="mb-1">
                <strong>Active cycle:</strong> {activePayCycle.startDate} to{" "}
                {activePayCycle.endDate}
              </p>

              {/* Salary for the current cycle */}
              <p className="mb-2">
                <strong>Cycle salary:</strong> ${currentSalary.toFixed(2)}
              </p>
            </>
          )}

          {/* Button to open profile edit  */}
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => setIsEditingProfile(true)}>
            Edit Profile
          </button>
        </div>
        {/** Remaining balance progress circle // Visual representation of
        remaining salary using SVG progress */}
        <div className="row justify-content-center my-4">
          <div className="col-md-6 text-center">
            {/* SVG container for circular progress */}
            <svg width="120" height="120" viewBox="0 0 120 120">
              {/* Background circle (full gray circle) */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#ddd"
                strokeWidth="10"
                fill="none"
              />

              {/* Progress circle (shows remaining percentage) */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#007bff"
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />

              {/* Percentage text in the center */}
              <text x="60" y="65" textAnchor="middle" className="progress-text">
                {progressPercentage.toFixed(0)}%
              </text>
            </svg>

            {/* Remaining salary value */}
            <h2 className="mt-2">
              <strong>${remainingSalary.toFixed(2)}</strong>
            </h2>
          </div>
        </div>
        {/** Main row: contains add expense form and expense list */}
        <div className="row">
          <div className="col-sm-12 col-md-6">
            <h3 className="text-center">Add Expenses</h3>

            {/* Table layout for expense input */}
            <table className="table table-bordered text-center">
              <thead className="table-light">
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>
                    <input
                      type="text"
                      name="expenseName"
                      className="form-control"
                      placeholder="Expense name"
                      value={formData.expenseName}
                      onChange={handleChange}
                    />
                  </td>

                  <td>
                    <select
                      name="expenseCategory"
                      className="form-select"
                      value={formData.expenseCategory}
                      onChange={handleChange}>
                      <option value="food">Food</option>
                      <option value="transport">Transport</option>
                      <option value="bills">Bills</option>
                      <option value="shopping">Shopping</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="health">Health</option>
                      <option value="other">Other</option>
                    </select>
                  </td>

                  <td>
                    <input
                      type="text"
                      name="expenseAmount"
                      className="form-control"
                      placeholder="Amount"
                      value={formData.expenseAmount}
                      onChange={validateNumber}
                    />
                  </td>

                  <td>
                    <button
                      id="btnADD"
                      className="btn btn-success"
                      onClick={handleAddExpense}>
                      ADD
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="col-sm-12 col-md-6">
            <h3 className="text-center">Expenses Detail</h3>

            {/* Table showing saved expenses */}
            <table className="table table-bordered text-center">
              <thead className="table-light">
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Remove</th>
                </tr>
              </thead>

              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="4">No expenses added yet for this cycle</td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.name}</td>

                      <td className="text-capitalize">
                        {expense.category || "other"}
                      </td>

                      <td>${Number(expense.amount).toFixed(2)}</td>

                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveExpense(expense.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="text-center">
              <h2>Total Expenses</h2>
              <strong>${totalExpenses.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
