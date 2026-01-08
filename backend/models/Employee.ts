import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    department: { type: String, required: false },
    designation: { type: String, required: false },
    azure_face_name: { type: String, unique: true, sparse: true },
    status: { type: String, default: 'active' },
    face_image_url: { type: String },
    created_at: { type: Date, default: Date.now }
});

export const Employee = mongoose.model('Employee', employeeSchema);
