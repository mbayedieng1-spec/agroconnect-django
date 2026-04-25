import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { getTagColor } from '../utils/helpers.js';
import api from '../utils/api.js';

export default function RightPanel() {
  const { currentUser, users, refreshUser } = useApp();
  const [top3,  setTop3]  = useState([]);
  const [tags,  setTags]  = useState([]);
  const [followLoading, setFollowLoading] = useState({});

  useEffect(() => {
    api.get('/publications/top3').then(r=>setTop3(r.data)).catch(()=>{});
    // Tags depuis les publications publiques
    api.get('/publications',{params:{limit:50}}).then(r=>{
      const tagCount = {};
      r.data.pubs?.forEach(p=>p.tags?.forEach(t=>{tagCount[t]=(tagCount[t]||0)+1;}));
      setTags(Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).slice(0,10));
    }).catch(()=>{});
  }, []);

  const suggestions = (users||[]).filter(u=>
    u.id !== currentUser?.id &&
    !currentUser?.following?.some(f=>(f.id||f)===u.id)
  ).slice(0,4);

  const handleFollow = async (user) => {
    if (!currentUser) return;
    setFollowLoading(p=>({...p,[user.id]:true}));
    try {
      await api.patch('/users/'+user.id+'/follow',{currentUserId:currentUser.id});
      await refreshUser();
    } finally { setFollowLoading(p=>({...p,[user.id]:false})); }
  };

  return (
    <aside style={{position:'sticky',top:80,display:'flex',flexDirection:'column',gap:12}}>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="card" style={{padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--t3)',letterSpacing:.5,textTransform:'uppercase',marginBottom:12}}>
            Suggestions d'abonnement
          </div>
          {suggestions.map(u=>(
            <div key={u.id} style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
              <Link to={'/profile/'+u.id}>
                <div style={{width:42,height:42,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,border:'2px solid var(--g200)',flexShrink:0,transition:'transform .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
                  {u.avatar}
                </div>
              </Link>
              <div style={{flex:1,minWidth:0}}>
                <Link to={'/profile/'+u.id} style={{textDecoration:'none'}}>
                  <div style={{fontWeight:600,fontSize:13,color:'var(--g900)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>@{u.pseudo}</div>
                </Link>
                <div style={{fontSize:11,color:'var(--t3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.type_culture}</div>
              </div>
              <button onClick={()=>handleFollow(u)} disabled={followLoading[u.id]} style={{
                background:'var(--g600)',color:'white',border:'none',borderRadius:16,
                padding:'4px 12px',fontSize:12,fontWeight:600,cursor:'pointer',flexShrink:0,
                transition:'all .2s',opacity:followLoading[u.id]?.6:1,
              }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--g700)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--g600)'}>
                {followLoading[u.id]?'...':'+ Suivre'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Top 3 */}
      {top3.length > 0 && (
        <div className="card" style={{padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--t3)',letterSpacing:.5,textTransform:'uppercase',marginBottom:12}}>🏆 Top publications</div>
          {top3.map((pub,i)=>pub&&(
            <div key={pub?.id||i} style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:12}}>
              <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,background:['#fef3c7','#f1f5f9','#fff7ed'][i],color:['#b45309','#475569','#92400e'][i]}}>
                {['🥇','🥈','🥉'][i]}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:'var(--t2)',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',lineHeight:1.4}}>{pub?.contenu}</div>
                {pub?.images?.length>0 && <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>📷 {pub.images.length} photo{pub.images.length>1?'s':''}</div>}
                <div style={{fontSize:11,color:'var(--t4)',marginTop:3}}>❤️ {pub?.likes?.length} · 💬 {pub?.commentaires?.length}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tags tendance */}
      {tags.length > 0 && (
        <div className="card" style={{padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--t3)',letterSpacing:.5,textTransform:'uppercase',marginBottom:12}}>🌿 Tags tendance</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {tags.map(([tag,count])=>(
              <Link key={tag} to={'/explore?tag='+tag} style={{textDecoration:'none'}}>
                <span className="tag" style={{background:getTagColor(tag)+'18',color:getTagColor(tag),border:`1px solid ${getTagColor(tag)}30`}}>
                  #{tag} <span style={{opacity:.6,fontWeight:400,fontSize:10}}>{count}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats rapides (visibles pour tous) */}
      <div className="card" style={{padding:16}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--t3)',letterSpacing:.5,textTransform:'uppercase',marginBottom:12}}>📈 Plateforme</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[
            ['👨‍🌾','Membres', (users||[]).length],
            ['🌱','Publications', top3.length > 0 ? '...' : '-'],
          ].map(([icon,label,val])=>(
            <div key={label} style={{background:'var(--g50)',borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
              <div style={{fontSize:18}}>{icon}</div>
              <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:20,color:'var(--g600)'}}>{val}</div>
              <div style={{fontSize:10,color:'var(--t3)'}}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
