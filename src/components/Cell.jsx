export default function Cell({ state, onFill, onBlock }) {
  return (
    <div
      onClick={onFill}
      onContextMenu={onBlock}
      className={`
        w-10 h-10 border border-gray-300 flex items-center justify-center cursor-pointer
        transition-colors
        ${state === 1 ? 'bg-gray-800' : 'hover:bg-gray-200 bg-white'}
      `}
    >
      {state === 2 && (
        <span className="text-red-500 font-bold text-xl leading-none select-none">X</span>
      )}
    </div>
  );
}