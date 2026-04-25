import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PostCard from '../components/PostCard.jsx';
import { getTagColor } from '../utils/helpers.js';
import api from '../utils/api.js';

const POPULAR_TAGS = ['irrigation','bio','riziculture','arachide','maraîchage','élevage','hivernage','mil','cajou','mangue','sécheresse','agroécologie','formation','biodiversité','rotation'];

export default function Explore() {
  const [searchParams] = useSearchParams();
  const initialTag = searchParams.get('tag')||'';
  const [activeTag,   setActiveTag]   = useState(initialTag);
  const [posts,       setPosts]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [view,        setView]        = useState('posts');
  const [userSearch,  setUserSearch]  = useState('');

  useEffect(() => {
    if (initialTag) fetchByTag(initialTag);
    else fetchAll();
    fetchUsers();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await api.get('/publications',{params:{sort:'recent',limit:30}});
      setPosts(r.data.pubs);
    } finally { setLoading(false); }
  };

  const fetchByTag = async (tag) => {
    setActiveTag(tag);
    setLoading(true);
    try {
      const r = await api.get('/publications/tag/'+encodeURIComponent(tag));
      setPosts(r.data);
    } finally { setLoading(false); }
  };

  const fetchUsers = async (q='') => {
    try {
      const url = q ? '/users/search/query?q='+encodeURIComponent(q) : '/users';
      const r = await api.get(url);
      setUsers(r.data);
    } catch {}
  };

  return (
    <div>
      <div className="card" style={{padding:20,marginBottom:12}}>
        <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:22,color:'var(--g900)',marginBottom:4}}>
          🌾 Explorer AgroConnect
        </div>
        <div style={{color:'var(--t3)',fontSize:14,marginBottom:16}}>
          Découvrez des agriculteurs et publications de toute la Sénégal
        </div>
        <div style={{display:'flex',gap:6,marginBottom:16}}>
          {[['posts','📝','Publications'],['users','👨‍🌾','Agriculteurs']].map(([k,i,l])=>(
            <button key={k} onClick={()=>setView(k)} style={{
              padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,
              background:view===k?'var(--g600)':'var(--g50)',
              color:view===k?'white':'var(--t2)',border:'none',cursor:'pointer',transition:'all .18s',
            }}>{i} {l}</button>
          ))}
        </div>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--t4)',letterSpacing:.5,textTransform:'uppercase',marginBottom:8}}>Tags populaires</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {POPULAR_TAGS.map(t=>(
              <button key={t} onClick={()=>activeTag===t?(setActiveTag(''),fetchAll()):fetchByTag(t)}
                className="tag"
                style={{background:activeTag===t?getTagColor(t)+'20':'var(--g50)',color:activeTag===t?getTagColor(t):'var(--t2)',border:`1px solid ${activeTag===t?getTagColor(t)+'40':'var(--border)'}`}}>
                #{t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view==='posts' ? (
        <>
          {activeTag && (
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10,padding:'10px 14px',background:'var(--g50)',borderRadius:10,border:'1px solid var(--border2)',fontSize:13}}>
              <span>🔍 Publications :</span>
              <span className="tag" style={{background:getTagColor(activeTag)+'20',color:getTagColor(activeTag),border:`1px solid ${getTagColor(activeTag)}30`}}>#{activeTag}</span>
              <span style={{color:'var(--t4)'}}>· {posts.length} résultat{posts.length!==1?'s':''}</span>
              <button onClick={()=>{setActiveTag('');fetchAll();}} style={{marginLeft:'auto',color:'var(--t3)',fontSize:12,background:'none',border:'none',cursor:'pointer'}}>Effacer ✕</button>
            </div>
          )}
          {loading
            ? Array.from({length:3}).map((_,i)=><div key={i} className="card skeleton" style={{marginBottom:12,height:160}}/>)
            : posts.length===0
            ? <div className="card" style={{padding:40,textAlign:'center'}}><div style={{fontSize:48,marginBottom:10}}>🔍</div><div style={{color:'var(--t3)',fontSize:14}}>Aucune publication trouvée.</div></div>
            : posts.map(p=><PostCard key={p.id} post={p} onTagClick={fetchByTag}/>)
          }
        </>
      ) : (
        <>
          <div className="card" style={{padding:12,marginBottom:12}}>
            <input value={userSearch} onChange={e=>{setUserSearch(e.target.value);fetchUsers(e.target.value);}}
              placeholder="🔍 Rechercher par pseudo, région, type de culture..."
              className="input" />
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {users.map(u=>(
              <Link key={u.id} to={'/profile/'+u.id} style={{textDecoration:'none'}}>
                <div className="card" style={{padding:16,transition:'all .2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(5,150,105,.12)';e.currentTarget.style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform=''}}>
                  <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
                    <div style={{width:52,height:52,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,border:'2px solid var(--g200)',flexShrink:0}}>
                      {u.avatar}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,color:'var(--g900)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {u.prenom} {u.nom}
                      </div>
                      <div style={{fontSize:12,color:'var(--t3)'}}>@{u.pseudo}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:8}}>
                    <span style={{background:'var(--g100)',color:'var(--g800)',borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600}}>{u.type_culture}</span>
                    <span style={{background:'#e0f2fe',color:'#0369a1',borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600}}>📍 {u.region}</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--t4)'}}>👥 {u.followers?.length||0} abonnés</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
