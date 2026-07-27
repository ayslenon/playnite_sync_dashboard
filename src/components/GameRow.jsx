import React from 'react';
import { Wrench, Star, Clock } from 'lucide-react';

export default function GameRow({ game, onClick }) {
  const statusColors = {
    'Jogando': 'bg-emerald-600',
    'Backlog': 'bg-sky-600',
    'Finalizado': 'bg-blue-600',
    'Abandonado': 'bg-zinc-600',
  };

  const inputIcon = game.input_recommendation === 'Controle' ? '🎮' 
    : game.input_recommendation === 'Teclado/Mouse' ? '⌨️' : '🖥️';

  return (
    <tr
      onClick={() => onClick(game)}
      className={`border-b border-zinc-800/50 hover:bg-zinc-800/40 transition cursor-pointer ${
        game.must_test ? 'bg-amber-500/5' : ''
      }`}
    >
      {/* Title + Cover + Must Test */}
      <td className="py-3 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
            {game.cover_url ? (
              <img src={game.cover_url} alt={game.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">🎮</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white truncate max-w-[200px]">{game.title}</span>
              {game.must_test && (
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center space-x-0.5 border border-amber-500/30">
                  <Wrench className="w-3 h-3" />
                  <span>TESTAR</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-2">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${statusColors[game.gameplay_status] || 'bg-zinc-600'}`}>
          {game.gameplay_status}
        </span>
      </td>

      {/* Platform */}
      <td className="py-3 px-2">
          <span className="text-xs text-zinc-400">{game.platform?.name}</span>
      </td>

      {/* Genres */}
      <td className="py-3 px-2">
        <div className="flex flex-wrap gap-1">
          {game.genres?.slice(0, 2).map(g => (
            <span key={g} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{g}</span>
          ))}
        </div>
      </td>

      {/* HD / Install */}
      <td className="py-3 px-2">
        <span className={`text-xs ${game.storage_device ? 'text-emerald-400' : 'text-zinc-600'}`}>
          {game.storage_device?.name || '—'}
        </span>
      </td>

      {/* HLTB + Playtime */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{game.hltb_main || '?'}h</span>
          </div>
          {game.playtime_seconds > 0 && (
            <>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-500">{Math.round(game.playtime_seconds / 3600)}h</span>
            </>
          )}
        </div>
      </td>

      {/* Interest */}
      <td className="py-3 px-2">
        <div className="flex items-center space-x-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-3 h-3 ${star <= game.interest_rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
            />
          ))}
        </div>
      </td>

      {/* Score */}
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-bold text-zinc-400">{game.score || '—'}</span>
      </td>
    </tr>
  );
}
