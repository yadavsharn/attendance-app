import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          "ml-64" // Default sidebar width, will be handled by sidebar state
        )}
      >
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
