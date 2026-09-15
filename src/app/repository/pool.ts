import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "nonogram.sqlite");

fs.mkdirSync(dataDirectory, { recursive: true });

const database = new Database(databasePath);
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

if (database.prepare("SELECT COUNT(*) AS count FROM puzzles").get().count === 0) {
    const puzzleDirectory = path.join(process.cwd(), "docker", "sqlite");
    const puzzleFiles = ["5x5.sql", "10x10.sql", "15x15.sql", "20x20.sql", "25x25.sql"];

    const seed = database.transaction(() => {
        for (const fileName of puzzleFiles) {
            const filePath = path.join(puzzleDirectory, fileName);
            if (fs.existsSync(filePath)) {
                database.exec(fs.readFileSync(filePath, "utf8"));
            }
        }
    });

    seed();
}

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