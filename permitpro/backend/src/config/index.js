require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  db: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    prices: {
      pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
      enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    },
  },

  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50,
    dir: process.env.UPLOAD_DIR || './uploads',
    allowedMimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/tiff',
    ],
  },

  ai: {
    mode: process.env.AI_SERVICE_MODE || 'mock',
    ocrEndpoint: process.env.AI_OCR_ENDPOINT,
    llmEndpoint: process.env.AI_LLM_ENDPOINT,
    llmApiKey: process.env.AI_LLM_API_KEY,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Subscription tier definitions
config.tiers = {
  free: {
    name: 'Free',
    maxProjects: 2,
    maxUploadsPerMonth: 3,
    maxFileSizeMB: 10,
    detailedReports: false,
    prioritySupport: false,
    price: 0,
  },
  pro: {
    name: 'Professional',
    maxProjects: 25,
    maxUploadsPerMonth: 50,
    maxFileSizeMB: 50,
    detailedReports: true,
    prioritySupport: false,
    priceMonthly: 79,
    priceYearly: 790,
  },
  enterprise: {
    name: 'Enterprise',
    maxProjects: -1, // unlimited
    maxUploadsPerMonth: -1,
    maxFileSizeMB: 100,
    detailedReports: true,
    prioritySupport: true,
    priceMonthly: 249,
    priceYearly: 2490,
  },
};

module.exports = config;
