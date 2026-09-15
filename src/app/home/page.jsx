'use client';
import { useState, useEffect } from 'react';
import { Puzzle } from '../model/puzzle';
import { Result } from '../model/result';
import { NonogramSolver } from '../model/NonogramSolver';
import { AsyncNonogramSolver } from '../model/AsyncNonogramSolver';
import VictoryModal from '../../components/VictoryModal';
import Board from '../../components/Board';
import HistoryModal from '../../components/HistoryModal';

export default function NonogramPage() {
  const [puzzleInstance, setPuzzleInstance] = useState(null);
  const [grid, setGrid] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isAutoSolving, setIsAutoSolving] = useState(false);
  const [matchResult, setMatchResult] = useState(null); 

  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const handleOpenHistory = () => {
    try {
      const existingData = localStorage.getItem('nonogram_history');
      if (existingData) {
        // Inverte o array para mostrar as partidas mais recentes no topo
        const parsed = JSON.parse(existingData);
        setHistoryData(parsed.reverse()); 
      } else {
        setHistoryData([]);
      }
      setShowHistory(true);
    } catch (error) {
      console.error("Erro ao ler histórico", error);
      setHistoryData([]);
    }
  };
  const availableSizes = [5, 10, 15, 20, 25];

  const loadPuzzle = async (size) => {
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
      setMatchResult(null); 
    } catch (error) {
      console.error("Falha ao carregar", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToLocalHistory = (resultData) => {
    try {
      const existingData = localStorage.getItem('nonogram_history');
      
      const history = existingData ? JSON.parse(existingData) : [];
      
      const newEntry = {
        ...resultData,
        date: new Date().toLocaleDateString('pt-BR')
      };
      history.push(newEntry);
      
      localStorage.setItem('nonogram_history', JSON.stringify(history));
      
      console.log("Histórico salvo no navegador!", history);
    } catch (error) {
      console.error("Erro ao salvar no localStorage", error);
    }
  };

  const checkWinCondition = () => {
    if (puzzleInstance.isSolved()) {
      puzzleInstance.finish();

      const finalResult = Result.fromPuzzle('Jogador Web', puzzleInstance);
      
      setMatchResult(finalResult);
      setIsSolved(true);
      saveToLocalHistory(finalResult);

      fetch('/api/puzzle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: puzzleInstance.id,
          player: finalResult.player,
          durationSeconds: finalResult.durationSeconds,
          wrongActions: finalResult.wrongActions,
          actionsPerMinute: finalResult.actionsPerMinute
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-800 mb-4"></div>
        <p className="text-xl font-bold text-gray-800">Carregando tabuleiro...</p>
      </div>
    );
  }

  if (!puzzleInstance) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 select-none">
        
        {showHistory && (
          <HistoryModal 
            history={historyData} 
            onClose={() => setShowHistory(false)} 
          />
        )}

        <h1 className="text-5xl font-extrabold mb-10 text-gray-800 tracking-tight">Nonogram</h1>
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-lg w-full transform animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-700 mb-8">Escolha a dificuldade</h2>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => loadPuzzle(size)}
                className="px-6 py-3 bg-gray-800 hover:bg-black text-white font-bold text-lg rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-95"
              >
                {size}x{size}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <button 
              onClick={handleOpenHistory}
              className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded-lg transition-colors flex items-center justify-center w-full"
            >
              📊 Ver Meus Recordes
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 select-none">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Nonogram</h1>
      
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

      {isSolved && matchResult && (
        <VictoryModal 
          result={matchResult} 
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