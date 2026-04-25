import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getTagColor } from '../utils/helpers.js';
import api from '../utils/api.js';

export default function Stats() {
  const { currentUser, isAdmin, users } = useApp();
  const navigate = useNavigate();
  const [stats,   setStats]   = useState(null);
  const [top3,    setTop3]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rediriger si pas admin
    if (currentUser && !isAdmin) { navigate('/'); return; }
    if (!currentUser) return;
    Promise.all([
      api.get('/publications/stats?adminId='+currentUser.id),
      api.get('/publications/top3'),
    ]).then(([sr,tr]) => {
      setStats(sr.data);
      setTop3(tr.data);
    }).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [currentUser, isAdmin]);

  if (!isAdmin) return null;

  if (loading) return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:12}}>
        {[1,2,3,4].map(i=><div key={i} className="skeleton card" style={{height:120}}/>)}
      </div>
    </div>
  );

  const maxTag = stats?.tagStats?.[0]?.count || 1;
  const maxRegion = Math.max(...(users||[]).reduce((acc,u)=>{
    acc[u.region]=(acc[u.region]||0)+1; return acc;
  },{}) ? Object.values(users.reduce((a,u)=>({...a,[u.region]:(a[u.region]||0)+1}),{})) : [1]);

  const regionStats = Object.entries(
    (users||[]).reduce((a,u)=>({...a,[u.region]:(a[u.region]||0)+1}),{})
  ).sort((a,b)=>b[1]-a[1]);

  return (
    <div>
      {/* Header admin */}
      <div style={{background:'linear-gradient(135deg,#7c2d12,#dc2626)',borderRadius:16,padding:20,marginBottom:16,color:'white'}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <span style={{fontSize:32}}>📊</span>
          <div>
            <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:22}}>Tableau de bord Administrateur</div>
            <div style={{opacity:.8,fontSize:13}}>Statistiques complètes — Accès réservé à l'administrateur</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:12}}>
        {[
          {icon:'📝',label:'Publications approuvées',value:stats?.total||0,color:'var(--g600)',sub:'visibles sur la plateforme'},
          {icon:'⏳',label:'En attente',value:stats?.pending||0,color:'var(--amber)',sub:'nécessitent votre approbation'},
          {icon:'❤️',label:'Total J\'aime',value:stats?.totalLikes||0,color:'var(--red)',sub:'interactions positives'},
          {icon:'👨‍🌾',label:'Membres actifs',value:(users||[]).length,color:'var(--blue)',sub:'agriculteurs inscrits'},
        ].map(({icon,label,value,color,sub})=>(
          <div key={label} className="card" style={{padding:20,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:4}}>{icon}</div>
            <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:34,color}}>{value}</div>
            <div style={{fontWeight:700,fontSize:13,color:'var(--t2)',marginBottom:2}}>{label}</div>
            <div style={{fontSize:11,color:'var(--t4)'}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tags bar chart */}
      <div className="card" style={{padding:20,marginBottom:12}}>
        <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,color:'var(--g900)',marginBottom:16}}>
          🏷️ Tags les plus utilisés
        </div>
        {stats?.tagStats?.map(t=>(
          <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div style={{width:100,fontSize:12,fontWeight:600,color:'var(--t2)',textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:0}}>
              #{t.id}
            </div>
            <div style={{flex:1,height:22,background:'var(--g50)',borderRadius:10,overflow:'hidden'}}>
              <div style={{
                height:'100%',borderRadius:10,
                background:`linear-gradient(90deg,${getTagColor(t.id)},${getTagColor(t.id)}aa)`,
                width:(t.count/maxTag*100)+'%',transition:'width .8s ease',
                display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:8,
              }}>
                <span style={{fontSize:10,color:'white',fontWeight:700}}>{t.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top 3 */}
      <div className="card" style={{padding:20,marginBottom:12}}>
        <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,color:'var(--g900)',marginBottom:16}}>
          🏆 Top 3 publications les plus likées
        </div>
        {top3.map((pub,i)=>pub&&(
          <div key={pub.id} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'14px 0',borderBottom:i<2?'1px solid var(--border)':'none'}}>
            <div style={{width:44,height:44,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,background:['#fef3c7','#f1f5f9','#fff7ed'][i],border:`2px solid ${['#d97706','#94a3b8','#c2410c'][i]}`}}>
              {['🥇','🥈','🥉'][i]}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                <span style={{fontSize:18}}>{pub.auteur?.avatar}</span>
                <span style={{fontWeight:700,fontSize:14,color:'var(--g800)'}}>@{pub.auteur?.pseudo}</span>
              </div>
              <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                {pub.contenu}
              </div>
              {pub.images?.length>0 && <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>📷 {pub.images.length} photo{pub.images.length>1?'s':''}</div>}
              <div style={{display:'flex',gap:14,marginTop:6,fontSize:12,color:'var(--t4)'}}>
                <span>❤️ {pub.likes?.length} j'aime</span>
                <span>💬 {pub.commentaires?.length} commentaires</span>
                <span>👁 {pub.vues} vues</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Répartition régionale */}
      <div className="card" style={{padding:20,marginBottom:12}}>
        <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,color:'var(--g900)',marginBottom:16}}>
          📍 Membres par région
        </div>
        {regionStats.map(([region,count])=>(
          <div key={region} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div style={{width:140,fontSize:12,color:'var(--t2)',textAlign:'right',flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {region}
            </div>
            <div style={{flex:1,height:20,background:'var(--g50)',borderRadius:10,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:10,background:'linear-gradient(90deg,var(--g500),var(--g400))',width:(count/Math.max(...regionStats.map(r=>r[1]))*100)+'%',transition:'width .8s ease'}}/>
            </div>
            <div style={{width:20,fontSize:12,color:'var(--t4)',flexShrink:0}}>{count}</div>
          </div>
        ))}
      </div>

      {/* Classement membres */}
      <div className="card" style={{padding:20}}>
        <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:17,color:'var(--g900)',marginBottom:16}}>
          👨‍🌾 Membres les plus suivis
        </div>
        {[...(users||[])].sort((a,b)=>(b.followers?.length||0)-(a.followers?.length||0)).slice(0,5).map((u,i)=>(
          <div key={u.id} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 0',borderBottom:i<4?'1px solid var(--border)':'none'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:i===0?'#fef3c7':i===1?'#f1f5f9':'var(--g50)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:i===0?'#d97706':i===1?'#64748b':'var(--t3)',flexShrink:0}}>
              {i+1}
            </div>
            <div style={{width:40,height:40,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,border:'2px solid var(--g200)',flexShrink:0}}>
              {u.avatar}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:'var(--g900)'}}>@{u.pseudo}</div>
              <div style={{fontSize:11,color:'var(--t3)'}}>{u.type_culture} · {u.region}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16,color:'var(--g600)'}}>{u.followers?.length||0}</div>
              <div style={{fontSize:11,color:'var(--t4)'}}>abonnés</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
