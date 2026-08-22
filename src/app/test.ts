import readline from "readline";
import dotenv from "dotenv";

import { PuzzleController } from "./controller/puzzleController";
import { PuzzleRepository } from "./repository/puzzleRepository";
import { ResultRepository } from "./repository/resultRepository";

const puzzleRepository = new PuzzleRepository();
const resultRepository = new ResultRepository();

const controller = new PuzzleController(
    resultRepository
);

dotenv.config({
    path: ".env.local"
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const PLAYER = "Pedro";

function showPuzzle(): void {

    const puzzle = controller.getPuzzle();

    console.clear();

    console.log("================================");
    console.log("          NONOGRAM");
    console.log("================================");
    console.log();

    if (!puzzle) {
        console.log("Nenhum puzzle carregado.");
        console.log();
        return;
    }

    console.log(`Puzzle #${puzzle.id}`);
    console.log(`Tamanho: ${puzzle.size}x${puzzle.size}`);
    console.log();

    /*
     * Cabeçalho das colunas
     */
    console.log("       " +
        Array.from(
            { length: puzzle.size },
            (_, i) => `${i + 1} `
        ).join(" ")
    );

    console.log("     " +
        "─────".repeat(puzzle.size)
    );

    /*
     * Grid
     */
    for (let row = 0; row < puzzle.size; row++) {

        let line = `${String(row + 1).padStart(2, " ")} │ `;

        for (let col = 0; col < puzzle.size; col++) {

            const cell = puzzle.table[row][col];

            switch (cell) {

                case 0:
                    line += ". ";
                    break;

                case 1:
                    line += "█ ";
                    break;

                case 2:
                    line += "X ";
                    break;
            }
        }

        console.log(line);
    }

    console.log();

    console.log("DICAS");

    console.log("Linhas:");

    for (let row = 0; row < puzzle.size; row++) {

        const clues = puzzle.rowClues[row];

        console.log(
            `  ${row + 1}: ${clues.length > 0
                ? clues.join(" ")
                : "-"
            }`
        );
    }

    console.log();

    console.log("Colunas:");

    for (let col = 0; col < puzzle.size; col++) {

        const clues = puzzle.colClues[col];

        console.log(
            `  ${col + 1}: ${clues.length > 0
                ? clues.join(" ")
                : "-"
            }`
        );
    }

    console.log();

    console.log(`Ações: ${puzzle.actions}`);
    console.log(`Ações erradas: ${puzzle.wrongActions}`);
    console.log(
        `Tempo: ${puzzle.getElapsedTime()}s`
    );

    console.log();
}

async function loadNewPuzzle(size: number): Promise<void> {

    const puzzle = await puzzleRepository.findRandom(size);

    if (!puzzle) {
        console.log();
        console.log(
            `Nenhum puzzle ${size}x${size} encontrado.`
        );
        console.log();

        return;
    }

    controller.loadPuzzle(puzzle);

    showPuzzle();
}

async function processCommand(
    input: string
): Promise<boolean> {

    const command = input.trim();

    if (!command) {
        return true;
    }

    /*
     * Sair
     */
    if (
        command === "q" ||
        command === "quit" ||
        command === "exit"
    ) {
        return false;
    }

    /*
     * Mostrar puzzle
     */
    if (command === "show") {

        showPuzzle();

        return true;
    }

    /*
     * Limpar puzzle
     */
    if (command === "clear") {

        const puzzle = controller.getPuzzle();

        if (!puzzle) {
            console.log("Nenhum puzzle carregado.");
            return true;
        }

        puzzle.clear();

        showPuzzle();

        return true;
    }

    /*
     * Reiniciar puzzle
     */
    if (command === "restart") {

        const puzzle = controller.getPuzzle();

        if (!puzzle) {
            console.log("Nenhum puzzle carregado.");
            return true;
        }

        puzzle.reset();

        showPuzzle();

        return true;
    }

    /*
     * Novo puzzle
     *
     * Exemplo:
     *
     * new 5
     */
    const newCommand = command.match(
        /^new\s+(\d+)$/
    );

    if (newCommand) {

        const size = Number(newCommand[1]);

        await loadNewPuzzle(size);

        return true;
    }

    /*
     * Preencher:
     *
     * fill 1 2
     */
    const fillCommand = command.match(
        /^fill\s+(\d+)\s+(\d+)$/
    );

    if (fillCommand) {

        await updateCell(
            Number(fillCommand[1]),
            Number(fillCommand[2]),
            1
        );

        return true;
    }

    /*
     * Limpar uma célula:
     *
     * clear 1 2
     */
    const clearCommand = command.match(
        /^clear\s+(\d+)\s+(\d+)$/
    );

    if (clearCommand) {

        await updateCell(
            Number(clearCommand[1]),
            Number(clearCommand[2]),
            0
        );

        return true;
    }

    /*
     * Bloquear:
     *
     * block 1 2
     */
    const blockCommand = command.match(
        /^block\s+(\d+)\s+(\d+)$/
    );

    if (blockCommand) {

        await updateCell(
            Number(blockCommand[1]),
            Number(blockCommand[2]),
            2
        );

        return true;
    }

    console.log();
    console.log("Comando desconhecido.");
    console.log();
    showHelp();

    return true;
}

async function updateCell(
    row: number,
    col: number,
    value: number
): Promise<void> {

    /*
     * Usuário utiliza coordenadas começando em 1.
     *
     * O controller utiliza índices começando em 0.
     */
    const result = await controller.updateCell(
        row - 1,
        col - 1,
        value,
        PLAYER
    );

    showPuzzle();

    if (result) {

        console.log();
        console.log("================================");
        console.log("       PUZZLE RESOLVIDO!");
        console.log("================================");
        console.log();

        console.log(`Jogador: ${result.player}`);
        console.log(
            `Tempo: ${result.durationSeconds}s`
        );
        console.log(
            `Ações erradas: ${result.wrongActions}`
        );
        console.log(
            `Ações por minuto: ${result.actionsPerMinute}`
        );

        console.log();
    }
}

function showHelp(): void {

    console.log("Comandos disponíveis:");
    console.log();

    console.log("  new <tamanho>");
    console.log("      Carrega um novo puzzle.");
    console.log("      Exemplo: new 2");
    console.log();

    console.log("  fill <linha> <coluna>");
    console.log("      Preenche uma célula.");
    console.log("      Exemplo: fill 1 2");
    console.log();

    console.log("  clear <linha> <coluna>");
    console.log("      Limpa uma célula.");
    console.log("      Exemplo: clear 1 2");
    console.log();

    console.log("  block <linha> <coluna>");
    console.log("      Marca uma célula como bloqueada.");
    console.log("      Exemplo: block 1 2");
    console.log();

    console.log("  clear");
    console.log("      Limpa o tabuleiro.");
    console.log();

    console.log("  restart");
    console.log("      Reinicia o puzzle.");
    console.log();

    console.log("  show");
    console.log("      Mostra o estado atual.");
    console.log();

    console.log("  q");
    console.log("      Sai do programa.");
    console.log();
}

async function main(): Promise<void> {

    console.clear();

    console.log("================================");
    console.log("       TESTE DO CONTROLLER");
    console.log("================================");
    console.log();

    showHelp();

    /*
     * Carrega automaticamente um puzzle 2x2
     * para facilitar o teste.
     */
    await loadNewPuzzle(2);

    askCommand();
}

function askCommand(): void {

    rl.question(
        "> ",
        async (input) => {

            try {

                const shouldContinue =
                    await processCommand(input);

                if (shouldContinue) {
                    askCommand();
                } else {
                    rl.close();
                }

            } catch (error) {

                console.error();
                console.error(
                    "Erro:",
                    error instanceof Error
                        ? error.message
                        : error
                );

                console.error();

                askCommand();
            }
        }
    );
}

main();