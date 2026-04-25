export const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://neondb_owner:npg_AwN3EyK0fZOl@ep-lively-feather-antrl9ag-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
