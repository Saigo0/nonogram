'use client';
import { useState, useEffect } from 'react';
import { Puzzle } from '../model/puzzle'; 

export default function NonogramPage() {
  const [puzzleInstance, setPuzzleInstance] = useState(null);
  const [grid, setGrid] = useState([]);
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    async function fetchPuzzle() {
      try {
        const response = await fetch('/api/puzzle?size=5');
        
        if (!response.ok) {
          const textError = await response.text();
          console.error(`Erro na API (Status ${response.status}):`, textError);
          return; 
        }

        const data = await response.json();
        
        const game = new Puzzle(data.id, data.size, data.rowClues, data.colClues);
        game.start();
        
        setPuzzleInstance(game);
        setGrid(game.table);
        
      } catch (error) {
        console.error("Falha ao carregar o tabuleiro", error);
      }
    }

    fetchPuzzle();
  }, []);

  const handleCellAction = (e, row, col, actionType) => {
    if (e) e.preventDefault(); 
    if (!puzzleInstance || isSolved) return;

    const currentValue = puzzleInstance.table[row][col];
    let newValue = 0; 

    if (actionType === 'fill') {
      newValue = currentValue === 1 ? 0 : 1;
    } 
    else if (actionType === 'block') {
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

  if (!puzzleInstance) return <div className="p-8 text-center">Carregando tabuleiro...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 select-none">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Nonogram</h1>
      
      {isSolved && (
        <div className="mb-4 px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md animate-bounce">
          Parabéns! Puzzle resolvido em {puzzleInstance.getElapsedTime()}s com {puzzleInstance.wrongActions} erros!
        </div>
      )}

      <div className="flex">
        <div className="w-24 h-24 border-r-2 border-b-2 border-gray-800 bg-gray-200" />
        
        <div className="flex bg-gray-50 border-b-2 border-gray-800">
          {puzzleInstance.colClues.map((clues, cIdx) => (
            <div key={`col-${cIdx}`} className="w-10 h-24 flex flex-col items-center justify-end pb-1 border-r border-gray-300">
              {clues.map((num, i) => (
                <span key={i} className="text-sm font-semibold">{num}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex">
        <div className="flex flex-col bg-gray-50 border-r-2 border-gray-800">
          {puzzleInstance.rowClues.map((clues, rIdx) => (
            <div key={`row-${rIdx}`} className="w-24 h-10 flex items-center justify-end pr-2 border-b border-gray-300">
              {clues.map((num, i) => (
                <span key={i} className="ml-1 text-sm font-semibold">{num}</span>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col border-2 border-gray-800 bg-white shadow-lg">
          {grid.map((row, rowIndex) => (
            <div key={`grid-row-${rowIndex}`} className="flex">
              {row.map((cellState, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  onClick={(e) => handleCellAction(e, rowIndex, colIndex, 'fill')}
                  onContextMenu={(e) => handleCellAction(e, rowIndex, colIndex, 'block')}
                  className={`
                    w-10 h-10 border border-gray-300 flex items-center justify-center cursor-pointer
                    transition-colors
                    ${cellState === 1 ? 'bg-gray-800' : 'hover:bg-gray-200 bg-white'}
                  `}
                >
                  {cellState === 2 && (
                    <span className="text-red-500 font-bold text-xl leading-none">X</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}