import { useState, useEffect } from 'react';
import { WebcamCapture } from '@/components/attendance/WebcamCapture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScanFace, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'idle' | 'success' | 'error';

export default function PublicAttendance() {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<AttendanceStatus>('idle');
    const [message, setMessage] = useState('');
    const [lastMarkedName, setLastMarkedName] = useState<string | null>(null);

    // Default to online to bypass checking
    // const [serviceStatus, setServiceStatus] = useState<'online' | 'offline' | 'checking'>('online');

    const handleCapture = async (imageData: string) => {
        setIsProcessing(true);
        setStatus('idle');
        setMessage('');

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/mark-attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'API request failed');

            if (data.success) {
                setStatus('success');
                setMessage(data.message || 'Attendance marked successfully!');
                setLastMarkedName(data.employeeName);
                toast({
                    title: 'Attendance Marked',
                    description: `Welcome, ${data.employeeName}! Check-in recorded at ${format(new Date(), 'h:mm a')}.`,
                });

                // Clear success message after 5 seconds to be ready for next person
                setTimeout(() => {
                    setStatus('idle');
                    setMessage('');
                    setLastMarkedName(null);
                }, 5000);

            } else {
                setStatus('error');
                setMessage(data.message || 'Face not recognized');
                // Clear error faster
                setTimeout(() => {
                    setStatus('idle');
                    setMessage('');
                }, 3000);
            }
        } catch (error: any) {
            console.error('Attendance error:', error);
            setStatus('error');
            setMessage('System error. Please try again.');
            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full space-y-8">

                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Attendance Kiosk</h1>
                    <p className="text-xl text-muted-foreground">
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-2xl font-mono mt-4">
                        <Clock className="w-6 h-6" />
                        {format(new Date(), 'h:mm:ss a')}
                    </div>
                </div>

                {lastMarkedName ? (
                    <Card className="border-success/50 bg-success/10 animate-in fade-in zoom-in duration-500">
                        <CardContent className="pt-6 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6">
                                <CheckCircle className="w-12 h-12 text-success" />
                            </div>
                            <h2 className="text-3xl font-bold text-success mb-2">Welcome!</h2>
                            <h3 className="text-2xl font-semibold text-foreground">{lastMarkedName}</h3>
                            <p className="text-muted-foreground mt-4">Safe Travels!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="md:col-span-2 overflow-hidden border-primary/20 shadow-xl">
                            <CardHeader className="text-center bg-muted/50 pb-8">
                                <div className="mx-auto w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm mb-4">
                                    <ScanFace className="w-8 h-8 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">Face Recognition</CardTitle>
                                <CardDescription className="text-lg">
                                    Look at the camera to mark attendance
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-6 bg-black/5">
                                    <WebcamCapture
                                        onCapture={handleCapture}
                                        isProcessing={isProcessing}
                                        status={status}
                                        message={message}
                                        autoCapture={true}
                                        interval={2000}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardContent className="pt-6 flex justify-around text-center text-sm text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">1</span>
                                    <span>Good Lighting</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">2</span>
                                    <span>Face in Frame</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">3</span>
                                    <span>Auto-Scan</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
