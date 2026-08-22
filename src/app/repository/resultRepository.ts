import { pool } from "./pool";
import { Result } from "../model/result";

export class ResultRepository {

    async save(
        puzzleId: number,
        result: Result
    ): Promise<Result> {

        const query = `
            INSERT INTO results (
                puzzle_id,
                player,
                duration_seconds,
                wrong_actions,
                actions_per_minute
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                player,
                duration_seconds,
                wrong_actions,
                actions_per_minute
        `;

        const values = [
            puzzleId,
            result.player,
            result.durationSeconds,
            result.wrongActions,
            result.actionsPerMinute
        ];

        const response = await pool.query(
            query,
            values
        );

        return this.mapRowToResult(
            response.rows[0]
        );
    }

    async findById(id: number): Promise<Result | null> {

        const query = `
            SELECT
                id,
                puzzle_id,
                player,
                duration_seconds,
                wrong_actions,
                actions_per_minute
            FROM results
            WHERE id = $1
        `;

        const response = await pool.query(query, [id]);

        if (response.rows.length === 0) {
            return null;
        }

        return this.mapRowToResult(response.rows[0]);
    }

    async findByPuzzle(
        puzzleId: number
    ): Promise<Result[]> {

        const query = `
            SELECT
                id,
                puzzle_id,
                player,
                duration_seconds,
                wrong_actions,
                actions_per_minute
            FROM results
            WHERE puzzle_id = $1
            ORDER BY duration_seconds ASC
        `;

        const response = await pool.query(
            query,
            [puzzleId]
        );

        return response.rows.map(
            row => this.mapRowToResult(row)
        );
    }

    async findBestResults(
        limit: number = 10
    ): Promise<Result[]> {

        const query = `
            SELECT
                id,
                puzzle_id,
                player,
                duration_seconds,
                wrong_actions,
                actions_per_minute
            FROM results
            ORDER BY duration_seconds ASC
            LIMIT $1
        `;

        const response = await pool.query(
            query,
            [limit]
        );

        return response.rows.map(
            row => this.mapRowToResult(row)
        );
    }

    private mapRowToResult(row: any): Result {

        return new Result(
            row.player,
            row.duration_seconds,
            row.wrong_actions,
            Number(row.actions_per_minute),
            row.id
        );
    }
}