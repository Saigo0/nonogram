import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDirectory = path.join(process.cwd(), "data");
const bundledDatabasePath = path.join(dataDirectory, "nonogram.sqlite");
const runtimeDatabasePath = process.env.VERCEL
    ? path.join("/tmp", "nonogram.sqlite")
    : bundledDatabasePath;

if (process.env.VERCEL && !fs.existsSync(runtimeDatabasePath)) {
    fs.copyFileSync(bundledDatabasePath, runtimeDatabasePath);
}

fs.mkdirSync(dataDirectory, { recursive: true });

const database = new Database(runtimeDatabasePath);
database.pragma("foreign_keys = ON");

database.exec(`
    CREATE TABLE IF NOT EXISTS puzzles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        size INTEGER NOT NULL,
        row_clues TEXT NOT NULL,
        col_clues TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        puzzle_id INTEGER NOT NULL,
        player TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL,
        wrong_actions INTEGER NOT NULL,
        actions_per_minute REAL NOT NULL,
        FOREIGN KEY (puzzle_id) REFERENCES puzzles(id)
    );
`);

export const pool = {
    query(query: string, values: unknown[] = []) {
        const statement = database.prepare(query);
        statement.bind(values);

        const rows = query.trimStart().toUpperCase().startsWith("SELECT")
            ? statement.all()
            : query.toUpperCase().includes("RETURNING")
                ? [statement.get()]
                : (statement.run(), []);

        return { rows };
    }
};