import { Puzzle } from "./puzzle";

export class Result {

    constructor(
        public player: string,
        public durationSeconds: number,
        public wrongActions: number,
        public actionsPerMinute: number,
        public avgActionTimeSeconds: number,
        public id?: number
    ) {}

    static fromPuzzle(
        player: string,
        puzzle: Puzzle
    ): Result {

        const durationSeconds =
            puzzle.getElapsedTime();

        const minutes =
            durationSeconds / 60;

        const actionsPerMinute =
            minutes > 0
                ? puzzle.actions / minutes
                : puzzle.actions;

        const avgActionTime = puzzle.getAverageActionTime();

        return new Result(
            player,
            durationSeconds,
            puzzle.wrongActions,
            Number(actionsPerMinute.toFixed(3)),
            avgActionTime
        );
    }
}