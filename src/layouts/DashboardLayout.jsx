import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ sidebarItems, sidebarTitle, children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="dashboard-layout container">
        {sidebarItems && <Sidebar items={sidebarItems} title={sidebarTitle} />}
        <main className="dashboard-layout__main page-content">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
