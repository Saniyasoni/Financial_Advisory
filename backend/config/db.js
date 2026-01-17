import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Connect to MongoDB using the URI from .env file
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1); // Exit process if connection fails
  }
};

export default connectDB;
