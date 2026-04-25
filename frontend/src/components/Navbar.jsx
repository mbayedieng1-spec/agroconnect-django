import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { timeAgo } from '../utils/helpers.js';
import api from '../utils/api.js';

const NOTIF_ICONS = { like:'❤️', commentaire:'💬', follow:'👤', partage:'🔄', nouveau_post:'🌱', approbation:'✅', rejet:'❌', suspension:'🚫' };

export default function Navbar() {
  const { currentUser, logout, notifications, unreadCount, markRead, isAdmin, pendingCount } = useApp();
  const [showNotifs,   setShowNotifs]   = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQ,      setSearchQ]      = useState('');
  const [results,      setResults]      = useState([]);
  const [showSearch,   setShowSearch]   = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const notifsRef = useRef();
  const userRef   = useRef();
  const searchRef = useRef();

  useEffect(() => {
    const h = e => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current   && !userRef.current.contains(e.target))   setShowUserMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!searchQ.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try { const r = await api.get('/users/search/query?q='+encodeURIComponent(searchQ)); setResults(r.data); }
      catch {}
    }, 280);
    return () => clearTimeout(t);
  }, [searchQ]);

  const navLinks = [
    { path:'/',        icon:'🏠', label:'Accueil' },
    { path:'/explore', icon:'🌾', label:'Explorer' },
    ...(isAdmin ? [
      { path:'/stats', icon:'📊', label:'Stats', adminOnly:true },
      { path:'/admin', icon:'👑', label:'Admin', adminOnly:true, badge: pendingCount },
    ] : []),
  ];

  return (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:1000,
      background:'rgba(255,255,255,0.97)',backdropFilter:'blur(16px)',
      borderBottom:'1px solid var(--border2)',
      boxShadow:'0 2px 12px rgba(5,150,105,0.08)',
      height:62,
    }}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'0 16px',height:'100%',display:'flex',alignItems:'center',gap:12}}>

        {/* Logo */}
        <Link to="/" style={{display:'flex',alignItems:'center',gap:8,flexShrink:0,textDecoration:'none'}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,var(--g800),var(--g500))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 2px 8px rgba(5,150,105,.3)'}}>
            🌱
          </div>
          <span style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:20,color:'var(--g600)',letterSpacing:-0.5}}>
            AgroConnect
          </span>
        </Link>

        {/* Barre de recherche */}
        <div style={{flex:1,maxWidth:300,position:'relative'}} ref={searchRef}>
          <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'var(--t4)',pointerEvents:'none'}}>🔍</div>
          <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setShowSearch(true);}}
            onFocus={()=>setShowSearch(true)}
            placeholder="Rechercher agriculteurs, régions..."
            style={{width:'100%',padding:'9px 16px 9px 36px',borderRadius:24,border:'1px solid var(--border2)',background:'var(--g50)',fontSize:13,color:'var(--g900)',outline:'none',transition:'all .2s'}}
            // onFocus2={e=>{e.target.style.borderColor='var(--g400)';e.target.style.background='white';}}
            onBlur={e=>{e.target.style.borderColor='var(--border2)';e.target.style.background='var(--g50)';}}
          />
          {showSearch && results.length > 0 && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:4,background:'white',border:'1px solid var(--border2)',borderRadius:14,boxShadow:'var(--sh2)',overflow:'hidden',zIndex:200}}>
              {results.map(u=>(
                <div key={u.id} onClick={()=>{navigate('/profile/'+u.id);setSearchQ('');setResults([]);setShowSearch(false);}}
                  style={{display:'flex',gap:10,padding:'10px 14px',cursor:'pointer',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--g50)'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <span style={{fontSize:22}}>{u.avatar}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,color:'var(--g900)'}}>@{u.pseudo}</div>
                    <div style={{fontSize:11,color:'var(--t3)'}}>{u.type_culture} · {u.region}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nav links */}
        <div style={{display:'flex',gap:2}}>
          {navLinks.map(({path,icon,label,adminOnly,badge})=>(
            <Link key={path} to={path} style={{
              padding:'7px 12px',borderRadius:10,fontSize:13,fontWeight:600,
              display:'flex',gap:5,alignItems:'center',transition:'all .2s',
              background:pathname===path?(adminOnly?'#fee2e2':'var(--g100)'):'transparent',
              color:pathname===path?(adminOnly?'#dc2626':'var(--g600)'):'var(--t2)',
              textDecoration:'none',position:'relative',
            }}>
              <span>{icon}</span><span>{label}</span>
              {badge > 0 && (
                <span style={{background:'#dc2626',color:'white',borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Droite */}
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>

          {/* Cloche notifications */}
          <div style={{position:'relative'}} ref={notifsRef}>
            <button onClick={()=>{setShowNotifs(p=>!p);if(!showNotifs)markRead();}}
              style={{width:40,height:40,borderRadius:'50%',background:unreadCount>0?'var(--g100)':'var(--g50)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'all .2s',cursor:'pointer',position:'relative'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--g100)'}
              onMouseLeave={e=>e.currentTarget.style.background=unreadCount>0?'var(--g100)':'var(--g50)'}>
              🔔
              {unreadCount > 0 && (
                <span style={{position:'absolute',top:-2,right:-2,background:'var(--red)',color:'white',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,border:'2px solid white',animation:'pulse 2s infinite'}}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div style={{position:'absolute',top:'110%',right:0,width:360,background:'white',border:'1px solid var(--border2)',borderRadius:18,boxShadow:'var(--sh3)',zIndex:500,overflow:'hidden'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--g50)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16,color:'var(--g900)'}}>Notifications</span>
                  <button onClick={markRead} style={{fontSize:12,color:'var(--t3)',cursor:'pointer',background:'none',border:'none'}}>Tout marquer lu</button>
                </div>
                <div style={{maxHeight:400,overflowY:'auto'}}>
                  {notifications.length === 0
                    ? <div style={{padding:28,textAlign:'center',color:'var(--t4)',fontSize:13}}>Aucune notification 🌱</div>
                    : notifications.map(n=>(
                      <div key={n.id} style={{padding:'12px 18px',display:'flex',gap:10,alignItems:'flex-start',background:n.lu?'white':'var(--g50)',borderBottom:'1px solid #f9fafb',transition:'background .15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--g50)'}
                        onMouseLeave={e=>e.currentTarget.style.background=n.lu?'white':'var(--g50)'}>
                        <span style={{fontSize:20,flexShrink:0,marginTop:2}}>{NOTIF_ICONS[n.type]||'🔔'}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.4}}>
                            <strong style={{color:'var(--g600)'}}>{n.expediteur?.pseudo}</strong>{' '}{n.message}
                          </div>
                          <div style={{fontSize:11,color:'var(--t4)',marginTop:2}}>{timeAgo(n.date)}</div>
                        </div>
                        {!n.lu && <div style={{width:8,height:8,borderRadius:'50%',background:'var(--g500)',flexShrink:0,marginTop:6}}/>}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          {/* Menu utilisateur */}
          <div style={{position:'relative'}} ref={userRef}>
            <button onClick={()=>setShowUserMenu(p=>!p)} style={{
              display:'flex',alignItems:'center',gap:8,padding:'6px 12px',
              borderRadius:24,background:'var(--g50)',border:'1px solid var(--border2)',
              transition:'all .2s',cursor:'pointer',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--g100)'}
            onMouseLeave={e=>e.currentTarget.style.background='var(--g50)'}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,border:'2px solid var(--g200)'}}>
                {currentUser?.avatar}
              </div>
              <span style={{fontWeight:600,color:'var(--g900)',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:13}}>
                {currentUser?.prenom}
              </span>
              <span style={{color:'var(--t4)',fontSize:10}}>▼</span>
            </button>

            {showUserMenu && (
              <div style={{position:'absolute',right:0,top:'110%',width:220,background:'white',border:'1px solid var(--border2)',borderRadius:16,boxShadow:'var(--sh2)',zIndex:200,overflow:'hidden'}}>
                <div style={{padding:'12px 14px',borderBottom:'1px solid var(--g50)',background:'var(--g50)'}}>
                  <div style={{fontWeight:700,fontSize:14,color:'var(--g900)'}}>
                    {currentUser?.prenom} {currentUser?.nom}
                  </div>
                  <div style={{fontSize:12,color:'var(--t3)'}}>@{currentUser?.pseudo}</div>
                  {isAdmin && <span style={{background:'#fee2e2',color:'#dc2626',borderRadius:10,padding:'1px 8px',fontSize:10,fontWeight:700}}>👑 Admin</span>}
                </div>
                <Link to={'/profile/'+currentUser?.id} onClick={()=>setShowUserMenu(false)}
                  style={{display:'flex',gap:10,padding:'11px 14px',color:'var(--t2)',fontSize:13,textDecoration:'none',alignItems:'center',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--g50)'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  👤 Mon profil
                </Link>
                <Link to={'/explore'} onClick={()=>setShowUserMenu(false)}
                  style={{display:'flex',gap:10,padding:'11px 14px',color:'var(--t2)',fontSize:13,textDecoration:'none',alignItems:'center',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--g50)'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  🌾 Explorer
                </Link>
                <div style={{borderTop:'1px solid var(--g50)'}}>
                  <button onClick={()=>{logout();setShowUserMenu(false);}}
                    style={{width:'100%',padding:'11px 14px',textAlign:'left',fontSize:13,color:'var(--red)',display:'flex',gap:10,alignItems:'center',background:'none',border:'none',cursor:'pointer',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    🚪 Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
