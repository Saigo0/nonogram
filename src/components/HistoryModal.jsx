export default function HistoryModal({ history, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl animate-fade-in-up flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-gray-800">Meus Recordes 🏆</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-colors font-bold text-xl px-3 py-1 bg-gray-100 rounded-lg hover:bg-red-50"
          >
            ✕
          </button>
        </div>

        {/* Área com rolagem (scroll) caso o jogador tenha muitas partidas salvas */}
        <div className="overflow-y-auto overflow-x-auto bg-gray-50 rounded-xl border border-gray-200">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 p-8 font-semibold">
              Você ainda não concluiu nenhuma partida. Jogue um tabuleiro para ver seus recordes!
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                  <th className="p-4 rounded-tl-xl">Data</th>
                  <th className="p-4">Tempo</th>
                  <th className="p-4">Erros</th>
                  <th className="p-4">APM</th>
                  <th className="p-4 rounded-tr-xl">Ritmo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-100 transition-colors text-gray-700">
                    <td className="p-4 font-medium">{result.date || 'Hoje'}</td>
                    <td className="p-4">{result.durationSeconds}s</td>
                    <td className={`p-4 font-bold ${result.wrongActions > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {result.wrongActions}
                    </td>
                    <td className="p-4 text-blue-600 font-semibold">{result.actionsPerMinute}</td>
                    <td className="p-4 text-purple-600 font-semibold">{result.avgActionTimeSeconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}