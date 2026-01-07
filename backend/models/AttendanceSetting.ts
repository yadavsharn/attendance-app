import mongoose from 'mongoose';

const attendanceSettingSchema = new mongoose.Schema({
    setting_key: { type: String, required: true, unique: true },
    setting_value: { type: String, required: true }
});

export const AttendanceSetting = mongoose.model('AttendanceSetting', attendanceSettingSchema);
