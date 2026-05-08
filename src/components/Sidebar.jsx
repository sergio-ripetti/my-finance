import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <>
      {/* Desktop sidebar navigation */}
      <aside className="sidebar d-none d-lg-flex flex-column">
        <div className="sidebar-header">
          <h1 className="mb-1">My Finance</h1>
          <h4 className="mb-0">Personal finance dashboard</h4>
        </div>

        {/* Main navigation links */}
        <nav className="sidebar-nav d-flex flex-column gap-3">
          <NavLink to="/" end className="sidebar-link">
            Dashboard
          </NavLink>

          <NavLink to="/expenses" className="sidebar-link">
            Expenses
          </NavLink>

          <NavLink to="/pay-cycles" className="sidebar-link">
            Pay Cycles
          </NavLink>

          <NavLink to="/reports" className="sidebar-link">
            Reports
          </NavLink>
        </nav>

        {/* Quick action button */}
        <div className="mobile-action-wrap">
          <NavLink to="/add-expense" className="mobile-add-btn">
            + Add Expense
          </NavLink>
        </div>
      </aside>

      {/* Mobile top navigation */}
      <div className="mobile-topbar d-lg-none">
        <div className="mobile-brand">
          <h1 className="mb-1">My Finance</h1>
          <p className="mb-0">Personal finance dashboard</p>
        </div>

        {/* Mobile navigation grid */}
        <div className="mobile-nav-grid">
          <NavLink to="/" end className="mobile-nav-link">
            Dashboard
          </NavLink>

          <NavLink to="/expenses" className="mobile-nav-link">
            Expenses
          </NavLink>

          <NavLink to="/pay-cycles" className="mobile-nav-link">
            Pay Cycles
          </NavLink>

          <NavLink to="/reports" className="mobile-nav-link">
            Reports
          </NavLink>
        </div>

        {/* Mobile quick action */}
        <div className="mobile-action-wrap">
          <NavLink to="/add-expense" className="mobile-add-btn">
            + Add Expense
          </NavLink>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
