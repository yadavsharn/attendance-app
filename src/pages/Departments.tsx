import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Plus, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Department {
    _id: string;
    name: string;
    description?: string;
    created_at?: string;
}

export default function Departments() {
    const { isAdmin } = useAuth();
    const { toast } = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/departments`);
            const result = await response.json();

            if (result.success) {
                setDepartments(result.data);
            } else {
                toast({ title: 'Error', description: result.message, variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
            toast({ title: 'Error', description: 'Could not fetch departments', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/departments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message);
            }

            toast({
                title: 'Department Added',
                description: `${formData.name} has been added successfully.`,
            });

            setIsAddDialogOpen(false);
            setFormData({ name: '', description: '' });
            fetchDepartments();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add department',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/departments/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast({ title: 'Success', description: 'Department deleted' });
                fetchDepartments();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Could not delete', variant: 'destructive' });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Departments</h1>
                        <p className="text-muted-foreground mt-1">Manage organization departments</p>
                    </div>

                    {isAdmin && (
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Department
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Department</DialogTitle>
                                    <DialogDescription>
                                        Create a new department for categorizing employees.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddDepartment} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Department Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Engineering"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (Optional)</Label>
                                        <Input
                                            id="description"
                                            placeholder="Brief description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Adding...
                                                </>
                                            ) : (
                                                'Add Department'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            All Departments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="h-20 animate-pulse bg-muted rounded" />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Created</TableHead>
                                        {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {departments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No departments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        departments.map((dept) => (
                                            <TableRow key={dept._id}>
                                                <TableCell className="font-medium">{dept.name}</TableCell>
                                                <TableCell>{dept.description || '-'}</TableCell>
                                                <TableCell>
                                                    {dept.created_at ? format(new Date(dept.created_at), 'MMM d, yyyy') : '-'}
                                                </TableCell>
                                                {isAdmin && (
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(dept._id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
