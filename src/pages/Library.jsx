import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { LayoutGrid, List, Plus, Loader2, AlertCircle, ChevronDown, FlaskConical, Bookmark, AlertTriangle, HardDrive, Star, Gamepad2, Keyboard, X, Check, Download } from 'lucide-react';
import * as api from '../services/api';
import FilterBar from '../components/FilterBar';
import GameCard from '../components/GameCard';
import GameRow from '../components/GameRow';
import GameModal from '../components/GameModal';
import SortDropdown from '../components/SortDropdown';
import { useToast } from '../components/Toast';

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
  favoriteOnly: false,
  inputRec: 'all',
  highInterestOnly: false,
  missingDataOnly: false,
  sort: [],
};

const CHUNK_SIZE = 120;
const DISPLAY_STEP = 60;

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function Library() {
  const { showToast } = useToast();
  const [games, setGames] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayCount, setDisplayCount] = useState(DISPLAY_STEP);
  const [prefetchProgress, setPrefetchProgress] = useState(null);
  const [hdPopupOpen, setHdPopupOpen] = useState(false);
  const [selectedHds, setSelectedHds] = useState([]);
  const sentinelRef = useRef(null);
  const loadedRef = useRef(false);

  const loadChunk = useCallback(async (offset) => {
    try {
      const data = await api.fetchGames({ limit: CHUNK_SIZE, offset });
      return data;
    } catch (err) {
      console.warn(`Chunk at offset ${offset} failed:`, err.message);
      if (offset === 0) throw err;
      return { items: [], total: 0, has_more: false };
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      setDisplayCount(DISPLAY_STEP);
      setPrefetchProgress(null);

      const data = await loadChunk(0);
      setGames(data.items);
      setTotal(data.total);

      if (data.has_more) {
        setPrefetchProgress({ loaded: data.items.length, total: data.total });
        const allGames = [...data.items];
        let offset = CHUNK_SIZE;
        let consecutiveFails = 0;

        while (offset < data.total && consecutiveFails < 3) {
          const chunk = await loadChunk(offset);
          if (chunk.items.length === 0) {
            consecutiveFails++;
            offset += CHUNK_SIZE;
            continue;
          }
          consecutiveFails = 0;
          allGames.push(...chunk.items);
          offset += CHUNK_SIZE;
          setGames([...allGames]);
          setPrefetchProgress({ loaded: allGames.length, total: data.total });
        }

        setPrefetchProgress(null);
      }

      loadedRef.current = true;
    } catch (err) {
      console.warn('API unavailable:', err.message);
      setApiError(err.message);
      showToast(err.message || 'Erro ao carregar jogos', 'error', 6000);
    } finally {
      setLoading(false);
    }
  }, [loadChunk, showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const reloadSilent = useCallback(async () => {
    try {
      const data = await loadChunk(0);
      const allGames = [...data.items];
      let offset = CHUNK_SIZE;
      let consecutiveFails = 0;

      while (offset < data.total && consecutiveFails < 3) {
        const chunk = await loadChunk(offset);
        if (chunk.items.length === 0) {
          consecutiveFails++;
          offset += CHUNK_SIZE;
          continue;
        }
        consecutiveFails = 0;
        allGames.push(...chunk.items);
        offset += CHUNK_SIZE;
      }

      setGames(allGames);
      setTotal(data.total);
    } catch {
      // silent — toast already shown by caller
    }
  }, [loadChunk]);

  const loadMoreDisplay = useCallback(() => {
    setDisplayCount(prev => prev + DISPLAY_STEP);
  }, []);

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  // Scroll to top when sort changes
  useEffect(() => {
    scrollToTop();
  }, [filters.sort]);

  // Sync selectedHds with filters.hds when popup opens
  useEffect(() => {
    setSelectedHds([...filters.hds]);
  }, [filters.hds, hdPopupOpen]);

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
      if (filters.favoriteOnly && !game.favorite) return false;
      if (filters.inputRec !== 'all' && game.input_recommendation !== filters.inputRec) return false;
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

  // Apply sort
  const sortedGames = useMemo(() => {
    if (!filters.sort || filters.sort.length === 0) return filteredGames;
    return [...filteredGames].sort((a, b) => {
      for (const s of filters.sort) {
        const aVal = a[s.field];
        const bVal = b[s.field];
        let cmp = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          cmp = aVal.localeCompare(bVal);
        } else {
          cmp = (aVal ?? 0) - (bVal ?? 0);
        }
        if (cmp !== 0) return s.dir === 'desc' ? -cmp : cmp;
      }
      return 0;
    });
  }, [filteredGames, filters.sort]);

  const displayedGames = useMemo(() => {
    return sortedGames.slice(0, displayCount);
  }, [sortedGames, displayCount]);

  const hasMoreDisplay = displayCount < sortedGames.length;

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || !hasMoreDisplay) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setDisplayCount(prev => prev + DISPLAY_STEP);
        observer.disconnect();
      }
    }, { rootMargin: '400px' });

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, hasMoreDisplay, displayCount]);

  // Quick filter counts
  const mustTestCount = useMemo(() =>
    games.filter(g => g.must_test && g.storage_device).length,
  [games]);

  const favoriteCount = useMemo(() =>
    games.filter(g => g.favorite).length,
  [games]);

  const backlogFocusCount = useMemo(() =>
    games.filter(g => g.gameplay_status === 'Backlog' && g.interest_rating >= 4).length,
  [games]);

  const missingDataCount = useMemo(() =>
    games.filter(hasMissingData).length,
  [games]);

  const installedGames = useMemo(() =>
    games.filter(g => g.storage_device),
  [games]);

  const uninstalledCount = games.length - installedGames.length;

  const inputFilteredCount = useMemo(() => {
    if (filters.inputRec === 'all') return games.length;
    return games.filter(g => g.input_recommendation === filters.inputRec).length;
  }, [games, filters.inputRec]);

  const hdBreakdown = useMemo(() =>
    installedGames.reduce((acc, game) => {
      const name = game.storage_device?.name;
      if (name) {
        acc[name] = (acc[name] || 0) + 1;
      }
      return acc;
    }, {}),
  [installedGames]);

  const hdEntries = useMemo(() =>
    Object.entries(hdBreakdown).sort((a, b) => b[1] - a[1]),
  [hdBreakdown]);

  const handleToggleFavorite = async (gameId, newVal) => {
    try {
      await api.updateGame(gameId, { favorite: newVal });
      setGames(prev => prev.map(g => g.id === gameId ? { ...g, favorite: newVal } : g));
      showToast(newVal ? 'Adicionado aos favoritos ★' : 'Removido dos favoritos', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar favorito', 'error');
    }
  };

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
    const game = selectedGame;
    const isUpdate = !!game;
    setModalOpen(false);
    setSelectedGame(null);
    try {
      if (isUpdate) {
        await api.updateGame(game.id, formData);
      } else {
        await api.createGame(formData);
      }
      showToast(isUpdate ? 'Jogo atualizado com sucesso!' : 'Jogo criado com sucesso!', 'success');
      await reloadSilent();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar jogo', 'error');
    }
  };

  const handleDelete = async (id) => {
    setModalOpen(false);
    setSelectedGame(null);
    try {
      await api.deleteGame(id);
      showToast('Jogo excluído com sucesso!', 'success');
      await reloadSilent();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir jogo', 'error');
    }
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
    } else if (type === 'favoriteOnly') {
      setFilters(prev => ({ ...prev, favoriteOnly: !prev.favoriteOnly }));
    } else if (type === 'inputRec') {
      setFilters(prev => {
        const cycle = { 'all': 'Controle', 'Controle': 'Teclado/Mouse', 'Teclado/Mouse': 'all' };
        return { ...prev, inputRec: cycle[prev.inputRec] || 'all' };
      });
    } else if (type === 'missingDataOnly') {
      setFilters(prev => ({ ...prev, missingDataOnly: !prev.missingDataOnly }));
    }
  };

  const toggleHd = (hd) => {
    setSelectedHds(prev =>
      prev.includes(hd) ? prev.filter(h => h !== hd) : [...prev, hd]
    );
  };

  const applyHdFilter = () => {
    handleQuickFilter('hds', selectedHds);
    setHdPopupOpen(false);
  };

  const clearHdFilter = () => {
    handleQuickFilter('hds', []);
    setSelectedHds([]);
    setHdPopupOpen(false);
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
    if (key === 'inputRec') return val !== 'all';
    if (typeof val === 'boolean') return val;
    return false;
  }).length;

  const isPrefetching = prefetchProgress !== null;

  const hdsActive = filters.hds.length > 0;
  const mustTestActive = filters.mustTestOnly;
  const favoriteActive = filters.favoriteOnly;
  const inputRecActive = filters.inputRec !== 'all';
  const backlogActive = filters.highInterestOnly && filters.gameplayStatus.includes('Backlog');
  const missingActive = filters.missingDataOnly;

  return (
    <div className="min-h-screen bg-[#0c0a0f]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#0c0a0f]/95 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 shrink">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">Biblioteca de Jogos</h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
                {loading ? '-' : sortedGames.length} de {total} jogos
                {activeFiltersCount > 0 && (
                  <span className="text-indigo-400 ml-1">({activeFiltersCount} ativos)</span>
                )}
                {isPrefetching && (
                  <span className="inline-flex items-center space-x-1 text-indigo-400 text-xs ml-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">{prefetchProgress.loaded} de {prefetchProgress.total}</span>
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* View toggle */}
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 h-9">
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

              {/* Sort */}
              <SortDropdown
                sort={filters.sort}
                onChange={(val) => setFilters(prev => ({ ...prev, sort: val }))}
              />

              {/* Export XLSX */}
              <button
                onClick={async () => {
                  try {
                    await api.exportXlsx();
                    showToast('Planilha exportada com sucesso!', 'success');
                  } catch (err) {
                    showToast(err.message || 'Erro ao exportar planilha', 'error');
                  }
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-sm font-bold px-3 py-2 rounded-lg transition flex items-center justify-center sm:space-x-2 h-9"
                title="Exportar planilha"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">XLSX</span>
              </button>

              {/* Add New */}
              <button
                onClick={handleAddNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-3 py-2 rounded-lg transition flex items-center justify-center sm:space-x-2 h-9"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Novo Jogo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* API Status Banner */}
        {apiError && (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium px-4 py-2 rounded-lg mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Erro de conexão com o servidor: {apiError}</span>
          </div>
        )}

        {/* Quick Filter Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Installed - HD Filter */}
          <button
            onClick={() => setHdPopupOpen(true)}
            className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative ${
              hdsActive
                ? 'border-green-500 bg-green-500/5 ring-1 ring-green-500/30'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-lg relative ${hdsActive ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-400'}`}>
                <HardDrive className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-green-400 shadow-sm">
                  {installedGames.length}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Instalados</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Armazenamento ({hdEntries.length} {hdEntries.length === 1 ? 'disco' : 'discos'})</p>
              </div>
            </div>
          </button>

          {/* Must Test */}
          <button
            onClick={() => handleQuickFilter('mustTestOnly')}
            className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative ${
              mustTestActive
                ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-lg relative ${mustTestActive ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <FlaskConical className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-amber-400 shadow-sm">
                  {mustTestCount}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Jogos a Testar</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Instalados para validar</p>
              </div>
            </div>
          </button>

          {/* Favorites */}
          <button
            onClick={() => handleQuickFilter('favoriteOnly')}
            className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative ${
              favoriteActive
                ? 'border-yellow-500 bg-yellow-500/5 ring-1 ring-yellow-500/30'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-lg relative ${favoriteActive ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                <Star className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-yellow-400 shadow-sm">
                  {favoriteCount}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Favoritos</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Jogos marcados como favorito</p>
              </div>
            </div>
          </button>

          {/* Input Preferido */}
          <button
            onClick={() => handleQuickFilter('inputRec')}
            className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative ${
              inputRecActive
                ? 'border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/30'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-lg relative ${inputRecActive ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-500/10 text-sky-400'}`}>
                {filters.inputRec === 'Teclado/Mouse' ? <Keyboard className="w-5 h-5" /> : <Gamepad2 className="w-5 h-5" />}
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-sky-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-sky-400 shadow-sm">
                  {inputFilteredCount}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Input</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">
                  {inputRecActive ? filters.inputRec : 'Controle / Teclado'}
                </p>
              </div>
            </div>
          </button>

          {/* Backlog Focus — hidden on small screens */}
          <button
            onClick={() => handleQuickFilter('backlogFocus')}
            className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative hidden lg:block ${
              backlogActive
                ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-lg relative ${backlogActive ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-500/10 text-rose-400'}`}>
                <Bookmark className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-rose-400 shadow-sm">
                  {backlogFocusCount}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Foco no Backlog</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Alta vontade pendente</p>
              </div>
            </div>
          </button>

          {/* Missing Data — hidden on small screens */}
          <button
            onClick={() => handleQuickFilter('missingDataOnly')}
            className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative hidden lg:block ${
              missingActive
                ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/30'
                : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-lg relative ${missingActive ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-400'}`}>
                <AlertTriangle className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-orange-400 shadow-sm">
                  {missingDataCount}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Dados Faltantes</p>
                <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Jogos com info. incompleta</p>
              </div>
            </div>
          </button>
        </div>

        {/* Mobile/Tablet Filter Dropdown + Desktop Sidebar + Game List */}
        <div className="xl:flex xl:flex-row xl:gap-6">
          <FilterBar
            games={games}
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
          />

          {/* Game List */}
          <div className="flex-1 min-w-0 mt-4 xl:mt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <span className="text-sm font-medium">Carregando biblioteca...</span>
              </div>
            ) : apiError && games.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                <p className="text-lg font-medium">Erro ao carregar dados</p>
                <p className="text-sm mt-1">Verifique se o servidor está rodando.</p>
                <button
                  onClick={loadAll}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition"
                >
                  Tentar novamente
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <>
                {sortedGames.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">
                    <p className="text-lg font-medium">Nenhum jogo encontrado</p>
                    <p className="text-sm mt-1">Tente ajustar os filtros ou adicionar um novo jogo.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                      {displayedGames.map(game => (
                        <GameCard key={game.id} game={game} onClick={handleCardClick} onToggleFavorite={handleToggleFavorite} />
                      ))}
                    </div>

                    {hasMoreDisplay && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={loadMoreDisplay}
                          className="flex items-center space-x-2 px-6 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl text-sm font-medium transition"
                        >
                          <ChevronDown className="w-4 h-4" />
                          <span>Carregar mais jogos</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {sortedGames.length === 0 ? (
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
                        {displayedGames.map(game => (
                           <GameRow key={game.id} game={game} onClick={handleCardClick} onToggleFavorite={handleToggleFavorite} />
                        ))}
                      </tbody>
                    </table>

                    {hasMoreDisplay && (
                      <div className="flex justify-center py-4 border-t border-zinc-800">
                        <button
                          onClick={loadMoreDisplay}
                          className="flex items-center space-x-2 px-6 py-3 text-zinc-400 hover:text-white rounded-xl text-sm font-medium transition"
                        >
                          <ChevronDown className="w-4 h-4" />
                          <span>Carregar mais jogos</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Single sentinel outside both views for infinite scroll */}
            {!loading && sortedGames.length > 0 && hasMoreDisplay && (
              <div ref={sentinelRef} className="h-2" />
            )}
          </div>
        </div>

        {/* HD Filter Popup */}
        {hdPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setHdPopupOpen(false)}>
            <div
              className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">Filtrar por Armazenamento</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">{installedGames.length} jogos instalados em {hdEntries.length} {hdEntries.length === 1 ? 'disco' : 'discos'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setHdPopupOpen(false)}
                  className="text-zinc-500 hover:text-white p-1.5 hover:bg-zinc-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* HD List with Checkboxes */}
              <div className="px-5 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
                <label
                  onClick={() => toggleHd('__uninstalled__')}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition ${
                    selectedHds.includes('__uninstalled__')
                      ? 'bg-zinc-600/20 border border-zinc-500/30'
                      : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                      selectedHds.includes('__uninstalled__')
                        ? 'bg-zinc-500 border-zinc-500'
                        : 'border-zinc-600 bg-transparent'
                    }`}>
                      {selectedHds.includes('__uninstalled__') && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div>
                      <span className="text-sm text-zinc-400 font-medium">Não Instalado</span>
                      <p className="text-[11px] text-zinc-600">{uninstalledCount} {uninstalledCount === 1 ? 'jogo sem' : 'jogos sem'} local de instalação</p>
                    </div>
                  </div>
                </label>

                <div className="border-t border-zinc-800 pt-2" />

                {hdEntries.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-6">Nenhum jogo instalado</p>
                ) : (
                  hdEntries.map(([hd, count]) => {
                    const isChecked = selectedHds.includes(hd);
                    return (
                      <label
                        key={hd}
                        onClick={() => toggleHd(hd)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition ${
                          isChecked
                            ? 'bg-green-500/10 border border-green-500/30'
                            : 'bg-zinc-950 border border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                            isChecked
                              ? 'bg-green-500 border-green-500'
                              : 'border-zinc-600 bg-transparent'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">{hd}</span>
                            <p className="text-[11px] text-zinc-500">{count} {count === 1 ? 'jogo' : 'jogos'}</p>
                          </div>
                        </div>
                        <span className="text-green-400 font-bold text-sm">{count}</span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
                <button
                  onClick={clearHdFilter}
                  className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 hover:bg-zinc-800 rounded-lg transition"
                >
                  Limpar filtro
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setHdPopupOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={applyHdFilter}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition flex items-center space-x-2 ${
                      selectedHds.length > 0
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{selectedHds.length > 0 ? `Aplicar (${selectedHds.length})` : 'Limpar Filtro'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        <GameModal
          games={games}
          game={selectedGame}
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedGame(null); }}
          isEditing={isEditing}
          onSave={handleSave}
          onDelete={handleDelete}
          onHltbSearch={api.searchHltb}
        />

        {/* Scroll to Top */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg shadow-indigo-600/30 transition hover:scale-110"
            title="Voltar ao topo"
          >
            <ChevronDown className="w-5 h-5 rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}
