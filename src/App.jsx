// Import Bootstrap styles and scripts for UI components
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Global app styles
import "./App.css";

// React Router for navigation
import { Routes, Route } from "react-router-dom";

// Page and component imports
import AddExpense from "./components/AddExpense";
import Dashboard from "./components/pages/Dashboard";
import Expenses from "./components/pages/Expenses";
import PayCycles from "./components/pages/PayCycles";
import Reports from "./components/pages/Reports";
import Layout from "./components/Layout";

// Main application component
function App() {
  return (
    <>
      {/* Define application routes */}
      <Routes>
        {/* Layout wrapper for all pages */}
        <Route path="/" element={<Layout />}>
          {/* Default route: Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Add expense page */}
          <Route path="/add-expense" element={<AddExpense />} />

          {/* Expenses list page */}
          <Route path="/expenses" element={<Expenses />} />

          {/* Pay cycles management page */}
          <Route path="/pay-cycles" element={<PayCycles />} />

          {/* Reports and analytics page */}
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </>
  );
}

// Export main App component
export default App;
