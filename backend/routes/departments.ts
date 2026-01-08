import express from 'express';
import { Department } from '../models/Department';

const router = express.Router();

// Get All Departments
router.get('/', async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json({ success: true, data: departments });
    } catch (error: any) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add Department
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }

        const existing = await Department.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Department already exists' });
        }

        const newDept = await Department.create({ name, description });
        res.json({ success: true, data: newDept });
    } catch (error: any) {
        console.error('Error adding department:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete Department
router.delete('/:id', async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Department deleted' });
    } catch (error: any) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
