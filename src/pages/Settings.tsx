import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react';

export default function Settings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        work_start_time: '09:00',
        late_threshold_minutes: '15',
        confidence_threshold: '0.5'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/settings`);
            const result = await response.json();
            if (result.success) {
                setSettings(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast({ title: 'Error', description: 'Could not load settings', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const result = await response.json();

            if (result.success) {
                toast({ title: 'Success', description: 'Settings saved successfully' });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to save settings', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure system parameters</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SettingsIcon className="w-5 h-5" />
                            Attendance Configuration
                        </CardTitle>
                        <CardDescription>
                            Manage work timings and detection sensitivity
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading settings...</div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="work_start_time">Work Start Time</Label>
                                    <Input
                                        id="work_start_time"
                                        type="time"
                                        value={settings.work_start_time}
                                        onChange={(e) => setSettings({ ...settings, work_start_time: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Employees checking in after this time + threshold will be marked late.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="late_threshold_minutes">Late Threshold (Minutes)</Label>
                                    <Input
                                        id="late_threshold_minutes"
                                        type="number"
                                        min="0"
                                        value={settings.late_threshold_minutes}
                                        onChange={(e) => setSettings({ ...settings, late_threshold_minutes: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Grace period in minutes before marking 'Late'.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confidence_threshold">Face Recognition Confidence (0.0 - 1.0)</Label>
                                    <Input
                                        id="confidence_threshold"
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={settings.confidence_threshold}
                                        onChange={(e) => setSettings({ ...settings, confidence_threshold: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Minimum confidence score required to recognize a face (Default: 0.5).
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
