import { pool } from "./pool";
import { Puzzle } from "../model/puzzle";

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
            WHERE id = $1
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
            row.row_clues,
            row.col_clues
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
            WHERE size = $1
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
            row.row_clues,
            row.col_clues
        );
    }
}