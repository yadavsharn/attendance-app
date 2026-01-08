
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/facecheck_db';

async function dropIndex() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('employees');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        const indexName = 'azure_face_name_1';
        const exists = indexes.find(i => i.name === indexName);

        if (exists) {
            await collection.dropIndex(indexName);
            console.log(`Index ${indexName} dropped successfully.`);
        } else {
            console.log(`Index ${indexName} not found.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

dropIndex();
