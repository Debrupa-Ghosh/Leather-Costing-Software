import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebar } from '../../contexts/SidebarContext';

export default function AppLayout({ children, title = 'Dashboard' }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ marginLeft: isCollapsed ? '72px' : '260px', transition: 'margin-left 0.3s ease' }}>
        <Navbar title={title} />
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
