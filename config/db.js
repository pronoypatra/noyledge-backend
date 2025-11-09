import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not defined in environment variables');
      console.error('Please create a .env file with MONGO_URI=your_connection_string');
      process.exit(1);
    }

    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\nPossible issues:');
      console.error('1. Check your internet connection');
      console.error('2. Verify your MongoDB Atlas cluster is running (not paused)');
      console.error('3. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('4. Verify your MONGO_URI connection string is correct');
      console.error('5. Try using the standard connection string instead of SRV if DNS resolution fails');
    } else if (error.message.includes('authentication')) {
      console.error('\nAuthentication failed:');
      console.error('1. Check your MongoDB username and password');
      console.error('2. Verify your database user has proper permissions');
    }
    
    console.error('\nConnection string format should be:');
    console.error('mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
    console.error('or');
    console.error('mongodb://username:password@cluster-shard-00-00.mongodb.net:27017/database?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin');
    
    process.exit(1);
  }
};

export default connectDB;

