import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import PostCard from '../components/PostCard.jsx';
import { timeAgo } from '../utils/helpers.js';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

const COVER_COLORS = ['#064e3b','#1e3a5f','#3b0764','#7f1d1d','#422006','#022c22','#0c1a2e','#1a0533','#14532d','#134e4a'];

export default function Profile() {
  const { id } = useParams();
  const { currentUser, refreshUser, isAdmin } = useApp();
  const [user,     setUser]     = useState(null);
  const [posts,    setPosts]    = useState([]);
  const [tab,      setTab]      = useState('posts');
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [editData, setEditData] = useState({});
  const [followLoading, setFollowLoading] = useState(false);

  const isOwn      = id === currentUser?.id;
  const isFollowing = currentUser?.following?.some(f=>(f.id||f)===id);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/users/'+id),
      api.get('/users/'+id+'/publications?requesterId='+(currentUser?.id||'')),
    ]).then(([ur,pr]) => {
      setUser(ur.data);
      setPosts(pr.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!currentUser) return;
    setFollowLoading(true);
    try {
      await api.patch('/users/'+id+'/follow',{currentUserId:currentUser.id});
      const r = await api.get('/users/'+id);
      setUser(r.data);
      await refreshUser();
      toast.success(isFollowing?'Abonnement annulé':'Vous suivez @'+user.pseudo+' !');
    } finally { setFollowLoading(false); }
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch('/users/'+id, editData);
      const r = await api.get('/users/'+id);
      setUser(r.data);
      await refreshUser();
      setEditing(false); setEditData({});
      toast.success('Profil mis à jour ! ✅');
    } catch { toast.error('Erreur lors de la mise à jour'); }
  };

  if (loading) return (
    <div>
      <div className="skeleton" style={{height:200,borderRadius:16,marginBottom:16}}/>
      <div className="card" style={{padding:20}}>
        <div style={{display:'flex',gap:12}}>
          <div className="skeleton" style={{width:80,height:80,borderRadius:'50%'}}/>
          <div style={{flex:1}}>
            <div className="skeleton" style={{height:20,width:'40%',marginBottom:8}}/>
            <div className="skeleton" style={{height:14,width:'60%'}}/>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return <div className="card" style={{padding:40,textAlign:'center',color:'var(--t3)'}}>Utilisateur introuvable</div>;

  return (
    <div>
      {/* Cover */}
      <div style={{
        height:200,borderRadius:16,overflow:'hidden',
        background:user.coverColor?`linear-gradient(135deg,${user.coverColor},${user.coverColor}bb)`:'linear-gradient(135deg,var(--g800),var(--g500))',
        position:'relative',marginBottom:0,
      }}>
        {isOwn && editing && (
          <div style={{position:'absolute',bottom:12,right:12,display:'flex',gap:6,flexWrap:'wrap'}}>
            {COVER_COLORS.map(c=>(
              <button key={c} onClick={()=>setEditData(p=>({...p,coverColor:c}))}
                style={{width:28,height:28,borderRadius:'50%',background:c,cursor:'pointer',border:(editData.coverColor||user.coverColor)===c?'3px solid white':'2px solid rgba(255,255,255,.3)',transition:'transform .15s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.2)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
            ))}
          </div>
        )}
      </div>

      {/* Profil header */}
      <div className="card" style={{padding:'0 20px 16px',marginBottom:12,borderTopLeftRadius:0,borderTopRightRadius:0}}>
        <div style={{display:'flex',gap:16,alignItems:'flex-end',marginBottom:12,marginTop:-48}}>
          <div style={{width:96,height:96,borderRadius:'50%',background:'white',border:'4px solid white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:50,boxShadow:'var(--sh2)',flexShrink:0}}>
            {editing
              ? <input value={editData.avatar??user.avatar} onChange={e=>setEditData(p=>({...p,avatar:e.target.value}))}
                  style={{width:60,textAlign:'center',border:'none',background:'transparent',fontSize:50,outline:'none'}}/>
              : user.avatar
            }
          </div>
          <div style={{flex:1,paddingBottom:4}}>
            {editing ? (
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {['prenom','nom'].map(f=>(
                  <input key={f} value={editData[f]??user[f]} onChange={e=>setEditData(p=>({...p,[f]:e.target.value}))}
                    placeholder={f} style={{padding:'6px 10px',borderRadius:8,border:'1px solid var(--border2)',fontSize:15,fontWeight:700,background:'var(--g50)',width:130,outline:'none'}}/>
                ))}
              </div>
            ) : (
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:22,color:'var(--g900)'}}>
                  {user.prenom} {user.nom}
                </div>
                {user.role==='admin' && <span style={{background:'#fee2e2',color:'#dc2626',borderRadius:20,padding:'2px 10px',fontSize:11,fontWeight:700}}>👑 Admin</span>}
              </div>
            )}
            <div style={{color:'var(--t3)',fontSize:13}}>@{user.pseudo}</div>
          </div>
          <div style={{display:'flex',gap:8,paddingBottom:4}}>
            {isOwn ? (
              editing ? (
                <>
                  <button onClick={handleSaveEdit} className="btn-primary" style={{padding:'9px 18px'}}>💾 Sauvegarder</button>
                  <button onClick={()=>{setEditing(false);setEditData({});}} className="btn-ghost">Annuler</button>
                </>
              ) : (
                <button onClick={()=>{setEditing(true);setEditData({});}} className="btn-ghost">✏️ Modifier</button>
              )
            ) : user.role !== 'admin' && (
              <button onClick={handleFollow} disabled={followLoading} className={isFollowing?'btn-ghost':'btn-primary'}
                style={{padding:'9px 20px',opacity:followLoading?.6:1}}>
                {followLoading?'...':(isFollowing?'✓ Abonné':'+ Suivre')}
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        {editing ? (
          <textarea value={editData.bio??user.bio??''} onChange={e=>setEditData(p=>({...p,bio:e.target.value}))}
            placeholder="Parlez de votre exploitation..." rows={2}
            className="input" style={{resize:'none',marginBottom:10}}/>
        ) : user.bio ? (
          <p style={{fontSize:14,color:'var(--t2)',marginBottom:10,lineHeight:1.5}}>{user.bio}</p>
        ) : null}

        {/* Infos */}
        <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:14}}>
          <span style={{fontSize:13,color:'var(--t3)',display:'flex',gap:4,alignItems:'center'}}>🌾 {user.type_culture}</span>
          <span style={{fontSize:13,color:'var(--t3)',display:'flex',gap:4,alignItems:'center'}}>📍 {user.region}</span>
          <span style={{fontSize:13,color:'var(--t3)',display:'flex',gap:4,alignItems:'center'}}>📅 Membre {timeAgo(user.createdAt)}</span>
        </div>

        {/* Stats */}
        <div style={{display:'flex',gap:24,paddingTop:10,borderTop:'1px solid var(--border)'}}>
          {[[posts.length,'Publications'],[user.followers?.length||0,'Abonnés'],[user.following?.length||0,'Abonnements']].map(([val,label])=>(
            <div key={label} style={{cursor:'pointer'}} onClick={()=>setTab(label.toLowerCase())}>
              <span style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:18,color:'var(--g600)'}}>{val}</span>
              <span style={{fontSize:12,color:'var(--t3)',marginLeft:5}}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{padding:'4px 8px',marginBottom:12,display:'flex',gap:4}}>
        {[
          {key:'posts',icon:'📝',label:'Publications'},
          {key:'abonnés',icon:'👥',label:'Abonnés'},
          {key:'abonnements',icon:'👤',label:'Abonnements'},
          ...(isOwn?[{key:'saved',icon:'🔖',label:'Enregistrés'}]:[]),
        ].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1,padding:'9px 4px',borderRadius:8,fontSize:13,fontWeight:600,
            background:tab===t.key?'var(--g100)':'transparent',
            color:tab===t.key?'var(--g600)':'var(--t3)',
            transition:'all .18s',border:'none',cursor:'pointer',display:'flex',gap:4,alignItems:'center',justifyContent:'center',
          }}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu des tabs */}
      {tab==='posts' && (
        posts.length===0
          ? <div className="card" style={{padding:36,textAlign:'center',color:'var(--t4)',fontSize:14}}>Aucune publication pour l'instant 🌱</div>
          : posts.map(p=><PostCard key={p.id} post={p} onDelete={id=>setPosts(pp=>pp.filter(x=>x.id!==id))}/>)
      )}

      {(tab==='abonnés'||tab==='abonnements') && (() => {
        const list = tab==='abonnés'?user.followers:user.following;
        return (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {!(list||[]).length
              ? <div className="card" style={{padding:24,textAlign:'center',color:'var(--t4)',fontSize:13,gridColumn:'1/-1'}}>Aucun utilisateur</div>
              : (list||[]).map(u=>(
                <Link key={u.id||u} to={'/profile/'+(u.id||u)} style={{textDecoration:'none'}}>
                  <div className="card" style={{padding:14,display:'flex',gap:10,alignItems:'center',transition:'all .2s'}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(5,150,105,.12)';e.currentTarget.style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform=''}}>
                    <div style={{width:46,height:46,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,border:'2px solid var(--g200)',flexShrink:0}}>
                      {u.avatar||'👤'}
                    </div>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--g900)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>@{u.pseudo}</div>
                      <div style={{fontSize:11,color:'var(--t3)'}}>{u.type_culture}</div>
                      <div style={{fontSize:11,color:'var(--t4)'}}>📍 {u.region}</div>
                    </div>
                  </div>
                </Link>
              ))
            }
          </div>
        );
      })()}

      {tab==='saved' && isOwn && (() => {
        const savedIds = user.savedPosts?.map(s=>s.id||s)||[];
        const savedPosts = posts.filter(p=>savedIds.includes(p.id));
        return savedPosts.length===0
          ? <div className="card" style={{padding:36,textAlign:'center',color:'var(--t4)',fontSize:14}}>Aucune publication enregistrée 🔖</div>
          : savedPosts.map(p=><PostCard key={p.id} post={p} onDelete={id=>setPosts(pp=>pp.filter(x=>x.id!==id))}/>);
      })()}
    </div>
  );
}
