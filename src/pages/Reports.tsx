import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { FileBarChart, Download, Users, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function Reports() {
    const { isAdmin } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/attendance/stats`);
            const data = await response.json();
            if (data.success) {
                setStats(data);
            }
        } catch (e) {
            console.error('Reports fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type: string) => {
        // Placeholder for export functionality
        alert(`Exporting ${type} report... (Feature coming soon)`);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Reports</h1>
                    <p className="text-muted-foreground mt-1">View and export attendance reports</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Employee Report
                            </CardTitle>
                            <CardDescription>Overview of employee status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-2">{stats?.totalEmployees || 0}</div>
                            <Button variant="outline" size="sm" onClick={() => handleExport('employees')}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarCheck className="w-5 h-5 text-success" />
                                Daily Attendance
                            </CardTitle>
                            <CardDescription>Today's attendance summary</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-2">{stats?.presentToday || 0} Present</div>
                            <Button variant="outline" size="sm" onClick={() => handleExport('attendance')}>
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
