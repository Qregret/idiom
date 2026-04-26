import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  User, 
  Bell, 
  Search, 
  LogOut,
  ChevronRight,
  Scale,
  TrendingUp,
  Shield,
  Atom,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  Star,
  Share2,
  ArrowLeft,
  Settings,
  Loader2,
  Info,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from './data';
import { Word, Category } from './types';
import { api, Idiom, MeResponse } from './services/api';

// --- Components ---

const WordDetailModal = ({ word, onClose, onAction }: { word: Idiom, onClose: () => void, onAction: (remembered: boolean) => void }) => {
  const [loading, setLoading] = useState(false);
  const handle = async (rem: boolean) => {
    setLoading(true);
    try {
      await api.submitAnswer(word.word, rem);
    } catch (e) {
      console.error(e);
    }
    await onAction(rem);
    onClose();
  };
  return (
    <div className="absolute inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1 transition-colors">
          <XCircle className="w-5 h-5" />
        </button>
        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">频次 {word.frequency}</span>
          {word.frequency >= 6 && <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded">核心高频</span>}
        </div>
        <h2 className="text-3xl font-black text-slate-800 mt-3 mb-4">{word.word}</h2>
        <div className="bg-slate-50 p-4 rounded-2xl text-slate-700 text-sm leading-relaxed mb-6 border border-slate-100 shadow-inner">
          {word.explanation}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handle(false)} 
            disabled={loading}
            className="flex-1 py-3.5 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-red-500/20"
          >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
             不认识
          </button>
          <button 
            onClick={() => handle(true)} 
            disabled={loading}
            className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-primary/20"
          >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
             认识
          </button>
        </div>
      </div>
    </div>
  );
};

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const tabs = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'library', label: '词库', icon: BookOpen },
    { id: 'study', label: '学习', icon: GraduationCap },
    { id: 'stats', label: '统计', icon: BarChart3 },
    { id: 'me', label: '我的', icon: User },
  ];

  return (
    <nav className="bg-white border-t border-slate-100 px-4 pb-safe pt-2 flex justify-between z-50 shrink-0 w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center py-1 transition-colors"
            id={`nav-tab-${tab.id}`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
            <span className={`text-[10px] mt-1 ${isActive ? 'text-blue-500 font-medium' : 'text-slate-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

const HomeScreen = ({ onStartStudy, setActiveTab, stats }: { onStartStudy: () => void, setActiveTab: (tab: string) => void, stats: MeResponse['stats'] | null }) => {
  const [topWords, setTopWords] = useState<Idiom[]>([]);
  const [activeModalWord, setActiveModalWord] = useState<Idiom | null>(null);

  const fetchTop = async () => {
    const words = await api.getWords('core', 4);
    setTopWords(words);
  };

  useEffect(() => {
    fetchTop();
  }, []);

  return (
    <div className="px-4 pt-4 flex flex-col h-full bg-background/50 overflow-hidden">
      {/* Header - Compact */}
      <header className="flex justify-between items-center px-1 shrink-0 mt-2 mb-3">
        <div>
          <h1 className="text-xl font-black text-slate-800 leading-none">考公词霸 <span className="text-primary italic">PRO</span></h1>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-80">智学备考 • 决胜公考</p>
        </div>
        <div className="bg-secondary text-white px-2.5 py-1 rounded-lg text-[10px] font-black shadow-lg shadow-secondary/20 flex items-center gap-1">
          🔥 {stats ? Math.floor(stats.learnedCount / 50) + 1 : 1} <span className="opacity-80 font-medium">Lvl</span>
        </div>
      </header>

      {/* Progress Card - Reduced Height */}
      <div className="bg-gradient-to-br from-primary via-primary to-blue-600 rounded-3xl p-4 text-white shadow-xl shadow-primary/20 relative overflow-hidden h-28 shrink-0 flex flex-col justify-center mb-3">
        <div className="relative z-10">
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">总体进度</p>
          <div className="flex items-baseline mt-1">
            <span className="text-4xl font-black tracking-tighter">{stats?.learnedCount || 0}</span>
            <span className="ml-2 text-[10px] font-bold text-white/60">/ {stats?.totalWords || 0} 词</span>
          </div>
          <div className="w-24 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-1000" 
              style={{ width: `${stats ? (stats.learnedCount / stats.totalWords) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="absolute right-[-5%] top-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <BookOpen className="absolute right-4 bottom-[-10px] w-16 h-16 text-white/5 -rotate-12" />
      </div>

      {/* Stats Row - Compact */}
      <div className="grid grid-cols-3 gap-2 shrink-0 mb-3">
        {[
          { label: '已掌握', value: stats?.learnedCount || 0, color: 'text-primary' },
          { label: '收藏', value: stats?.favoriteCount || 0, color: 'text-secondary' },
          { label: '剩余', value: stats?.remainingCount || 0, color: 'text-orange-500' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white rounded-xl p-2 border border-slate-50 shadow-card text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{s.label}</p>
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions - Bento Grid Style */}
      <div className="grid grid-cols-4 gap-2 shrink-0 py-1 mb-3">
        {[
          { label: '开始', icon: GraduationCap, color: 'bg-primary text-white', onClick: onStartStudy },
          { label: '测试', icon: ClipboardList, color: 'bg-orange-500 text-white', onClick: () => setActiveTab('test') },
          { label: '统计', icon: BarChart3, color: 'bg-white text-slate-600', onClick: () => setActiveTab('stats') },
          { label: '难点', icon: Shield, color: 'bg-white text-slate-600', onClick: () => setActiveTab('difficult') },
        ].map((a, idx) => (
          <button key={idx} onClick={a.onClick} className="flex flex-col items-center space-y-1.5">
            <div className={`w-9 h-9 rounded-[14px] flex items-center justify-center ${a.color} shadow-md transition-transform active:scale-90 border border-slate-50`}>
              <a.icon className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="text-[8px] text-slate-900 font-black uppercase tracking-tighter">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Today Plan - Compressed List */}
      <section className="flex-1 overflow-hidden flex flex-col mb-4">
        <div className="flex justify-between items-end px-1 mb-1.5 shrink-0">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">重点词汇</h2>
          <button className="text-[9px] font-bold text-primary opacity-60" onClick={() => setActiveTab('top_words')}>查看全部</button>
        </div>
        <div className="bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100/50 flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] border border-slate-50/50 overflow-hidden divide-y divide-slate-50">
            {topWords.map((word, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveModalWord(word)}
                className="relative bg-white pl-4 pr-2 py-3 flex items-center justify-between group hover:-translate-y-0.5 hover:shadow-sm hover:z-10 transition-all cursor-pointer"
              >
                <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-primary/10 group-hover:bg-primary transition-colors" />
                <div className="flex items-center gap-2.5">
                  <h3 className="text-[13px] font-black text-slate-800 leading-none">{word.word}</h3>
                  <span className="bg-blue-50 text-blue-500 text-[8px] font-black uppercase px-2 py-1 rounded tracking-wider leading-none">频次 {word.frequency}</span>
                </div>
                <button 
                  className="w-7 h-7 flex items-center justify-center rounded-full text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            ))}
            {topWords.length === 0 && (
              <div className="text-center py-4 text-slate-400 text-[9px] uppercase font-bold tracking-widest opacity-40">
                暂无重点词汇
              </div>
            )}
          </div>
        </div>
      </section>

      {activeModalWord && (
        <WordDetailModal 
          word={activeModalWord} 
          onClose={() => setActiveModalWord(null)} 
          onAction={async (remembered) => {
             await new Promise(r => setTimeout(r, 100)); // wait for db update
             fetchTop();
          }}
        />
      )}
    </div>
  );
};

const LibraryScreen = ({ stats }: { stats: MeResponse['stats'] | null }) => {
  const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string } | null>(null);

  const icons: Record<string, any> = { Scale, TrendingUp, Shield, BookOpen };

  if (selectedCategory) {
    return <WordListScreen 
      onBack={() => setSelectedCategory(null)} 
      categoryId={selectedCategory.id} 
      categoryName={selectedCategory.name} 
    />;
  }

  return (
    <div className="px-4 pt-4 flex flex-col h-full bg-background/50 overflow-hidden">
      <header className="flex justify-between items-center px-1 shrink-0 mb-3">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">词库清单</h1>
        <div 
          onClick={() => setSelectedCategory({ id: 'search', name: '全库搜索' })}
          className="p-2 rounded-xl bg-white shadow-sm border border-slate-50 cursor-pointer active:scale-95 transition-transform"
        >
          <Search className="w-5 h-5 text-slate-400" />
        </div>
      </header>

      <div className="flex-1 space-y-2">
        {CATEGORIES.map((cat) => {
          const Icon = icons[cat.icon] || GraduationCap;
          
          let displayWordCount = cat.wordCount;
          let displayLearnedCount = cat.learnedCount;
          
          if (stats) {
            if (cat.id === 'all') {
              displayWordCount = stats.totalWords;
              displayLearnedCount = stats.learnedCount;
            } else if (cat.id === '1') {
              displayWordCount = stats.coreWords || cat.wordCount;
              displayLearnedCount = stats.coreLearned || 0;
            } else if (cat.id === '2') {
              displayWordCount = stats.lowFreqWords || cat.wordCount;
              displayLearnedCount = stats.lowFreqLearned || 0;
            }
          }
          
          return (
            <div 
              key={cat.id} 
              onClick={() => setSelectedCategory({ id: cat.id, name: cat.name })}
              className="bg-white p-3 py-3.5 rounded-3xl border border-slate-50 shadow-card flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 shadow-inner shrink-0" style={{ color: cat.color }}>
                <Icon className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-800 text-sm">{cat.name}</h3>
                  <span className="text-[9px] font-black text-primary uppercase">{displayWordCount} 词</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden border border-slate-50 shadow-inner">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-700" 
                    style={{ width: `${Math.min(100, (displayLearnedCount / Math.max(1, displayWordCount)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex justify-between items-end px-1 pt-2 mb-1.5">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">快捷分类</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pb-2">
          {[
            { label: '我的收藏', icon: Star, color: 'text-orange-500', bg: 'bg-orange-50', id: 'favorites', count: stats?.favoriteCount || 0 },
            { label: '核心背诵', icon: GraduationCap, color: 'text-primary', bg: 'bg-blue-50', id: 'core', count: stats?.coreWords || CATEGORIES.find(c => c.id === '1')?.wordCount || 824 },
          ].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedCategory({ id: item.id, name: item.label })}
              className="bg-white p-3 rounded-2xl border border-slate-50 shadow-card flex flex-col items-center text-center space-y-1.5 group active:scale-95 transition-transform cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.bg} ${item.color} shadow-sm group-hover:shadow-md transition-shadow`}>
                <item.icon className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-black text-slate-800 text-[11px]">{item.label}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.count} 词</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WordListScreen = ({ 
  onBack, 
  categoryName, 
  categoryId 
}: { 
  onBack: () => void, 
  categoryName: string, 
  categoryId: string 
}) => {
  const [activeTab, setActiveTab] = useState<'study' | 'review' | 'learned'>('study');
  const [words, setWords] = useState<Idiom[]>([]);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllDefs, setShowAllDefs] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        if (categoryId === 'difficult') {
          const res = await api.getWords('difficult', 200);
          setWords(res);
        } else if (categoryId === 'favorites') {
          const res = await api.getWords('favorites', 500);
          setWords(res);
        } else if (categoryId === 'core') {
          const res = await api.getWords('core', 500);
          setWords(res);
        } else if (categoryId === 'search') {
          const res = await api.getWords('all', 2000);
          setWords(res);
        } else if (categoryId === 'top_words') {
          const res = await api.getWords('core', 200);
          setWords(res);
        } else if (categoryId === '1' || categoryId === '2' || categoryId === 'all') {
          let limit = 2000;
          let offset = 0;
          
          let fetchType: 'all' | 'learned' | 'remaining' = 'all';
          if (activeTab === 'study') fetchType = 'remaining';
          if (activeTab === 'review' || activeTab === 'learned') fetchType = 'learned';
          
          let res = await api.getWords(fetchType, limit, offset, categoryId === 'all' ? undefined : categoryId);
          setWords(res);
        } else {
          if (activeTab === 'study') {
            const res = await api.getSession(100);
            setWords(res.words);
          } else if (activeTab === 'review') {
            const res = await api.getReviewSession();
            setWords(res.words);
          } else {
            const res = await api.getWords('learned', 200);
            setWords(res);
          }
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [activeTab, categoryId]);

  const handleForget = async (wordStr: string) => {
    try {
      await api.submitAnswer(wordStr, false);
      if (activeTab === 'learned') {
        setWords(prev => prev.filter(w => w.word !== wordStr));
      }
      setSwipeOffset(prev => ({ ...prev, [wordStr]: 0 }));
      if (expandedWord === wordStr) setExpandedWord(null);
    } catch(e) {
      console.error(e);
    }
  };

  const handleMarkKnown = async (wordStr: string) => {
    try {
      await api.submitAnswer(wordStr, true);
      if (activeTab === 'study' || activeTab === 'review' || categoryId === 'top_words') {
        setWords(prev => prev.filter(w => w.word !== wordStr));
      }
      setExpandedWord(null);
    } catch(e) {
      console.error(e);
    }
  };

  const filteredWords = useMemo(() => {
    if (!searchQuery) return words;
    return words.filter(w => w.word.toLowerCase().includes(searchQuery.toLowerCase()) || w.explanation.includes(searchQuery));
  }, [words, searchQuery]);

  const handleTouchStart = (e: React.TouchEvent, word: string) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const handleTouchMove = (e2: TouchEvent) => {
      const currentX = e2.touches[0].clientX;
      const diff = currentX - startX;
      if (diff > 0) { // swipe right
        setSwipeOffset(prev => ({ ...prev, [word]: Math.min(diff, 80) }));
      } else if (diff < 0) { // swipe left
         // maybe can add mark known on swipe left, but avoiding complex overlap right now.
      }
    };
    const handleTouchEnd = () => {
      setSwipeOffset(prev => {
        if ((prev[word] || 0) > 40) return { ...prev, [word]: 80 };
        return { ...prev, [word]: 0 };
      });
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <header className="flex justify-between items-center px-4 py-3 shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 -ml-1 mr-1">
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>
          <button className="text-slate-800 font-bold text-lg flex items-center">
            {categoryName}
          </button>
        </div>
        <div className="flex items-center gap-4 text-slate-800">
          <button onClick={() => setShowAllDefs(!showAllDefs)}>
            <div className={`relative ${showAllDefs ? 'text-primary' : ''}`}>
              <span className="text-lg">👁</span>
              {showAllDefs && <div className="absolute top-1 left-0 w-full h-[1.5px] bg-primary -rotate-45" />}
            </div>
          </button>
        </div>
      </header>
      
      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索词汇或释义..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus={categoryId === 'search'}
            className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {categoryId !== 'difficult' && categoryId !== 'top_words' && categoryId !== 'favorites' && categoryId !== 'core' && categoryId !== 'search' && (
        <div className="flex bg-slate-50/50 p-2 mx-4 mt-2 rounded-xl shrink-0">
          {[
            { id: 'study', label: '学习' },
            { id: 'review', label: '复习' },
            { id: 'learned', label: '认识' }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeTab === t.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 flex items-center shrink-0">
        <div className="w-1 h-3 bg-slate-400 rounded-full mr-2" />
        <span className="text-xs font-bold text-slate-600">{filteredWords.length} 词</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center pt-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredWords.map((word) => {
              const isExpanded = showAllDefs || expandedWord === word.word;
              const xOffset = swipeOffset[word.word] || 0;
              return (
                <div key={word.word} className="relative bg-white overflow-hidden group">
                  {/* Action underlay */}
                  <div className="absolute left-0 inset-y-0 bg-red-100 text-red-600 w-20 flex items-center justify-center font-bold text-xs"
                       onClick={() => handleForget(word.word)}>
                    忘记
                  </div>
                  
                  {/* Main content layer */}
                  <div 
                    className="relative bg-white transition-transform w-full"
                    style={{ transform: `translateX(${xOffset}px)` }}
                    onTouchStart={(e) => handleTouchStart(e, word.word)}
                  >
                    <div 
                      className={`px-4 py-4 transition-colors ${isExpanded ? 'bg-orange-50/50' : ''}`}
                      onClick={() => {
                        if (xOffset > 0) setSwipeOffset(prev => ({ ...prev, [word.word]: 0 }));
                        else setExpandedWord(isExpanded ? null : (expandedWord === word.word ? null : word.word));
                      }}
                    >
                      <div className="flex flex-col">
                        <span className={`font-black tracking-normal ${isExpanded ? 'text-orange-600 text-lg' : 'text-slate-800 text-base'}`}>
                          {word.word}
                        </span>
                        
                        {isExpanded && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 text-sm font-medium text-slate-600 flex items-start gap-2"
                          >
                            <div className="flex-1">
                              <p className="leading-relaxed">{word.explanation}</p>
                            </div>
                            <div className="flex flex-col gap-3 ml-2">
                              <button className="text-slate-400 hover:text-orange-500">
                                <Star className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMarkKnown(word.word); }}
                                className="text-xs text-green-600 px-2 py-1 bg-green-50 rounded font-bold"
                              >
                                标熟
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const StudyScreen = ({ onExit, mode, userData }: { onExit: () => void, mode: 'learn' | 'review' | 'test-quick' | 'test-mistake', userData: MeResponse | null }) => {
  const [queue, setQueue] = useState<Idiom[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const target = userData?.dailyTarget || 30;
        let res;
        if (mode === 'learn') {
          res = await api.getSession(target);
        } else if (mode === 'review') {
          res = await api.getReviewSession();
        } else if (mode === 'test-quick') {
          // get top 20 remaining items
          const words = await api.getWords('remaining', 20);
          res = { words: words.sort(() => Math.random() - 0.5) };
        } else if (mode === 'test-mistake') {
          const words = await api.getWords('difficult', 20);
          res = { words };
        }
        setQueue(res?.words || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [mode]);

  const handleChoice = (knewIt: boolean) => {
    setChoice(knewIt);
    setShowDefinition(true);
  };

  const handleContinue = async () => {
    if (choice === null) return;
    
    const word = queue[currentIndex];
    try {
      await api.submitAnswer(word.word, choice);
    } catch (e) {
      console.error(e);
    }
    
    let nextQueue = [...queue];
    if (!choice) {
      // User didn't know it, re-insert randomly into the remaining queue
      const remainingCount = nextQueue.length - (currentIndex + 1);
      const insertIdx = (currentIndex + 1) + Math.floor(Math.random() * (remainingCount + 1));
      nextQueue.splice(insertIdx, 0, word);
    }

    if (currentIndex + 1 >= nextQueue.length) {
      onExit();
    } else {
      setQueue(nextQueue);
      setCurrentIndex(prev => prev + 1);
      setShowDefinition(false);
      setChoice(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (queue.length === 0 || currentIndex >= queue.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">暂无{mode === 'learn' ? '新词' : '待复习词'}</h3>
        <p className="text-xs text-slate-400">太棒了！你已经完成了{mode === 'learn' ? '所有学习内容' : '当前的复习计划'}。</p>
        <button onClick={onExit} className="bg-primary text-white px-8 py-3 rounded-2xl font-bold">返回主页</button>
      </div>
    );
  }

  const word = queue[currentIndex];

  return (
    <div className="h-full bg-background flex flex-col pt-3 px-4 max-w-md mx-auto w-full">
      {/* Header - Very Compact */}
      <header className="flex justify-between items-center mb-1">
        <button onClick={onExit} className="p-2 -ml-2"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
        <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-slate-50">
          <span className="text-[10px] font-black text-primary tracking-widest uppercase">{mode === 'learn' ? '新词背诵' : '温故知新'}</span>
        </div>
        <div className="w-9"></div> {/* placeholder to keep the header balanced */}
      </header>

      {/* Progress Bar - Minimal */}
      <div className="mb-2">
        <div className="w-full bg-slate-200/50 h-1 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${mode === 'learn' ? 'bg-primary' : 'bg-orange-500'}`} style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[8px] font-black text-slate-400 mt-1 uppercase tracking-tighter opacity-60">
          <span>{currentIndex + 1} / {queue.length} {mode === 'learn' ? '今日新词' : '待复习词'}</span>
          <span>掌握中...</span>
        </div>
      </div>

      {/* Card Content Area - Flex Grow but with Min Height */}
      <div className="flex-1 flex flex-col relative min-h-0 py-2">
        <AnimatePresence mode="wait">
          <motion.div 
            key={word.word}
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -5 }}
            className="flex-1 bg-white rounded-[2.5rem] shadow-vibrant border border-slate-50/50 p-6 flex flex-col items-center justify-start text-center space-y-4 relative overflow-hidden"
          >
            {/* Top Indicator - Moved to normal flow to avoid overlapping */}
            <div className="pt-2 h-6">
               {word.frequency >= 6 && <span className="bg-red-50 text-red-500 text-[8px] font-bold px-3 py-1 rounded-full border border-red-100 tracking-widest uppercase shadow-sm">核心高频词指标</span>}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-slate-900 tracking-normal">{word.word}</h2>
                <div className="flex items-center justify-center gap-2">
                   <p className="text-slate-400 font-mono text-[10px] italic tracking-wider">考频: {word.frequency} 次</p>
                   <div className="p-1.5 rounded-full bg-slate-50 group cursor-pointer hover:bg-primary/10 transition-colors">
                     <Volume2 className="w-3 h-3 text-slate-300 group-hover:text-primary" />
                   </div>
                </div>
              </div>
              
              <div className="w-12 h-1 bg-slate-100/60 rounded-full" />

              {!showDefinition ? (
                <button 
                  onClick={() => setShowDefinition(true)}
                  className="w-full py-10 flex flex-col items-center justify-center text-primary/50 font-bold text-xs space-y-3 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-all scale-100 group-hover:scale-110 active:scale-95">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                  <span className="tracking-[0.2em] uppercase opacity-70 text-[10px]">点击查看释义详情</span>
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 text-left w-full overflow-y-auto max-h-[200px] px-2 custom-scrollbar"
                >
                  <div className="space-y-1">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-3 bg-primary rounded-full" />
                      词语解释
                    </h4>
                    <p className="text-slate-700 leading-relaxed text-sm font-medium">{word.explanation}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Buttons - More accessible and high contrast */}
      <div className="py-4 flex gap-3">
        {showDefinition && choice !== null ? (
          <button 
            onClick={handleContinue}
            className="w-full py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black text-[12px] shadow-[0_10px_20px_rgba(79,70,229,0.2)] active:scale-[0.98] transition-all uppercase tracking-widest"
          >
            继续
          </button>
        ) : (
          <>
            <button 
              onClick={() => handleChoice(false)}
              className="flex-1 py-4 rounded-[1.5rem] bg-slate-100 text-slate-600 font-black text-[10px] hover:bg-slate-200 transition-all uppercase tracking-widest flex flex-col items-center gap-1 shadow-sm"
            >
              <XCircle className="w-4 h-4 opacity-40" />
              不认识
            </button>
            <button 
              onClick={() => handleChoice(true)}
              className="flex-1 py-4 rounded-[1.5rem] bg-primary text-white font-black text-[10px] shadow-[0_10px_20px_rgba(59,130,246,0.2)] active:scale-[0.98] transition-all uppercase tracking-widest flex flex-col items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4 opacity-80" />
              认识了
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const MeScreen = ({ userData, onUpdateDailyTarget, onReset }: { userData: MeResponse | null, onUpdateDailyTarget: (val: number) => void, onReset: () => void }) => {
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const handleReset = async () => {
    setResetting(true);
    setShowResetConfirm(false);
    try {
      await api.resetProgress();
      onReset();
    } catch(e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveTarget = async () => {
    const val = parseInt(tempTarget);
    if (!isNaN(val) && val > 0) {
      await api.updateSettings(val);
      onUpdateDailyTarget(val);
    }
    setEditingTarget(false);
  };

  return (
    <div className="px-4 pt-6 flex flex-col h-full overflow-hidden relative">
      <header className="flex items-center gap-4 py-4 shrink-0">
        <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shrink-0">
          <img src="/avatar.png" alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">努力上岸的公考人</h2>
          <p className="text-xs text-slate-500">累计学习 {userData?.stats?.learnedCount || 0} 词</p>
        </div>
        <button className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold shrink-0">
          打卡 1 天
        </button>
      </header>

      <div className="flex-1 space-y-4">
        {/* Feature Grid */}
        <section className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">我的功能</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: '学习计划', icon: GraduationCap, color: 'text-blue-500' },
              { label: '我的收藏', icon: Star, color: 'text-orange-500' },
              { label: '我的笔记', icon: BookOpen, color: 'text-blue-500' },
              { label: '学习记录', icon: BarChart3, color: 'text-blue-500' },
              { label: '复习设置', icon: BarChart3, color: 'text-blue-500' },
              { label: '常用设备', icon: Bell, color: 'text-blue-500' },
              { label: '提醒设置', icon: Bell, color: 'text-blue-500' },
              { label: '我的资料', icon: User, color: 'text-blue-500' },
            ].map((f, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <span className="text-[10px] text-slate-600">{f.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Settings List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
          <button 
            onClick={() => {
              setTempTarget(userData?.dailyTarget?.toString() || '30');
              setEditingTarget(true);
            }} 
            className="w-full flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-700 font-medium">每日新词量</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">{userData?.dailyTarget || 30} 词</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </button>
          {[
            { label: '帮助与反馈', icon: HelpCircle },
            { label: '关于我们', icon: Info },
          ].map((item, idx) => (
            <button key={idx} className="w-full flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-700 font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          ))}
          <button 
            onClick={() => setShowResetConfirm(true)} 
            disabled={resetting}
            className="w-full flex items-center justify-between p-4 border-b border-slate-50 last:border-0 active:bg-slate-50"
          >
            <div className="flex items-center gap-3">
               {resetting ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : <Loader2 className="w-5 h-5 text-slate-400" />}
              <span className="text-sm text-slate-700 font-medium">重置进度</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        <button className="w-full py-2 text-red-500 text-sm font-bold flex items-center justify-center gap-2 mt-2">
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>

      {showResetConfirm && (
        <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-black text-slate-800 text-lg">确认重置进度？</h3>
            <p className="text-slate-500 text-xs">此操作将永久删除您的所有背诵记录和学习统计。操作不可逆，请谨慎！</p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold active:scale-95 transition-transform"
              >
                取消
              </button>
              <button 
                onClick={handleReset}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold active:scale-95 transition-transform shadow-lg shadow-red-500/20"
              >
                确定重置
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTarget && (
        <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-black text-slate-800 text-lg">设置每日新词量</h3>
            <p className="text-slate-500 text-xs">建议每天结合自己的时间设置一个合理的背诵量。根据记忆曲线，复习也是很重要的哦！</p>
            <input 
              type="number" 
              value={tempTarget}
              onChange={(e) => setTempTarget(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-lg font-bold text-center text-slate-800 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setEditingTarget(false)}
                className="flex-1 py-3 text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleSaveTarget}
                className="flex-1 py-3 text-white font-bold bg-primary rounded-xl shadow-lg shadow-primary/20 text-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatsScreen = ({ stats }: { stats: MeResponse['stats'] | null }) => {
  return (
    <div className="px-4 pt-6 flex flex-col h-full bg-background overflow-hidden">
      <header className="px-1 shrink-0 mb-6">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">学习统计</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Learning Statistics</p>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">总计掌握</span>
            <div className="text-3xl font-black text-primary">{stats?.learnedCount || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-50 shadow-sm flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">本周新学</span>
            <div className="text-3xl font-black text-orange-500">{stats ? Math.min(stats.learnedCount, 120) : 0}</div>
          </div>
        </div>

        {/* Chart representation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm">
          <h3 className="font-black text-slate-800 text-sm mb-4">掌握进度</h3>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${Math.min(100, ((stats?.learnedCount || 0) / (stats?.totalWords || 1)) * 100)}%` }} 
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
            <span>{stats?.learnedCount || 0} / {stats?.totalWords || 0} (考公词汇)</span>
            <span>{Math.round(((stats?.learnedCount || 0) / (stats?.totalWords || 1)) * 100)}%</span>
          </div>
        </div>

        {/* Heatmap mockup */}
        <div className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 text-sm">学习打卡</h3>
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">已连续坚持 {stats?.consecutiveDays || 0} 天 🔥</span>
          </div>
          
          <div className="flex gap-2.5">
            <div className="flex flex-col items-center justify-start gap-0.5 mt-1 shrink-0 min-w-[12px]">
              <span className="text-[10px] font-bold text-slate-300">{new Date().getMonth() + 1}</span>
              <span className="text-[10px] font-bold text-slate-300">月</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 flex-1">
              {Array.from({ length: 28 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - i));
                const dStr = date.toISOString().split('T')[0];
                const dayNum = date.getDate();
                const isToday = i === 27;
                
                const activity = stats?.activity?.find(a => a.date === dStr);
                const count = activity ? activity.count : 0;
                
                let intensityClass = 'bg-slate-100';
                let textClass = 'text-slate-400';
                
                if (count > 0) {
                  textClass = 'text-blue-900';
                  if (count >= 50) intensityClass = 'bg-blue-500 text-white';
                  else if (count >= 20) intensityClass = 'bg-blue-400 text-white';
                  else if (count >= 10) intensityClass = 'bg-blue-300 text-blue-900';
                  else intensityClass = 'bg-blue-200 text-blue-900';
                }

                return (
                  <div 
                    key={dStr} 
                    className={`w-full aspect-square flex items-center justify-center ${isToday && count === 0 ? 'rounded-full bg-slate-100 ring-2 ring-slate-300 ring-offset-2 animate-pulse text-slate-400' : isToday && count > 0 ? 'rounded-full shadow-[0_2px_8px_-2px_rgba(59,130,246,0.5)] ring-2 ring-primary/20 ring-offset-2 animate-pulse ' + intensityClass : 'rounded-[4px] ' + intensityClass} ${textClass}`}
                  >
                    <span className="text-[8px] font-bold opacity-80">{dayNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TestScreen = ({ onBack, onStartQuickTest, onStartMistakeTest }: { onBack: () => void, onStartQuickTest: () => void, onStartMistakeTest: () => void }) => {
  return (
    <div className="px-4 pt-6 flex flex-col h-full bg-background overflow-hidden">
      <header className="flex justify-between items-center px-1 shrink-0 mb-6 relative">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors z-10">
          <ArrowLeft className="w-5 h-5 text-slate-800" />
        </button>
        <h1 className="absolute w-full text-center text-xl font-black text-slate-800 uppercase tracking-tight">模拟测试</h1>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {/* Quick Test */}
        <div 
          onClick={onStartQuickTest}
          className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
             <span className="text-3xl">⏱️</span>
          </div>
          <h3 className="font-black text-slate-800 text-lg">快速测试</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">20道题 • 随机抽取测试水平</p>
        </div>

        {/* Mistake Reinforcement */}
        <div 
          onClick={onStartMistakeTest}
          className="bg-white p-5 rounded-3xl border border-slate-50 shadow-sm flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
             <span className="text-3xl">🎯</span>
          </div>
          <h3 className="font-black text-slate-800 text-lg">错题强化</h3>
          <p className="text-xs text-slate-400 font-bold mt-1">针对易错词汇集中打击</p>
        </div>
      </div>
    </div>
  );
};

const StudyDashboard = ({ onStartLearn, onStartReview, stats, userData }: { onStartLearn: () => void, onStartReview: () => void, stats: MeResponse['stats'] | null, userData: MeResponse | null }) => {
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchReviewCount = async () => {
      try {
        const res = await api.getReviewSession();
        setReviewCount(res.words.length);
      } catch (e) {
        console.error("Failed to fetch review session", e);
        setReviewCount(0);
      }
    };
    fetchReviewCount();
  }, []);

  return (
    <div className="px-4 pt-6 flex flex-col h-full bg-background/50 overflow-hidden">
      <header className="px-1 shrink-0 mb-6">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">今日任务</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ebbinghaus Memory Plan</p>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-4">
        {/* Task Cards */}
        <div className="grid grid-cols-1 gap-4">
          {/* Learn New */}
          <button 
            onClick={onStartLearn}
            className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-card flex items-center justify-between group active:scale-[0.98] transition-all text-left"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">今日新词</span>
              </div>
              <h3 className="text-xl font-black text-slate-800">开始背诵</h3>
              <p className="text-[10px] text-slate-400 font-bold">待学习: {stats ? Math.min(stats.remainingCount, userData?.dailyTarget || 30) : '--'} 词 • 预计 15 分钟</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <GraduationCap className="w-7 h-7" strokeWidth={2.5} />
            </div>
          </button>

          {/* Review */}
          <button 
            onClick={onStartReview}
            className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-card flex items-center justify-between group active:scale-[0.98] transition-all text-left"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">记忆复习</span>
              </div>
              <h3 className="text-xl font-black text-slate-800">巩固练习</h3>
              <p className="text-[10px] text-slate-400 font-bold">待复习: {reviewCount !== null ? reviewCount : '--'} 词 • 遵循记忆曲线</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <BarChart3 className="w-7 h-7" strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* Progress Chart Mock */}
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative">
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-60">记忆保留度</h4>
              <span className="text-xs font-black text-primary">85%</span>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t-sm relative group">
                  <div 
                    className="absolute bottom-0 inset-x-0 bg-primary group-hover:bg-white transition-all rounded-t-sm" 
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="text-[9px] font-bold opacity-40 leading-relaxed uppercase tracking-tighter text-center">
              近 7 日词汇掌握趋势分析
            </p>
          </div>
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isStudying, setIsStudying] = useState(false);
  const [studyMode, setStudyMode] = useState<'learn' | 'review' | 'test-quick' | 'test-mistake'>('learn');
  const [userData, setUserData] = useState<MeResponse | null>(null);

  const fetchUser = async () => {
    try {
      const data = await api.getMe();
      setUserData(data);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const startSession = (mode: 'learn' | 'review' | 'test-quick' | 'test-mistake') => {
    setStudyMode(mode);
    setIsStudying(true);
  };

  const handleStudyExit = () => {
    setIsStudying(false);
    fetchUser();
  };

  const renderContent = () => {
    if (isStudying) return <StudyScreen onExit={handleStudyExit} mode={studyMode} userData={userData} />;

    switch (activeTab) {
      case 'home': return <HomeScreen onStartStudy={() => startSession('learn')} setActiveTab={setActiveTab} stats={userData?.stats || null} />;
      case 'library': return <LibraryScreen stats={userData?.stats || null} />;
      case 'difficult': return <WordListScreen onBack={() => setActiveTab('home')} categoryName="难点词汇" categoryId="difficult" />;
      case 'top_words': return <WordListScreen onBack={() => setActiveTab('home')} categoryName="重点词汇" categoryId="top_words" />;
      case 'stats': return <StatsScreen stats={userData?.stats || null} />;
      case 'test': return <TestScreen onBack={() => setActiveTab('home')} onStartQuickTest={() => startSession('test-quick')} onStartMistakeTest={() => startSession('test-mistake')} />;
      case 'study': return <StudyDashboard onStartLearn={() => startSession('learn')} onStartReview={() => startSession('review')} stats={userData?.stats || null} userData={userData} />;
      case 'me': return <MeScreen 
                          userData={userData} 
                          onUpdateDailyTarget={(val) => setUserData(prev => prev ? { ...prev, dailyTarget: val } : null)} 
                          onReset={() => fetchUser()}
                        />;
      default: return <HomeScreen onStartStudy={() => startSession('learn')} setActiveTab={setActiveTab} stats={userData?.stats || null} />;
    }
  };

  return (
    <div className="max-w-[430px] mx-auto h-[100dvh] bg-background font-sans shadow-vibrant relative overflow-hidden flex flex-col border-x border-slate-200">
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>
      {!isStudying && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
    </div>
  );
}
