import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  TrendingUp,
  CalendarDays,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}

interface RecentAttendance {
  id: string;
  employee_name: string;
  check_in_time: string;
  status: 'present' | 'late' | 'absent' | 'half_day';
  confidence_score: number;
}

export default function Dashboard() {
  const { isAdmin, isManager, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTodayStatus, setMyTodayStatus] = useState<'present' | 'absent' | 'late' | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [isAdmin, isManager]);

  const fetchDashboardData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      // Fetch total employees
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch today's attendance
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select(`
          id,
          status,
          check_in_time,
          confidence_score,
          employees (
            id,
            full_name
          )
        `)
        .eq('date', today)
        .order('check_in_time', { ascending: false })
        .limit(10);

      // Calculate stats
      const presentCount = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const lateCount = todayAttendance?.filter(a => a.status === 'late').length || 0;
      const absentCount = (totalEmployees || 0) - presentCount - lateCount;

      setStats({
        totalEmployees: totalEmployees || 0,
        presentToday: presentCount,
        absentToday: absentCount > 0 ? absentCount : 0,
        lateToday: lateCount,
      });

      // Format recent attendance for display
      const formatted = todayAttendance?.map(a => ({
        id: a.id,
        employee_name: (a.employees as any)?.full_name || 'Unknown',
        check_in_time: a.check_in_time || '',
        status: a.status as 'present' | 'late' | 'absent' | 'half_day',
        confidence_score: a.confidence_score || 0,
      })) || [];

      setRecentAttendance(formatted);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const attendancePercentage = stats.totalEmployees > 0 
    ? Math.round(((stats.presentToday + stats.lateToday) / stats.totalEmployees) * 100) 
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Stats Grid */}
        {(isAdmin || isManager) && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              subtitle="Active employees"
              icon={Users}
              variant="default"
            />
            <StatCard
              title="Present Today"
              value={stats.presentToday}
              subtitle={`${attendancePercentage}% attendance`}
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              title="Absent Today"
              value={stats.absentToday}
              subtitle="Not marked yet"
              icon={UserX}
              variant="destructive"
            />
            <StatCard
              title="Late Arrivals"
              value={stats.lateToday}
              subtitle="After grace period"
              icon={Clock}
              variant="warning"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Attendance */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Check-ins
              </CardTitle>
              <CardDescription>Today's attendance activity</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentAttendance.length > 0 ? (
                <div className="space-y-3">
                  {recentAttendance.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {record.employee_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{record.employee_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.check_in_time 
                              ? format(new Date(record.check_in_time), 'h:mm a')
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {(record.confidence_score * 100).toFixed(0)}%
                        </span>
                        <StatusBadge status={record.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No attendance records for today yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Attendance Overview
              </CardTitle>
              <CardDescription>Today's attendance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Attendance Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Attendance</span>
                    <span className="font-semibold">{attendancePercentage}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${attendancePercentage}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-4 rounded-xl bg-success/10">
                    <p className="text-2xl font-bold text-success">{stats.presentToday}</p>
                    <p className="text-xs text-muted-foreground mt-1">Present</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-warning/10">
                    <p className="text-2xl font-bold text-warning">{stats.lateToday}</p>
                    <p className="text-xs text-muted-foreground mt-1">Late</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-destructive/10">
                    <p className="text-2xl font-bold text-destructive">{stats.absentToday}</p>
                    <p className="text-xs text-muted-foreground mt-1">Absent</p>
                  </div>
                </div>

                {/* Current Time */}
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Current Time</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {format(new Date(), 'h:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
