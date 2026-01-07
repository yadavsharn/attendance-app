import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Camera, 
  CalendarDays, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ScanFace,
  FileBarChart,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('admin' | 'manager' | 'employee')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Mark Attendance', href: '/attendance/mark', icon: Camera },
  { label: 'My Attendance', href: '/attendance/history', icon: CalendarDays },
  { label: 'Employees', href: '/employees', icon: Users, roles: ['admin', 'manager'] },
  { label: 'Reports', href: '/reports', icon: FileBarChart, roles: ['admin', 'manager'] },
  { label: 'Departments', href: '/departments', icon: Building2, roles: ['admin'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, isAdmin, isManager, user } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    if (isAdmin && item.roles.includes('admin')) return true;
    if (isManager && item.roles.includes('manager')) return true;
    return item.roles.includes('employee');
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <ScanFace className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">FaceTrack</h1>
              <p className="text-xs text-sidebar-foreground/60">Attendance System</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center mx-auto">
            <ScanFace className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "sidebar-nav-item",
                isActive && "active",
                collapsed && "justify-center px-2"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user.email}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {isAdmin ? 'Administrator' : isManager ? 'Manager' : 'Employee'}
            </p>
          </div>
        )}
        
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
};
