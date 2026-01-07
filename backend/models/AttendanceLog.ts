import mongoose from 'mongoose';

const attendanceLogSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    action: { type: String, required: true }, // 'check_in', 'recognition_failed'
    azure_response: { type: Object },
    confidence_score: { type: Number },
    success: { type: Boolean, required: true },
    error_message: { type: String },
    created_at: { type: Date, default: Date.now }
});

export const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);
