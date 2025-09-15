const mongoose = require('mongoose');
  const dotenv = require('dotenv');

  console.log('?? MONGODB CONNECTION TEST (Simple)');
  console.log('Current directory:', process.cwd());
  console.log('NODE_ENV:', process.env.NODE_ENV);

  // Cargar variables según ambiente
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
  console.log('Loading env file:', envFile);

  dotenv.config({ path: envFile });

  console.log('\n?? Environment Check:');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('PORT:', process.env.PORT);

  if (!process.env.MONGODB_URI) {
      console.error('? MONGODB_URI not found!');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
      process.exit(1);
  }

  console.log('URI preview:', process.env.MONGODB_URI.substring(0, 30) + '...');

  console.log('\n?? Connecting to MongoDB...');

  mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
  })
  .then(() => {
      console.log('? MongoDB connected successfully!');
      console.log('Host:', mongoose.connection.host);
      console.log('Database:', mongoose.connection.name);
      process.exit(0);
  })
  .catch((error) => {
      console.error('? Connection failed:', error.message);
      process.exit(1);
  });

  setTimeout(() => {
      console.error('? Timeout after 10 seconds');
      process.exit(1);
  }, 10000);