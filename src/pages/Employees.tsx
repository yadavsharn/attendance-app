import { useState, useEffect } from 'react';
import { WebcamCapture } from '@/components/attendance/WebcamCapture';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';

import { UserPlus, Search, Users, ScanFace, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  _id?: string;
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  status: 'active' | 'inactive';
  date_of_joining: string;
  azure_face_name: string | null;
}

interface Department {
  _id?: string;
  id: string; // Keep id for compatibility or assume mapped
  name: string;
}

export default function Employees() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    department: '',
    date_of_joining: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/employees`);
      const result = await response.json();

      if (result.success) {
        setEmployees(result.data);
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({ title: 'Error', description: 'Could not fetch employees', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/departments`);
      const result = await response.json();

      if (result.success) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Ensure this matches backend expected fields
          status: 'active'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      toast({
        title: 'Employee Added',
        description: `${formData.full_name} has been added successfully.`,
      });

      setIsAddDialogOpen(false);
      setFormData({
        employee_id: '',
        full_name: '',
        email: '',
        department: '',
        date_of_joining: format(new Date(), 'yyyy-MM-dd'),
      });
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add employee',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleEnrollFace = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEnrollDialogOpen(true);
  };

  const handleCaptureEnrollment = async (imageData: string) => {
    if (!selectedEmployee) return;

    // setIsEnrolling(selectedEmployee.id); // No, use local loading state if better, or keep this
    // Actually, WebcamCapture handles its own loading usually, but we need to trigger the API call.

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      // Use _id from MongoDB if available, otherwise id
      const empId = selectedEmployee._id || selectedEmployee.id;
      if (!empId) throw new Error("Invalid Employee ID");

      const response = await fetch(`${API_URL}/employees/${empId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: 'Success', description: 'Face enrolled successfully!' });
        setIsEnrollDialogOpen(false);
        fetchEmployees(); // Refresh list
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Enrollment failed', variant: 'destructive' });
    }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.employee_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground mt-1">Manage employee records and face enrollment</p>
          </div>
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Enter the employee details below. Face enrollment can be done after adding.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        placeholder="EMP001"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_joining">Date of Joining</Label>
                      <Input
                        id="date_of_joining"
                        type="date"
                        value={formData.date_of_joining}
                        onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="John Doe"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => setFormData({ ...formData, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments && departments.length > 0 ? (
                          departments.map((dept) => (
                            <SelectItem key={dept._id || dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No departments found. Please add one in the Departments tab.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
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
                        'Add Employee'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enroll Face for {selectedEmployee?.full_name}</DialogTitle>
                <DialogDescription>
                  Capture a clear photo of the employee to enable face recognition.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {/* Reusing WebcamCapture with auto-capture OFF for enrollment to allow manual approval if needed, 
                     but for simplicity let's use the same component. 
                     We need to pass a handler. */}
                {isEnrollDialogOpen && (
                  <div className="mt-4">
                    {/* We need to use the WebcamCapture component properly. */}
                    {/* Assuming WebcamCapture handles the UI. checking imports needed. */}
                    <WebcamCapture
                      onCapture={handleCaptureEnrollment}
                      isProcessing={false} // We handle loading via toast for now or local state
                      status="idle"
                      message="Look at the camera and capture"
                      autoCapture={false} // Manual capture for enrollment
                      buttonText="Enroll Face"
                    />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, email, ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employees Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Employee Directory
            </CardTitle>
            <CardDescription>
              {filteredEmployees.length} employees found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Face Enrolled</TableHead>
                      <TableHead>Joined</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee._id || employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {(employee.full_name || '?').charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{employee.full_name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{employee.email || 'No Email'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{employee.employee_id || 'N/A'}</TableCell>
                          <TableCell>{employee.department || 'N/A'}</TableCell>
                          <TableCell>
                            <StatusBadge status={employee.status} />
                          </TableCell>
                          <TableCell>
                            {employee.azure_face_name ? (
                              <span className="inline-flex items-center gap-1 text-success text-sm">
                                <ScanFace className="w-4 h-4" />
                                Enrolled
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not enrolled</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              try {
                                return employee.date_of_joining ? format(new Date(employee.date_of_joining), 'MMM d, yyyy') : 'N/A';
                              } catch (e) {
                                return 'Invalid Date';
                              }
                            })()}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              {!employee.azure_face_name && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEnrollFace(employee)}
                                  disabled={isEnrolling === employee.id}
                                >
                                  {isEnrolling === employee.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <ScanFace className="w-4 h-4 mr-1" />
                                      Enroll
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                          No employees found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout >
  );
}
