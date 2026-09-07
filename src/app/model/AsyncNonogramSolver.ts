import { LineSolver } from "./lineSolver";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class AsyncNonogramSolver {
    private lineSolver: LineSolver;
    private size: number;
    private onUpdate: (table: number[][]) => void;
    private delayMs: number;

    constructor(size: number, onUpdate: (table: number[][]) => void, delayMs: number = 50) {
        this.lineSolver = new LineSolver();
        this.size = size;
        this.onUpdate = onUpdate;
        this.delayMs = delayMs;
    }

    async solve(
        rowClues: number[][],
        colClues: number[][],
        initialTable: number[][]
    ): Promise<number[][] | null> {
        const table = initialTable.map(row => [...row]);
        return await this.recursiveSolve(rowClues, colClues, table);
    }

    private async recursiveSolve(
        rowClues: number[][],
        colClues: number[][],
        table: number[][]
    ): Promise<number[][] | null> {
        let changed: boolean;
        let rowPossibilities: number[][][] = [];
        let colPossibilities: number[][][] = [];

        do {
            changed = false;
            rowPossibilities = [];
            colPossibilities = [];

            for (let r = 0; r < this.size; r++) {
                const line = table[r];
                const poss = this.lineSolver.getPossibleSolutions(rowClues[r], line);
                if (poss.length === 0) return null; 
                rowPossibilities[r] = poss;

                for (let c = 0; c < this.size; c++) {
                    if (table[r][c] === 0) {
                        const firstVal = poss[0][c];
                        const isConstant = poss.every(p => p[c] === firstVal);
                        
                        if (isConstant) {
                            table[r][c] = firstVal;
                            changed = true;
                            
                            this.onUpdate([...table.map(row => [...row])]);
                            await sleep(this.delayMs); 
                        }
                    }
                }
            }

            for (let c = 0; c < this.size; c++) {
                const col = this.getColumn(table, c);
                const poss = this.lineSolver.getPossibleSolutions(colClues[c], col);
                if (poss.length === 0) return null; 
                colPossibilities[c] = poss;

                for (let r = 0; r < this.size; r++) {
                    if (table[r][c] === 0) {
                        const firstVal = poss[0][r];
                        const isConstant = poss.every(p => p[r] === firstVal);

                        if (isConstant) {
                            table[r][c] = firstVal;
                            changed = true;
                            
                            this.onUpdate([...table.map(row => [...row])]);
                            await sleep(this.delayMs);
                        }
                    }
                }
            }
        } while (changed);

        if (this.isComplete(table)) return table;

        let bestIsRow = true;
        let bestIndex = -1;
        let minPossibilities = Infinity;

        for (let r = 0; r < this.size; r++) {
            if (rowPossibilities[r].length > 1 && rowPossibilities[r].length < minPossibilities) {
                minPossibilities = rowPossibilities[r].length;
                bestIndex = r;
                bestIsRow = true;
            }
        }
        for (let c = 0; c < this.size; c++) {
            if (colPossibilities[c].length > 1 && colPossibilities[c].length < minPossibilities) {
                minPossibilities = colPossibilities[c].length;
                bestIndex = c;
                bestIsRow = false;
            }
        }

        if (bestIndex === -1) return null;
        const candidates = bestIsRow ? rowPossibilities[bestIndex] : colPossibilities[bestIndex];

        for (const candidate of candidates) {
            const nextTable = table.map(row => [...row]);
            if (bestIsRow) {
                nextTable[bestIndex] = [...candidate];
            } else {
                for (let r = 0; r < this.size; r++) {
                    nextTable[r][bestIndex] = candidate[r];
                }
            }

            const result = await this.recursiveSolve(rowClues, colClues, nextTable);
            if (result !== null) return result; 
        }

        return null; 
    }

    private getColumn(table: number[][], colIndex: number): number[] {
        const col: number[] = [];
        for (let r = 0; r < this.size; r++) col.push(table[r][colIndex]);
        return col;
    }

    private isComplete(table: number[][]): boolean {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (table[r][c] === 0) return false;
            }
        }
        return true;
    }
}