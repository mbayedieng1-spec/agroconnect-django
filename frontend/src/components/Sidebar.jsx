import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function Sidebar() {
  const { currentUser, isAdmin } = useApp();
  const { pathname } = useLocation();

  if (!currentUser) return (
    <aside style={{position:'sticky',top:80}}>
      {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:56,borderRadius:12,marginBottom:8}}/>)}
    </aside>
  );

  const links = [
    { icon:'🏠', label:'Fil d\'actualité', path:'/' },
    { icon:'👤', label:'Mon profil',        path:'/profile/'+currentUser.id },
    { icon:'🌾', label:'Explorer',          path:'/explore' },
    ...(isAdmin ? [
      { icon:'📊', label:'Statistiques',   path:'/stats', adminOnly:true },
      { icon:'👑', label:'Administration', path:'/admin', adminOnly:true },
    ] : []),
    { icon:'🔖', label:'Enregistrés',       path:'/profile/'+currentUser.id+'?tab=saved' },
  ];

  return (
    <aside style={{position:'sticky',top:80,display:'flex',flexDirection:'column',gap:8}}>

      {/* Profile card */}
      <div className="card" style={{overflow:'hidden',marginBottom:4}}>
        <div style={{
          height:72, borderRadius:'14px 14px 0 0',
          background:currentUser.coverColor?`linear-gradient(135deg,${currentUser.coverColor},${currentUser.coverColor}99)`:'linear-gradient(135deg,var(--g800),var(--g600))',
        }}/>
        <div style={{padding:'0 14px 14px',marginTop:-30}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:'white',border:'3px solid white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,marginBottom:8,boxShadow:'var(--sh2)'}}>
            {currentUser.avatar}
          </div>
          <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,color:'var(--g900)'}}>
            {currentUser.prenom} {currentUser.nom}
          </div>
          {isAdmin && (
            <span style={{background:'#fee2e2',color:'#dc2626',borderRadius:20,padding:'2px 10px',fontSize:11,fontWeight:700}}>👑 Administrateur</span>
          )}
          <div style={{fontSize:12,color:'var(--t3)',marginBottom:10,marginTop:isAdmin?4:0}}>@{currentUser.pseudo}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,textAlign:'center'}}>
            {[['Abonnés',currentUser.followers?.length||0],['Suivis',currentUser.following?.length||0]].map(([label,val])=>(
              <div key={label} style={{background:'var(--g50)',borderRadius:8,padding:'6px 4px'}}>
                <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:18,color:'var(--g600)'}}>{val}</div>
                <div style={{fontSize:11,color:'var(--t3)'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="card" style={{padding:8}}>
        {links.map(({icon,label,path,adminOnly})=>(
          <Link key={path} to={path} style={{
            display:'flex',gap:12,alignItems:'center',padding:'10px 12px',borderRadius:10,
            color:pathname===path?'var(--g600)':'var(--t2)',
            background:pathname===path?'var(--g50)':'transparent',
            fontSize:14,fontWeight:pathname===path?700:500,
            transition:'all .18s',textDecoration:'none',
            borderLeft:pathname===path?'3px solid var(--g500)':'3px solid transparent',
          }}
          onMouseEnter={e=>{if(pathname!==path){e.currentTarget.style.background='var(--g50)';e.currentTarget.style.color='var(--g600)';}}}
          onMouseLeave={e=>{if(pathname!==path){e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--t2)';}}}
          >
            <span style={{fontSize:20,width:26,textAlign:'center'}}>{icon}</span>
            <span style={{flex:1}}>{label}</span>
            {adminOnly && <span style={{fontSize:9,background:'#fee2e2',color:'#dc2626',borderRadius:10,padding:'1px 6px',fontWeight:700}}>ADMIN</span>}
          </Link>
        ))}
      </div>

      {/* Badge culture */}
      <div className="card" style={{padding:14}}>
        <div style={{fontSize:11,color:'var(--t4)',fontWeight:600,letterSpacing:.5,textTransform:'uppercase',marginBottom:8}}>Mon exploitation</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:currentUser.bio?8:0}}>
          <span style={{background:'var(--g100)',color:'var(--g800)',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>{currentUser.type_culture}</span>
          <span style={{background:'#e0f2fe',color:'#0369a1',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:600}}>📍 {currentUser.region}</span>
        </div>
        {currentUser.bio && <p style={{fontSize:12,color:'var(--t3)',lineHeight:1.5,fontStyle:'italic'}}>"{currentUser.bio}"</p>}
      </div>
    </aside>
  );
}
