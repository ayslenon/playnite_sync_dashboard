import React, { useState } from 'react';
import { X, Wrench, Save, Gamepad2, Keyboard, Clock, Users, Monitor, Search, Eye, EyeOff, AlertTriangle, Check, HardDrive, Plus } from 'lucide-react';

const EMPTY_GAME = {
  title: '',
  cover_url: '',
  background_url: '',
  genres: [],
  platform: { name: '' },
  storage_device: null,
  gameplay_status: 'Backlog',
  finish_hours: null,
  finish_date: null,
  score: '',
  hltb_main: 0,
  hltb_main_extra: 0,
  hltb_full: 0,
  notes: '',
  interest_rating: 3,
  replay_score: 3,
  coop_players: '1 Jogador',
  coop_type: ['Um Jogador'],
  coop_screen_type: 'Tela Inteira',
  input_recommendation: 'Controle',
  must_test: false,
};

export default function GameModal({ games, game, isOpen, onClose, isEditing: _, onSave, onDelete }) {
  const [formData, setFormData] = useState(game || { ...EMPTY_GAME });
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [hdMode, setHdMode] = useState('existing');

  const existingHds = Array.from(
    new Set((games || []).map(g => g.storage_device?.name).filter(Boolean))
  ).sort();

  const validateForm = (data) => {
    const errs = {};
    if (!data.title?.trim()) errs.title = 'Título é obrigatório';
    if (!data.genres?.length) errs.genres = 'Adicione pelo menos um gênero';
    if (!data.platform?.name?.trim()) errs.platform = 'Plataforma é obrigatória';
    if (!data.interest_rating || data.interest_rating < 1) errs.interest_rating = 'Selecione a vontade de jogar';
    if (data.storage_device && !data.storage_device.name?.trim()) errs.storage_device = 'Informe o local de instalação';
    if (data.gameplay_status === 'Finalizado') {
      if (!data.score?.trim()) errs.score = 'Nota de conclusão é obrigatória';
      if (!data.finish_hours && data.finish_hours !== 0) errs.finish_hours = 'Horas para finalizar é obrigatório';
      if (!data.finish_date) errs.finish_date = 'Data de finalização é obrigatória';
      if (!data.replay_score || data.replay_score < 1) errs.replay_score = 'Selecione a vontade de rejogar';
    }
    return errs;
  };

  React.useEffect(() => {
    setErrors({});
    setConfirm(null);
    if (game && isOpen) {
      setFormData(JSON.parse(JSON.stringify(game)));
      const hds = Array.from(new Set((games || []).map(g => g.storage_device?.name).filter(Boolean)));
      setHdMode(game.storage_device && hds.includes(game.storage_device.name) ? 'existing' : 'custom');
    } else if (!game && isOpen) {
      setFormData({ ...EMPTY_GAME, id: String(Date.now()) });
      setHdMode('existing');
    }
  }, [game, isOpen, games]);

  React.useEffect(() => {
    if (formData.gameplay_status !== 'Finalizado' && activeTab === 'finish') {
      setActiveTab('details');
    }
  }, [formData.gameplay_status, activeTab]);

  if (!isOpen) return null;

  const hasChanges = () => {
    if (!game) return formData.title?.trim() || formData.genres?.length;
    return JSON.stringify(formData) !== JSON.stringify(game);
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleNestedChange = (parent, key, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSaveClick = () => {
    const errs = validateForm(formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.score || errs.finish_hours || errs.finish_date || errs.replay_score) {
        setActiveTab('finish');
      } else if (errs.storage_device) {
        setActiveTab('details');
      } else if (errs.coop_type) {
        setActiveTab('multiplayer');
      } else {
        setActiveTab('general');
      }
      return;
    }
    setConfirm('save');
  };

  const confirmSave = () => {
    setConfirm(null);
    onSave(formData);
  };

  const confirmDelete = () => {
    setConfirm(null);
    onDelete?.(game.id);
  };

  const handleDiscard = () => {
    if (hasChanges()) {
      setConfirm('discard');
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    setConfirm(null);
    onClose();
  };

  const toggleCoopType = (type) => {
    setFormData(prev => {
      const current = prev.coop_type || [];
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return { ...prev, coop_type: updated };
    });
    setErrors(prev => ({ ...prev, coop_type: undefined }));
  };

  const toggleGenre = (genre) => {
    const input = document.getElementById('genre-input');
    if (!genre && input) {
      genre = input.value.trim();
      if (!genre) return;
      input.value = '';
    }
    setFormData(prev => {
      const genres = prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres };
    });
  };

  const bgUrl = game?.background_url || '';
  const isFinalized = formData.gameplay_status === 'Finalizado';

  const tabs = [
    { id: 'general', label: 'Geral' },
    { id: 'details', label: 'Instalação' },
    { id: 'multiplayer', label: 'Multiplayer' },
    ...(isFinalized ? [{ id: 'finish', label: 'Finalização' }] : []),
  ];

  const coopPlayersLabels = {
    '1 Jogador': '1 Jogador',
    '2 Jogadores': '2 Jogadores',
    'Até 4 Jogadores': 'Até 4 Jogadores',
    'Mais de 4 Jogadores': 'Mais de 4 Jogadores',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Background image header */}
        <div className="relative h-40 bg-zinc-800 rounded-t-2xl overflow-hidden">
          {bgUrl && (
            <img src={bgUrl} alt="" className="w-full h-full object-cover opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

          <button
            onClick={handleDiscard}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-zinc-400 hover:text-white p-2 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-5 flex items-center space-x-4">
            <div className="w-16 h-20 bg-zinc-700 rounded-lg overflow-hidden shadow-xl flex-shrink-0">
              {formData.cover_url ? (
                <img src={formData.cover_url} alt={formData.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Gamepad2 className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{formData.title || 'Novo Jogo'}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{formData.platform?.name || 'Plataforma não definida'}</p>
            </div>
          </div>

          {formData.must_test && (
            <div className="absolute top-3 left-3 bg-amber-500/90 text-black text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-lg animate-pulse">
              <Wrench className="w-3.5 h-3.5" />
              <span>A TESTAR</span>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-zinc-800 px-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold px-4 py-3 border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-5">
          {/* Tab: Geral */}
          {activeTab === 'general' && (
            <>
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Título do Jogo</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={`flex-1 bg-zinc-950 border rounded-lg px-3 py-2 text-sm text-white outline-none transition h-9 ${
                      errors.title ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800 focus:border-indigo-500'
                    }`}
                    placeholder="Ex: The Witcher 3"
                  />
                  <button
                    type="button"
                    title="Buscar automaticamente metadados (em breve)"
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition flex items-center h-9"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
              </div>

              {/* Genres */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Gêneros</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(formData.genres || []).map(genre => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className="text-[11px] font-bold px-2 py-1 rounded-full bg-indigo-600 text-white"
                    >
                      {genre} ✕
                    </button>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    id="genre-input"
                    type="text"
                    className={`flex-1 bg-zinc-950 border rounded-lg px-3 py-2 text-sm text-white outline-none transition h-9 ${
                      errors.genres ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800 focus:border-indigo-500'
                    }`}
                    placeholder="Adicionar gênero e pressionar +"
                    onKeyDown={e => e.key === 'Enter' && toggleGenre()}
                  />
                  <button
                    onClick={() => toggleGenre()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-lg transition h-9 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {errors.genres && <p className="text-red-400 text-xs mt-1">{errors.genres}</p>}
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">URL da Capa</label>
                  <input
                    type="text"
                    value={formData.cover_url || ''}
                    onChange={(e) => handleChange('cover_url', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">URL do Background</label>
                  <input
                    type="text"
                    value={formData.background_url || ''}
                    onChange={(e) => handleChange('background_url', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Interest + Must Test + Platform (same row) */}
              <div className="grid grid-cols-3 gap-2">
                {/* Interest */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Vontade</label>
                  <div className={`flex items-center space-x-0.1 bg-zinc-950 border py-2.5 px-2 rounded-lg ${
                    errors.interest_rating ? 'border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800'
                  }`}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleChange('interest_rating', star)}
                        className={`leading-none text-lg transition ${star <= formData.interest_rating ? 'text-amber-400 scale-90' : 'text-zinc-700 hover:text-zinc-500 scale-80'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {errors.interest_rating && <p className="text-red-400 text-xs mt-1">{errors.interest_rating}</p>}
                </div>

                {/* Platform */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Plataforma</label>
                  <input
                    type="text"
                    value={formData.platform?.name || ''}
                    onChange={(e) => handleNestedChange('platform', 'name', e.target.value)}
                    className={`w-full bg-zinc-950 border rounded-lg px-3 py-2.5 text-sm text-white outline-none transition ${
                      errors.platform ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800 focus:border-indigo-500'
                    }`}
                    placeholder="PC (Steam)..."
                  />
                  {errors.platform && <p className="text-red-400 text-xs mt-1">{errors.platform}</p>}
                </div>

                {/* Must Test */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Jogo a Testar</label>
                  <button
                    onClick={() => handleChange('must_test', !formData.must_test)}
                    className={`w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-sm font-bold border transition ${
                      formData.must_test
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {formData.must_test ? (
                      <><EyeOff className="w-4 h-4" /><span>A Testar</span></>
                    ) : (
                      <><Eye className="w-4 h-4" /><span>Marcar</span></>
                    )}
                  </button>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Indicação de Controle</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Controle', icon: <Gamepad2 className="w-4 h-4" /> },
                    { value: 'Teclado/Mouse', icon: <Keyboard className="w-4 h-4" /> },
                    { value: 'Ambos', icon: <Monitor className="w-4 h-4" /> },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleChange('input_recommendation', opt.value)}
                      className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition ${
                        formData.input_recommendation === opt.value
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* HLTB Breakdown */}
              <div className="space-y-3">
                <h4 className="text-white text-sm font-bold flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>How Long To Beat (Horas)</span>
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Principal</label>
                    <input
                      type="number"
                      value={formData.hltb_main || 0}
                      onChange={(e) => handleChange('hltb_main', Number(e.target.value))}
                      className="no-spinner w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Extra</label>
                    <input
                      type="number"
                      value={formData.hltb_main_extra || 0}
                      onChange={(e) => handleChange('hltb_main_extra', Number(e.target.value))}
                      className="no-spinner w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">100%</label>
                    <input
                      type="number"
                      value={formData.hltb_full || 0}
                      onChange={(e) => handleChange('hltb_full', Number(e.target.value))}
                      className="no-spinner w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Jogado</label>
                    <input
                      type="number"
                      value={formData.playtime_seconds ? Math.round(formData.playtime_seconds / 3600) : 0}
                      onChange={(e) => handleChange('playtime_seconds', Number(e.target.value) * 3600)}
                      className="no-spinner w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tab: Instalação */}
          {activeTab === 'details' && (
            <>
              <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-bold text-sm">Configuração de Instalação</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Instalação</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleChange('storage_device', formData.storage_device ? null : { name: '' })}
                    className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-xs font-bold border transition ${
                      formData.storage_device
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {formData.storage_device ? <><EyeOff className="w-4 h-4" /><span>Instalado</span></> : <><Eye className="w-4 h-4" /><span>Não Instalado</span></>}
                  </button>
                </div>
              </div>

              {formData.storage_device && (
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    Local de Instalação (HD/SSD)
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {existingHds.map(hd => (
                      <button
                        key={hd}
                        type="button"
                        onClick={() => { setHdMode('existing'); handleNestedChange('storage_device', 'name', hd); }}
                        className={`text-[11px] font-bold px-3 py-2 rounded-lg border transition ${
                          hdMode === 'existing' && formData.storage_device?.name === hd
                            ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        {hd}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setHdMode('custom'); handleNestedChange('storage_device', 'name', ''); }}
                      className={`text-[11px] font-bold px-3 py-2 rounded-lg border transition ${
                        hdMode === 'custom'
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      Personalizado ✏️
                    </button>
                  </div>
                  {hdMode === 'custom' && (
                    <input
                      type="text"
                      value={formData.storage_device?.name || ''}
                      onChange={(e) => handleNestedChange('storage_device', 'name', e.target.value)}
                      className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm text-white outline-none transition ${
                        errors.storage_device ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800 focus:border-indigo-500'
                      }`}
                      placeholder="Digite o nome do disco..."
                    />
                  )}
                  {errors.storage_device && <p className="text-red-400 text-xs mt-1">{errors.storage_device}</p>}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Status do Gameplay</label>
                <select
                  value={formData.gameplay_status}
                  onChange={(e) => handleChange('gameplay_status', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                >
                  <option value="Backlog">Backlog</option>
                  <option value="Jogando">Jogando</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Abandonado">Abandonado</option>
                </select>
              </div>
            </>
          )}

          {/* Tab: Multiplayer */}
          {activeTab === 'multiplayer' && (
            <div className="space-y-5">
              <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-bold text-sm">Configuração Multiplayer</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Jogadores</label>
                <select
                  value={formData.coop_players || '1 Jogador'}
                  onChange={(e) => handleChange('coop_players', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                >
                  {Object.entries(coopPlayersLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Tipo
                  {formData.coop_players !== '1 Jogador' && (
                    <span className="text-zinc-600 font-normal lowercase ml-1">(selecione um ou mais)</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Sofá', 'Online', 'LAN'].map(type => {
                    const selected = (formData.coop_type || []).includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleCoopType(type)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition ${
                          selected
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        } ${formData.coop_players === '1 Jogador' ? 'opacity-40 pointer-events-none' : ''}`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tela</label>
                <select
                  value={formData.coop_screen_type || 'Tela Inteira'}
                  onChange={(e) => handleChange('coop_screen_type', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition"
                >
                  <option value="Tela Inteira">Tela Inteira</option>
                  <option value="Tela Dividida">Tela Dividida</option>
                  <option value="Versus">Versus</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab: Finalização */}
          {activeTab === 'finish' && (
            <>
              <div className="flex items-center space-x-2 pb-2 border-b border-zinc-800">
                <Check className="w-5 h-5 text-emerald-400" />
                <h3 className="text-white font-bold text-sm">Dados de Finalização</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Nota Pessoal (Score)
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.score || ''}
                  onChange={(e) => handleChange('score', e.target.value)}
                  className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm text-white outline-none transition ${
                    errors.score ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800 focus:border-indigo-500'
                  }`}
                  placeholder="8/10, 9.5..."
                />
                {errors.score && <p className="text-red-400 text-xs mt-1">{errors.score}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    Horas para Finalizar
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.finish_hours || ''}
                    onChange={(e) => handleChange('finish_hours', e.target.value ? Number(e.target.value) : null)}
                    className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm text-white outline-none transition ${
                      errors.finish_hours ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800 focus:border-indigo-500'
                    }`}
                    placeholder="Horas jogadas"
                  />
                  {errors.finish_hours && <p className="text-red-400 text-xs mt-1">{errors.finish_hours}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    Data de Finalização
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.finish_date ? formData.finish_date.slice(0, 10) : ''}
                    onChange={(e) => handleChange('finish_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm text-white outline-none transition ${
                      errors.finish_date ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800 focus:border-indigo-500'
                    }`}
                  />
                  {errors.finish_date && <p className="text-red-400 text-xs mt-1">{errors.finish_date}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Vontade de Rejogar
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className={`flex items-center space-x-1 bg-zinc-950 border p-2 rounded-lg ${
                  errors.replay_score ? 'border-red-500 ring-1 ring-red-500/30' : 'border-zinc-800'
                }`}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleChange('replay_score', star)}
                      className={`text-lg transition ${star <= (formData.replay_score || 0) ? 'text-amber-400 scale-110' : 'text-zinc-700 hover:text-zinc-500'}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="text-xs text-zinc-500 ml-auto">{formData.replay_score || '?'}/5</span>
                </div>
                {errors.replay_score && <p className="text-red-400 text-xs mt-1">{errors.replay_score}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Observações / Notas</label>
                <textarea
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white outline-none transition resize-none"
                  placeholder="Suas impressões, dicas de configuração, o que achou do jogo..."
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-zinc-800 px-5 py-4 flex items-center justify-end space-x-3">
          {game && (
            <button
              onClick={() => setConfirm('delete')}
              className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition mr-auto"
            >
              Excluir Jogo
            </button>
          )}
          <button
            onClick={handleDiscard}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveClick}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{game ? 'Salvar Alterações' : 'Adicionar Jogo'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Popup */}
      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" onClick={() => setConfirm(null)}>
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${
                confirm === 'discard' ? 'bg-amber-500/10 text-amber-400' :
                confirm === 'delete' ? 'bg-red-500/10 text-red-400' :
                'bg-emerald-500/10 text-emerald-400'
              }`}>
                {confirm === 'discard' ? <AlertTriangle className="w-6 h-6" /> :
                 confirm === 'delete' ? <AlertTriangle className="w-6 h-6" /> :
                 <Check className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-white font-bold text-base">
                  {confirm === 'discard' ? 'Descartar alterações?' :
                   confirm === 'delete' ? 'Excluir jogo?' :
                   'Confirmar salvamento'}
                </h3>
                <p className="text-zinc-400 text-sm mt-0.5">
                  {confirm === 'discard'
                    ? 'Você tem alterações não salvas. Deseja realmente descartá-las?'
                    : confirm === 'delete'
                    ? `Tem certeza que deseja excluir "${game?.title}"? Esta ação não pode ser desfeita.`
                    : 'Tem certeza que deseja salvar os dados deste jogo?'}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              >
                Voltar
              </button>
              <button
                onClick={confirm === 'discard' ? confirmDiscard : confirm === 'delete' ? confirmDelete : confirmSave}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition text-white ${
                  confirm === 'discard' ? 'bg-amber-600 hover:bg-amber-500' :
                  confirm === 'delete' ? 'bg-red-600 hover:bg-red-500' :
                  'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {confirm === 'discard' ? 'Descartar' :
                 confirm === 'delete' ? 'Excluir' :
                 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
