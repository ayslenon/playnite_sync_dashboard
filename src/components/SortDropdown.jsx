import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, X } from 'lucide-react';

const FIELDS = [
  { value: 'title', label: 'Título' },
  { value: 'interest_rating', label: 'Vontade' },
  { value: 'score', label: 'Nota' },
  { value: 'gameplay_status', label: 'Status' },
  { value: 'hltb_main', label: 'HLTB (Main)' },
  { value: 'hltb_main_extra', label: 'HLTB (Main+)' },
  { value: 'hltb_full', label: 'HLTB (100%)' },
  { value: 'playtime_seconds', label: 'Tempo Jogado' },
  { value: 'coop_players', label: 'Jogadores' },
  { value: 'updated_at', label: 'Atualização' },
  { value: 'created_at', label: 'Criação' },
];

export default function SortDropdown({ sort, onChange }) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState('interest_rating');
  const [dir, setDir] = useState('desc');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addSort = () => {
    if (!field) return;
    if (sort.some(s => s.field === field)) return;
    const next = [...sort, { field, dir }];
    onChange(next);
  };

  const removeSort = (index) => {
    onChange(sort.filter((_, i) => i !== index));
  };

  const toggleDir = (index) => {
    onChange(sort.map((s, i) =>
      i === index ? { ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' } : s
    ));
  };

  const moveSort = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sort.length) return;
    const arr = [...sort];
    [arr[index], arr[target]] = [arr[target], arr[index]];
    onChange(arr);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center sm:space-x-2 px-3 py-2 rounded-lg text-xs font-bold border transition h-9 ${
          sort.length > 0
            ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400'
            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:border-zinc-700'
        }`}
      >
        <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline">Ordenar</span>
        {sort.length > 0 && (
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-full">
            {sort.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50">
          <div className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider mb-3 flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ordenação</span>
          </div>

          {sort.length > 0 && (
            <div className="space-y-1 mb-3">
              {sort.map((s, i) => {
                const f = FIELDS.find(f => f.value === s.field);
                return (
                  <div
                    key={i}
                    className="flex items-center space-x-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <span className="text-zinc-300 font-medium flex-1 truncate">
                      {f?.label || s.field}
                    </span>
                    <button
                      onClick={() => moveSort(i, -1)}
                      disabled={i === 0}
                      className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 p-0.5"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveSort(i, 1)}
                      disabled={i === sort.length - 1}
                      className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 p-0.5"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggleDir(i)}
                      className={`w-10 text-center px-1 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                        s.dir === 'asc'
                          ? 'bg-indigo-600/20 text-indigo-400'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {s.dir === 'asc' ? 'ASC' : 'DESC'}
                    </button>
                    <button
                      onClick={() => removeSort(i)}
                      className="text-zinc-600 hover:text-red-400 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <select
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
            >
              {FIELDS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <button
              onClick={() => setDir(d => d === 'asc' ? 'desc' : 'asc')}
              className={`w-10 text-center px-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition ${
                dir === 'asc'
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {dir === 'asc' ? 'ASC' : 'DESC'}
            </button>
            <button
              onClick={addSort}
              disabled={sort.some(s => s.field === field)}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white p-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
