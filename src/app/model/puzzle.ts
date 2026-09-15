export class Puzzle {
    id: number;
    size: number;

    rowClues: number[][];
    colClues: number[][];

    table: number[][];

    startTime: number | null;
    finishTime: number | null;

    lastActionTime: number | null;
    totalIntervalTimeMs = 0;

    actions: number;
    wrongActions: number;

    constructor(
        id: number,
        size: number,
        rowClues: number[][],
        colClues: number[][]
    ) {
        this.id = id;
        this.size = size;

        this.lastActionTime = null;
        this.totalIntervalTimeMs = 0;

        this.rowClues = rowClues;
        this.colClues = colClues;

        this.table = this.createEmptyTable();

        this.startTime = null;
        this.finishTime = null;

        this.actions = 0;
        this.wrongActions = 0;
    }

    private createEmptyTable(): number[][] {
        return Array.from(
            { length: this.size },
            () => Array(this.size).fill(0)
        );
    }

    start(): void {
        this.startTime = Date.now();
        this.finishTime = null;

        this.actions = 0;
        this.wrongActions = 0;

        this.lastActionTime = this.startTime;

        this.totalIntervalTimeMs = 0;

        this.table = this.createEmptyTable();
    }

    updateCell(row: number, col: number, value: number): boolean {
        if (!this.isValidPosition(row, col)) {
            return false;
        }

        if (![0, 1, 2].includes(value)) {
            return false;
        }

        if (this.table[row][col] === value) {
            return false;
        }

        this.table[row][col] = value;
        this.actions++;

        const now = Date.now();
        if(this.lastActionTime){
            this.totalIntervalTimeMs += (now - this.lastActionTime);
        }

        this.lastActionTime = now;

        if (this.isCellWrong(row, col)) {
            this.wrongActions++;
        }

        return true;
    }

    getAverageActionTime(): number {
        if(this.actions === 0) return 0;

        const avgMs = this.totalIntervalTimeMs / this.actions;
        return Number((avgMs / 1000).toFixed(2));
    }

    isSolved(): boolean {
        return (
            this.rowsMatchClues() &&
            this.columnsMatchClues()
        );
    }

    finish(): void {
        if (!this.startTime) {
            return;
        }

        this.finishTime = Date.now();
    }

    getElapsedTime(): number {
        if (!this.startTime) {
            return 0;
        }

        const end = this.finishTime ?? Date.now();

        return Math.floor((end - this.startTime) / 1000);
    }

    private isCellWrong(row: number, col: number): boolean {
        /*
         * Uma célula preenchida só pode ser considerada
         * errada individualmente se conseguirmos determinar
         * isso pelas regras.
         *
         * Para isso, a estratégia mais simples é considerar
         * como erro apenas uma célula preenchida que torna
         * imediatamente impossível satisfazer a dica.
         */
        if (this.table[row][col] !== 1) {
            return false;
        }

        return (
            !this.lineCanStillMatch(row) ||
            !this.columnCanStillMatch(col)
        );
    }

    private rowsMatchClues(): boolean {
        for (let row = 0; row < this.size; row++) {
            const blocks = this.getBlocks(this.table[row]);

            if (!this.arraysEqual(blocks, this.rowClues[row])) {
                return false;
            }
        }

        return true;
    }

    private columnsMatchClues(): boolean {
        for (let col = 0; col < this.size; col++) {
            const column = [];

            for (let row = 0; row < this.size; row++) {
                column.push(this.table[row][col]);
            }

            const blocks = this.getBlocks(column);

            if (!this.arraysEqual(blocks, this.colClues[col])) {
                return false;
            }
        }

        return true;
    }

    private lineCanStillMatch(row: number): boolean {
        return this.canStillMatch(
            this.table[row],
            this.rowClues[row]
        );
    }

    private columnCanStillMatch(col: number): boolean {
        const column = [];

        for (let row = 0; row < this.size; row++) {
            column.push(this.table[row][col]);
        }

        return this.canStillMatch(
            column,
            this.colClues[col]
        );
    }

    private canStillMatch(
        line: number[],
        clues: number[]
    ): boolean {
        const blocks = this.getBlocks(line);

        // Regra 1: O jogador não pode pintar mais células do que o total exigido pelas dicas
        const totalFilled = blocks.reduce((acc, val) => acc + val, 0);
        const totalRequired = clues.reduce((acc, val) => acc + val, 0);
        if (totalFilled > totalRequired) {
            return false;
        }

        // Regra 2: Nenhum bloco isolado pode ser MAIOR que a maior dica disponível
        const maxClue = clues.length > 0 ? Math.max(...clues) : 0;
        if (blocks.some(block => block > maxClue)) {
            return false;
        }

        /*
         * Se ainda houver blocos incompletos ou células vazias,
         * precisamos apenas verificar se existe espaço suficiente.
         *
         * Para a validação de vitória, isso não é necessário;
         * aqui serve somente para identificar jogadas impossíveis.
         */
        return true;
    }

    private getBlocks(line: number[]): number[] {
        const blocks: number[] = [];

        let currentBlock = 0;

        for (const cell of line) {
            if (cell === 1) {
                currentBlock++;
            } else if (currentBlock > 0) {
                blocks.push(currentBlock);
                currentBlock = 0;
            }
        }

        if (currentBlock > 0) {
            blocks.push(currentBlock);
        }

        return blocks;
    }

    private arraysEqual(
        a: number[],
        b: number[]
    ): boolean {
        return (
            a.length === b.length &&
            a.every((value, index) => value === b[index])
        );
    }

    private isValidPosition(
        row: number,
        col: number
    ): boolean {
        return (
            row >= 0 &&
            row < this.size &&
            col >= 0 &&
            col < this.size
        );
    }
}