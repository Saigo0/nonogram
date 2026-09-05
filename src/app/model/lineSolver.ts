export class LineSolver {
    /**
     * Encontra todas as formas possíveis de preencher uma linha do nonograma.
     *
     * O método recebe duas informações:
     * - `clues`: os grupos de células preenchidas esperados na linha. Por
     *   exemplo, `[3, 1]` representa um grupo de três células preenchidas,
     *   pelo menos uma célula vazia e, depois, um grupo de uma célula.
     * - `line`: o estado atual das células da linha, usando `0` para uma
     *   célula desconhecida, `1` para uma célula preenchida e `2` para uma
     *   célula conhecida como vazia.
     *
     * Primeiro, os argumentos são validados. Em seguida, o método inicia uma
     * busca recursiva que testa cada posição possível para cada dica. A busca
     * descarta uma possibilidade quando ela contradiz uma célula já preenchida
     * ou vazia, ou quando não há espaço suficiente para as próximas dicas.
     *
     * Para cada combinação válida, as células dos grupos recebem `1` e todas
     * as demais recebem `2`, formando uma solução completa. O método retorna
     * uma matriz contendo todas essas soluções. Quando nenhuma combinação é
     * compatível com a linha, o retorno é um array vazio.
     *
     * @param clues Grupos de células preenchidas que a linha deve conter.
     * @param line Estado atual da linha, com células `0`, `1` ou `2`.
     * @returns Todas as soluções completas compatíveis com as dicas e a linha.
     */
    getPossibleSolutions(
        clues: number[],
        line: number[]
    ): number[][] {
        this.validateInput(clues, line);

        const solutions: number[][] = [];
        const filledPrefix = this.createPrefix(line, 1);
        const blockedPrefix = this.createPrefix(line, 2);
        const remainingSpace = this.createRemainingSpace(clues);

        this.findSolutions(
            clues,
            line,
            0,
            0,
            Array(line.length).fill(2),
            filledPrefix,
            blockedPrefix,
            remainingSpace,
            solutions
        );

        return solutions;
    }

    /**
     * Explora recursivamente as posições possíveis para cada grupo de dicas.
     *
     * Em cada nível da recursão, o método escolhe uma posição para a dica
     * atual. Uma posição é ignorada quando contém uma célula bloqueada, deixa
     * uma célula preenchida fora de um grupo ou não deixa espaço para as
     * próximas dicas.
     *
     * A linha `solution` é reutilizada durante a busca. Depois de explorar
     * uma posição, as células alteradas são restauradas para `2`, evitando a
     * criação de uma nova matriz em cada ramo da recursão. Uma cópia só é
     * criada quando uma solução completa é encontrada.
     *
     * @param clues Grupos de células preenchidas que a linha deve conter.
     * @param line Linha original com células desconhecidas ou já definidas.
     * @param clueIndex Índice da dica que está sendo posicionada.
     * @param searchStart Primeira posição permitida para a dica atual.
     * @param solution Linha de trabalho que representa o ramo atual da busca.
     * @param filledPrefix Prefixos usados para localizar células preenchidas.
     * @param blockedPrefix Prefixos usados para localizar células vazias.
     * @param remainingSpace Espaço mínimo necessário para as dicas restantes.
     * @param solutions Lista que recebe as soluções completas encontradas.
     */
    private findSolutions(
        clues: number[],
        line: number[],
        clueIndex: number,
        searchStart: number,
        solution: number[],
        filledPrefix: number[],
        blockedPrefix: number[],
        remainingSpace: number[],
        solutions: number[][]
    ): void {
        if (clueIndex === clues.length) {
            if (this.hasCell(filledPrefix, searchStart, line.length)) {
                return;
            }

            solutions.push([...solution]);
            return;
        }

        const clue = clues[clueIndex];
        const latestStart = line.length - clue - remainingSpace[clueIndex + 1];

        for (
            let start = searchStart;
            start <= latestStart;
            start++
        ) {
            const end = start + clue;

            if (
                this.hasCell(filledPrefix, searchStart, start) ||
                this.hasCell(blockedPrefix, start, end) ||
                (
                    clueIndex < clues.length - 1 &&
                    this.hasCell(filledPrefix, end, end + 1)
                )
            ) {
                continue;
            }

            for (let index = start; index < end; index++) {
                solution[index] = 1;
            }

            const nextStart = end + (
                clueIndex < clues.length - 1 ? 1 : 0
            );

            this.findSolutions(
                clues,
                line,
                clueIndex + 1,
                nextStart,
                solution,
                filledPrefix,
                blockedPrefix,
                remainingSpace,
                solutions
            );

            for (let index = start; index < end; index++) {
                solution[index] = 2;
            }
        }
    }

    /**
     * Calcula o espaço mínimo necessário para cada sufixo de dicas.
     *
     * O espaço inclui o tamanho dos grupos restantes e um separador vazio
     * entre cada par de grupos. O resultado permite calcular a última posição
     * possível de uma dica em tempo constante durante o backtracking.
     *
     * @param clues Grupos de células preenchidas da linha.
     * @returns Array em que cada índice guarda o espaço das dicas a partir
     * desse índice; o último item representa nenhuma dica restante.
     */
    private createRemainingSpace(clues: number[]): number[] {
        const remainingSpace = Array(clues.length + 1).fill(0);

        for (let index = clues.length - 1; index >= 0; index--) {
            remainingSpace[index] = remainingSpace[index + 1] + clues[index];

            if (index < clues.length - 1) {
                remainingSpace[index]++;
            }
        }

        return remainingSpace;
    }

    /**
     * Cria um array de soma acumulada para um tipo específico de célula.
     *
     * Para um intervalo `[start, end)`, a quantidade de células procuradas
     * pode ser obtida subtraindo `prefix[start]` de `prefix[end]`. Assim, o
     * solver evita percorrer o mesmo intervalo repetidamente.
     *
     * @param line Linha cujas células serão analisadas.
     * @param cellValue Valor da célula que deve ser contabilizado.
     * @returns Prefixos de contagem, começando com zero.
     */
    private createPrefix(
        line: number[],
        cellValue: number
    ): number[] {
        const prefix = [0];

        for (const cell of line) {
            prefix.push(
                prefix[prefix.length - 1] + (
                    cell === cellValue ? 1 : 0
                )
            );
        }

        return prefix;
    }

    /**
     * Verifica se um intervalo contém pelo menos uma célula do tipo buscado.
     *
     * O intervalo usa o formato semiaberto `[start, end)`: `start` é incluído
     * e `end` não é incluído. Essa convenção permite consultar também uma única
     * célula usando `end = start + 1`.
     *
     * @param prefix Prefixo de contagem criado por `createPrefix`.
     * @param start Início inclusivo do intervalo.
     * @param end Fim exclusivo do intervalo.
     * @returns `true` quando o intervalo contém a célula procurada.
     */
    private hasCell(
        prefix: number[],
        start: number,
        end: number
    ): boolean {
        return prefix[end] > prefix[start];
    }

    /**
     * Valida os valores recebidos antes de iniciar a busca de soluções.
     *
     * As dicas precisam ser inteiros positivos. As células só podem usar `0`
     * para desconhecida, `1` para preenchida ou `2` para vazia. Entradas
     * inválidas geram um erro para evitar resultados silenciosamente incorretos.
     *
     * @param clues Dicas que descrevem os grupos preenchidos da linha.
     * @param line Estado atual da linha.
     * @throws Error Quando uma dica ou célula possui um valor inválido.
     */
    private validateInput(
        clues: number[],
        line: number[]
    ): void {
        for (const clue of clues) {
            if (!Number.isInteger(clue) || clue <= 0) {
                throw new Error("Clues must contain positive integers.");
            }
        }

        for (const cell of line) {
            if (cell !== 0 && cell !== 1 && cell !== 2) {
                throw new Error("Line cells must be 0, 1, or 2.");
            }
        }
    }
}