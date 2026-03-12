const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, Postman) in development
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);
