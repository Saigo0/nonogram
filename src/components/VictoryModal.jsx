export default function VictoryModal({ result, onSelectSize }) {
  const availableSizes = [5, 10, 15, 20, 25];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in-up">
        <h2 className="text-4xl font-extrabold text-green-500 mb-6">Resolvido! 🎉</h2>
        
        <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200 shadow-inner">
          <p className="text-gray-600 text-lg flex justify-between border-b border-gray-200 pb-2 mb-2">
            <span>Jogador:</span>
            <span className="font-bold text-gray-800">{result.player}</span>
          </p>
          <p className="text-gray-600 text-lg flex justify-between border-b border-gray-200 pb-2 mb-2">
            <span>Tempo:</span>
            <span className="font-bold text-gray-800">{result.durationSeconds}s</span>
          </p>
          <p className="text-gray-600 text-lg flex justify-between border-b border-gray-200 pb-2 mb-2">
            <span>Erros:</span>
            <span className="font-bold text-red-500">{result.wrongActions}</span>
          </p>
          <p className="text-gray-600 text-lg flex justify-between pt-1">
            <span>APM (Ações/Min):</span>
            <span className="font-bold text-blue-600">{result.actionsPerMinute}</span>
          </p>
        </div>
        
        <div className="w-full h-px bg-gray-200 mb-6"></div>

        <h3 className="text-lg font-semibold text-gray-700 mb-4">Escolha o próximo desafio:</h3>
        
        <div className="flex flex-wrap justify-center gap-3">
          {availableSizes.map(size => (
            <button
              key={size}
              onClick={() => onSelectSize(size)}
              className="px-4 py-2 bg-gray-800 hover:bg-black text-white font-bold rounded-lg shadow transition-transform transform hover:scale-105 active:scale-95"
            >
              {size}x{size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}