import React from 'react';
import { Wrench, Clock, Star, Gamepad2, Keyboard, Users } from 'lucide-react';

function getCoopLabel(coopPlayers) {
  if (!coopPlayers || coopPlayers === '1 Jogador') return null;
  if (coopPlayers === '2 Jogadores') return '2';
  if (coopPlayers === 'Até 4 Jogadores') return '+2';
  if (coopPlayers === 'Mais de 4 Jogadores') return '+4';
  return null;
}

function formatPlaytime(seconds) {
  if (!seconds || seconds === 0) return null;
  const hours = seconds / 3600;
  return Math.round(hours) + 'h';
}

export default function GameCard({ game, onClick, onToggleFavorite }) {
  const coverUrl = game.cover_url || '';

  const statusColors = {
    'Jogando': 'bg-emerald-600',
    'Backlog': 'bg-sky-600',
    'Finalizado': 'bg-blue-600',
    'Abandonado': 'bg-zinc-600',
  };

  const statusLabels = {
    'Jogando': 'Jogando',
    'Backlog': 'Backlog',
    'Finalizado': 'Finalizado',
    'Abandonado': 'Abandonado',
  };

  const coopLabel = getCoopLabel(game.coop_players);
  const showGamepad = game.input_recommendation === 'Controle';
  const showKeyboard = game.input_recommendation === 'Teclado/Mouse';
  const playtimeLabel = formatPlaytime(game.playtime_seconds);

  return (
    <div
      onClick={() => onClick(game)}
      className={`group relative bg-zinc-900 rounded-xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:border-zinc-700 hover:z-10 flex flex-col ${
        game.favorite ? 'border-2 border-amber-400/60' : 'border border-zinc-800'
      }`}
    >
      {/* Must Test Indicator */}
      {game.must_test && (
        <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/30 to-amber-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      {/* Cover Image */}
      <div className="relative aspect-[3/4] bg-zinc-800 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Gamepad2 className="w-12 h-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {playtimeLabel != "0h" && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{playtimeLabel}</span>
          </div>
        )}

        {game.score && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {game.score}
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-md ${statusColors[game.gameplay_status] || 'bg-zinc-600'}`}>
            {statusLabels[game.gameplay_status] || game.gameplay_status}
          </span>
        </div>

        <div className="absolute bottom-2 right-2 flex items-center space-x-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 ${star <= game.interest_rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`}
            />
          ))}
        </div>
      </div>

      {/* Info Section — flex column with bottom row pinned to end */}
      <div className="p-3 flex flex-col gap-1.5 flex-1 min-h-0">
        {/* Title + Must Test inline */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(game.id, !game.favorite); }}
            className={`flex-shrink-0 transition ${game.favorite ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}
            title={game.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star className={`w-4 h-4 ${game.favorite ? 'fill-amber-400' : ''}`} />
          </button>
          <h3 className="text-sm font-bold text-white truncate leading-tight" title={game.title}>
            {game.title}
          </h3>
          {game.must_test && (
            <span className="flex-shrink-0 bg-amber-500/20 text-amber-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center space-x-0.5 border border-amber-500/30">
              <Wrench className="w-2.5 h-2.5" />
              <span>Testar</span>
            </span>
          )}
        </div>

        {/* Platform + HLTB row */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-400">
          <span className="break-all max-w-[140px]">{game.platform?.name}</span>

          {game.hltb_main > 0 && (
            <>
              <span className="text-zinc-600">•</span>
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{game.hltb_main}h</span>
            </>
          )}
        </div>

        {/* Genres — grows to push bottom row down */}
        <div className="flex flex-wrap gap-1 flex-1 items-start">
          {game.genres?.slice(0, 3).map(genre => (
            <span key={genre} className="text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded">
              {genre}
            </span>
          ))}
        </div>

        {/* Bottom row — always at the end */}
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 border-t border-zinc-800/50 mt-auto">
          <span className="truncate max-w-[120px]">{game.storage_device?.name || 'Não instalado'}</span>

          <div className="flex items-center space-x-2">
            {coopLabel && (
              <div className="flex items-center space-x-0.5 text-indigo-400 font-extrabold">
                <Users className="w-3.5 h-3.5" />
                <span>{coopLabel}</span>
              </div>
            )}
            {showGamepad && <Gamepad2 className="w-3.5 h-3.5 text-zinc-500" />}
            {showKeyboard && <Keyboard className="w-3.5 h-3.5 text-zinc-500" />}
          </div>
        </div>
      </div>
    </div>
  );
}
