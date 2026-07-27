import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { LayoutGrid, List, Plus, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { mockGames } from '../data/mockGames';
import * as api from '../services/api';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import GameCard from '../components/GameCard';
import GameRow from '../components/GameRow';
import GameModal from '../components/GameModal';

const DEFAULT_FILTERS = {
  search: '',
  installed: 'all',
  hds: [],
  platform: [],
  gameplayStatus: [],
  minInterest: 0,
  maxInterest: 0,
  coopType: 'all',
  genres: [],
  mustTestOnly: false,
  highInterestOnly: false,
  missingDataOnly: false,
};

export default function Library() {
  const [games, setGames] = useState(mockGames);
  const [total, setTotal] = useState(mockGames.length);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const loadedRef = useRef(false);

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const data = await api.fetchGames({ limit: 60, offset: 0 });
      setGames(data.items);
      setTotal(data.total);
      setHasMore(data.has_more);
      loadedRef.current = true;
    } catch (err) {
      console.warn('API unavailable, using mock data:', err.message);
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    try {
      setLoadingMore(true);
      const data = await api.fetchGames({ limit: 60, offset: games.length });
      setGames(prev => [...prev, ...data.items]);
      setHasMore(data.has_more);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [games.length]);

  const reloadAll = useCallback(async () => {
    loadedRef.current = false;
    setGames([]);
    await loadInitial();
  }, [loadInitial]);

  const applyFilters = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      setApiError(null);
      const params = { limit: 200 };
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.gameplayStatus.length === 1) {
        params.status = currentFilters.gameplayStatus[0];
      }
      const data = await api.fetchGames(params);
      setGames(data.items);
      setTotal(data.total);
      setHasMore(data.has_more);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // Auto-switch to grid on very small screens
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 640 && viewMode === 'table') {
        setViewMode('grid');
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [viewMode]);

  const hasMissingData = (game) => {
    if (!game.cover_url) return true;
    if (!game.hltb_main) return true;
    if (!game.genres?.length) return true;
    if (!game.notes) return true;
    if (!game.platform) return true;
    if (game.gameplay_status === 'Finalizado') {
      if (!game.score) return true;
      if (!game.finish_hours) return true;
      if (!game.finish_date) return true;
      if (!game.replay_score || game.replay_score === 0) return true;
    }
    return false;
  };

  // Apply filters
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      if (filters.search && !game.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.mustTestOnly && !game.must_test) return false;
      if (filters.missingDataOnly && !hasMissingData(game)) return false;
      if (filters.highInterestOnly && game.interest_rating < 4) return false;
      if (filters.installed === 'installed' && !game.storage_device) return false;
      if (filters.installed === 'uninstalled' && game.storage_device) return false;
      if (filters.hds.length > 0) {
        const showUninstalled = filters.hds.includes('__uninstalled__');
        if (showUninstalled && !game.storage_device) { /* keep */ }
        else if (game.storage_device && filters.hds.includes(game.storage_device.name)) { /* keep */ }
        else if (!showUninstalled || game.storage_device) return false;
      }
      if (filters.platform.length > 0 && !filters.platform.includes(game.platform?.name)) return false;
      if (filters.gameplayStatus.length > 0 && !filters.gameplayStatus.includes(game.gameplay_status)) return false;
      if (filters.minInterest > 0 && game.interest_rating < filters.minInterest) return false;
      if (filters.maxInterest > 0 && filters.maxInterest < 5 && game.interest_rating > filters.maxInterest) return false;
      if (filters.coopType !== 'all' && !(game.coop_type || []).includes(filters.coopType)) return false;
      if (filters.genres.length > 0) {
        const hasGenre = filters.genres.some(g => (game.genres || []).includes(g));
        if (!hasGenre) return false;
      }
      return true;
    });
  }, [games, filters]);

  const handleCardClick = (game) => {
    setSelectedGame(game);
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedGame(null);
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      setApiError(null);
      if (selectedGame) {
        await api.updateGame(selectedGame.id, formData);
      } else {
        await api.createGame(formData);
      }
      await reloadAll();
    } catch (err) {
      setApiError(err.message);
      return;
    }
    setModalOpen(false);
    setSelectedGame(null);
  };

  const handleDelete = async (id) => {
    try {
      setApiError(null);
      await api.deleteGame(id);
      await reloadAll();
    } catch (err) {
      setApiError(err.message);
    }
    setModalOpen(false);
    setSelectedGame(null);
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const handleQuickFilter = (type, value) => {
    if (type === 'mustTestOnly') {
      setFilters(prev => ({ ...prev, mustTestOnly: !prev.mustTestOnly }));
    } else if (type === 'backlogFocus') {
      setFilters(prev => {
        const isActive = prev.highInterestOnly && prev.gameplayStatus.includes('Backlog');
        if (isActive) {
          return { ...prev, highInterestOnly: false, gameplayStatus: [] };
        } else {
          return { ...prev, highInterestOnly: true, gameplayStatus: ['Backlog'] };
        }
      });
    } else if (type === 'hds') {
      setFilters(prev => ({ ...prev, hds: value }));
    } else if (type === 'missingDataOnly') {
      setFilters(prev => ({ ...prev, missingDataOnly: !prev.missingDataOnly }));
    }
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'genres') return val.length > 0;
    if (key === 'hds') return val.length > 0;
    if (key === 'minInterest') return val > 0;
    if (key === 'maxInterest') return val > 0 && val < 5;
    if (key === 'search') return val !== '';
    if (key === 'installed') return val !== 'all';
    if (key === 'platform') return val.length > 0;
    if (key === 'gameplayStatus') return val.length > 0;
    if (key === 'missingDataOnly') return val;
    if (key === 'coopType') return val !== 'all';
    if (typeof val === 'boolean') return val;
    return false;
  }).length;

  return (
    <div className="min-h-screen bg-[#0c0a0f]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Biblioteca de Jogos</h1>
              <p className="text-zinc-500 text-sm mt-0.5">
                {filteredGames.length} de {total} jogos
                {activeFiltersCount > 0 && (
                  <span className="text-indigo-400 ml-1">({activeFiltersCount} filtros ativos)</span>
                )}
              </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddNew}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition flex items-center space-x-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Jogo</span>
            </button>
          </div>
        </div>

        {/* API Status Banner */}
        {apiError && (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium px-4 py-2 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>API: {apiError} — usando dados mockados</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando biblioteca...</span>
          </div>
        ) : (
          <StatsCard
            games={games}
            filters={filters}
            onQuickFilter={handleQuickFilter}
          />
        )}

        {/* Mobile/Tablet Filter Dropdown + Desktop Sidebar + Game List */}
        <div className="xl:flex xl:flex-row xl:gap-6">
          <FilterBar
            games={games}
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            onApply={applyFilters}
          />

          {/* Game List */}
          <div className="flex-1 min-w-0 mt-4 xl:mt-0">
            {viewMode === 'grid' ? (
              <>
                {filteredGames.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">
                    <p className="text-lg font-medium">Nenhum jogo encontrado</p>
                    <p className="text-sm mt-1">Tente ajustar os filtros ou adicionar um novo jogo.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredGames.map(game => (
                        <GameCard key={game.id} game={game} onClick={handleCardClick} />
                      ))}
                    </div>
                    {hasMore && filteredGames.length === games.length && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="flex items-center space-x-2 px-6 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                        >
                          {loadingMore ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span>{loadingMore ? 'Carregando...' : 'Carregar mais jogos'}</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {filteredGames.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">
                    <p className="text-lg font-medium">Nenhum jogo encontrado</p>
                    <p className="text-sm mt-1">Tente ajustar os filtros.</p>
                  </div>
                ) : (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead>
                          <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] font-semibold uppercase tracking-wider">
                            <th className="text-left py-3 px-4">Jogo</th>
                            <th className="text-left py-3 px-2">Status</th>
                            <th className="text-left py-3 px-2">Plataforma</th>
                            <th className="text-left py-3 px-2">Gêneros</th>
                            <th className="text-left py-3 px-2">HD</th>
                            <th className="text-left py-3 px-2">HLTB | Played</th>
                            <th className="text-left py-3 px-2">Vontade</th>
                            <th className="text-center py-3 px-4">Nota</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGames.map(game => (
                            <GameRow key={game.id} game={game} onClick={handleCardClick} />
                          ))}
                        </tbody>
                      </table>
                      {hasMore && filteredGames.length === games.length && (
                        <div className="flex justify-center py-4 border-t border-zinc-800">
                          <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="flex items-center space-x-2 px-6 py-3 text-zinc-400 hover:text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                          >
                            {loadingMore ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <span>{loadingMore ? 'Carregando...' : 'Carregar mais jogos'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal */}
        <GameModal
          games={games}
          game={selectedGame}
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedGame(null); }}
          isEditing={isEditing}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
