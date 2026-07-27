import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react';
import * as api from '../services/api';

export default function FilterBar({
  games,
  filters,
  setFilters,
  resetFilters,
  onApply,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [platforms, setPlatforms] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, g] = await Promise.all([
          api.fetchPlatforms(),
          api.fetchGenres(),
        ]);
        setPlatforms(p.map(x => x.name).sort());
        setGenres(g.map(x => x.name).sort());
      } catch {
        const p = Array.from(new Set(games.map(g => g.platform?.name).filter(Boolean))).sort();
        const g = Array.from(new Set(games.flatMap(g => g.genres || []).filter(Boolean))).sort();
        setPlatforms(p);
        setGenres(g);
      } finally {
        setLoadingCatalogs(false);
      }
    }
    load();
  }, []);

  const handleTextChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key, value) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  };

  const toggleGenre = (genre) => {
    setFilters(prev => {
      const selectedGenres = prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres: selectedGenres };
    });
  };

  const activeCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'genres' || key === 'platform' || key === 'gameplayStatus') return val.length > 0;
    if (key === 'hds') return val.length > 0;
    if (key === 'minInterest') return val > 0;
    if (key === 'maxInterest') return val > 0 && val < 5;
    if (key === 'search') return val !== '';
    if (key === 'installed') return val !== 'all';
    if (key === 'coopType') return val !== 'all';
    if (typeof val === 'boolean') return val;
    return false;
  }).length;

  const filterContent = (
    <div className="space-y-5">
      {/* Search Input */}
      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">Buscar Jogo</label>
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={handleTextChange}
            placeholder="Nome do jogo..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 outline-none transition"
          />
        </div>
      </div>

      {/* Gameplay Status */}
      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">Status de Gameplay</label>
        <div className="flex flex-wrap gap-1.5">
          {['Backlog', 'Jogando', 'Finalizado', 'Abandonado'].map(status => {
            const selected = filters.gameplayStatus.includes(status);
            return (
              <button
                key={status}
                onClick={() => toggleArrayFilter('gameplayStatus', status)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition ${
                  selected
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform */}
      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">Plataforma</label>
        {loadingCatalogs ? (
          <div className="flex items-center space-x-2 text-zinc-500 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
            {platforms.length === 0 ? (
              <span className="text-xs text-zinc-500">Nenhuma plataforma</span>
            ) : (
              platforms.map(p => {
                const selected = filters.platform.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => toggleArrayFilter('platform', p)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${
                      selected
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Vontade de Jogar (Mínimo) */}
      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">Vontade de Jogar (Mínimo)</label>
        <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 p-2 rounded-lg">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleFilterChange('minInterest', star === filters.minInterest ? 0 : star)}
              className={`text-lg transition ${
                star <= filters.minInterest ? 'text-amber-400 scale-110' : 'text-zinc-700 hover:text-zinc-500'
              }`}
            >
              ★
            </button>
          ))}
          <span className="text-xs text-zinc-500 ml-auto">
            {filters.minInterest > 0 ? `★ ${filters.minInterest}+` : 'Qualquer'}
          </span>
        </div>
      </div>

      {/* Vontade de Jogar (Máximo) */}
      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">Vontade de Jogar (Máximo)</label>
        <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 p-2 rounded-lg">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleFilterChange('maxInterest', star === filters.maxInterest ? 5 : star)}
              className={`text-lg transition ${
                star <= filters.maxInterest ? 'text-amber-400 scale-110' : 'text-zinc-700 hover:text-zinc-500'
              }`}
            >
              ★
            </button>
          ))}
          <span className="text-xs text-zinc-500 ml-auto">
            {filters.maxInterest > 0 && filters.maxInterest < 5 ? `★ até ${filters.maxInterest}` : 'Qualquer'}
          </span>
        </div>
      </div>

      {/* Coop Mode */}
      <div className="space-y-1.5">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">Multiplayer / Coop</label>
        <select
          value={filters.coopType}
          onChange={(e) => handleFilterChange('coopType', e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition"
        >
          <option value="all">Todos</option>
          <option value="Um Jogador">Um Jogador</option>
          <option value="Sofá">Coop de Sofá (Local)</option>
          <option value="Online">Coop/Multiplayer Online</option>
          <option value="LAN">LAN</option>
        </select>
      </div>

      {/* Genres Tag Cloud */}
      <div className="space-y-2 border-t border-zinc-800 pt-3">
        <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider block">Filtro por Gêneros</label>
        {loadingCatalogs ? (
          <div className="flex items-center space-x-2 text-zinc-500 text-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {genres.map(genre => {
              const isSelected = filters.genres.includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Desktop: always visible sidebar
  const desktopFilters = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-5 h-fit xl:sticky xl:top-6 hidden xl:block w-64 flex-shrink-0">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2 text-white font-semibold">
          <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
          <span>Filtros</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onApply(filters)}
            className="text-indigo-400 hover:text-indigo-300 p-1 hover:bg-indigo-500/10 rounded transition"
            title="Aplicar filtros"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetFilters}
            className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded transition"
            title="Limpar todos os filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {filterContent}
    </div>
  );

  // Mobile/Tablet: collapsible dropdown
  const mobileFilters = (
    <div className="xl:hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-zinc-900 border rounded-xl px-5 py-3 transition ${
          isOpen ? 'border-indigo-500/50 rounded-b-none' : 'border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">Filtros Avançados</span>
          {activeCount > 0 && (
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
              {activeCount} ativos
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => { e.stopPropagation(); onApply(filters); setIsOpen(false); }}
            className="text-indigo-400 hover:text-indigo-300 p-1 hover:bg-indigo-500/10 rounded transition"
            title="Aplicar filtros"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); resetFilters(); }}
            className="text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded transition"
            title="Limpar filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="bg-zinc-900 border border-t-0 border-zinc-800 rounded-b-xl px-5 py-4 shadow-lg">
          {filterContent}
        </div>
      )}
    </div>
  );

  return (
    <>
      {desktopFilters}
      {mobileFilters}
    </>
  );
}
