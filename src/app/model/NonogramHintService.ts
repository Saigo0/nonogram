//
// Versão para backend do motor de resolução de nonogramas.
// Reaproveita o LineSolver original (que não tem estado nem efeitos
// colaterais) mas troca o objetivo do AsyncNonogramSolver original:
// em vez de resolver o tabuleiro inteiro passo a passo para fins de
// animação (com onUpdate + sleep), este serviço expõe duas operações
// pensadas para uso em tempo real dentro de uma API:
//
//   1. getHint(...)  -> encontra a PRÓXIMA célula a revelar ao jogador,
//      sem resolver o resto do tabuleiro (quando possível).
//   2. solve(...)    -> resolve o tabuleiro inteiro (ex: botão "resolver
//      para mim", ou para checar se o puzzle ainda tem solução).
//
// Como o Node.js é single-threaded, solve() cede o event loop
// periodicamente (via setImmediate) durante o backtracking, para não
// travar o servidor em puzzles grandes/difíceis enquanto outras
// requisições estão sendo atendidas. Isso NÃO é paralelismo real — é
// só cooperação com o event loop. Se os puzzles forem muito grandes ou
// pesados, vale considerar mover solve() para uma worker_thread.
//

import { LineSolver } from "./lineSolver";

export type Cell = 0 | 1 | 2; // 0 = desconhecida, 1 = preenchida, 2 = vazia
export type Board = Cell[][];

export interface Hint {
  row: number;
  col: number;
  value: 1 | 2;
  /**
   * "logical" -> dedução 100% certa a partir do estado atual (propagação).
   * "guess"   -> não havia dedução lógica disponível; a célula vem da
   *              solução canônica do puzzle (exigiu backtracking).
   */
  certainty: "logical" | "guess";
}

export interface SolveOptions {
  /** Permite cancelar um solve em andamento (ex: jogador mudou o tabuleiro). */
  signal?: AbortSignal;
  /** A cada quantos "passos" ceder o event loop. Ajuste conforme o tamanho do puzzle. */
  yieldEvery?: number;
}

interface SolveContext {
  steps: number;
  yieldEvery: number;
  signal?: AbortSignal;
}

export class NonogramHintService {
  private lineSolver = new LineSolver();
  private size: number;

  constructor(size: number) {
    this.size = size;
  }

  // ---------------------------------------------------------------------
  // API PRINCIPAL
  // ---------------------------------------------------------------------

  /**
   * Resolve o tabuleiro inteiro a partir do estado atual.
   * Mesma lógica de propagação + backtracking (MRV) do solver original,
   * mas sem callback de UI e sem delay artificial.
   *
   * @returns O tabuleiro resolvido, ou `null` se o estado atual for
   * inconsistente com as dicas (não existe solução a partir daqui).
   */
  async solve(
    rowClues: number[][],
    colClues: number[][],
    initialTable: Board,
    options: SolveOptions = {}
  ): Promise<Board | null> {
    const table = initialTable.map(row => [...row]) as Board;
    const ctx: SolveContext = {
      steps: 0,
      yieldEvery: options.yieldEvery ?? 500,
      signal: options.signal,
    };
    return this.recursiveSolve(rowClues, colClues, table, ctx);
  }

  /**
   * Encontra a próxima dica a mostrar ao jogador.
   *
   * Estratégia em duas camadas:
   *  1. Tenta achar uma célula deduzível por lógica pura (rápido, barato,
   *     não precisa resolver o puzzle inteiro).
   *  2. Se não houver nenhuma dedução lógica disponível nesse ponto (o
   *     puzzle exige "chute"/backtracking para avançar), resolve o
   *     tabuleiro inteiro e revela uma célula da solução canônica.
   *
   * @returns A dica, ou `null` se o tabuleiro já estiver completo ou se
   * o estado atual for inconsistente (o jogador errou alguma célula).
   */
  async getHint(
    rowClues: number[][],
    colClues: number[][],
    table: Board
  ): Promise<Hint | null> {
    const logical = this.getLogicalHint(rowClues, colClues, table);
    if (logical !== undefined) return logical; // Hint válido OU null (inconsistente)
    return this.getGuessHint(rowClues, colClues, table);
  }

  /**
   * Verifica se o estado atual do tabuleiro ainda é compatível com as
   * dicas — ou seja, se existe pelo menos uma forma de completar cada
   * linha e cada coluna sem contradizer o que já foi marcado.
   *
   * Útil para detectar em tempo real que o jogador cometeu um erro, mesmo
   * antes de pedir uma dica ou tentar resolver o puzzle.
   */
  isConsistent(rowClues: number[][], colClues: number[][], table: Board): boolean {
    for (let r = 0; r < this.size; r++) {
      if (this.lineSolver.getPossibleSolutions(rowClues[r], table[r]).length === 0) {
        return false;
      }
    }
    for (let c = 0; c < this.size; c++) {
      const col = this.getColumn(table, c);
      if (this.lineSolver.getPossibleSolutions(colClues[c], col).length === 0) {
        return false;
      }
    }
    return true;
  }

  // ---------------------------------------------------------------------
  // DICA LÓGICA (uma única passada de propagação, sem backtracking)
  // ---------------------------------------------------------------------

  /**
   * Roda uma única passada de propagação (linhas, depois colunas) e
   * retorna a PRIMEIRA célula que pode ser fixada com certeza.
   *
   * Retorna `undefined` (e não `null`) quando não há dedução lógica
   * disponível, para diferenciar de `null`, que sinaliza estado
   * inconsistente — assim getHint() sabe quando cair para getGuessHint().
   */
  private getLogicalHint(
    rowClues: number[][],
    colClues: number[][],
    table: Board
  ): Hint | null | undefined {
    for (let r = 0; r < this.size; r++) {
      const poss = this.lineSolver.getPossibleSolutions(rowClues[r], table[r]);
      if (poss.length === 0) return null; // inconsistente

      for (let c = 0; c < this.size; c++) {
        if (table[r][c] === 0) {
          const firstVal = poss[0][c];
          if (poss.every(p => p[c] === firstVal)) {
            return { row: r, col: c, value: firstVal as 1 | 2, certainty: "logical" };
          }
        }
      }
    }

    for (let c = 0; c < this.size; c++) {
      const col = this.getColumn(table, c);
      const poss = this.lineSolver.getPossibleSolutions(colClues[c], col);
      if (poss.length === 0) return null; // inconsistente

      for (let r = 0; r < this.size; r++) {
        if (table[r][c] === 0) {
          const firstVal = poss[0][r];
          if (poss.every(p => p[r] === firstVal)) {
            return { row: r, col: c, value: firstVal as 1 | 2, certainty: "logical" };
          }
        }
      }
    }

    return undefined; // nenhuma dedução lógica disponível neste estado
  }

  /**
   * Fallback: resolve o tabuleiro inteiro (com backtracking) e revela uma
   * única célula ainda desconhecida a partir da solução encontrada.
   */
  private async getGuessHint(
    rowClues: number[][],
    colClues: number[][],
    table: Board
  ): Promise<Hint | null> {
    const solved = await this.solve(rowClues, colClues, table);
    if (!solved) return null; // inconsistente, ou sem solução

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (table[r][c] === 0) {
          return { row: r, col: c, value: solved[r][c] as 1 | 2, certainty: "guess" };
        }
      }
    }
    return null; // já estava completo
  }

  // ---------------------------------------------------------------------
  // RESOLUÇÃO COMPLETA (propagação + MRV + backtracking)
  // Mesmo algoritmo do AsyncNonogramSolver original, sem onUpdate/sleep.
  // ---------------------------------------------------------------------

  private async recursiveSolve(
    rowClues: number[][],
    colClues: number[][],
    table: Board,
    ctx: SolveContext
  ): Promise<Board | null> {
    let changed: boolean;
    let rowPossibilities: number[][][] = [];
    let colPossibilities: number[][][] = [];

    do {
      changed = false;
      rowPossibilities = [];
      colPossibilities = [];

      for (let r = 0; r < this.size; r++) {
        const poss = this.lineSolver.getPossibleSolutions(rowClues[r], table[r]);
        if (poss.length === 0) return null;
        rowPossibilities[r] = poss;

        for (let c = 0; c < this.size; c++) {
          if (table[r][c] === 0) {
            const firstVal = poss[0][c];
            if (poss.every(p => p[c] === firstVal)) {
              table[r][c] = firstVal as Cell;
              changed = true;
            }
          }
        }

        await this.maybeYield(ctx);
      }

      for (let c = 0; c < this.size; c++) {
        const col = this.getColumn(table, c);
        const poss = this.lineSolver.getPossibleSolutions(colClues[c], col);
        if (poss.length === 0) return null;
        colPossibilities[c] = poss;

        for (let r = 0; r < this.size; r++) {
          if (table[r][c] === 0) {
            const firstVal = poss[0][r];
            if (poss.every(p => p[r] === firstVal)) {
              table[r][c] = firstVal as Cell;
              changed = true;
            }
          }
        }

        await this.maybeYield(ctx);
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
      const nextTable = table.map(row => [...row]) as Board;
      if (bestIsRow) {
        nextTable[bestIndex] = [...candidate] as Cell[];
      } else {
        for (let r = 0; r < this.size; r++) {
          nextTable[r][bestIndex] = candidate[r] as Cell;
        }
      }

      const result = await this.recursiveSolve(rowClues, colClues, nextTable, ctx);
      if (result !== null) return result;

      if (ctx.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    }

    return null;
  }

  private async maybeYield(ctx: SolveContext): Promise<void> {
    ctx.steps++;
    if (ctx.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (ctx.steps % ctx.yieldEvery === 0) {
      await new Promise<void>(resolve => setImmediate(resolve));
    }
  }

  private getColumn(table: Board, colIndex: number): number[] {
    const col: number[] = [];
    for (let r = 0; r < this.size; r++) col.push(table[r][colIndex]);
    return col;
  }

  private isComplete(table: Board): boolean {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (table[r][c] === 0) return false;
      }
    }
    return true;
  }
}