import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../utils/helpers.js';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

function Badge({ label, color='green' }) {
  const C = {green:{bg:'#d1fae5',text:'#065f46'},red:{bg:'#fee2e2',text:'#991b1b'},yellow:{bg:'#fef3c7',text:'#92400e'},blue:{bg:'#dbeafe',text:'#1e40af'}}[color]||{bg:'#f3f4f6',text:'#374151'};
  return <span style={{background:C.bg,color:C.text,borderRadius:20,padding:'2px 10px',fontSize:11,fontWeight:700,flexShrink:0}}>{label}</span>;
}

export default function AdminDashboard() {
  const { currentUser, isAdmin, users, loadUsers, loadPendingCount, socket } = useApp();
  const navigate = useNavigate();
  const [tab,          setTab]          = useState('pending');
  const [pending,      setPending]      = useState([]);
  const [allPubs,      setAllPubs]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [rejectModal,  setRejectModal]  = useState(null);
  const [rejectRaison, setRejectRaison] = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [isAdmin]);

  useEffect(() => {
    if (!socket) return;
    const onPending = pub => { setPending(p=>[pub,...p]); loadPendingCount?.(); };
    socket.on('pending_post', onPending);
    return () => socket.off('pending_post', onPending);
  }, [socket]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pr, ar] = await Promise.all([
        api.get('/publications/en-attente?adminId='+currentUser.id),
        api.get('/publications?adminId='+currentUser.id+'&limit=60'),
      ]);
      setPending(pr.data);
      setAllPubs(ar.data?.pubs || []);
      await loadUsers?.();
    } finally { setLoading(false); }
  };

  const handleApprove = async (pubId) => {
    try {
      await api.patch('/publications/'+pubId+'/moderer',{statut:'approuve',adminId:currentUser.id});
      setPending(p=>p.filter(x=>x.id!==pubId));
      loadPendingCount?.();
      toast.success('✅ Publication approuvée et publiée !');
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await api.patch('/publications/'+rejectModal+'/moderer',{statut:'rejete',adminId:currentUser.id,raisonRejet:rejectRaison});
      setPending(p=>p.filter(x=>x.id!==rejectModal));
      loadPendingCount?.();
      toast.success('Publication refusée.');
      setRejectModal(null); setRejectRaison('');
      loadData();
    } catch { toast.error('Erreur'); }
  };

  const handleDeletePub = async (pubId) => {
    if (!confirm('Supprimer définitivement ?')) return;
    try {
      await api.delete('/publications/'+pubId,{data:{userId:currentUser.id}});
      setAllPubs(p=>p.filter(x=>x.id!==pubId));
      toast.success('Supprimée');
    } catch { toast.error('Erreur'); }
  };

  const handleToggleUser = async (user) => {
    const newStatut = user.statut==='suspendu'?'actif':'suspendu';
    if (!confirm(`${newStatut==='suspendu'?'Suspendre':'Réactiver'} @${user.pseudo} ?`)) return;
    try {
      await api.patch('/users/'+user.id+'/statut',{statut:newStatut,adminId:currentUser.id});
      await loadUsers?.();
      toast.success(newStatut==='suspendu'?'🚫 Compte suspendu':'✅ Compte réactivé');
    } catch { toast.error('Erreur'); }
  };

  const TABS = [
    { key:'pending',      icon:'⏳', label:'En attente',       badge:pending.length },
    { key:'all',          icon:'📝', label:'Toutes les publications' },
    { key:'utilisateurs', icon:'👥', label:'Membres' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#7c2d12,#dc2626)',borderRadius:16,padding:22,marginBottom:16,color:'white'}}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:14}}>
          <span style={{fontSize:34}}>👑</span>
          <div>
            <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:22}}>Panneau d'Administration</div>
            <div style={{opacity:.8,fontSize:13}}>Bonjour {currentUser?.prenom} — Vous gérez toute la plateforme</div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
          {[
            ['⏳','En attente',pending.length],
            ['✅','Approuvées',allPubs.filter(p=>p.statut==='approuve').length],
            ['❌','Rejetées',allPubs.filter(p=>p.statut==='rejete').length],
            ['👥','Membres',(users||[]).length],
          ].map(([icon,label,val])=>(
            <div key={label} style={{background:'rgba(255,255,255,.12)',borderRadius:10,padding:'10px',backdropFilter:'blur(8px)',textAlign:'center'}}>
              <div style={{fontSize:20}}>{icon}</div>
              <div style={{fontFamily:'Playfair Display,serif',fontWeight:900,fontSize:24}}>{val}</div>
              <div style={{fontSize:11,opacity:.8}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{padding:'4px 8px',marginBottom:12,display:'flex',gap:4}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1,padding:'9px 8px',borderRadius:8,fontSize:13,fontWeight:600,
            background:tab===t.key?'#fee2e2':'transparent',
            color:tab===t.key?'#dc2626':'var(--t3)',
            transition:'all .18s',border:'none',cursor:'pointer',
            display:'flex',gap:5,alignItems:'center',justifyContent:'center',
          }}>
            <span>{t.icon}</span><span>{t.label}</span>
            {t.badge>0 && <span style={{background:'#dc2626',color:'white',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── EN ATTENTE ── */}
      {tab === 'pending' && (
        <div>
          {loading
            ? <div className="card" style={{padding:40,textAlign:'center',color:'var(--t3)'}}>Chargement...</div>
            : pending.length === 0
            ? (
              <div className="card" style={{padding:48,textAlign:'center'}}>
                <div style={{fontSize:48,marginBottom:10}}>✅</div>
                <div style={{fontFamily:'Playfair Display,serif',fontSize:18,color:'var(--g800)'}}>Aucune publication en attente</div>
                <div style={{color:'var(--t3)',fontSize:13,marginTop:6}}>Tout a été traité.</div>
              </div>
            ) : pending.map(pub=>(
              <div key={pub.id} className="card fade-in" style={{marginBottom:12,overflow:'hidden',border:'2px solid #fef3c7'}}>
                <div style={{background:'#fffbeb',padding:'10px 16px',display:'flex',gap:8,alignItems:'center',borderBottom:'1px solid #fef3c7'}}>
                  <span style={{fontSize:18}}>⏳</span>
                  <span style={{fontWeight:700,fontSize:13,color:'#92400e'}}>En attente de votre approbation</span>
                  <span style={{marginLeft:'auto',fontSize:12,color:'#b45309'}}>{timeAgo(pub.date)}</span>
                </div>
                <div style={{padding:'14px 16px'}}>
                  <div style={{display:'flex',gap:10,marginBottom:12}}>
                    <div style={{width:44,height:44,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,border:'2px solid var(--g200)',flexShrink:0}}>
                      {pub.auteur?.avatar}
                    </div>
                    <div>
                      <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,color:'var(--g900)'}}>
                        {pub.auteur?.prenom} {pub.auteur?.nom}
                      </div>
                      <div style={{fontSize:12,color:'var(--t3)'}}>@{pub.auteur?.pseudo} · {pub.auteur?.region}</div>
                    </div>
                  </div>
                  <p style={{fontSize:14,color:'var(--t1)',lineHeight:1.65,marginBottom:10}}>{pub.contenu}</p>
                  {/* Images en attente */}
                  {pub.images?.length>0 && (
                    <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                      {pub.images.map((src,i)=>(
                        <img key={i} src={'http://localhost:5000'+src} alt="" style={{width:80,height:80,objectFit:'cover',borderRadius:8,border:'1px solid var(--border2)'}} />
                      ))}
                    </div>
                  )}
                  {pub.tags?.length>0 && (
                    <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:12}}>
                      {pub.tags.map(t=><span key={t} style={{background:'var(--g100)',color:'var(--g700)',borderRadius:20,padding:'2px 9px',fontSize:11,fontWeight:600}}>#{t}</span>)}
                    </div>
                  )}
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>handleApprove(pub.id)} className="btn-primary" style={{flex:1,padding:'10px'}}>
                      ✅ Approuver & Publier
                    </button>
                    <button onClick={()=>{setRejectModal(pub.id);setRejectRaison('');}} style={{
                      flex:1,padding:'10px',borderRadius:10,border:'1px solid #fecaca',
                      background:'#fef2f2',color:'#dc2626',fontSize:13,fontWeight:700,cursor:'pointer',
                    }}>
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── TOUTES PUBLICATIONS ── */}
      {tab === 'all' && (
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16,color:'var(--g900)'}}>
            Toutes les publications ({allPubs.length})
          </div>
          {allPubs.map((pub,i)=>(
            <div key={pub.id} style={{padding:'12px 18px',display:'flex',gap:12,alignItems:'flex-start',borderBottom:i<allPubs.length-1?'1px solid var(--border)':'none',background:i%2===0?'white':'#fafafa'}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                {pub.auteur?.avatar}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                  <span style={{fontWeight:700,fontSize:13,color:'var(--g900)'}}>@{pub.auteur?.pseudo}</span>
                  <Badge label={pub.statut==='approuve'?'✅ Approuvée':pub.statut==='en_attente'?'⏳ En attente':'❌ Rejetée'} color={pub.statut==='approuve'?'green':pub.statut==='en_attente'?'yellow':'red'} />
                  {pub.images?.length>0 && <span style={{fontSize:11,color:'var(--t3)'}}>📷 {pub.images.length}</span>}
                  <span style={{fontSize:11,color:'var(--t4)',marginLeft:'auto'}}>{timeAgo(pub.date)}</span>
                </div>
                <div style={{fontSize:13,color:'var(--t2)',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',lineHeight:1.5}}>
                  {pub.contenu}
                </div>
                <div style={{display:'flex',gap:12,marginTop:4,fontSize:11,color:'var(--t4)'}}>
                  <span>❤️ {pub.likes?.length}</span>
                  <span>💬 {pub.commentaires?.length}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                {pub.statut==='en_attente' && (
                  <button onClick={()=>handleApprove(pub.id)} style={{padding:'5px 10px',borderRadius:8,border:'none',background:'var(--g100)',color:'var(--g700)',fontSize:11,fontWeight:700,cursor:'pointer'}}>✅</button>
                )}
                <button onClick={()=>handleDeletePub(pub.id)} style={{padding:'5px 10px',borderRadius:8,border:'none',background:'#fee2e2',color:'#dc2626',fontSize:11,fontWeight:700,cursor:'pointer'}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MEMBRES ── */}
      {tab === 'utilisateurs' && (
        <div className="card" style={{overflow:'hidden'}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:16,color:'var(--g900)'}}>
            Gestion des membres ({(users||[]).length})
          </div>
          {(users||[]).map((u,i)=>(
            <div key={u.id} style={{padding:'14px 18px',display:'flex',gap:12,alignItems:'center',borderBottom:i<users.length-1?'1px solid var(--border)':'none'}}>
              <div style={{width:46,height:46,borderRadius:'50%',background:'var(--g100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,border:'2px solid',borderColor:u.statut==='suspendu'?'#fca5a5':'var(--g200)',flexShrink:0}}>
                {u.avatar}
              </div>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:2}}>
                  <span style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:14,color:'var(--g900)'}}>{u.prenom} {u.nom}</span>
                  <Badge label={u.statut==='actif'?'✅ Actif':'🚫 Suspendu'} color={u.statut==='actif'?'green':'red'} />
                </div>
                <div style={{fontSize:12,color:'var(--t3)'}}>@{u.pseudo} · {u.type_culture} · 📍{u.region}</div>
                <div style={{fontSize:11,color:'var(--t4)',marginTop:2}}>👥 {u.followers?.length||0} abonnés · {u.email}</div>
              </div>
              <button onClick={()=>handleToggleUser(u)} style={{
                padding:'7px 14px',borderRadius:10,border:'1px solid',
                borderColor:u.statut==='suspendu'?'var(--border2)':'#fecaca',
                background:u.statut==='suspendu'?'var(--g50)':'#fef2f2',
                color:u.statut==='suspendu'?'var(--g600)':'#dc2626',
                fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0,transition:'all .2s',
              }}>
                {u.statut==='suspendu'?'✅ Réactiver':'🚫 Suspendre'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal rejet */}
      {rejectModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div className="pop-in" style={{background:'white',borderRadius:20,padding:28,width:'100%',maxWidth:420,boxShadow:'var(--sh3)'}}>
            <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:18,color:'#dc2626',marginBottom:14}}>❌ Refuser la publication</div>
            <div style={{fontSize:13,color:'var(--t3)',marginBottom:12}}>Raison du refus (optionnel) — transmise à l'auteur.</div>
            <textarea value={rejectRaison} onChange={e=>setRejectRaison(e.target.value)}
              placeholder="Ex: Contenu non conforme aux règles de la plateforme..."
              rows={4} className="input" style={{resize:'none',marginBottom:16}} />
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setRejectModal(null);setRejectRaison('');}} className="btn-ghost" style={{flex:1}}>Annuler</button>
              <button onClick={handleReject} style={{flex:1,padding:'10px',borderRadius:10,border:'none',background:'#dc2626',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}>❌ Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
