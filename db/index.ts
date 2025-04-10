import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  // connectionString: "postgres://postgres:moiKarmel@127.0.0.1:5432/postgres",
});

export const db = drizzle(pool, {
    schema: {
      ...schema,
      ...authSchema,
    }
  });
