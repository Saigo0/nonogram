'use client';
import { useState, useEffect } from 'react';
import { Puzzle } from '../model/puzzle';
import VictoryModal from '../../components/VictoryModal';
import Board from '../../components/Board';
import { NonogramSolver } from '../model/NonogramSolver';
import { AsyncNonogramSolver } from '../model/AsyncNonogramSolver';

export default function NonogramPage() {
  const [puzzleInstance, setPuzzleInstance] = useState(null);
  const [grid, setGrid] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoSolving, setIsAutoSolving] = useState(false);

  const loadPuzzle = async (size = 5) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/puzzle?size=${size}`, { cache: 'no-store' });
      
      if (!response.ok) {
        alert(`Nenhum tabuleiro ${size}x${size} encontrado no banco.`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const game = new Puzzle(data.id, data.size, data.rowClues, data.colClues);
      game.start();
      
      setPuzzleInstance(game);
      setGrid(game.table);
      setIsSolved(false);
    } catch (error) {
      console.error("Falha ao carregar o tabuleiro", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPuzzle(5);
  }, []);

  const checkWinCondition = () => {
    if (puzzleInstance.isSolved()) {
      puzzleInstance.finish();
      setIsSolved(true);
      
      const duration = puzzleInstance.getElapsedTime();
      const minutes = duration / 60;
      const apm = minutes > 0 ? puzzleInstance.actions / minutes : puzzleInstance.actions;

      fetch('/api/puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: puzzleInstance.id,
          player: 'Jogador Web', 
          durationSeconds: duration,
          wrongActions: puzzleInstance.wrongActions,
          actionsPerMinute: Number(apm.toFixed(3))
        })
      });
    }
  };

  const handleCellAction = (e, row, col, actionType) => {
    if (e) e.preventDefault();
    if (!puzzleInstance || isSolved || isAutoSolving) return;

    const currentValue = puzzleInstance.table[row][col];
    let newValue = 0;

    if (actionType === 'fill') newValue = currentValue === 1 ? 0 : 1;
    else if (actionType === 'block') newValue = currentValue === 2 ? 0 : 2;

    const updated = puzzleInstance.updateCell(row, col, newValue);

    if (updated) {
      setGrid([...puzzleInstance.table.map(r => [...r])]);
      console.log("Checando vitória...");
      console.log("Está resolvido?", puzzleInstance.isSolved());
      checkWinCondition();
    }
  };

  const handleHint = () => {
    if (!puzzleInstance || isSolved || isAutoSolving) return;

    const solver = new NonogramSolver(puzzleInstance.size);
    
    const emptyTable = Array(puzzleInstance.size).fill().map(() => Array(puzzleInstance.size).fill(0));
    const solution = solver.solve(puzzleInstance.rowClues, puzzleInstance.colClues, emptyTable);
    
    if (!solution) return;

    const candidates = [];
    for (let r = 0; r < puzzleInstance.size; r++) {
      for (let c = 0; c < puzzleInstance.size; c++) {
        if (puzzleInstance.table[r][c] !== solution[r][c]) {
          candidates.push({ r, c, correctValue: solution[r][c] });
        }
      }
    }

    if (candidates.length > 0) {
      const choice = candidates[Math.floor(Math.random() * candidates.length)];
      
      puzzleInstance.updateCell(choice.r, choice.c, choice.correctValue);
      setGrid([...puzzleInstance.table.map(row => [...row])]);
      
      checkWinCondition();
    }
  };

  const handleAutoSolve = async () => {
    if (!puzzleInstance || isSolved || isAutoSolving) return;
    
    setIsAutoSolving(true);
    
    const onUpdate = (newTable) => {
      setGrid(newTable);
    };

    const speed = puzzleInstance.size <= 10 ? 100 : 20;

    const asyncSolver = new AsyncNonogramSolver(puzzleInstance.size, onUpdate, speed);
    
    const emptyTable = Array(puzzleInstance.size).fill().map(() => Array(puzzleInstance.size).fill(0));
    
    const finalSolution = await asyncSolver.solve(puzzleInstance.rowClues, puzzleInstance.colClues, emptyTable);

    if (finalSolution) {
      for (let r = 0; r < puzzleInstance.size; r++) {
        for (let c = 0; c < puzzleInstance.size; c++) {
          if (puzzleInstance.table[r][c] !== finalSolution[r][c]) {
             puzzleInstance.updateCell(r, c, finalSolution[r][c]);
          }
        }
      }
      setGrid([...puzzleInstance.table.map(row => [...row])]);
      checkWinCondition();
    }
    
    setIsAutoSolving(false);
  };
  
  if (isLoading || !puzzleInstance) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Carregando tabuleiro...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 select-none">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Nonogram</h1>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={handleHint}
            disabled={isAutoSolving || isSolved}
            className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold rounded-lg shadow disabled:opacity-50 transition-colors"
          >
            💡 Pedir Dica
          </button>

          <button 
            onClick={handleAutoSolve}
            disabled={isAutoSolving || isSolved}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow disabled:opacity-50 flex items-center transition-colors"
          >
            {isAutoSolving ? (
              <span className="animate-pulse">🤖 Resolvendo...</span>
            ) : (
              <span>🤖 Auto-Resolver</span>
            )}
          </button>
        </div>
      
      {isSolved && (
        <VictoryModal 
          time={puzzleInstance.getElapsedTime()} 
          wrongActions={puzzleInstance.wrongActions} 
          onSelectSize={loadPuzzle} 
        />
      )}

      <Board 
        puzzleInstance={puzzleInstance} 
        grid={grid} 
        onCellAction={handleCellAction} 
      />
    </div>
  );
}