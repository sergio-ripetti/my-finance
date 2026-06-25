import { useMemo, useState } from "react";
import {
  getExpenseCountByCycleId,
  getTotalSpentByCycleId,
} from "../../utils/expenses";

import {
  createNextPayCycle,
  deletePayCycle,
  getPayCycles,
  updatePayCycleSalary,
} from "../../utils/payCycles";
import { STORAGE_KEYS } from "../../utils/constants";

function PayCycles() {
  // Input used to create a new cycle.
  const [salaryInput, setSalaryInput] = useState("");

  // Refresh trigger after updates.
  const [refreshKey, setRefreshKey] = useState(0);

  // Stores cycle currently in edit mode.
  const [editingCycleId, setEditingCycleId] = useState(null);

  // Edited salary value.
  const [editedSalary, setEditedSalary] = useState("");

  // Loads pay cycles ordered by newest first.
  const payCycles = useMemo(() => {
    return getPayCycles().sort((a, b) => b.id - a.id);
  }, [refreshKey]);

  // Forces component refresh.
  const refreshCycles = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Saves cycles manually to localStorage if needed.
  const savePayCyclesToStorage = (updatedCycles) => {
    localStorage.setItem(STORAGE_KEYS.PAY_CYCLES, JSON.stringify(updatedCycles));
  };

  // Creates next pay cycle.
  const handleCreateNextCycle = () => {
    const parsedSalary = Number(salaryInput);

    if (!parsedSalary || parsedSalary <= 0) {
      alert("Please enter a valid salary amount.");
      return;
    }

    const result = createNextPayCycle(parsedSalary);

    if (!result.success) {
      alert(result.message);
      return;
    }

    setSalaryInput("");
    refreshCycles();
  };

  // Opens edit mode for one cycle.
  const handleStartEdit = (cycle) => {
    setEditingCycleId(cycle.id);
    setEditedSalary(String(cycle.salaryAmount ?? ""));
  };

  // Cancels edit mode.
  const handleCancelEdit = () => {
    setEditingCycleId(null);
    setEditedSalary("");
  };

  // Saves updated salary.
  const handleSaveSalary = (cycleId) => {
    const result = updatePayCycleSalary(cycleId, editedSalary);

    if (!result.success) {
      alert(result.message);
      return;
    }

    handleCancelEdit();
    refreshCycles();
  };

  // Deletes selected cycle.
  const handleDeleteCycle = (cycle) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this pay cycle?",
    );

    if (!confirmDelete) return;

    const result = deletePayCycle(cycle.id);

    if (!result.success) {
      alert(result.message);
      return;
    }

    refreshCycles();
  };

  // Formats currency values.
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(Number(value || 0));

  // Formats dates for display.
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

  // Formats payment frequency label.
  const formatFrequency = (frequency) => {
    if (!frequency) return "Cycle";
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  return (
    <section className="container-fluid py-3 px-2 px-md-3">
      {/* Page title */}
      <div className="mb-3 mb-md-4">
        <h2 className="fw-bold text-dark mb-1">Pay Cycles</h2>
        <p className="text-muted small mb-0">
          View and manage your salary periods
        </p>
      </div>

      {/* Create cycle section */}
      <div className="row justify-content-center mb-3 mb-md-4">
        <div className="col-12 col-md-8 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-3 p-md-4">
              <div className="mb-3 text-center">
                <h3 className="h5 fw-bold text-dark mb-1">
                  Create New Pay Cycle
                </h3>
                <p className="text-muted small mb-0">
                  Close the active cycle and start a new one with a new salary
                  amount
                </p>
              </div>

              {/* Create cycle form */}
              <div className="d-flex flex-row justify-content-center align-items-center gap-3 flex-wrap">
                <input
                  type="number"
                  value={salaryInput}
                  onChange={(e) => setSalaryInput(e.target.value)}
                  placeholder="Enter salary amount"
                  className="form-control rounded-4 py-3 text-center"
                  style={{ width: "40%", minWidth: "220px" }}
                />

                <button
                  onClick={handleCreateNextCycle}
                  className="btn btn-primary rounded-4 py-3 fw-semibold"
                  style={{ width: "40%", minWidth: "220px" }}>
                  Create Cycle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {payCycles.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-3 p-md-4">
            <p className="text-muted small mb-0">No pay cycles found yet.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile accordion view */}
          <div className="d-block d-md-none">
            <div className="accordion" id="payCyclesAccordion">
              {payCycles.map((cycle, index) => {
                const totalSpent = getTotalSpentByCycleId(cycle.id);
                const expenseCount = getExpenseCountByCycleId(cycle.id);
                const remainingBalance =
                  Number(cycle.salaryAmount) - Number(totalSpent);

                const headingId = `heading-${cycle.id}`;
                const collapseId = `collapse-${cycle.id}`;
                const isEditing = editingCycleId === cycle.id;

                return (
                  <div
                    key={cycle.id}
                    className="accordion-item border rounded-4 overflow-hidden mb-2">
                    {/* Accordion header */}
                    <h2 className="accordion-header" id={headingId}>
                      <button
                        className={`accordion-button ${
                          index !== 0 ? "collapsed" : ""
                        } fw-semibold`}
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#${collapseId}`}
                        aria-expanded={index === 0 ? "true" : "false"}
                        aria-controls={collapseId}>
                        <div className="d-flex flex-column w-100 me-3">
                          <div className="d-flex justify-content-between align-items-center gap-2">
                            <span className="text-dark">
                              {formatFrequency(cycle.paymentFrequency)} Cycle
                            </span>

                            <span
                              className={`badge rounded-pill ${
                                cycle.status === "active"
                                  ? "text-bg-success"
                                  : "text-bg-light text-secondary"
                              }`}>
                              {cycle.status === "active" ? "Active" : "Closed"}
                            </span>
                          </div>

                          <small className="text-muted mt-1">
                            {formatDate(cycle.startDate)} -{" "}
                            {formatDate(cycle.endDate)}
                          </small>
                        </div>
                      </button>
                    </h2>

                    {/* Accordion body */}
                    <div
                      id={collapseId}
                      className={`accordion-collapse collapse ${
                        index === 0 ? "show" : ""
                      }`}
                      aria-labelledby={headingId}
                      data-bs-parent="#payCyclesAccordion">
                      <div className="accordion-body p-2">
                        {/* Cycle info rows */}
                        <div className="d-flex flex-column gap-2">
                          <CompactInfoRow
                            label="Start Date"
                            value={formatDate(cycle.startDate)}
                          />

                          <CompactInfoRow
                            label="End Date"
                            value={formatDate(cycle.endDate)}
                          />

                          {isEditing ? (
                            <div className="border rounded-4 px-3 py-2">
                              <p
                                className="text-muted mb-1"
                                style={{ fontSize: "12px" }}>
                                Salary
                              </p>

                              <input
                                type="number"
                                className="form-control form-control-sm rounded-3"
                                value={editedSalary}
                                onChange={(e) =>
                                  setEditedSalary(e.target.value)
                                }
                                placeholder="Enter salary amount"
                              />

                              {/* Edit actions mobile */}
                              <div className="d-flex flex-column gap-2 mt-2">
                                <button
                                  className="btn btn-primary btn-sm rounded-3 w-100"
                                  onClick={() => handleSaveSalary(cycle.id)}>
                                  Save
                                </button>

                                <button
                                  className="btn btn-light btn-sm rounded-3 w-100"
                                  onClick={handleCancelEdit}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <CompactInfoRow
                              label="Salary"
                              value={formatCurrency(cycle.salaryAmount)}
                            />
                          )}

                          <CompactInfoRow
                            label="Total Spent"
                            value={formatCurrency(totalSpent)}
                          />

                          <CompactInfoRow
                            label="Remaining"
                            value={formatCurrency(remainingBalance)}
                          />

                          <CompactInfoRow
                            label="Expenses Count"
                            value={String(expenseCount)}
                          />
                        </div>

                        {/* Mobile action buttons */}
                        <div className="d-flex flex-column gap-2 mt-3">
                          {!isEditing && (
                            <button
                              className="btn btn-outline-primary btn-sm rounded-3 w-100"
                              onClick={() => handleStartEdit(cycle)}>
                              Edit Salary
                            </button>
                          )}

                          <button
                            className="btn btn-outline-danger btn-sm rounded-3 w-100"
                            onClick={() => handleDeleteCycle(cycle)}>
                            Delete Cycle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop cards view */}
          <div className="d-none d-md-block">
            <div className="row g-3">
              {payCycles.map((cycle) => {
                const totalSpent = getTotalSpentByCycleId(cycle.id);
                const expenseCount = getExpenseCountByCycleId(cycle.id);
                const remainingBalance =
                  Number(cycle.salaryAmount) - Number(totalSpent);
                const isEditing = editingCycleId === cycle.id;

                return (
                  <div key={cycle.id} className="col-12 col-md-6 col-xl-4">
                    <div
                      className={`card border-0 shadow-sm rounded-4 h-100 ${
                        cycle.status === "active"
                          ? "border border-success-subtle"
                          : ""
                      }`}>
                      <div className="card-body p-3 p-lg-4 d-flex flex-column">
                        {/* Card header */}
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                          <div>
                            <h4 className="h6 fw-bold text-dark mb-1">
                              {formatFrequency(cycle.paymentFrequency)} Cycle
                            </h4>

                            <p className="text-muted small mb-0">
                              {formatDate(cycle.startDate)} -{" "}
                              {formatDate(cycle.endDate)}
                            </p>
                          </div>

                          <span
                            className={`badge rounded-pill ${
                              cycle.status === "active"
                                ? "text-bg-success"
                                : "text-bg-light text-secondary"
                            }`}>
                            {cycle.status === "active" ? "Active" : "Closed"}
                          </span>
                        </div>

                        {/* Summary mini cards */}
                        <div className="row g-2">
                          <div className="col-6">
                            {isEditing ? (
                              <div className="bg-light rounded-4 p-3 h-100">
                                <p className="text-muted small mb-1">Salary</p>

                                <input
                                  type="number"
                                  className="form-control form-control-sm rounded-3"
                                  value={editedSalary}
                                  onChange={(e) =>
                                    setEditedSalary(e.target.value)
                                  }
                                  placeholder="Enter salary amount"
                                />
                              </div>
                            ) : (
                              <InfoMiniCard
                                label="Salary"
                                value={formatCurrency(cycle.salaryAmount)}
                              />
                            )}
                          </div>

                          <div className="col-6">
                            <InfoMiniCard
                              label="Total Spent"
                              value={formatCurrency(totalSpent)}
                            />
                          </div>

                          <div className="col-6">
                            <InfoMiniCard
                              label="Remaining"
                              value={formatCurrency(remainingBalance)}
                            />
                          </div>

                          <div className="col-6">
                            <InfoMiniCard
                              label="Expenses Count"
                              value={String(expenseCount)}
                            />
                          </div>
                        </div>

                        {/* Desktop action buttons */}
                        <div className="mt-3 d-flex justify-content-end gap-2 flex-wrap">
                          {isEditing ? (
                            <>
                              <button
                                className="btn btn-primary btn-sm rounded-3"
                                onClick={() => handleSaveSalary(cycle.id)}>
                                Save
                              </button>

                              <button
                                className="btn btn-light btn-sm rounded-3"
                                onClick={handleCancelEdit}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-outline-primary btn-sm rounded-3"
                              onClick={() => handleStartEdit(cycle)}>
                              Edit Salary
                            </button>
                          )}

                          <button
                            className="btn btn-outline-danger btn-sm rounded-3"
                            onClick={() => handleDeleteCycle(cycle)}>
                            Delete Cycle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// Small desktop metric card.
function InfoMiniCard({ label, value }) {
  return (
    <div className="bg-light rounded-4 p-3 h-100">
      <p className="text-muted small mb-1">{label}</p>
      <p className="fw-semibold text-dark mb-0">{value}</p>
    </div>
  );
}

// Compact mobile info row.
function CompactInfoRow({ label, value }) {
  return (
    <div className="border rounded-4 px-3 py-2">
      <p className="text-muted mb-1" style={{ fontSize: "12px" }}>
        {label}
      </p>

      <p className="fw-semibold text-dark mb-0 small">{value}</p>
    </div>
  );
}

export default PayCycles;
