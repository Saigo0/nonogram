import { pool } from "./pool";
import { Puzzle } from "../model/puzzle";

function parseClues(clues: number[][] | string): number[][] {
    return typeof clues === "string" ? JSON.parse(clues) : clues;
}

export class PuzzleRepository {

    async findById(id: number): Promise<Puzzle | null> {

        const result = await pool.query(
            `
            SELECT
                id,
                size,
                row_clues,
                col_clues
            FROM puzzles
            WHERE id = ?
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        return new Puzzle(
            row.id,
            row.size,
            parseClues(row.row_clues),
            parseClues(row.col_clues)
        );
    }
    
    async findRandom(size: number): Promise<Puzzle | null> {

        const result = await pool.query(
            `
            SELECT
                id,
                size,
                row_clues,
                col_clues
            FROM puzzles
            WHERE size = ?
            ORDER BY RANDOM()
            LIMIT 1
            `,
            [size]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];

        return new Puzzle(
            row.id,
            row.size,
            parseClues(row.row_clues),
            parseClues(row.col_clues)
        );
    }
}