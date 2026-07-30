import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Close menu when Escape is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleBackdropClick = () => {
    setIsMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Desktop sidebar navigation - unchanged */}
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

      {/* Mobile/Tablet header with hamburger button */}
      <div className="mobile-header d-lg-none">
        <button
          className="hamburger-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="mobile-header-brand">
          <h1>My Finance</h1>
        </div>
      </div>

      {/* Off-canvas backdrop */}
      {isMenuOpen && (
        <div
          className="offcanvas-backdrop"
          onClick={handleBackdropClick}
          role="presentation"
        />
      )}

      {/* Off-canvas mobile menu */}
      <div
        id="mobile-menu"
        className={`offcanvas-menu ${isMenuOpen ? "open" : ""}`}
        aria-hidden={!isMenuOpen}>
        <div className="offcanvas-header">
          <div className="offcanvas-brand">
            <h1>My Finance</h1>
            <p>Personal finance dashboard</p>
          </div>
          <button
            className="close-btn"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close navigation menu">
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Off-canvas navigation */}
        <nav className="offcanvas-nav">
          <NavLink
            to="/"
            end
            className="offcanvas-link"
            onClick={handleLinkClick}>
            Dashboard
          </NavLink>

          <NavLink
            to="/expenses"
            className="offcanvas-link"
            onClick={handleLinkClick}>
            Expenses
          </NavLink>

          <NavLink
            to="/pay-cycles"
            className="offcanvas-link"
            onClick={handleLinkClick}>
            Pay Cycles
          </NavLink>

          <NavLink
            to="/reports"
            className="offcanvas-link"
            onClick={handleLinkClick}>
            Reports
          </NavLink>
        </nav>

        {/* Off-canvas quick action */}
        <div className="offcanvas-action">
          <NavLink
            to="/add-expense"
            className="offcanvas-add-btn"
            onClick={handleLinkClick}>
            + Add Expense
          </NavLink>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
