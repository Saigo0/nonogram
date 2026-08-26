export default function VictoryModal({ time, wrongActions, onSelectSize }) {
  const availableSizes = [5, 10, 15, 20, 25];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in-up">
        <h2 className="text-4xl font-extrabold text-green-500 mb-4">Resolvido! 🎉</h2>
        <p className="text-gray-600 mb-6 text-lg">
          Tempo: <span className="font-bold text-gray-800">{time}s</span> <br/>
          Erros: <span className="font-bold text-gray-800">{wrongActions}</span>
        </p>
        
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