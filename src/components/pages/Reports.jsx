// Reports page
// Generates financial insights across pay cycles including totals, charts, and export functionality
import { useMemo, useState } from "react";
import { getPayCycles } from "../../utils/payCycles";
import {
  getCategoryTotalsByCycleIds,
  getExpenseCountByCycleId,
  getTotalSpentByCycleId,
  getExpensesWithCycleInfo,
} from "../../utils/expenses";
import SummaryCard from "../SummaryCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import ExcelJS from "exceljs";
// Colors used by the category pie charts.
const CATEGORY_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#0891b2",
  "#6b7280",
  "#111827",
];

function Reports() {
  // Filter state for cycle status and selected categories
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Load and sort pay cycles, prioritizing the active one
  const payCycles = useMemo(() => {
    return [...getPayCycles()].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return b.id - a.id;
    });
  }, []);
  // Filter pay cycles based on selected status (active, closed, all)
  const filteredPayCycles = useMemo(() => {
    if (statusFilter === "all") return payCycles;
    return payCycles.filter((cycle) => cycle.status === statusFilter);
  }, [payCycles, statusFilter]);

  // Extract IDs of visible cycles for data aggregation.
  const visibleCycleIds = useMemo(() => {
    return filteredPayCycles.map((cycle) => cycle.id);
  }, [filteredPayCycles]);

  // Build category totals for selected cycles (used in charts)
  const rawCategoryChartData = useMemo(() => {
    return getCategoryTotalsByCycleIds(visibleCycleIds).map((item) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      rawCategory: item.category,
      value: Number(item.total || 0),
    }));
  }, [visibleCycleIds]);

  // Extract available categories for filter buttons
  const categoryOptions = useMemo(() => {
    return rawCategoryChartData.map((item) => item.rawCategory);
  }, [rawCategoryChartData]);

  // Calculate total income, expenses, savings, and cycle count
  const reportSummary = useMemo(() => {
    const totalIncome = filteredPayCycles.reduce((total, cycle) => {
      return total + Number(cycle.salaryAmount || 0);
    }, 0);

    const totalExpenses = filteredPayCycles.reduce((total, cycle) => {
      return total + getTotalSpentByCycleId(cycle.id);
    }, 0);

    const totalSavings = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      totalCycles: filteredPayCycles.length,
    };
  }, [filteredPayCycles]);

  // Prepare data for cycle comparison chart (salary vs expenses vs savings)
  const chartData = useMemo(() => {
    return filteredPayCycles.map((cycle, index) => {
      const expenses = getTotalSpentByCycleId(cycle.id);
      const savings = Number(cycle.salaryAmount || 0) - Number(expenses || 0);

      return {
        name: `Cycle ${index + 1}`,
        salary: Number(cycle.salaryAmount || 0),
        expenses: Number(expenses || 0),
        savings: Number(savings || 0),
      };
    });
  }, [filteredPayCycles]);

  // Filter category data based on selection and group remaining as "Other"
  const categoryChartData = useMemo(() => {
    if (selectedCategories.length === 0) {
      return rawCategoryChartData;
    }

    const selectedItems = rawCategoryChartData.filter((item) =>
      selectedCategories.includes(item.rawCategory),
    );

    const otherTotal = rawCategoryChartData
      .filter((item) => !selectedCategories.includes(item.rawCategory))
      .reduce((total, item) => total + item.value, 0);

    if (otherTotal > 0) {
      return [
        ...selectedItems,
        {
          name: "Other Categories",
          rawCategory: "other-categories",
          value: otherTotal,
        },
      ];
    }

    return selectedItems;
  }, [rawCategoryChartData, selectedCategories]);

  // Add or remove category from selected filters
  const handleToggleCategory = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      }

      return [...prev, category];
    });
  };
  // Add or remove category from selected filters
  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  // Generate and export full financial report as Excel file
  const handleExportExcel = async () => {
    if (filteredPayCycles.length === 0) {
      alert("No data available to export.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "My Finance App";
    workbook.created = new Date();

    // Creates workbook sheets.
    const summarySheet = workbook.addWorksheet("Summary");
    const cyclesSheet = workbook.addWorksheet("Cycle Breakdown");
    const categoriesSheet = workbook.addWorksheet("Categories");
    const expensesSheet = workbook.addWorksheet("Expenses Detail");

    // Excel styling helpers (colors, fonts, borders)
    const primaryFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" },
    };

    const lightFill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFF6FF" },
    };

    const headerFont = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    const titleFont = {
      bold: true,
      size: 18,
      color: { argb: "FF111827" },
    };

    const borderStyle = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } },
    };

    // Apply currency format to Excel cells
    const formatMoneyCell = (cell) => {
      cell.numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00';
    };

    // Apply consistent header style to Excel rows
    const applyHeaderStyle = (row) => {
      row.eachCell((cell) => {
        cell.fill = primaryFill;
        cell.font = headerFont;
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = borderStyle;
      });
    };

    // Build summary sheet with total income, expenses, savings, and cycle count
    summarySheet.mergeCells("A1:D1");
    summarySheet.getCell("A1").value = "Finance Report Summary";
    summarySheet.getCell("A1").font = titleFont;
    summarySheet.getCell("A1").alignment = { horizontal: "center" };

    summarySheet.addRow([]);
    summarySheet.addRow(["Metric", "Value"]);
    applyHeaderStyle(summarySheet.getRow(3));

    const summaryRows = [
      ["Total Income", reportSummary.totalIncome],
      ["Total Expenses", reportSummary.totalExpenses],
      ["Total Savings", reportSummary.totalSavings],
      ["Visible Pay Cycles", reportSummary.totalCycles],
    ];

    summaryRows.forEach((row) => {
      const addedRow = summarySheet.addRow(row);
      addedRow.eachCell((cell) => {
        cell.border = borderStyle;
        cell.alignment = { vertical: "middle" };
      });

      if (typeof row[1] === "number" && row[0] !== "Visible Pay Cycles") {
        formatMoneyCell(addedRow.getCell(2));
      }

      if (row[0] === "Total Savings" && row[1] < 0) {
        addedRow.getCell(2).font = {
          bold: true,
          color: { argb: "FFDC2626" },
        };
      }
    });

    summarySheet.columns = [
      { width: 24 },
      { width: 18 },
      { width: 16 },
      { width: 16 },
    ];

    // Build cycle breakdown sheet with detailed financial data per cycle
    cyclesSheet.mergeCells("A1:H1");
    cyclesSheet.getCell("A1").value = "Cycle Breakdown";
    cyclesSheet.getCell("A1").font = titleFont;
    cyclesSheet.getCell("A1").alignment = { horizontal: "center" };

    cyclesSheet.addRow([]);
    cyclesSheet.addRow([
      "Cycle",
      "Status",
      "Start Date",
      "End Date",
      "Salary",
      "Expenses",
      "Savings",
      "Expenses Count",
    ]);

    applyHeaderStyle(cyclesSheet.getRow(3));

    filteredPayCycles.forEach((cycle, index) => {
      const totalSpent = getTotalSpentByCycleId(cycle.id);
      const expenseCount = getExpenseCountByCycleId(cycle.id);
      const savings = Number(cycle.salaryAmount || 0) - Number(totalSpent || 0);

      const row = cyclesSheet.addRow([
        `${formatFrequency(cycle.paymentFrequency)} Cycle ${index + 1}`,
        cycle.status === "active" ? "Active" : "Closed",
        formatDate(cycle.startDate),
        formatDate(cycle.endDate),
        Number(cycle.salaryAmount || 0),
        Number(totalSpent || 0),
        Number(savings || 0),
        expenseCount,
      ]);

      row.eachCell((cell) => {
        cell.border = borderStyle;
        cell.alignment = { vertical: "middle" };
      });

      formatMoneyCell(row.getCell(5));
      formatMoneyCell(row.getCell(6));
      formatMoneyCell(row.getCell(7));

      if (cycle.status === "active") {
        row.getCell(2).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD1FAE5" },
        };
        row.getCell(2).font = {
          bold: true,
          color: { argb: "FF047857" },
        };
      }

      if (savings < 0) {
        row.getCell(7).font = {
          bold: true,
          color: { argb: "FFDC2626" },
        };
      }
    });

    cyclesSheet.columns = [
      { width: 24 },
      { width: 14 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 18 },
    ];

    // Build category summary with totals and percentage distribution
    categoriesSheet.mergeCells("A1:C1");
    categoriesSheet.getCell("A1").value = "Expenses by Category";
    categoriesSheet.getCell("A1").font = titleFont;
    categoriesSheet.getCell("A1").alignment = { horizontal: "center" };

    categoriesSheet.addRow([]);
    categoriesSheet.addRow(["Category", "Amount", "Percentage"]);
    applyHeaderStyle(categoriesSheet.getRow(3));

    const totalCategoryAmount = categoryChartData.reduce(
      (total, item) => total + Number(item.value || 0),
      0,
    );

    categoryChartData.forEach((item) => {
      const percentage =
        totalCategoryAmount > 0
          ? Number(item.value || 0) / totalCategoryAmount
          : 0;

      const row = categoriesSheet.addRow([
        item.name,
        Number(item.value || 0),
        percentage,
      ]);

      row.eachCell((cell) => {
        cell.border = borderStyle;
        cell.alignment = { vertical: "middle" };
      });

      formatMoneyCell(row.getCell(2));
      row.getCell(3).numFmt = "0.00%";
    });

    categoriesSheet.columns = [{ width: 24 }, { width: 18 }, { width: 16 }];

    [summarySheet, cyclesSheet, categoriesSheet, expensesSheet].forEach(
      (sheet) => {
        sheet.views = [{ state: "frozen", ySplit: 3 }];

        sheet.eachRow((row, rowNumber) => {
          row.height = rowNumber === 1 ? 26 : 22;
        });

        sheet.getRow(3).height = 24;
      },
    );

    // Build detailed expenses sheet including cycle and category info
    const visibleCycleIdsSet = new Set(visibleCycleIds);

    const expensesDetailData = getExpensesWithCycleInfo().filter((expense) =>
      visibleCycleIdsSet.has(expense.cycleId),
    );

    expensesSheet.mergeCells("A2:H2");
    expensesSheet.getCell("A2").value = "Expenses Detail";
    expensesSheet.getCell("A2").font = titleFont;
    expensesSheet.getCell("A2").alignment = { horizontal: "center" };

    // Add spacing row before the table header
    expensesSheet.addRow([]);

    // Create and style the expenses detail header row
    const expensesHeaderRow = expensesSheet.addRow([
      "Expense",
      "Category",
      "Amount",
      "Date",
      "Cycle Status",
      "Cycle Frequency",
      "Cycle Start Date",
      "Cycle End Date",
    ]);

    applyHeaderStyle(expensesHeaderRow);

    expensesDetailData.forEach((expense) => {
      const row = expensesSheet.addRow([
        expense.name,
        expense.category
          ? expense.category.charAt(0).toUpperCase() + expense.category.slice(1)
          : "Other",
        Number(expense.amount || 0),
        formatDate(expense.createdAt),
        expense.cycleStatus === "active" ? "Active" : "Closed",
        formatFrequency(expense.cycleFrequency),
        formatDate(expense.cycleStartDate),
        formatDate(expense.cycleEndDate),
      ]);

      row.eachCell((cell) => {
        cell.border = borderStyle;
        cell.alignment = { vertical: "middle" };
      });

      formatMoneyCell(row.getCell(3));

      if (expense.cycleStatus === "active") {
        row.getCell(5).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD1FAE5" },
        };
        row.getCell(5).font = {
          bold: true,
          color: { argb: "FF047857" },
        };
      }
    });

    expensesSheet.columns = [
      { width: 24 },
      { width: 18 },
      { width: 16 },
      { width: 18 },
      { width: 16 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    // Generate Excel file and trigger download in browser
    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `finance-report-${new Date().toISOString().split("T")[0]}.xlsx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };;

  // Format values as NZD currency
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency: "NZD",
    }).format(Number(value || 0));

  // Format date values for display
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

  // Formats cycle frequency text.
  const formatFrequency = (frequency) => {
    if (!frequency) return "Cycle";
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  return (
    <section className="container-fluid py-3 px-2 px-md-3">
      <div className="mb-3 mb-md-4">
        <h2 className="fw-bold text-dark mb-1">Reports</h2>
        <p className="text-muted small mb-0">
          Financial overview across all pay cycles
        </p>
      </div>
      {/* Report filters and export actions */}
      <div className="row justify-content-center mb-3 mb-md-4">
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-3 p-md-4">
              <div className="d-flex flex-column gap-4">
                <div className="row justify-content-center">
                  <div className="col-12 col-lg-8">
                    <label className="form-label small fw-semibold text-secondary mb-2 d-block text-center text-lg-start">
                      Filter by Cycle Status
                    </label>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="form-select rounded-4 py-2">
                      <option value="all">All Cycles</option>
                      <option value="active">Active Only</option>
                      <option value="closed">Closed Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <label className="small fw-semibold text-secondary mb-0">
                      Filter Categories
                    </label>

                    <button
                      type="button"
                      onClick={handleClearCategories}
                      className="btn btn-outline-secondary btn-sm rounded-3">
                      Clear Selection
                    </button>
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="btn btn-primary btn-sm rounded-3">
                      Export CSV
                    </button>
                  </div>

                  {categoryOptions.length === 0 ? (
                    <p className="text-muted small mb-0">
                      No categories available.
                    </p>
                  ) : (
                    <div className="row g-2 justify-content-center">
                      {categoryOptions.map((category) => {
                        const isSelected =
                          selectedCategories.includes(category);

                        return (
                          <div key={category} className="col-6 col-md-4">
                            <button
                              type="button"
                              onClick={() => handleToggleCategory(category)}
                              className={`btn w-100 rounded-4 py-2 fw-medium ${
                                isSelected
                                  ? "btn-primary"
                                  : "btn-light border text-secondary"
                              }`}>
                              {category.charAt(0).toUpperCase() +
                                category.slice(1)}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*// Small card to display cycle metrics */}
      <div className="d-none d-md-block">
        <div className="row g-3 mb-3 mb-md-4">
          <div className="col-12 col-md-6 col-xl-3">
            <SummaryCard
              title="Total Income"
              value={formatCurrency(reportSummary.totalIncome)}
              subtitle="Across visible pay cycles"
            />
          </div>

          <div className="col-12 col-md-6 col-xl-3">
            <SummaryCard
              title="Total Expenses"
              value={formatCurrency(reportSummary.totalExpenses)}
              subtitle="Across visible pay cycles"
            />
          </div>

          <div className="col-12 col-md-6 col-xl-3">
            <SummaryCard
              title="Total Savings"
              value={formatCurrency(reportSummary.totalSavings)}
              subtitle="Income minus expenses"
            />
          </div>

          <div className="col-12 col-md-6 col-xl-3">
            <SummaryCard
              title="Pay Cycles"
              value={String(reportSummary.totalCycles)}
              subtitle="Visible cycles"
            />
          </div>
        </div>
      </div>
      {/* Row for displaying summary data in mobile layout*/}
      <div className="d-block d-md-none mb-3">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-3">
            <div className="d-flex flex-column gap-2">
              <MobileSummaryRow
                label="Total Income"
                value={formatCurrency(reportSummary.totalIncome)}
              />
              <MobileSummaryRow
                label="Total Expenses"
                value={formatCurrency(reportSummary.totalExpenses)}
              />
              <MobileSummaryRow
                label="Total Savings"
                value={formatCurrency(reportSummary.totalSavings)}
              />
              <MobileSummaryRow
                label="Pay Cycles"
                value={String(reportSummary.totalCycles)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Desktop charts and cycle breakdown */}
      <div className="d-none d-md-block">
        <div className="card border-0 shadow-sm rounded-4 mb-3 mb-md-4">
          <div className="card-body p-3 p-md-4">
            <div className="mb-3">
              <h3 className="h5 fw-bold text-dark mb-1">
                Cycle Comparison Chart
              </h3>
              <p className="text-muted small mb-0">
                Salary, expenses, and savings by pay cycle
              </p>
            </div>

            {chartData.length === 0 ? (
              <p className="text-muted small mb-0">
                No chart data available for this filter.
              </p>
            ) : (
              <div style={{ width: "100%", height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="salary"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      fill="#dc2626"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="savings"
                      fill="#16a34a"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-3 mb-md-4">
          <div className="card-body p-3 p-md-4">
            <div className="mb-3">
              <h3 className="h5 fw-bold text-dark mb-1">
                Expenses by Category
              </h3>
              <p className="text-muted small mb-0">
                Distribution of expenses across visible cycles
              </p>
            </div>

            {categoryChartData.length === 0 ? (
              <p className="text-muted small mb-0">
                No category data available for this filter.
              </p>
            ) : (
              <div className="row g-4 align-items-start">
                <div className="col-12 col-xl-6">
                  <div style={{ width: "100%", height: 330 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          label>
                          {categoryChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-12 col-xl-6">
                  <div className="d-flex flex-column gap-2">
                    {categoryChartData.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="border rounded-4 px-3 py-2 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="d-inline-block rounded-circle"
                            style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor:
                                CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                            }}
                          />
                          <span className="fw-medium text-dark">
                            {item.name}
                          </span>
                        </div>

                        <span className="fw-semibold text-dark">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-3 p-md-4">
            <div className="mb-3">
              <h3 className="h5 fw-bold text-dark mb-1">Cycle Breakdown</h3>
              <p className="text-muted small mb-0">
                Detailed summary of each visible pay cycle
              </p>
            </div>

            {filteredPayCycles.length === 0 ? (
              <p className="text-muted small mb-0">
                No pay cycles found for this filter.
              </p>
            ) : (
              <div className="row g-3">
                {filteredPayCycles.map((cycle) => {
                  const totalSpent = getTotalSpentByCycleId(cycle.id);
                  const expenseCount = getExpenseCountByCycleId(cycle.id);
                  const savings = Number(cycle.salaryAmount) - totalSpent;

                  return (
                    <div key={cycle.id} className="col-12 col-md-6 col-xl-4">
                      <div className="card border rounded-4 h-100">
                        <div className="card-body p-3">
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

                          <div className="row g-2">
                            <div className="col-6">
                              <InfoMiniCard
                                label="Salary"
                                value={formatCurrency(cycle.salaryAmount)}
                              />
                            </div>

                            <div className="col-6">
                              <InfoMiniCard
                                label="Expenses"
                                value={formatCurrency(totalSpent)}
                              />
                            </div>

                            <div className="col-6">
                              <InfoMiniCard
                                label="Savings"
                                value={formatCurrency(savings)}
                              />
                            </div>

                            <div className="col-6">
                              <InfoMiniCard
                                label="Expenses Count"
                                value={String(expenseCount)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile accordion reports */}
      <div className="d-block d-md-none">
        <div className="accordion" id="reportsMobileAccordion">
          <div className="accordion-item border rounded-4 overflow-hidden mb-2">
            <h2 className="accordion-header" id="headingChart">
              <button
                className="accordion-button collapsed fw-semibold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseChart"
                aria-expanded="false"
                aria-controls="collapseChart">
                Cycle Comparison Chart
              </button>
            </h2>
            <div
              id="collapseChart"
              className="accordion-collapse collapse"
              aria-labelledby="headingChart"
              data-bs-parent="#reportsMobileAccordion">
              <div className="accordion-body p-2">
                {chartData.length === 0 ? (
                  <p className="text-muted small mb-0">
                    No chart data available for this filter.
                  </p>
                ) : (
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="salary"
                          fill="#2563eb"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          fill="#dc2626"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="savings"
                          fill="#16a34a"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item border rounded-4 overflow-hidden mb-2">
            <h2 className="accordion-header" id="headingCategoryChart">
              <button
                className="accordion-button collapsed fw-semibold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseCategoryChart"
                aria-expanded="false"
                aria-controls="collapseCategoryChart">
                Expenses by Category
              </button>
            </h2>
            <div
              id="collapseCategoryChart"
              className="accordion-collapse collapse"
              aria-labelledby="headingCategoryChart"
              data-bs-parent="#reportsMobileAccordion">
              <div className="accordion-body p-2">
                {categoryChartData.length === 0 ? (
                  <p className="text-muted small mb-0">
                    No category data available for this filter.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    <div style={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            label>
                            {categoryChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  CATEGORY_COLORS[
                                    index % CATEGORY_COLORS.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="d-flex flex-column gap-2">
                      {categoryChartData.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="border rounded-4 px-3 py-2 d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="d-inline-block rounded-circle"
                              style={{
                                width: "12px",
                                height: "12px",
                                backgroundColor:
                                  CATEGORY_COLORS[
                                    index % CATEGORY_COLORS.length
                                  ],
                              }}
                            />
                            <span className="small fw-medium text-dark">
                              {item.name}
                            </span>
                          </div>

                          <span className="small fw-semibold text-dark">
                            {formatCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="accordion-item border rounded-4 overflow-hidden">
            <h2 className="accordion-header" id="headingBreakdown">
              <button
                className="accordion-button collapsed fw-semibold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapseBreakdown"
                aria-expanded="false"
                aria-controls="collapseBreakdown">
                Cycle Breakdown
              </button>
            </h2>
            <div
              id="collapseBreakdown"
              className="accordion-collapse collapse"
              aria-labelledby="headingBreakdown"
              data-bs-parent="#reportsMobileAccordion">
              <div className="accordion-body p-2">
                {filteredPayCycles.length === 0 ? (
                  <p className="text-muted small mb-0">
                    No pay cycles found for this filter.
                  </p>
                ) : (
                  <div className="accordion" id="cycleBreakdownAccordion">
                    {filteredPayCycles.map((cycle, index) => {
                      const totalSpent = getTotalSpentByCycleId(cycle.id);
                      const expenseCount = getExpenseCountByCycleId(cycle.id);
                      const savings = Number(cycle.salaryAmount) - totalSpent;
                      const headingId = `cycle-heading-${cycle.id}`;
                      const collapseId = `cycle-collapse-${cycle.id}`;

                      return (
                        <div
                          key={cycle.id}
                          className="accordion-item border rounded-4 overflow-hidden mb-2">
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
                                    {formatFrequency(cycle.paymentFrequency)}{" "}
                                    Cycle
                                  </span>

                                  <span
                                    className={`badge rounded-pill ${
                                      cycle.status === "active"
                                        ? "text-bg-success"
                                        : "text-bg-light text-secondary"
                                    }`}>
                                    {cycle.status === "active"
                                      ? "Active"
                                      : "Closed"}
                                  </span>
                                </div>

                                <small className="text-muted mt-1">
                                  {formatDate(cycle.startDate)} -{" "}
                                  {formatDate(cycle.endDate)}
                                </small>
                              </div>
                            </button>
                          </h2>

                          <div
                            id={collapseId}
                            className={`accordion-collapse collapse ${
                              index === 0 ? "show" : ""
                            }`}
                            aria-labelledby={headingId}
                            data-bs-parent="#cycleBreakdownAccordion">
                            <div className="accordion-body p-2">
                              <div className="d-flex flex-column gap-2">
                                <CompactInfoRow
                                  label="Salary"
                                  value={formatCurrency(cycle.salaryAmount)}
                                />
                                <CompactInfoRow
                                  label="Expenses"
                                  value={formatCurrency(totalSpent)}
                                />
                                <CompactInfoRow
                                  label="Savings"
                                  value={formatCurrency(savings)}
                                />
                                <CompactInfoRow
                                  label="Expenses Count"
                                  value={String(expenseCount)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
// Small reusable card for cycle metrics.
function InfoMiniCard({ label, value }) {
  return (
    <div className="bg-light rounded-4 p-3 h-100">
      <p className="text-muted small mb-1">{label}</p>
      <p className="fw-semibold text-dark mb-0">{value}</p>
    </div>
  );
}
// Compact row used inside mobile accordions.
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
// Mobile summary row for report totals.
function MobileSummaryRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between align-items-center gap-3 border rounded-4 px-3 py-2">
      <p className="text-muted small fw-medium mb-0">{label}</p>
      <p className="fw-bold text-dark mb-0">{value}</p>
    </div>
  );
}

export default Reports;
