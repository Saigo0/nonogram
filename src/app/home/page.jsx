'use client';
import { useState, useEffect } from 'react';
import { Puzzle } from '../model/puzzle';
import VictoryModal from '../../components/VictoryModal';
import Board from '../../components/Board';

export default function NonogramPage() {
  const [puzzleInstance, setPuzzleInstance] = useState(null);
  const [grid, setGrid] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleCellAction = (e, row, col, actionType) => {
    if (e) e.preventDefault();
    if (!puzzleInstance || isSolved) return;

    const currentValue = puzzleInstance.table[row][col];
    let newValue = 0;

    if (actionType === 'fill') {
      newValue = currentValue === 1 ? 0 : 1;
    } else if (actionType === 'block') {
      newValue = currentValue === 2 ? 0 : 2;
    }

    const updated = puzzleInstance.updateCell(row, col, newValue);

    if (updated) {
      setGrid([...puzzleInstance.table.map(r => [...r])]);

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
    }
  };

  if (isLoading || !puzzleInstance) {
    return <div className="min-h-screen flex items-center justify-center text-xl font-bold">Carregando tabuleiro...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 select-none">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Nonogram</h1>
      
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