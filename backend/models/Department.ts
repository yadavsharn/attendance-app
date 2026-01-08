import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    created_at: { type: Date, default: Date.now }
});

export const Department = mongoose.model('Department', departmentSchema);
