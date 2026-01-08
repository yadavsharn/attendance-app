import express from 'express';
import { AttendanceSetting } from '../models/AttendanceSetting';

const router = express.Router();

// Get All Settings
router.get('/', async (req, res) => {
    try {
        const settings = await AttendanceSetting.find();
        // Convert array to object for easier frontend consumption
        const settingsObj: any = {};
        settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
        });

        // Set defaults if missing
        const defaults = {
            work_start_time: '09:00',
            late_threshold_minutes: '15',
            confidence_threshold: '0.5'
        };

        res.json({ success: true, data: { ...defaults, ...settingsObj } });
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Settings
router.post('/', async (req, res) => {
    try {
        const updates = req.body; // Expecting { key: value, ... }

        for (const [key, value] of Object.entries(updates)) {
            await AttendanceSetting.findOneAndUpdate(
                { setting_key: key },
                { setting_value: String(value) },
                { upsert: true, new: true }
            );
        }

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
