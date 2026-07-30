// Excel report export utilities for financial data

import ExcelJS from "exceljs";
import { formatDate, formatFrequency } from "./formatters";

// Excel styling constants
const EXCEL_STYLES = {
  primaryFill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" },
  },
  headerFont: {
    bold: true,
    color: { argb: "FFFFFFFF" },
  },
  titleFont: {
    bold: true,
    size: 18,
    color: { argb: "FF111827" },
  },
  borderStyle: {
    top: { style: "thin", color: { argb: "FFE5E7EB" } },
    left: { style: "thin", color: { argb: "FFE5E7EB" } },
    bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    right: { style: "thin", color: { argb: "FFE5E7EB" } },
  },
  activeFill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD1FAE5" },
  },
  activeFont: {
    bold: true,
    color: { argb: "FF047857" },
  },
  negativeFont: {
    bold: true,
    color: { argb: "FFDC2626" },
  },
};

// Helper function to format currency in Excel cells
const formatMoneyCell = (cell) => {
  cell.numFmt = '"$"#,##0.00;[Red]-"$"#,##0.00';
};

// Helper function to apply consistent header style to Excel rows
const applyHeaderStyle = (row) => {
  row.eachCell((cell) => {
    cell.fill = EXCEL_STYLES.primaryFill;
    cell.font = EXCEL_STYLES.headerFont;
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = EXCEL_STYLES.borderStyle;
  });
};

// Add summary sheet with totals
const buildSummarySheet = (summarySheet, reportSummary) => {
  summarySheet.mergeCells("A1:D1");
  summarySheet.getCell("A1").value = "Finance Report Summary";
  summarySheet.getCell("A1").font = EXCEL_STYLES.titleFont;
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
      cell.border = EXCEL_STYLES.borderStyle;
      cell.alignment = { vertical: "middle" };
    });

    if (typeof row[1] === "number" && row[0] !== "Visible Pay Cycles") {
      formatMoneyCell(addedRow.getCell(2));
    }

    if (row[0] === "Total Savings" && row[1] < 0) {
      addedRow.getCell(2).font = EXCEL_STYLES.negativeFont;
    }
  });

  summarySheet.columns = [
    { width: 24 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
  ];
};

// Add cycle breakdown sheet with per-cycle data
const buildCyclesSheet = (
  cyclesSheet,
  filteredPayCycles,
  getTotalSpentByCycleId,
  getExpenseCountByCycleId
) => {
  cyclesSheet.mergeCells("A1:H1");
  cyclesSheet.getCell("A1").value = "Cycle Breakdown";
  cyclesSheet.getCell("A1").font = EXCEL_STYLES.titleFont;
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
      cell.border = EXCEL_STYLES.borderStyle;
      cell.alignment = { vertical: "middle" };
    });

    formatMoneyCell(row.getCell(5));
    formatMoneyCell(row.getCell(6));
    formatMoneyCell(row.getCell(7));

    if (cycle.status === "active") {
      row.getCell(2).fill = EXCEL_STYLES.activeFill;
      row.getCell(2).font = EXCEL_STYLES.activeFont;
    }

    if (savings < 0) {
      row.getCell(7).font = EXCEL_STYLES.negativeFont;
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
};

// Add category summary sheet
const buildCategoriesSheet = (categoriesSheet, categoryChartData) => {
  categoriesSheet.mergeCells("A1:C1");
  categoriesSheet.getCell("A1").value = "Expenses by Category";
  categoriesSheet.getCell("A1").font = EXCEL_STYLES.titleFont;
  categoriesSheet.getCell("A1").alignment = { horizontal: "center" };

  categoriesSheet.addRow([]);
  categoriesSheet.addRow(["Category", "Amount", "Percentage"]);
  applyHeaderStyle(categoriesSheet.getRow(3));

  const totalCategoryAmount = categoryChartData.reduce(
    (total, item) => total + Number(item.value || 0),
    0
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
      cell.border = EXCEL_STYLES.borderStyle;
      cell.alignment = { vertical: "middle" };
    });

    formatMoneyCell(row.getCell(2));
    row.getCell(3).numFmt = "0.00%";
  });

  categoriesSheet.columns = [{ width: 24 }, { width: 18 }, { width: 16 }];
};

// Add expenses detail sheet with full expense information
const buildExpensesSheet = (expensesSheet, expensesDetailData) => {
  expensesSheet.mergeCells("A2:H2");
  expensesSheet.getCell("A2").value = "Expenses Detail";
  expensesSheet.getCell("A2").font = EXCEL_STYLES.titleFont;
  expensesSheet.getCell("A2").alignment = { horizontal: "center" };

  expensesSheet.addRow([]);

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
      cell.border = EXCEL_STYLES.borderStyle;
      cell.alignment = { vertical: "middle" };
    });

    formatMoneyCell(row.getCell(3));

    if (expense.cycleStatus === "active") {
      row.getCell(5).fill = EXCEL_STYLES.activeFill;
      row.getCell(5).font = EXCEL_STYLES.activeFont;
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
};

// Main export function
export async function generateFinanceReport(
  filteredPayCycles,
  reportSummary,
  categoryChartData,
  expensesDetailData,
  visibleCycleIds,
  getTotalSpentByCycleId,
  getExpenseCountByCycleId
) {
  if (filteredPayCycles.length === 0) {
    throw new Error("No data available to export.");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "My Finance App";
  workbook.created = new Date();

  // Create workbook sheets
  const summarySheet = workbook.addWorksheet("Summary");
  const cyclesSheet = workbook.addWorksheet("Cycle Breakdown");
  const categoriesSheet = workbook.addWorksheet("Categories");
  const expensesSheet = workbook.addWorksheet("Expenses Detail");

  // Build each sheet
  buildSummarySheet(summarySheet, reportSummary);
  buildCyclesSheet(
    cyclesSheet,
    filteredPayCycles,
    getTotalSpentByCycleId,
    getExpenseCountByCycleId
  );
  buildCategoriesSheet(categoriesSheet, categoryChartData);
  buildExpensesSheet(expensesSheet, expensesDetailData);

  // Apply common sheet settings
  [summarySheet, cyclesSheet, categoriesSheet, expensesSheet].forEach(
    (sheet) => {
      sheet.views = [{ state: "frozen", ySplit: 3 }];

      sheet.eachRow((row, rowNumber) => {
        row.height = rowNumber === 1 ? 26 : 22;
      });

      sheet.getRow(3).height = 24;
    }
  );

  // Generate and download Excel file
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
}
