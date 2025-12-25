import mongoose from 'mongoose'

class DatabaseService {
  async connect() {
    const uri = process.env.MONGO_URI?.trim();
    if (!uri) throw new Error('MONGO_URI is missing');

    try {
      await mongoose.connect(uri)
      console.log('MongoDB connected successfully ✔')
    } catch (error) {
      console.error('MongoDB connection error ❌', error)
      process.exit(1)
    }
  }
}

const databaseService = new DatabaseService()
export default databaseService
