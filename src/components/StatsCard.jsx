import React from 'react';
import { HardDrive, FlaskConical, Bookmark, AlertTriangle, X, Check, HardDrive as HDIcon } from 'lucide-react';

export default function StatsCard({ games, filters, onQuickFilter }) {
  const installedGames = games.filter(g => g.storage_device);
  const totalInstalled = installedGames.length;

  const hdBreakdown = installedGames.reduce((acc, game) => {
    const name = game.storage_device?.name;
    if (name) {
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {});

  const gamesToTest = games.filter(g => g.must_test && g.storage_device).length;
  const backlogFocus = games.filter(g => g.gameplay_status === 'Backlog' && g.interest_rating >= 4).length;

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

  const missingDataCount = games.filter(hasMissingData).length;
  const isMissingDataActive = filters.missingDataOnly;

  const isInstalledActive = filters.hds.length > 0;
  const isMustTestActive = filters.mustTestOnly;
  const isBacklogActive = filters.highInterestOnly && filters.gameplayStatus.includes('Backlog');

  const [popupOpen, setPopupOpen] = React.useState(false);
  const hdEntries = Object.entries(hdBreakdown).sort((a, b) => b[1] - a[1]);
  const [selectedHds, setSelectedHds] = React.useState([...filters.hds]);

  React.useEffect(() => {
    setSelectedHds([...filters.hds]);
  }, [filters.hds, popupOpen]);

  const toggleHd = (hd) => {
    setSelectedHds(prev =>
      prev.includes(hd) ? prev.filter(h => h !== hd) : [...prev, hd]
    );
  };

  const applyHdFilter = () => {
    onQuickFilter('hds', selectedHds);
    setPopupOpen(false);
  };

  const clearHdFilter = () => {
    onQuickFilter('hds', []);
    setSelectedHds([]);
    setPopupOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Installed - Clickable Quick Filter */}
        <button
          onClick={() => setPopupOpen(true)}
          className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative ${
            isInstalledActive
              ? 'border-green-500 bg-green-500/5 ring-1 ring-green-500/30'
              : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg relative ${isInstalledActive ? 'bg-green-500/20 text-green-400' : 'bg-green-500/10 text-green-400'}`}>
              <HardDrive className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-green-400 shadow-sm">
                {totalInstalled}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Instalados</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Armazenamento ({hdEntries.length} {hdEntries.length === 1 ? 'disco' : 'discos'})</p>
            </div>
            {isInstalledActive && (
              <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/30 flex-shrink-0">
                {filters.hds.length} HD{(filters.hds.length) > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </button>

        {/* Must Test - Clickable Quick Filter */}
        <button
          onClick={() => onQuickFilter('mustTestOnly')}
          className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative ${
            isMustTestActive
              ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30'
              : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg relative ${isMustTestActive ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <FlaskConical className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-amber-400 shadow-sm">
                {gamesToTest}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Jogos a Testar</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Instalados para validar</p>
            </div>
            {isMustTestActive && (
              <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 flex-shrink-0">
                ATIVO
              </span>
            )}
          </div>
        </button>

        {/* Backlog Focus - Clickable Quick Filter */}
        <button
          onClick={() => onQuickFilter('backlogFocus')}
          className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative ${
            isBacklogActive
              ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30'
              : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg relative ${isBacklogActive ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Bookmark className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-rose-400 shadow-sm">
                {backlogFocus}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Foco no Backlog</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Alta vontade pendente</p>
            </div>
            {isBacklogActive && (
              <span className="ml-auto text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 flex-shrink-0">
                ATIVO
              </span>
            )}
          </div>
        </button>

        {/* Missing Data - Clickable Quick Filter */}
        <button
          onClick={() => onQuickFilter('missingDataOnly')}
          className={`bg-zinc-900 border rounded-xl p-4 shadow-md transition text-left col-span-1 relative ${
            isMissingDataActive
              ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/30'
              : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg relative ${isMissingDataActive ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-400'}`}>
              <AlertTriangle className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-800/70 rounded-full flex items-center justify-center text-[10px] font-extrabold text-orange-400 shadow-sm">
                {missingDataCount}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Dados Faltantes</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block">Jogos com info. incompleta</p>
            </div>
            {isMissingDataActive && (
              <span className="ml-auto text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/30 flex-shrink-0">
                ATIVO
              </span>
            )}
          </div>
        </button>
      </div>

      {/* HD Filter Popup */}
      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPopupOpen(false)}>
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
                  <HDIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Filtrar por Armazenamento</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">{totalInstalled} jogos instalados em {hdEntries.length} {hdEntries.length === 1 ? 'disco' : 'discos'}</p>
                </div>
              </div>
              <button
                onClick={() => setPopupOpen(false)}
                className="text-zinc-500 hover:text-white p-1.5 hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* HD List with Checkboxes */}
            <div className="px-5 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
              {/* Não Instalado option */}
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
                    <p className="text-[11px] text-zinc-600">Jogos sem local de instalação</p>
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
                  onClick={() => setPopupOpen(false)}
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
    </>
  );
}
