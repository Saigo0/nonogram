import { Puzzle } from "../model/puzzle";
import { Result } from "../model/result";
import { ResultRepository } from "../repository/resultRepository";

export class PuzzleController {

    private puzzle: Puzzle | null = null;

    constructor(
        private resultRepository: ResultRepository
    ) {}

    loadPuzzle(puzzle: Puzzle): void {
        this.puzzle = puzzle;
        this.puzzle.start();
    }

    async updateCell(
        row: number,
        col: number,
        value: number,
        player: string
    ): Promise<Result | null> {

        if (!this.puzzle) {
            throw new Error("No puzzle loaded.");
        }

        if (this.puzzle.finishTime !== null) {
            return null;
        }

        const updated = this.puzzle.updateCell(
            row,
            col,
            value
        );

        if (!updated) {
            return null;
        }

        if (this.puzzle.isSolved()) {
            return await this.finishPuzzle(player);
        }

        return null;
    }

    async finishPuzzle(
        player: string = "Anonymous"
    ): Promise<Result | null> {

        if (!this.puzzle) {
            return null;
        }

        if (this.puzzle.finishTime !== null) {
            return null;
        }

        if (!this.puzzle.isSolved()) {
            return null;
        }

        this.puzzle.finish();

        const result = Result.fromPuzzle(
            player,
            this.puzzle
        );

        return await this.resultRepository.save(
            this.puzzle.id,
            result
        );
    }

    getPuzzle(): Puzzle | null {
        return this.puzzle;
    }
}