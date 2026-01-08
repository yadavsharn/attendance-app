import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import attendanceRoutes from './routes/attendance';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import departmentRoutes from './routes/departments';
import settingsRoutes from './routes/settings';
import { Admin } from './models/Admin';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper: Seed Admin
const seedAdmin = async () => {
    try {
        const existing = await Admin.findOne({ email: 'admin@gmail.com' });
        if (!existing) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash('123456', salt);
            await Admin.create({
                email: 'admin@gmail.com',
                password_hash
            });
            console.log('Default Admin (admin@gmail.com) created.');
        }
    } catch (e) {
        console.error('Admin seed failed:', e);
    }
};

// MongoDB Connectio
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('ERROR: MONGODB_URI is not defined in .env');
    process.exit(1);
}

console.log('Attempting to connect to MongoDB...', uri.replace(/:([^:@]+)@/, ':****@')); // Log masked URI

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('Successfully connected to MongoDB');
        seedAdmin();
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        console.error('Please check your IP Whitelist on MongoDB Atlas or your internet connection.');
    });

mongoose.connection.on('error', err => {
    console.error('MongoDB runtime error:', err);
});

// Routes
app.use('/api', attendanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
