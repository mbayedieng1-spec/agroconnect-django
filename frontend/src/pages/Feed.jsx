import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext.jsx';
import PostCard from '../components/PostCard.jsx';
import NewPostModal from '../components/NewPostModal.jsx';
import api from '../utils/api.js';

export default function Feed() {
  const { currentUser, socket } = useApp();
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(true);
  const [skip,        setSkip]        = useState(0);
  const [showModal,   setShowModal]   = useState(false);
  const [filter,      setFilter]      = useState('all');   // all | following | tag
  const [activeTag,   setActiveTag]   = useState('');
  const [sort,        setSort]        = useState('recent');
  const [liveNotice,  setLiveNotice]  = useState('');
  const LIMIT = 15;

  const fetchPosts = useCallback(async (reset=false) => {
    if (!currentUser) return;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      let data = [], total = 0;
      const s = reset ? 0 : skip;

      if (filter === 'following') {
        const r = await api.get('/users/'+currentUser.id+'/feed');
        data = r.data; total = data.length;
        setPosts(data); setHasMore(false);
        return;
      }

      const tag = filter === 'tag' ? activeTag : '';
      const r = await api.get('/publications',{ params:{ sort, skip:s, limit:LIMIT, tag } });
      data = r.data.pubs; total = r.data.total;
      setPosts(p => reset ? data : [...p,...data]);
      setSkip(s + LIMIT);
      setHasMore(data.length === LIMIT);
    } finally { setLoading(false); setLoadingMore(false); }
  }, [currentUser, filter, activeTag, sort, skip]);

  useEffect(() => { setSkip(0); fetchPosts(true); }, [currentUser, filter, activeTag, sort]);

  useEffect(() => {
    if (!socket) return;
    const onCreated = pub => {
      setPosts(p => [pub, ...p]);
      setLiveNotice('🌱 Nouvelle publication !');
      setTimeout(() => setLiveNotice(''), 3500);
    };
    const onDeleted = id  => setPosts(p => p.filter(x => x.id !== id));
    const onLike    = d   => setPosts(p => p.map(x => x.id===d.postId?{...x,likes:d.likes}:x));
    const onComment = d   => setPosts(p => p.map(x => {
      if (x.id !== d.postId) return x;
      const exists = x.commentaires?.find(c => c.id === d.comment?.id);
      return exists ? x : {...x,commentaires:[...(x.commentaires||[]),d.comment]};
    }));
    socket.on('publication_created', onCreated);
    socket.on('publication_deleted', onDeleted);
    socket.on('like_update', onLike);
    socket.on('comment_added', onComment);
    return () => { socket.off('publication_created',onCreated); socket.off('publication_deleted',onDeleted); socket.off('like_update',onLike); socket.off('comment_added',onComment); };
  }, [socket, filter]);

  const handleTagClick = tag => { setActiveTag(tag); setFilter('tag'); };

  const tabs = [
    { key:'all',       icon:'🌍', label:'Toutes les publications' },
    { key:'following', icon:'👥', label:'Mon fil' },
  ];

  return (
    <div>
      {liveNotice && (
        <div className="fade-in" style={{background:'var(--g100)',border:'1px solid var(--g300)',borderRadius:10,padding:'8px 14px',marginBottom:10,fontSize:13,color:'var(--g700)',fontWeight:600,textAlign:'center'}}>
          {liveNotice}
        </div>
      )}

      {/* Barre de composition */}
      <div className="card" style={{padding:14,marginBottom:12}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <div style={{width:44,height:44,borderRadius:'50%',flexShrink:0,background:'var(--g100)',border:'2px solid var(--g200)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>
            {currentUser?.avatar}
          </div>
          <button onClick={()=>setShowModal(true)} style={{
            flex:1,textAlign:'left',padding:'10px 16px',background:'var(--g50)',
            border:'1px solid var(--border2)',borderRadius:24,color:'var(--t4)',fontSize:14,cursor:'pointer',transition:'all .2s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='var(--g100)';e.currentTarget.style.borderColor='var(--g300)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='var(--g50)';e.currentTarget.style.borderColor='var(--border2)'}}>
            Quoi de neuf sur votre exploitation, {currentUser?.prenom} ?
          </button>
        </div>
        <div style={{display:'flex',gap:6,marginTop:10,paddingTop:10,borderTop:'1px solid var(--border)'}}>
          {[{icon:'📷',label:'Photo/Vidéo'},{icon:'😊',label:'Feeling'},{icon:'📍',label:'Localisation'}].map(b=>(
            <button key={b.label} onClick={()=>setShowModal(true)} style={{
              flex:1,display:'flex',gap:6,alignItems:'center',justifyContent:'center',
              padding:'7px',borderRadius:8,fontSize:13,fontWeight:600,color:'var(--t3)',transition:'background .15s',border:'none',background:'transparent',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--g50)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{fontSize:18}}>{b.icon}</span>{b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{padding:'6px 8px',marginBottom:12,display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>{setFilter(t.key);setActiveTag('');}}
            style={{
              padding:'8px 14px',borderRadius:8,fontSize:13,fontWeight:600,
              background:filter===t.key?'var(--g100)':'transparent',
              color:filter===t.key?'var(--g600)':'var(--t3)',
              transition:'all .18s',border:'none',cursor:'pointer',display:'flex',gap:5,alignItems:'center',
            }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
        {activeTag && (
          <button onClick={()=>{setActiveTag('');setFilter('all');}}
            style={{padding:'8px 12px',borderRadius:8,fontSize:13,fontWeight:600,background:'var(--g600)',color:'white',border:'none',cursor:'pointer',display:'flex',gap:5,alignItems:'center'}}>
            #{activeTag} ✕
          </button>
        )}
        <div style={{marginLeft:'auto',display:'flex',gap:4}}>
          {[['recent','📅 Récent'],['likes','❤️ Likés']].map(([k,l])=>(
            <button key={k} onClick={()=>setSort(k)} style={{
              padding:'6px 10px',borderRadius:8,fontSize:12,fontWeight:600,
              background:sort===k?'var(--g100)':'transparent',
              color:sort===k?'var(--g600)':'var(--t3)',
              transition:'all .18s',border:'none',cursor:'pointer',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        Array.from({length:3}).map((_,i)=>(
          <div key={i} className="card" style={{marginBottom:12,padding:16}}>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              <div className="skeleton" style={{width:44,height:44,borderRadius:'50%',flexShrink:0}}/>
              <div style={{flex:1}}>
                <div className="skeleton" style={{height:14,width:'40%',marginBottom:6}}/>
                <div className="skeleton" style={{height:12,width:'25%'}}/>
              </div>
            </div>
            <div className="skeleton" style={{height:14,marginBottom:6}}/>
            <div className="skeleton" style={{height:14,width:'80%',marginBottom:6}}/>
            <div className="skeleton" style={{height:120,marginTop:10,borderRadius:10}}/>
          </div>
        ))
      ) : posts.length === 0 ? (
        <div className="card" style={{padding:48,textAlign:'center'}}>
          <div style={{fontSize:56,marginBottom:12}}>🌾</div>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:20,color:'var(--g800)',marginBottom:8}}>
            Aucune publication pour l'instant
          </div>
          <div style={{color:'var(--t3)',fontSize:14,marginBottom:20}}>Soyez le premier à partager une actualité !</div>
          <button onClick={()=>setShowModal(true)} className="btn-primary" style={{padding:'10px 24px'}}>
            🌱 Créer une publication
          </button>
        </div>
      ) : (
        <>
          {posts.map(p=>(
            <PostCard key={p.id} post={p}
              onDelete={id=>setPosts(prev=>prev.filter(x=>x.id!==id))}
              onTagClick={handleTagClick} />
          ))}
          {hasMore && (
            <button onClick={()=>fetchPosts(false)} disabled={loadingMore}
              style={{width:'100%',padding:'12px',borderRadius:10,border:'1px solid var(--border2)',background:'white',color:'var(--g600)',fontSize:13,fontWeight:600,cursor:'pointer',marginTop:4,transition:'all .2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--g50)'}
              onMouseLeave={e=>e.currentTarget.style.background='white'}>
              {loadingMore?'⏳ Chargement...':'⬇️ Voir plus de publications'}
            </button>
          )}
        </>
      )}

      {showModal && <NewPostModal onClose={()=>setShowModal(false)} onCreated={pub=>setPosts(p=>[pub,...p])} />}
    </div>
  );
}
