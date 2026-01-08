import express from 'express';
import { Employee } from '../models/Employee';
import axios from 'axios';
import FormData from 'form-data';

const router = express.Router();

// Get All Employees
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.find().sort({ full_name: 1 });
        res.json({ success: true, data: employees });
    } catch (error: any) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add Employee
router.post('/', async (req, res) => {
    try {
        const { employee_id, full_name, email, department, date_of_joining } = req.body;

        const existing = await Employee.findOne({ $or: [{ email }, { employee_id }] });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Employee with this Email or ID already exists' });
        }

        const newEmployee = await Employee.create({
            employee_id,
            full_name,
            email,
            department,
            date_of_joining,
            status: 'active'
        });

        res.json({ success: true, data: newEmployee });
    } catch (error: any) {
        console.error('Error adding employee:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Enroll Face
router.post('/:id/enroll', async (req, res) => {
    try {
        const { image } = req.body; // Expecting base64 string
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        if (!image) {
            return res.status(400).json({ success: false, message: 'No image provided' });
        }

        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Prepare FormData for external API
        const formData = new FormData();
        formData.append('name', employee.full_name); // Use full name as identifier
        formData.append('file', buffer, { filename: 'enrollment.jpg', contentType: 'image/jpeg' });

        const azureUrl = process.env.AZURE_FACE_API_URL || 'http://20.244.80.165:8000';

        console.log(`Enrolling ${employee.full_name} at ${azureUrl}/enroll...`);

        const response = await axios.post(`${azureUrl}/enroll`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 10000
        });

        const result = response.data;

        if (result.success) {
            // Update employee with the enrolled name
            // The API returns { success: true, name: "Name" }
            employee.azure_face_name = result.name || employee.full_name;
            await employee.save();

            res.json({ success: true, message: 'Face enrolled successfully', data: result });
        } else {
            res.status(400).json({ success: false, message: result.message || 'Enrollment failed' });
        }

    } catch (error: any) {
        console.error('Enrollment error:', error.message);
        if (error.response) {
            console.error('External API details:', error.response.data);
            return res.status(error.response.status).json({ success: false, message: error.response.data.message || 'External API Error' });
        }
        res.status(500).json({ success: false, message: 'Server error during enrollment: ' + error.message });
    }
});

// Delete Employee
router.delete('/:id', async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Employee deleted' });
    } catch (error: any) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
