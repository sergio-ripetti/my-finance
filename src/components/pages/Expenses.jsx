import { useMemo, useState } from "react";
import {
  getAllExpenseCategories,
  getExpensesWithCycleInfo,
  removeExpenseById,
  updateExpenseById,
} from "../../utils/expenses";
import { getPayCycles } from "../../utils/payCycles";
import "./Expenses.css";

function Expenses() {
  // Refreshes the data after editing or deleting an expense.
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter values used by the search controls.
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Tracks which expense is currently being edited.
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Stores the temporary values while editing an expense.
  const [editFormData, setEditFormData] = useState({
    name: "",
    category: "food",
    amount: "",
  });

  // Controls table sorting.
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");

  // Loads expenses with their related cycle information.
  const expenses = useMemo(() => {
    return getExpensesWithCycleInfo().sort((a, b) => b.id - a.id);
  }, [refreshKey]);

  // Loads all categories used by expenses.
  const categories = useMemo(() => {
    return getAllExpenseCategories();
  }, [refreshKey]);

  // Loads all pay cycles for the cycle filter.
  const payCycles = useMemo(() => {
    return getPayCycles().sort((a, b) => b.id - a.id);
  }, [refreshKey]);

  // Checks if the user is using any filter.
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      categoryFilter !== "all" ||
      cycleFilter !== "all" ||
      statusFilter !== "all"
    );
  }, [searchTerm, categoryFilter, cycleFilter, statusFilter]);

  // Filters expenses by name, category, cycle, and status.
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || expense.category === categoryFilter;

      const matchesCycle =
        cycleFilter === "all" || String(expense.cycleId) === cycleFilter;

      const matchesStatus =
        statusFilter === "all" || expense.cycleStatus === statusFilter;

      return matchesSearch && matchesCategory && matchesCycle && matchesStatus;
    });
  }, [expenses, searchTerm, categoryFilter, cycleFilter, statusFilter]);

  // Sorts the filtered expenses and limits the default view to 10 items.
  const displayedExpenses = useMemo(() => {
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
      let valueA;
      let valueB;

      if (sortField === "name") {
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
      } else if (sortField === "category") {
        valueA = (a.category || "other").toLowerCase();
        valueB = (b.category || "other").toLowerCase();
      } else if (sortField === "amount") {
        valueA = Number(a.amount || 0);
        valueB = Number(b.amount || 0);
      } else if (sortField === "date") {
        valueA = new Date(a.createdAt || 0).getTime();
        valueB = new Date(b.createdAt || 0).getTime();
      } else {
        valueA = a.id;
        valueB = b.id;
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    if (!hasActiveFilters) {
      return sortedExpenses.slice(0, 10);
    }

    return sortedExpenses;
  }, [filteredExpenses, sortField, sortDirection, hasActiveFilters]);

  // Calculates the total amount currently displayed.
  const totalFilteredAmount = useMemo(() => {
    return displayedExpenses.reduce((total, expense) => {
      return total + Number(expense.amount || 0);
    }, 0);
  }, [displayedExpenses]);

  // Deletes an expense after confirmation.
  const handleRemoveExpense = (expenseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmDelete) return;

    removeExpenseById(expenseId);
    setRefreshKey((prev) => prev + 1);

    if (editingExpenseId === expenseId) {
      setEditingExpenseId(null);
      setEditFormData({
        name: "",
        category: "food",
        amount: "",
      });
    }
  };

  // Opens edit mode for the selected expense.
  const handleStartEdit = (expense) => {
    setEditingExpenseId(expense.id);
    setEditFormData({
      name: expense.name,
      category: expense.category || "other",
      amount: String(expense.amount),
    });
  };

  // Cancels edit mode and clears the edit form.
  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditFormData({
      name: "",
      category: "food",
      amount: "",
    });
  };

  // Updates edit form values.
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validates and saves the edited expense.
  const handleSaveEdit = (expenseId) => {
    const parsedAmount = Number(editFormData.amount);

    if (!editFormData.name.trim()) {
      alert("Please enter an expense name.");
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    if (!editFormData.category) {
      alert("Please select a category.");
      return;
    }

    updateExpenseById(expenseId, {
      name: editFormData.name,
      category: editFormData.category,
      amount: parsedAmount,
    });

    setEditingExpenseId(null);
    setEditFormData({
      name: "",
      category: "food",
      amount: "",
    });
    setRefreshKey((prev) => prev + 1);
  };

  // Changes the table sorting field and direction.
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  // Returns the sort icon for each table header.
  const getSortIndicator = (field) => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  // Formats the expense creation date.
  const formatExpenseDate = (dateString) => {
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

  // Formats cycle dates for desktop and mobile.
  const formatCycleDate = (dateString, isMobile = false) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString("en-NZ", {
      day: "2-digit",
      month: "short",
      ...(isMobile ? {} : { year: "numeric" }),
    });
  };

  // Formats a shorter date for mobile cards.
  const formatExpenseDateShort = (dateString) => {
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

  return (
    <section>
      {/* Page heading */}
      <div className="mb-4">
        <h2 className="section-title mb-1">Expenses</h2>
        <p className="section-subtitle mb-0">
          Manage, search, and filter all your saved expenses
        </p>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="filters-panel h-100">
            <div className="card-body p-3">
              <label className="form-label small fw-semibold text-secondary mb-2">
                Search by Name
              </label>
              <input
                type="text"
                placeholder="Search expense..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control filter-input"
              />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="filters-panel h-100">
            <div className="card-body p-3">
              <label className="form-label small fw-semibold text-secondary mb-2">
                Filter by Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-select filter-select">
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="filters-panel h-100">
            <div className="card-body p-3">
              <label className="form-label small fw-semibold text-secondary mb-2">
                Filter by Cycle
              </label>
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                className="form-select filter-select">
                <option value="all">All Cycles</option>
                {payCycles.map((cycle, index) => (
                  <option key={cycle.id} value={String(cycle.id)}>
                    {`Cycle ${payCycles.length - index} | ${cycle.startDate} to ${cycle.endDate}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="filters-panel h-100">
            <div className="card-body p-3">
              <label className="form-label small fw-semibold text-secondary mb-2">
                Filter by Cycle Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select filter-select">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filter summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card dashboard-summary-card h-100 border-0 shadow-sm">
            <div className="card-body p-3">
              <p className="summary-title mb-1">
                {hasActiveFilters
                  ? "Filtered Expenses"
                  : "Latest Expenses Shown"}
              </p>
              <h3 className="summary-value mb-0">{displayedExpenses.length}</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card dashboard-summary-card h-100 border-0 shadow-sm">
            <div className="card-body p-3">
              <p className="summary-title mb-1">Displayed Total</p>
              <h3 className="summary-value mb-0">
                ${totalFilteredAmount.toFixed(2)}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card dashboard-summary-card h-100 border-0 shadow-sm">
            <div className="card-body p-3">
              <p className="summary-title mb-1">Available Categories</p>
              <h3 className="summary-value mb-0">{categories.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Default list note */}
      {!hasActiveFilters && (
        <div className="info-banner mb-4">
          Showing the latest 10 expenses by default. Use filters to search
          through all saved expenses.
        </div>
      )}

      <div className="table-panel overflow-hidden">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 pt-3 pb-2 d-none d-lg-flex">
          <p className="table-hint mb-0">
            Click the column titles to sort expenses
          </p>
        </div>

        {/* Desktop Table */}
        <div className="table-responsive d-none d-lg-block">
          <table className="table table-modern mb-0">
            <thead>
              <tr>
                <th
                  className="sortable-header"
                  onClick={() => handleSort("name")}>
                  <span className="sortable-label">Name</span>
                  <span className="sort-icon">{getSortIndicator("name")}</span>
                </th>

                <th
                  className="sortable-header"
                  onClick={() => handleSort("category")}>
                  <span className="sortable-label">Category</span>
                  <span className="sort-icon">
                    {getSortIndicator("category")}
                  </span>
                </th>

                <th
                  className="sortable-header"
                  onClick={() => handleSort("amount")}>
                  <span className="sortable-label">Amount</span>
                  <span className="sort-icon">
                    {getSortIndicator("amount")}
                  </span>
                </th>

                <th>Cycle</th>

                <th
                  className="sortable-header"
                  onClick={() => handleSort("date")}>
                  <span className="sortable-label">Date</span>
                  <span className="sort-icon">{getSortIndicator("date")}</span>
                </th>

                <th>Status</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>

            <tbody>
              {displayedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No expenses found for the selected filters.
                  </td>
                </tr>
              ) : (
                displayedExpenses.map((expense) => {
                  const isEditing = editingExpenseId === expense.id;

                  return (
                    <tr key={expense.id}>
                      <td className="fw-semibold text-dark">
                        {isEditing ? (
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                            className="form-control inline-input"
                          />
                        ) : (
                          expense.name
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <select
                            name="category"
                            value={editFormData.category}
                            onChange={handleEditChange}
                            className="form-select inline-select">
                            <option value="food">Food</option>
                            <option value="transport">Transport</option>
                            <option value="bills">Bills</option>
                            <option value="shopping">Shopping</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="health">Health</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <span className="category-badge">
                            {(expense.category || "other")
                              .charAt(0)
                              .toUpperCase() +
                              (expense.category || "other").slice(1)}
                          </span>
                        )}
                      </td>

                      <td className="fw-semibold text-dark">
                        {isEditing ? (
                          <input
                            type="number"
                            name="amount"
                            value={editFormData.amount}
                            onChange={handleEditChange}
                            className="form-control inline-input"
                          />
                        ) : (
                          `$${Number(expense.amount).toFixed(2)}`
                        )}
                      </td>

                      <td>
                        <div>
                          <div className="fw-semibold text-dark small d-none d-md-block">
                            {formatCycleDate(expense.cycleStartDate)} to{" "}
                            {formatCycleDate(expense.cycleEndDate)}
                          </div>

                          <div className="fw-semibold text-dark small d-block d-md-none">
                            {formatCycleDate(expense.cycleStartDate, true)} to{" "}
                            {formatCycleDate(expense.cycleEndDate, true)}
                          </div>

                          <div className="small text-secondary text-capitalize">
                            {expense.cycleFrequency}
                          </div>
                        </div>
                      </td>

                      <td className="small text-secondary">
                        {formatExpenseDate(expense.createdAt)}
                      </td>

                      <td>
                        <span
                          className={
                            expense.cycleStatus === "active"
                              ? "soft-badge-active"
                              : "soft-badge-closed"
                          }>
                          {expense.cycleStatus}
                        </span>
                      </td>

                      <td>
                        {isEditing ? (
                          <div className="d-flex gap-2 flex-wrap actions-wrap">
                            <button
                              onClick={() => handleSaveEdit(expense.id)}
                              className="btn btn-sm btn-success rounded-pill px-3 fw-semibold">
                              Save
                            </button>

                            <button
                              onClick={handleCancelEdit}
                              className="btn btn-sm btn-secondary rounded-pill px-3 fw-semibold">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex gap-2 flex-wrap actions-wrap">
                            <button
                              onClick={() => handleStartEdit(expense)}
                              className="btn btn-sm btn-warning rounded-pill px-3 fw-semibold text-dark border-0">
                              Edit
                            </button>

                            <button
                              onClick={() => handleRemoveExpense(expense.id)}
                              className="btn btn-sm btn-danger rounded-pill px-3 fw-semibold">
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="d-lg-none p-3">
          <p className="table-hint mb-3">Your saved expenses</p>

          {displayedExpenses.length === 0 ? (
            <div className="text-center text-muted py-4">
              No expenses found for the selected filters.
            </div>
          ) : (
            <div className="expense-mobile-list">
              {displayedExpenses.map((expense) => {
                const isEditing = editingExpenseId === expense.id;

                return (
                  <div key={expense.id} className="expense-mobile-card">
                    {isEditing ? (
                      <>
                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-secondary mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                            className="form-control"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-secondary mb-2">
                            Category
                          </label>
                          <select
                            name="category"
                            value={editFormData.category}
                            onChange={handleEditChange}
                            className="form-select">
                            <option value="food">Food</option>
                            <option value="transport">Transport</option>
                            <option value="bills">Bills</option>
                            <option value="shopping">Shopping</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="health">Health</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label small fw-semibold text-secondary mb-2">
                            Amount
                          </label>
                          <input
                            type="number"
                            name="amount"
                            value={editFormData.amount}
                            onChange={handleEditChange}
                            className="form-control"
                          />
                        </div>

                        <div className="d-flex gap-2 flex-wrap mt-3">
                          <button
                            onClick={() => handleSaveEdit(expense.id)}
                            className="btn btn-success rounded-pill px-3 fw-semibold">
                            Save
                          </button>

                          <button
                            onClick={handleCancelEdit}
                            className="btn btn-secondary rounded-pill px-3 fw-semibold">
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                          <div>
                            <h6 className="expense-mobile-title mb-1">
                              {expense.name}
                            </h6>
                            <span className="category-badge">
                              {(expense.category || "other")
                                .charAt(0)
                                .toUpperCase() +
                                (expense.category || "other").slice(1)}
                            </span>
                          </div>

                          <div className="expense-mobile-amount">
                            ${Number(expense.amount).toFixed(2)}
                          </div>
                        </div>

                        <div className="expense-mobile-meta compact-meta">
                          <div className="expense-meta-row-inline">
                            <span className="expense-meta-label">Cycle</span>
                            <span className="expense-meta-value text-end">
                              {formatCycleDate(expense.cycleStartDate, true)} to{" "}
                              {formatCycleDate(expense.cycleEndDate, true)}
                            </span>
                          </div>

                          <div className="expense-meta-row-inline">
                            <span className="expense-meta-label">
                              Frequency
                            </span>
                            <span className="expense-meta-value text-capitalize text-end">
                              {expense.cycleFrequency}
                            </span>
                          </div>

                          <div className="expense-meta-row-inline">
                            <span className="expense-meta-label">Created</span>
                            <span className="expense-meta-value text-end">
                              {formatExpenseDateShort(expense.createdAt)}
                            </span>
                          </div>

                          <div className="expense-meta-row-inline">
                            <span className="expense-meta-label">Status</span>
                            <span className="text-end">
                              <span
                                className={
                                  expense.cycleStatus === "active"
                                    ? "soft-badge-active"
                                    : "soft-badge-closed"
                                }>
                                {expense.cycleStatus}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="d-flex gap-2 flex-wrap mt-3">
                          <button
                            onClick={() => handleStartEdit(expense)}
                            className="btn btn-warning rounded-pill px-3 fw-semibold text-dark border-0">
                            Edit
                          </button>

                          <button
                            onClick={() => handleRemoveExpense(expense.id)}
                            className="btn btn-danger rounded-pill px-3 fw-semibold">
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Expenses;
