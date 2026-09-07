import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({
    path: ".env.local"
});

const connectionString = "postgresql://postgres:Saigo2707@@127.0.0.1:5433/postgres";

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