import {LineSolver} from "./lineSolver";

export class NonogramSolver{
    private lineSolver: LineSolver;
    private size: number;

    constructor(size:number){
        this.lineSolver = new LineSolver();
        this.size = size;
    }

    solve(
        rowClues: number[][],
        colClues: number[][],
        initialTable: number[][]
    ): number[][] | null {
        const table = initialTable.map(row => [...row]);
        return this.recursiveSolve(rowClues, colClues, table);
    } 
    
    private recursiveSolve(
        rowClues: number[][],
        colClues: number[][],
        table: number[][]
    ): number[][] | null {
        let changed: boolean;
        let rowPossibilities: number[][][] = [];
        let colPossibilities: number[][][] = [];

        do{
            changed = false;
            rowPossibilities = [];
            colPossibilities = [];

            for (let r = 0; r < this.size; r++) {
                const line = table[r];
                const clues = rowClues[r];
                const poss = this.lineSolver.getPossibleSolutions(clues, line);

                if(poss.length === 0) return null;
                rowPossibilities[r] = poss;

                for(let c = 0; c< this.size; c++){
                    if(table[r][c] === 0){
                        const firstVal = poss[0][c];
                        const isConstant =poss.every(p => p[c] === firstVal);
                        if(isConstant){
                            table[r][c] = firstVal;
                            changed = true;
                        }
                    }
                }
            }
            for (let c = 0; c< this.size; c++) {
                const col = this.getColumn(table, c);
                const clues = colClues[c];
                const poss = this.lineSolver.getPossibleSolutions(clues, col);

                if(poss.length === 0) return null;
                colPossibilities[c] = poss;

                for(let r = 0; r< this.size; r++){
                    if(table[r][c] === 0){
                        const firstVal = poss[0][r];
                        const isConstant = poss.every(p => p[r] === firstVal);
                        if(isConstant){
                            table[r][c] = firstVal;
                            changed = true;
                        }
                    }
                }    
            }   
        } while(changed);

        if(this.isComplete(table)){
            return table;
        }

        let bestIsRow = true;
        let bestIndex = -1;
        let minpossibilities = Infinity;

        for (let r = 0; r < this.size; r++) {
            const len = rowPossibilities[r].length;
            if(len > 1 && len < minpossibilities){
                minpossibilities = len;
                bestIndex = r;
                bestIsRow = true;
            }
        }

        for (let c = 0; c < this.size; c++) {
            const len = colPossibilities[c].length;
            if(len > 1 && len < minpossibilities){
                minpossibilities = len;
                bestIndex = c;
                bestIsRow = false;
            }
        }

        if(bestIndex === -1) return null;
        
        const candidates = bestIsRow ? rowPossibilities[bestIndex] : colPossibilities[bestIndex];

        for(const candidate of candidates){
            const nextTable = table.map(row => [...row]);

            if(bestIsRow){
                nextTable[bestIndex] = [...candidate];
            } else{
                for(let r = 0; r < this.size; r++){
                    nextTable[r][bestIndex] = candidate[r];
                }
            }

            const result = this.recursiveSolve(rowClues, colClues, nextTable);

            if(result !== null){
                return result;
            }

        }

        return null;
    }

    private getColumn(table: number[][], colIndex: number): number[]{
        const col: number[] = [];
        for(let r = 0; r < this.size; r++){
            col.push(table[r][colIndex]);
        }
        return col;
    }

    private isComplete(table: number[][]): boolean{
        for(let r = 0; r < this.size; r++){
            for(let c = 0; c < this.size; c++){
                if(table[r][c] === 0){
                    return false;
                }
            }
        }
        return true;
    }
}