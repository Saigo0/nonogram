import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({
    path: ".env.local"
});

const connectionString = "postgresql://joanthan:DTtprGrX4iNrakJqJVR80AScFcnwfvQw@dpg-daks5u2jnfac73folcsg-a:5432/nonogram_db_utav";

if (!connectionString) {
    throw new Error(
        "DATABASE_URL environment variable is not defined."
    );
}

export const pool = new Pool({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
});
