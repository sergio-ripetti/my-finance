import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function Layout() {
  return (
    // Main app structure with sidebar and page content.
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">
        {/* Responsive container for all page views */}
        <div className="container-fluid py-4 px-3 px-md-4 px-lg-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;