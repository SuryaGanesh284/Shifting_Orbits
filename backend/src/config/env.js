const dotenv = require('dotenv');
const path = require('path');
const { z } = require('zod');

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/shifting_orbits'),
  JWT_ACCESS_SECRET: z.string().default('sof_jwt_access_super_secret_key_2026_change_in_production'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().default('sof_jwt_refresh_super_secret_key_2026_change_in_production'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173'),
  AI_PROVIDER: z.enum(['gemini', 'openai', 'mock']).default('mock'),
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment configuration validation error:', parsed.error.format());
  process.exit(1);
}

const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGIN.split(',').map((s) => s.trim())
};

module.exports = env;
