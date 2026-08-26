import Cell from './Cell';

export default function Board({ puzzleInstance, grid, onCellAction }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex">
        <div className="w-24 h-24 border-r-2 border-b-2 border-gray-800 bg-gray-200" />
        
        <div className="flex bg-gray-50 border-b-2 border-gray-800">
          {puzzleInstance.colClues.map((clues, cIdx) => (
            <div key={`col-${cIdx}`} className="w-10 h-24 flex flex-col items-center justify-end pb-1 border-r border-gray-900">
              {clues.map((num, i) => (
                <span key={i} className="text-sm font-bold text-black">{num}</span>
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
                <span key={i} className="ml-1 text-sm font-bold text-black">{num}</span>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col border-2 border-gray-800 bg-white shadow-lg">
          {grid.map((row, rowIndex) => (
            <div key={`grid-row-${rowIndex}`} className="flex">
              {row.map((cellState, colIndex) => (
                <Cell 
                  key={`cell-${rowIndex}-${colIndex}`}
                  state={cellState}
                  onFill={(e) => onCellAction(e, rowIndex, colIndex, 'fill')}
                  onBlock={(e) => onCellAction(e, rowIndex, colIndex, 'block')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}