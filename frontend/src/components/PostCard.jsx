import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { timeAgo, getTagColor } from '../utils/helpers.js';
import api from '../utils/api.js';

// Résout l'URL d'une image (Cloudinary https:// ou chemin local /uploads/)
const resolveImg = (src) => {
  if (!src) return '';
  if (src.startsWith('http')) return src; // Cloudinary
  const base = import.meta.env.VITE_BACKEND_URL || '';
  return base + src;
};

function Avatar({ user, size=40 }) {
  return (
    <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:'var(--g100)',border:'2px solid var(--g200)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.48}}>
      {user?.avatar||'👤'}
    </div>
  );
}

function ImageGrid({ images }) {
  const [lightbox, setLightbox] = useState(null);
  if (!images?.length) return null;
  const cols = images.length===1?'1fr':images.length===2?'1fr 1fr':'1fr 1fr 1fr';
  return (
    <>
      <div style={{display:'grid',gridTemplateColumns:cols,gap:3,borderRadius:12,overflow:'hidden',marginBottom:12}}>
        {images.map((src,i)=>(
          <div key={i} onClick={()=>setLightbox(i)}
            style={{position:'relative',paddingTop:images.length===1?'50%':'70%',background:'var(--g50)',cursor:'pointer',overflow:'hidden'}}>
            <img src={resolveImg(src)} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',transition:'transform .3s'}}
              onMouseEnter={e=>e.target.style.transform='scale(1.04)'}
              onMouseLeave={e=>e.target.style.transform='scale(1)'}
              onError={e=>e.target.style.display='none'} />
          </div>
        ))}
      </div>
      {lightbox !== null && (
        <div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out'}}>
          <img src={resolveImg(images[lightbox])} alt="" style={{maxWidth:'90vw',maxHeight:'90vh',objectFit:'contain',borderRadius:12,boxShadow:'0 20px 60px rgba(0,0,0,.5)'}} />
          <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,.15)',border:'none',color:'white',width:40,height:40,borderRadius:'50%',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
          {images.length > 1 && <>
            <button onClick={e=>{e.stopPropagation();setLightbox(l=>(l-1+images.length)%images.length)}}
              style={{position:'absolute',left:20,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.2)',border:'none',color:'white',width:44,height:44,borderRadius:'50%',fontSize:22,cursor:'pointer'}}>‹</button>
            <button onClick={e=>{e.stopPropagation();setLightbox(l=>(l+1)%images.length)}}
              style={{position:'absolute',right:20,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.2)',border:'none',color:'white',width:44,height:44,borderRadius:'50%',fontSize:22,cursor:'pointer'}}>›</button>
          </>}
        </div>
      )}
    </>
  );
}

export default function PostCard({ post: initialPost, onDelete, onTagClick }) {
  const { currentUser } = useApp();
  const [post,         setPost]         = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState('');
  const [replyTo,      setReplyTo]      = useState(null);
  const [replyText,    setReplyText]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [saved,        setSaved]        = useState(currentUser?.savedPosts?.some(s=>(s.id||s)===initialPost.id));
  const [showMenu,     setShowMenu]     = useState(false);

  const userId  = currentUser?.id;
  const liked   = post.likes?.some(l=>(l.id||l)===userId);
  const isOwner = (post.auteur?.id||post.auteur)===userId;
  const isAdmin = currentUser?.role==='admin';

  const handleLike = async () => {
    try {
      const r = await api.patch('/publications/'+post.id+'/like',{userId});
      setPost(p=>({...p,likes:r.data.liked?[...(p.likes||[]),userId]:(p.likes||[]).filter(l=>(l.id||l)!==userId)}));
    } catch {}
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      await api.post('/publications/'+post.id+'/commentaires',{auteur:userId,texte:commentText});
      const r = await api.get('/publications/'+post.id);
      setPost(r.data); setCommentText('');
    } finally { setLoading(false); }
  };

  const handleReply = async (cid) => {
    if (!replyText.trim()) return;
    try {
      await api.post('/publications/'+post.id+'/commentaires/'+cid+'/reponses',{auteur:userId,texte:replyText});
      const r = await api.get('/publications/'+post.id);
      setPost(r.data); setReplyTo(null); setReplyText('');
    } catch {}
  };

  const handleLikeComment = async (cid) => {
    try {
      await api.patch('/publications/'+post.id+'/commentaires/'+cid+'/like',{userId});
      const r = await api.get('/publications/'+post.id);
      setPost(r.data);
    } catch {}
  };

  const handleSave = async () => {
    try { await api.patch('/users/'+userId+'/save/'+post.id); setSaved(p=>!p); } catch {}
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette publication ?')) return;
    await api.delete('/publications/'+post.id,{data:{userId}});
    onDelete?.(post.id);
  };

  return (
    <div className="card fade-in" style={{marginBottom:12,overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 16px 0',display:'flex',gap:10,alignItems:'flex-start'}}>
        <Link to={'/profile/'+(post.auteur?.id||post.auteur)}><Avatar user={post.auteur} size={44}/></Link>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <Link to={'/profile/'+(post.auteur?.id||post.auteur)} style={{textDecoration:'none'}}>
                <span style={{fontFamily:'Playfair Display,serif',fontWeight:700,fontSize:15,color:'var(--g900)'}}>{post.auteur?.prenom} {post.auteur?.nom}</span>
              </Link>
              {post.feeling&&<span style={{fontSize:12,color:'var(--t3)',marginLeft:6}}>se sent {post.feeling}</span>}
            </div>
            <div style={{display:'flex',gap:6,alignItems:'center',position:'relative'}}>
              <span style={{fontSize:11,color:'var(--t4)'}}>{timeAgo(post.date)}</span>
              {(isOwner||isAdmin)&&(
                <>
                  <button onClick={()=>setShowMenu(p=>!p)} style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'var(--t3)',border:'none',background:'transparent',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--g50)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>⋯</button>
                  {showMenu&&(
                    <div style={{position:'absolute',right:0,top:'100%',background:'white',border:'1px solid var(--border)',borderRadius:10,boxShadow:'var(--sh2)',zIndex:50,minWidth:140}}>
                      <button onClick={handleDelete} style={{width:'100%',padding:'10px 14px',textAlign:'left',fontSize:13,color:'var(--red)',display:'flex',gap:8,alignItems:'center',background:'none',border:'none',cursor:'pointer'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                        onMouseLeave={e=>e.currentTarget.style.background='white'}>🗑️ Supprimer</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div style={{fontSize:12,color:'var(--t3)'}}>
            @{post.auteur?.pseudo} · {post.auteur?.type_culture}
            {post.localisation&&<span> · 📍 {post.localisation}</span>}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div style={{padding:'10px 16px'}}>
        <p style={{fontSize:15,color:'var(--t1)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{post.contenu}</p>
      </div>

      {/* Images */}
      {post.images?.length>0&&<div style={{padding:'0 16px'}}><ImageGrid images={post.images}/></div>}

      {/* Tags */}
      {post.tags?.length>0&&(
        <div style={{padding:'0 16px 12px',display:'flex',flexWrap:'wrap',gap:5}}>
          {post.tags.map(t=>(
            <span key={t} className="tag" onClick={()=>onTagClick?.(t)}
              style={{background:getTagColor(t)+'15',color:getTagColor(t),border:`1px solid ${getTagColor(t)}25`}}>#{t}</span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{padding:'6px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',fontSize:12,color:'var(--t3)'}}>
        <div style={{display:'flex',gap:12}}>
          {post.likes?.length>0&&<span>❤️ {post.likes.length} j'aime</span>}
          {post.commentaires?.length>0&&<span style={{cursor:'pointer'}} onClick={()=>setShowComments(p=>!p)}>💬 {post.commentaires.length} commentaire{post.commentaires.length>1?'s':''}</span>}
        </div>
        <div style={{display:'flex',gap:8}}>
          {post.partages?.length>0&&<span>🔄 {post.partages.length}</span>}
          {post.vues>0&&<span>👁 {post.vues}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{display:'flex',padding:'4px 8px',gap:2}}>
        {[
          {icon:liked?'❤️':'🤍',label:'J\'aime',onClick:handleLike,active:liked},
          {icon:'💬',label:'Commenter',onClick:()=>setShowComments(p=>!p),active:showComments},
          {icon:saved?'🔖':'📌',label:saved?'Enregistré':'Enregistrer',onClick:handleSave,active:saved},
        ].map(({icon,label,onClick,active})=>(
          <button key={label} onClick={onClick} style={{flex:1,display:'flex',gap:6,alignItems:'center',justifyContent:'center',padding:'8px 4px',borderRadius:8,fontSize:13,fontWeight:600,color:active?'var(--g600)':'var(--t3)',background:active?'var(--g50)':'transparent',transition:'all .18s',border:'none',cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--g50)'}
            onMouseLeave={e=>e.currentTarget.style.background=active?'var(--g50)':'transparent'}>
            <span style={{fontSize:17}}>{icon}</span><span style={{fontSize:12}}>{label}</span>
          </button>
        ))}
      </div>

      {/* Commentaires */}
      {showComments&&(
        <div style={{padding:'0 16px 14px',borderTop:'1px solid var(--border)'}}>
          {post.commentaires?.map(c=>(
            <div key={c.id} style={{marginTop:12}}>
              <div style={{display:'flex',gap:8}}>
                <Avatar user={c.auteur} size={32}/>
                <div style={{flex:1}}>
                  <div style={{background:'var(--g50)',borderRadius:'4px 16px 16px 16px',padding:'8px 12px',display:'inline-block',maxWidth:'100%'}}>
                    <div style={{fontWeight:700,fontSize:12,color:'var(--g800)',marginBottom:2}}>@{c.auteur?.pseudo}</div>
                    <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.5}}>{c.texte}</div>
                  </div>
                  <div style={{display:'flex',gap:14,marginTop:4,paddingLeft:4}}>
                    <button onClick={()=>handleLikeComment(c.id)} style={{fontSize:11,color:c.likes?.includes(userId)?'var(--red)':'var(--t3)',fontWeight:600,background:'none',border:'none',cursor:'pointer'}}>❤️{c.likes?.length>0?` ${c.likes.length}`:''} J'aime</button>
                    <button onClick={()=>setReplyTo(replyTo===c.id?null:c.id)} style={{fontSize:11,color:'var(--t3)',fontWeight:600,background:'none',border:'none',cursor:'pointer'}}>💬 Répondre</button>
                    <span style={{fontSize:11,color:'var(--t4)'}}>{timeAgo(c.date)}</span>
                  </div>
                  {c.reponses?.length>0&&(
                    <div style={{marginTop:6,paddingLeft:8,borderLeft:'2px solid var(--g200)'}}>
                      {c.reponses.map((rp,ri)=>(
                        <div key={ri} style={{display:'flex',gap:6,marginTop:6}}>
                          <Avatar user={rp.auteur} size={26}/>
                          <div style={{background:'var(--g50)',borderRadius:'4px 12px 12px 12px',padding:'6px 10px'}}>
                            <div style={{fontWeight:700,fontSize:11,color:'var(--g800)'}}>@{rp.auteur?.pseudo}</div>
                            <div style={{fontSize:12,color:'var(--t2)'}}>{rp.texte}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {replyTo===c.id&&(
                    <div style={{display:'flex',gap:6,marginTop:6,paddingLeft:4}}>
                      <Avatar user={currentUser} size={26}/>
                      <input value={replyText} onChange={e=>setReplyText(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&handleReply(c.id)}
                        placeholder="Répondre..." style={{flex:1,background:'var(--g50)',border:'1px solid var(--border2)',borderRadius:16,padding:'5px 12px',fontSize:12,color:'var(--t1)',outline:'none'}}/>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <Avatar user={currentUser} size={36}/>
            <div style={{flex:1,display:'flex',gap:6}}>
              <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleComment()}
                placeholder="Écrire un commentaire..."
                style={{flex:1,background:'var(--g50)',border:'1px solid var(--border2)',borderRadius:24,padding:'8px 16px',fontSize:13,color:'var(--t1)',outline:'none',transition:'border-color .2s'}}
                onFocus={e=>e.target.style.borderColor='var(--g400)'}
                onBlur={e=>e.target.style.borderColor='var(--border2)'}/>
              <button onClick={handleComment} disabled={!commentText.trim()||loading}
                style={{background:'var(--g600)',color:'white',border:'none',borderRadius:24,padding:'8px 14px',fontSize:13,fontWeight:600,opacity:!commentText.trim()?.4:1,transition:'all .2s',cursor:'pointer'}}>➤</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
