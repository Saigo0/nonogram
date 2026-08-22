import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({
    path: ".env.local"
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "DATABASE_URL environment variable is not defined."
    );
}

export const pool = new Pool({
    connectionString
});