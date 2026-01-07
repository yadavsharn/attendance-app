import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day';
  confidence_score: number | null;
}

export default function AttendanceHistory() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0,
  });

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth, user]);

  const fetchAttendance = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      // Get employee ID first
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false });

      if (error) throw error;

      const records = (data || []).map(r => ({
        ...r,
        status: r.status as 'present' | 'absent' | 'late' | 'half_day',
      }));

      setAttendance(records);

      // Calculate stats
      const presentCount = records.filter(r => r.status === 'present').length;
      const lateCount = records.filter(r => r.status === 'late').length;
      const absentCount = records.filter(r => r.status === 'absent').length;
      const totalWorkDays = records.length || 1;
      const attendancePercentage = Math.round(((presentCount + lateCount) / totalWorkDays) * 100);

      setStats({
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        percentage: attendancePercentage,
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getAttendanceForDay = (day: Date) => {
    return attendance.find(a => isSameDay(new Date(a.date), day));
  };

  const getDayStatusColor = (day: Date) => {
    const record = getAttendanceForDay(day);
    if (!record) return 'bg-muted';
    
    switch (record.status) {
      case 'present':
        return 'bg-success text-success-foreground';
      case 'late':
        return 'bg-warning text-warning-foreground';
      case 'absent':
        return 'bg-destructive text-destructive-foreground';
      case 'half_day':
        return 'bg-info text-info-foreground';
      default:
        return 'bg-muted';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground mt-1">View your attendance history and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Present Days</p>
                  <p className="text-3xl font-bold text-success">{stats.present}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-success/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Late Days</p>
                  <p className="text-3xl font-bold text-warning">{stats.late}</p>
                </div>
                <Clock className="w-8 h-8 text-warning/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Absent Days</p>
                  <p className="text-3xl font-bold text-destructive">{stats.absent}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attendance %</p>
                  <p className="text-3xl font-bold text-primary">{stats.percentage}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attendance Calendar</CardTitle>
                <CardDescription>{format(currentMonth, 'MMMM yyyy')}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Add empty cells for days before the month starts */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {monthDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${getDayStatusColor(day)}`}
                >
                  {format(day, 'd')}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success" />
                <span className="text-sm text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning" />
                <span className="text-sm text-muted-foreground">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive" />
                <span className="text-sm text-muted-foreground">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted" />
                <span className="text-sm text-muted-foreground">No Record</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Records */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Records</CardTitle>
            <CardDescription>All attendance entries for {format(currentMonth, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : attendance.length > 0 ? (
              <div className="space-y-3">
                {attendance.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {format(new Date(record.date), 'EEEE, MMMM d')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Check-in: {record.check_in_time 
                          ? format(new Date(record.check_in_time), 'h:mm a')
                          : 'N/A'
                        }
                        {record.check_out_time && (
                          <> • Check-out: {format(new Date(record.check_out_time), 'h:mm a')}</>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No attendance records for this month</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
