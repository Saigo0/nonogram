const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "nonogram.sqlite");
const puzzleDirectory = path.join(process.cwd(), "docker", "sqlite");
const puzzleFiles = ["5x5.sql", "10x10.sql", "15x15.sql", "20x20.sql", "25x25.sql"];

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

const resetDatabase = database.transaction(() => {
    database.exec("DELETE FROM results; DELETE FROM puzzles;");
    database.exec(
        "DELETE FROM sqlite_sequence WHERE name IN ('results', 'puzzles');"
    );

    for (const fileName of puzzleFiles) {
        const filePath = path.join(puzzleDirectory, fileName);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo de seed não encontrado: ${filePath}`);
        }

        database.exec(fs.readFileSync(filePath, "utf8"));
    }
});

try {
    resetDatabase();

    const puzzleCount = database
        .prepare("SELECT COUNT(*) AS count FROM puzzles")
        .get().count;

    if (puzzleCount === 0) {
        throw new Error("Nenhum puzzle foi carregado no banco SQLite.");
    }

    console.log(`Banco SQLite resetado com ${puzzleCount} puzzles.`);
} finally {
    database.close();
}
