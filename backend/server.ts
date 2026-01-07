import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import attendanceRoutes from './routes/attendance';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
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
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        console.error('Please check your IP Whitelist on MongoDB Atlas or your internet connection.');
    });

mongoose.connection.on('error', err => {
    console.error('MongoDB runtime error:', err);
});

// Routes
app.use('/api', attendanceRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
