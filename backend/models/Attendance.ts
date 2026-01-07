import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    check_in_time: { type: Date, required: true },
    status: { type: String, required: true }, // 'present', 'late', etc.
    confidence_score: { type: Number },
    source: { type: String, default: 'face_recognition' }
});

export const Attendance = mongoose.model('Attendance', attendanceSchema);
