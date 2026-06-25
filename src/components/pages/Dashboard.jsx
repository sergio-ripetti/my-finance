import { useEffect, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import SummaryCard from "../SummaryCard";
import { getFromLocalStorage } from "../../utils/localStorage";
import {
  createInitialPayCycle,
  getActivePayCycle,
  getPayCycles,
} from "../../utils/payCycles";
import {
  getAverageExpenseByCycleId,
  getExpensesByCycleId,
  getLargestExpenseByCycleId,
  getTopCategoryByCycleId,
} from "../../utils/expenses";


export default function Dashboard() {
  const userInfo = getFromLocalStorage("userInfo", {
    name: "",
    paymentFrequency: "",
    dateInitial: "",
  });


  const salary = getFromLocalStorage("salary", 0);
  const hasSalary = Number(salary) > 0;


  useEffect(() => {
    createInitialPayCycle(userInfo, salary);
  }, [userInfo, salary]);

  const payCycles = useMemo(() => getPayCycles(), []);
  const activePayCycle = useMemo(() => getActivePayCycle(), [payCycles]);

  const activeCycleExpenses = useMemo(() => {
    if (!activePayCycle) return [];
    return getExpensesByCycleId(activePayCycle.id);
  }, [activePayCycle]);

  const currentSalary = activePayCycle?.salaryAmount || Number(salary) || 0;

  const totalSpent = useMemo(() => {
    return activeCycleExpenses.reduce((total, expense) => {
      return total + Number(expense.amount || 0);
    }, 0);
  }, [activeCycleExpenses]);

  const remainingBalance = useMemo(() => {
    return Number(currentSalary) - totalSpent;
  }, [currentSalary, totalSpent]);

  const formattedFrequency = useMemo(() => {
    const frequency =
      activePayCycle?.paymentFrequency || userInfo.paymentFrequency;

    if (!frequency) return "Not set";

    const frequencyMap = {
      weekly: "Weekly",
      fortnightly: "Fortnightly",
      monthly: "Monthly",
    };

    return frequencyMap[frequency] || frequency;
  }, [activePayCycle, userInfo.paymentFrequency]);

  const recentExpenses = useMemo(() => {
    return [...activeCycleExpenses]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 5);
  }, [activeCycleExpenses]);

  const nextPayDate = useMemo(() => {
    if (!activePayCycle?.endDate) return "Not available";

    const endDate = new Date(activePayCycle.endDate);

    if (Number.isNaN(endDate.getTime())) return "Invalid date";

    const nextDate = new Date(endDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return nextDate.toLocaleDateString("en-NZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [activePayCycle]);

  const largestExpense = useMemo(() => {
    if (!activePayCycle) return null;
    return getLargestExpenseByCycleId(activePayCycle.id);
  }, [activePayCycle, activeCycleExpenses]);

  const topCategory = useMemo(() => {
    if (!activePayCycle) return null;
    return getTopCategoryByCycleId(activePayCycle.id);
  }, [activePayCycle, activeCycleExpenses]);

  const averageExpense = useMemo(() => {
    if (!activePayCycle) return 0;
    return getAverageExpenseByCycleId(activePayCycle.id);
  }, [activePayCycle, activeCycleExpenses]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(Number(value || 0));

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Invalid date";

    return parsedDate.toLocaleDateString("en-NZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
   const hasUserInfo =
     userInfo?.name?.trim() !== "" &&
     userInfo?.paymentFrequency !== "" &&
     userInfo?.paymentFrequency !== "0" &&
     userInfo?.dateInitial !== "";

   if (!hasUserInfo || !hasSalary) {
     return <Navigate to="/add-expense" replace />;
   }

  return (
    <section className="container-fluid py-3 px-2 px-md-3">
      {/* Header: welcome message and dashboard description */}
      <div className="mb-3 mb-md-4">
        <h2 className="fw-bold text-dark mb-1 fs-3 fs-md-2">
          {/* Display user name if available */}
          Welcome{userInfo.name ? `, ${userInfo.name}` : ""}
        </h2>
        <p className="text-muted mb-0 small">
          {/* Short description of the dashboard purpose */}
          Overview of your current finances
        </p>
      </div>

      {/* MOBILE VIEW: summary cards and collapsible sections */}
      <div className="d-block d-md-none">
        {/* Mobile summary cards: display key financial metrics */}
        <div className="row g-2">
          {/* Current salary */}
          <div className="col-12">
            <MobileSummaryCard
              title="Current Salary"
              value={formatCurrency(currentSalary)}
              subtitle="Active pay cycle salary"
            />
          </div>

          {/* Total expenses */}
          <div className="col-12">
            <MobileSummaryCard
              title="Total Spent"
              value={formatCurrency(totalSpent)}
              subtitle="Current cycle expenses"
            />
          </div>

          {/* Remaining balance */}
          <div className="col-12">
            <MobileSummaryCard
              title="Remaining"
              value={formatCurrency(remainingBalance)}
              subtitle="Current cycle balance"
            />
          </div>

          {/* Total number of pay cycles */}
          <div className="col-12">
            <MobileSummaryCard
              title="Pay Cycles"
              value={String(payCycles.length)}
              subtitle="Total saved cycles"
            />
          </div>

          {/* Largest expense in current cycle */}
          <div className="col-12">
            <MobileSummaryCard
              title="Biggest Expense"
              value={largestExpense ? largestExpense.name : "No expenses yet"}
              subtitle={
                largestExpense
                  ? formatCurrency(largestExpense.amount)
                  : "Nothing recorded for this cycle"
              }
            />
          </div>

          {/* Top spending category */}
          <div className="col-12">
            <MobileSummaryCard
              title="Top Category"
              value={
                topCategory
                  ? topCategory.category.charAt(0).toUpperCase() +
                    topCategory.category.slice(1)
                  : "No category yet"
              }
              subtitle={
                topCategory
                  ? `${formatCurrency(topCategory.total)} spent`
                  : "No expenses recorded"
              }
            />
          </div>

          {/* Number of expenses in active cycle */}
          <div className="col-12">
            <MobileSummaryCard
              title="Expenses Count"
              value={String(activeCycleExpenses.length)}
              subtitle="Expenses saved in this cycle"
            />
          </div>

          {/* Average expense value */}
          <div className="col-12">
            <MobileSummaryCard
              title="Average Expense"
              value={formatCurrency(averageExpense)}
              subtitle="Per expense in current cycle"
            />
          </div>
        </div>

        {/* Mobile accordion: detailed sections */}
        <div className="accordion mt-3" id="dashboardMobileAccordion">
          {/* Accordion section: recent expenses */}
          <div className="accordion-item border rounded-4 overflow-hidden">
            <h2 className="accordion-header" id="headingRecentExpenses">
              <button
                className="accordion-button collapsed fw-semibold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseRecentExpenses"
                aria-expanded="false"
                aria-controls="collapseRecentExpenses">
                Recent Expenses
              </button>
            </h2>

            <div
              id="collapseRecentExpenses"
              className="accordion-collapse collapse"
              aria-labelledby="headingRecentExpenses"
              data-bs-parent="#dashboardMobileAccordion">
              <div className="accordion-body p-2">
                {/* Empty state when no expenses */}
                {recentExpenses.length === 0 ? (
                  <p className="text-muted small mb-0">
                    No expenses added to this cycle yet.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {/* Render each recent expense */}
                    {recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="border rounded-4 p-2 d-flex justify-content-between align-items-center">
                        <div className="me-2">
                          <p className="fw-semibold text-dark mb-1 small">
                            {expense.name}
                          </p>

                          {/* Expense category */}
                          <p
                            className="text-muted mb-0"
                            style={{ fontSize: "12px" }}>
                            {expense.category
                              ? expense.category.charAt(0).toUpperCase() +
                                expense.category.slice(1)
                              : "Other"}
                          </p>
                        </div>

                        {/* Expense amount */}
                        <p className="fw-bold text-dark mb-0 small">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Accordion section: current cycle info */}
          <div className="accordion-item border rounded-4 overflow-hidden mt-2">
            <h2 className="accordion-header" id="headingCycleInfo">
              <button
                className="accordion-button collapsed fw-semibold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseCycleInfo"
                aria-expanded="false"
                aria-controls="collapseCycleInfo">
                Current Cycle Info
              </button>
            </h2>

            <div
              id="collapseCycleInfo"
              className="accordion-collapse collapse"
              aria-labelledby="headingCycleInfo"
              data-bs-parent="#dashboardMobileAccordion">
              <div className="accordion-body p-2">
                {/* Cycle details */}
                <div className="d-flex flex-column gap-2">
                  <CompactInfoRow
                    label="Start Date"
                    value={formatDate(
                      activePayCycle?.startDate || userInfo.dateInitial,
                    )}
                  />
                  <CompactInfoRow
                    label="End Date"
                    value={formatDate(activePayCycle?.endDate)}
                  />
                  <CompactInfoRow
                    label="Payment Frequency"
                    value={formattedFrequency}
                  />
                  <CompactInfoRow
                    label="Estimated Next Pay Date"
                    value={nextPayDate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP / TABLET VIEW: main dashboard layout */}
      <div className="d-none d-md-block">
        {/* Summary cards: main financial overview */}
        <div className="row g-3">
          {/* Current salary */}
          <div className="col-12 col-md-6 col-xl-3">
            <SummaryCard
              title="Current Salary"
              value={formatCurrency(currentSalary)}
              subtitle="Active pay cycle salary"
            />
          </div>

          {/* Total spent */}
          <div className="col-12 col-md-6 col-xl-3">
            <SummaryCard
              title="Total Spent"
              value={formatCurrency(totalSpent)}
              subtitle="Current cycle expenses"
            />
          </div>

          {/* Remaining balance */}
          <div className="col-12 col-md-6 col-xl-3">
            <SummaryCard
              title="Remaining"
              value={formatCurrency(remainingBalance)}
              subtitle="Current cycle balance"
            />
          </div>

          {/* Total pay cycles */}
          <div className="col-12 col-md-6 col-xl-3">
            <SummaryCard
              title="Pay Cycles"
              value={String(payCycles.length)}
              subtitle="Total saved cycles"
            />
          </div>
        </div>

        {/* Additional metrics cards */}
        <div className="row g-3 mt-1 mt-md-3">
          {/* Largest expense */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100 rounded-4">
              <div className="card-body">
                <p className="text-muted small mb-2">Biggest Expense</p>
                <h3 className="h5 fw-bold text-dark mb-2">
                  {largestExpense ? largestExpense.name : "No expenses yet"}
                </h3>
                <p className="text-secondary small mb-0">
                  {largestExpense
                    ? formatCurrency(largestExpense.amount)
                    : "Nothing recorded for this cycle"}
                </p>
              </div>
            </div>
          </div>

          {/* Top category */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100 rounded-4">
              <div className="card-body">
                <p className="text-muted small mb-2">Top Category</p>
                <h3 className="h5 fw-bold text-dark mb-2">
                  {topCategory
                    ? topCategory.category.charAt(0).toUpperCase() +
                      topCategory.category.slice(1)
                    : "No category yet"}
                </h3>
                <p className="text-secondary small mb-0">
                  {topCategory
                    ? `${formatCurrency(topCategory.total)} spent`
                    : "No expenses recorded"}
                </p>
              </div>
            </div>
          </div>

          {/* Expenses count */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100 rounded-4">
              <div className="card-body">
                <p className="text-muted small mb-2">Expenses Count</p>
                <h3 className="h5 fw-bold text-dark mb-2">
                  {activeCycleExpenses.length}
                </h3>
                <p className="text-secondary small mb-0">
                  Expenses saved in this cycle
                </p>
              </div>
            </div>
          </div>

          {/* Average expense */}
          <div className="col-12 col-md-6 col-xl-3">
            <div className="card border-0 shadow-sm h-100 rounded-4">
              <div className="card-body">
                <p className="text-muted small mb-2">Average Expense</p>
                <h3 className="h5 fw-bold text-dark mb-2">
                  {formatCurrency(averageExpense)}
                </h3>
                <p className="text-secondary small mb-0">
                  Per expense in current cycle
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed sections */}
        <div className="row g-4 mt-1 mt-md-3">
          {/* Recent expenses list */}
          <div className="col-12 col-xl-7">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                {/* Section header */}
                <div className="mb-4">
                  <h3 className="h4 fw-bold text-dark mb-1">Recent Expenses</h3>
                  <p className="text-muted small mb-0">
                    Latest expenses from the active cycle
                  </p>
                </div>

                {/* Empty state */}
                {recentExpenses.length === 0 ? (
                  <p className="text-muted small mb-0">
                    No expenses added to this cycle yet.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {/* Render each expense */}
                    {recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="d-flex justify-content-between align-items-center border rounded-4 p-3 bg-white">
                        <div>
                          <p className="fw-medium text-dark mb-1">
                            {expense.name}
                          </p>

                          {/* Expense category */}
                          <p className="text-muted small mb-0">
                            {expense.category
                              ? expense.category.charAt(0).toUpperCase() +
                                expense.category.slice(1)
                              : "Other"}
                          </p>
                        </div>

                        {/* Expense amount */}
                        <p className="fw-semibold text-dark mb-0">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current cycle info */}
          <div className="col-12 col-xl-5">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body">
                {/* Section header */}
                <div className="mb-4">
                  <h3 className="h4 fw-bold text-dark mb-1">
                    Current Cycle Info
                  </h3>
                  <p className="text-muted small mb-0">
                    Basic details about your active payment setup
                  </p>
                </div>

                {/* Cycle details */}
                <div className="d-flex flex-column gap-3">
                  {/* Start date */}
                  <div className="border rounded-4 p-3">
                    <p className="text-muted small mb-1">Start Date</p>
                    <p className="fw-semibold text-dark mb-0">
                      {formatDate(
                        activePayCycle?.startDate || userInfo.dateInitial,
                      )}
                    </p>
                  </div>

                  {/* End date */}
                  <div className="border rounded-4 p-3">
                    <p className="text-muted small mb-1">End Date</p>
                    <p className="fw-semibold text-dark mb-0">
                      {formatDate(activePayCycle?.endDate)}
                    </p>
                  </div>

                  {/* Payment frequency */}
                  <div className="border rounded-4 p-3">
                    <p className="text-muted small mb-1">Payment Frequency</p>
                    <p className="fw-semibold text-dark mb-0">
                      {formattedFrequency}
                    </p>
                  </div>

                  {/* Next pay date */}
                  <div className="border rounded-4 p-3">
                    <p className="text-muted small mb-1">
                      Estimated Next Pay Date
                    </p>
                    <p className="fw-semibold text-dark mb-0">{nextPayDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Mobile summary card component
// Displays a compact financial metric (title, value, subtitle) for mobile view
function MobileSummaryCard({ title, value, subtitle }) {
  return (
    // Card container for each metric
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body py-2 px-3">

        {/* Row: title (left) and value (right) */}
        <div className="d-flex justify-content-between align-items-center gap-3">
          <p className="text-muted mb-0 small fw-medium">{title}</p>
          <p className="fw-bold text-dark mb-0">{value}</p>
        </div>

        {/* Subtitle: additional context for the metric */}
        <p className="text-secondary mb-0 mt-1" style={{ fontSize: "12px" }}>
          {subtitle}
        </p>

      </div>
    </div>
  );
}

// Compact info row component
// Displays a simple label-value pair (used in mobile accordion sections)
function CompactInfoRow({ label, value }) {
  return (
    // Container for each info row
    <div className="border rounded-4 px-3 py-2">

      {/* Label: description of the data */}
      <p className="text-muted mb-1" style={{ fontSize: "12px" }}>
        {label}
      </p>

      {/* Value: actual data displayed */}
      <p className="fw-semibold text-dark mb-0 small">{value}</p>

    </div>
  );
}