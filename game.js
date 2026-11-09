/* RING CLASH — multiplayer wrestling, split screen, phone controllers. Tune constants below. */
(()=>{'use strict';
const T=window.THREE,$=s=>document.querySelector(s),cl=T.MathUtils.clamp;
const MAXP=4,RING=8,CRESET=4500,WINS=3,CLS=[{n:'BRAWLER',spd:1,dmg:1,hp:100,s:1},{n:'SPEEDSTER',spd:1.25,dmg:.85,hp:90,s:.95},{n:'TANK',spd:.85,dmg:1.2,hp:125,s:1.12}],cols=['#59f4ff','#ff4fc8','#c8ff4d','#ffb84d'];
const ATK={punch:{dur:.38,hit:.12,r:2.1,dmg:7,kb:4},kick:{dur:.65,hit:.28,r:2.7,dmg:12,kb:8,kd:1.1},grab:{dur:.8,hit:.3,r:1.9,dmg:16,kb:10,kd:1.8,g:1}};
const code='WWE-'+Math.floor(1000+Math.random()*9000);$('#code').textContent=code;
const peer=new Peer(code,{debug:0}),P=new Map(),keys={};let started=false,over=0,last=performance.now(),now=0,shake=0,slowT=0,ac=null,nb=0;
/* ---- scene ---- */
const sc=new T.Scene();sc.background=new T.Color(0x05070d);sc.fog=new T.Fog(0x05070d,28,75);
const R=new T.WebGLRenderer({canvas:$('#c'),antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,1.5));R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=true;
sc.add(new T.HemisphereLight(0x99aaff,0x331122,.9));
const sun=new T.DirectionalLight(0xfff0dd,2.4);sun.position.set(6,22,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);const s2=sun.shadow.camera;s2.left=s2.bottom=-14;s2.right=s2.top=14;sc.add(sun);
const box=(w,h,d,c,x,y,z,e=0)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.7,emissive:e}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;sc.add(m);return m};
box(120,.2,120,0x0a0d16,0,-.1,0);box(20.4,1,20.4,0x7a1020,0,.5,0);box(18.4,.14,18.4,0xe8e2d2,0,1.02,0);
for(const sx of[-1,1])for(const sz of[-1,1]){box(.5,3.6,.5,0x222833,sx*RING*1.12,2.3,sz*RING*1.12);box(.62,.62,.62,0xff4d6d,sx*RING*1.12,2.1,sz*RING*1.12,0x330008)}
[2.2,3,3.8].forEach((y,i)=>{const c=[0xff4d6d,0xffffff,0x4d7dff][i],L=RING*2.24;[[0,-1],[0,1]].forEach(([a,s])=>box(L,.12,.12,c,0,y,s*RING*1.12));[-1,1].forEach(s=>box(.12,.12,L,c,s*RING*1.12,y,0))});
const cr=new T.InstancedMesh(new T.BoxGeometry(.8,1.2,.8),new T.MeshStandardMaterial({roughness:1}),260),dm=new T.Object3D();
for(let i=0;i<260;i++){const a=Math.random()*6.28,r=18+Math.random()*14;dm.position.set(Math.cos(a)*r,.6+Math.floor((r-18)/3.5)*.9,Math.sin(a)*r);dm.updateMatrix();cr.setMatrixAt(i,dm.matrix);cr.setColorAt(i,new T.Color().setHSL(Math.random(),.5,.35))}sc.add(cr);
const sky=[0xff4d6d,0x4d7dff];sky.forEach((c,i)=>{const l=new T.PointLight(c,260,40);l.position.set(i?-10:10,9,i?10:-10);sc.add(l)});
/* ---- wrestlers ---- */
function mk(col){const g=new T.Group(),M=c=>new T.MeshStandardMaterial({color:c,roughness:.6}),sk=M(0xe0a98a),tr=M(col),body=new T.Group();g.add(body);
 const add=(geo,mat,x,y,z,p)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o};
 add(new T.BoxGeometry(.95,1,.5),sk,0,1.6,0,body);add(new T.BoxGeometry(.98,.5,.54),tr,0,1.0,0,body);add(new T.SphereGeometry(.28,16,12),sk,0,2.35,0,body);
 add(new T.BoxGeometry(.5,.12,.5),tr,0,2.6,0,body);
 const lim=(s,y,h,m,w)=>{const a=new T.Group();a.position.set(s*w,y,0);body.add(a);add(new T.BoxGeometry(.28,h,.28),m,0,-h/2,0,a);return a};
 g.u={body,aL:lim(-1,2.05,.95,sk,.62),aR:lim(1,2.05,.95,sk,.62),lL:lim(-1,1,1,tr,.25),lR:lim(1,1,1,tr,.25)};sc.add(g);return g}
function spawn(id,name,color,i){const n=P.size,a=i/Math.max(n,1)*6.28;
 const p={id,name,color,car:mk(new T.Color(color)),x:Math.cos(a)*4,z:Math.sin(a)*4,vx:0,vz:0,kx:0,kz:0,hp:100,meter:0,st:'idle',t:0,dur:0,hit:0,d:[0,1],ang:0,in:{},msg:'',mt:0,wins:0,i,cls:0,mhp:100,combo:0,ct:0,dc:0,bk:0,bAt:0};P.set(id,p);return p}
function applyCls(p){const s=CLS[p.cls];p.mhp=p.hp=s.hp;p.car.scale.setScalar(s.s)}
function removeP(p){sc.remove(p.car);if(p.hud)p.hud.el.remove();P.delete(p.id)}
function snd(f,d=.1,t='square'){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),c=ac.currentTime;o.type=t;o.frequency.setValueAtTime(f,c);o.frequency.exponentialRampToValueAtTime(f/3,c+d);g.gain.setValueAtTime(.15,c);g.gain.exponentialRampToValueAtTime(.001,c+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(c+d)}
function reset(){if([...P.values()].some(p=>p.wins>=WINS))for(const p of P.values())p.wins=0;let i=0;const n=P.size;for(const p of P.values()){const a=i++/n*6.28;Object.assign(p,{x:Math.cos(a)*4,z:Math.sin(a)*4,vx:0,vz:0,kx:0,kz:0,hp:p.mhp,meter:0,st:'idle',t:0,combo:0});p.car.visible=true}over=0;say('FIGHT!',1500)}
const say=(t,ms=1200,p)=>{if(p){p.msg=t;p.mt=now+ms}else{$('#msg').textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>$('#msg').textContent='',ms)}};
/* ---- network ---- */
peer.on('open',id=>{$('#st').textContent='Ready — waiting for fighters';const u=new URL('controller.html',location.href);u.searchParams.set('room',id);if(window.QRCode)new QRCode($('#qr'),{text:u.href,width:118,height:118})});
peer.on('error',e=>$('#st').textContent='Network error: '+e.type);
peer.on('connection',c=>{const bt=[...P.values()].find(x=>x.bot);if(P.size>=MAXP&&bt)removeP(bt);if(P.size>=MAXP){c.on('open',()=>c.send({type:'full'}));setTimeout(()=>c.close(),300);return}
 const p=spawn(c.peer,'FIGHTER '+(P.size+1),cols[P.size%4],P.size);p.conn=c;c.on('open',()=>c.send({type:'init',color:p.color,name:p.name}));
 c.on('data',d=>{if(!d||typeof d!=='object')return;if(d.type==='in')p.in=d.in||{};if(d.type==='name'&&typeof d.name==='string'){if(d.name)p.name=d.name.slice(0,12);if(d.cls>=0&&d.cls<3&&d.cls!==p.cls){p.cls=d.cls|0;applyCls(p)}}});
 c.on('close',()=>{sc.remove(p.car);if(p.hud)p.hud.el.remove();P.delete(c.peer)})});
$('#bots').onclick=e=>{nb=(nb+1)%4;e.target.textContent='BOTS: '+nb};
$('#start').onclick=()=>{if(started)return;started=true;if(!P.size)spawn('host','PLAYER 1',cols[0],0);ac=ac||new(window.AudioContext||window.webkitAudioContext)();for(let i=0;i<nb&&P.size<MAXP;i++){const b=spawn('bot'+i,'BOT '+(i+1),cols[P.size%4],P.size);b.bot=1;b.cls=(i+1)%3;applyCls(b)}$('#lobby').hidden=true;say('FIGHT!',1800)};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key===' ')e.preventDefault()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
/* ---- combat ---- */
function strike(p,A){for(const q of P.values()){if(q===p||q.st==='ko'||q.st==='dash')continue;const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz)||1;if(d>A.r||(dx*p.d[0]+dz*p.d[1])/d<.3)continue;
 const blk=q.st==='block'&&(q.d[0]*dx+q.d[1]*dz)<0&&!A.g;let dmg=A.dmg*CLS[p.cls].dmg*(1+Math.min(p.combo,5)*.1);
 if(A.g&&p.meter>=100){dmg=40;p.meter=0;say('💥 FINISHER!',1500,p);slowT=now+800;shake=1;snd(60,.6,'sawtooth')}
 q.kx=dx/d*(blk?3:A.kb);q.kz=dz/d*(blk?3:A.kb);
 if(blk){dmg*=.15;say('BLOCKED',700,q);snd(400,.05)}else{if(['punch','kick','grab'].includes(q.st)){q.st='idle';q.t=0}if(A.kd){q.st='down';q.t=0;q.dur=A.kd}p.meter=Math.min(100,p.meter+dmg);p.combo=now-p.ct<1500?p.combo+1:1;p.ct=now;if(p.combo>1)say(p.combo+' HIT COMBO!',900,p);shake=Math.max(shake,dmg/20);snd(140,.12,'sawtooth');q.meter=Math.min(100,q.meter+dmg*.5)}
 q.hp=Math.max(0,q.hp-dmg);q.hurt=now;if(!blk)q.flash=1;if(q.hp<=0){q.st='ko';q.t=0;say('K.O.!',1500,q);slowT=now+700;shake=1.2;snd(45,.7,'sawtooth')}}}
function upd(dt){if(!started)return;if(now<slowT)dt*=.25;const L=[...P.values()];
 for(const p of L){if(p.st==='ko')continue;
  let tg=null,bd=1e9;for(const q of L)if(q!==p&&q.st!=='ko'){const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<bd){bd=d;tg=q}}
  if(tg)p.d=[(tg.x-p.x)/(bd||1),(tg.z-p.z)/(bd||1)];const[dx,dz]=p.d,i={...p.in};
  if(p===L[0]){i.mx=(i.mx||0)+(keys.d?1:0)-(keys.a?1:0);i.mz=(i.mz||0)+(keys.w?1:0)-(keys.s?1:0);i.punch=i.punch||keys.j;i.kick=i.kick||keys.k;i.grab=i.grab||keys.l;i.block=i.block||keys[' '];i.dash=i.dash||keys.shift}
  if(p.bot){i.mx=Math.sin(now/700+p.i*2)*.7;i.mz=bd>2.3?1:bd<1.3?-.6:0;if(tg&&bd<2.3&&now>p.bAt+500&&Math.random()<dt*3){p.bk=['punch','punch','kick','grab'][Math.random()*4|0];p.bAt=now}
   if(p.bk&&now<p.bAt+120)i[p.bk]=1;if(tg&&['punch','kick','grab'].includes(tg.st)&&bd<2.8&&Math.random()<dt*4)p.bB=now+600;i.block=now<(p.bB||0);if(Math.random()<dt*.4&&bd<4)i.dash=1}
  if(over)i.mx=i.mz=i.punch=i.kick=i.grab=i.block=i.dash=0;
  p.t+=dt;
  if(p.st==='down'){if(p.t>p.dur){p.st='idle';p.t=0}}
  else if(p.st==='dash'){if(p.t>.3){p.st='idle';p.t=0}}
  else if(ATK[p.st]){const A=ATK[p.st];if(!p.hit&&p.t>=A.hit){p.hit=1;strike(p,A)}if(p.t>=A.dur){p.st='idle';p.t=0}}
  else{if(i.block)p.st='block';else if(p.st==='block')p.st='idle';
   if(p.st==='idle')for(const k of['punch','kick','grab'])if(i[k]){p.st=k;p.t=0;p.hit=0;break}
   if(p.st==='idle'&&i.dash&&now>p.dc){let ux=dx*(i.mz||0)-dz*(i.mx||0),uz=dz*(i.mz||0)+dx*(i.mx||0);const m=Math.hypot(ux,uz);if(m<.2){ux=-dx;uz=-dz}else{ux/=m;uz/=m}p.kx=ux*15;p.kz=uz*15;p.st='dash';p.t=0;p.dc=now+900;snd(220,.1,'triangle')}}
  const sp=CLS[p.cls].spd*(p.st==='idle'?5.5:p.st==='block'?1.6:p.st==='down'||p.st==='dash'?0:1.3),mx=cl(i.mx||0,-1,1),mz=cl(i.mz||0,-1,1);
  const wx=(dx*mz-dz*mx)*sp,wz=(dz*mz+dx*mx)*sp,k=Math.min(1,dt*10);p.vx+=(wx-p.vx)*k;p.vz+=(wz-p.vz)*k;
  const f=Math.pow(.02,dt);p.kx*=f;p.kz*=f;p.x+=(p.vx+p.kx)*dt;p.z+=(p.vz+p.kz)*dt;
  const lim=RING-.2;for(const a of['x','z']){if(Math.abs(p[a])>lim){const k2='k'+a;p[a]=Math.sign(p[a])*lim;if(Math.abs(p[k2])>5&&!p.rope){p.hp=Math.max(0,p.hp-4);p.rope=1;say('ROPES!',600,p);if(p.hp<=0)p.st='ko'}p[k2]*=-.8;p['v'+a]=0}else p.rope=0}
  for(const q of L)if(q!==p&&q.st!=='ko'){const ax=p.x-q.x,az=p.z-q.z,d=Math.hypot(ax,az);if(d<1.1&&d>.001){p.x+=ax/d*(1.1-d)/2;p.z+=az/d*(1.1-d)/2;q.x-=ax/d*(1.1-d)/2;q.z-=az/d*(1.1-d)/2}}
  p.ang+=Math.atan2(Math.sin(Math.atan2(dx,dz)-p.ang),Math.cos(Math.atan2(dx,dz)-p.ang))*Math.min(1,dt*12);
 }
 const al=L.filter(p=>p.st!=='ko');
 if(!over&&L.length>1&&al.length<=1){over=now+CRESET;const w=al[0];if(w)w.wins++;say(w?'🏆 '+w.name+' WINS!':'DRAW',CRESET-300)}
 if(over&&now>over)reset();
}
function anim(p,time){const u=p.car.userData=p.car.u,s=p.st,pr=Math.min(1,p.t/(ATK[s]?ATK[s].dur:1)),sw=Math.sin(pr*Math.PI),mv=Math.hypot(p.vx,p.vz),b=u.body;
 p.car.position.set(p.x,1.09,p.z);p.car.rotation.y=p.ang;
 u.aL.rotation.set(0,0,.15);u.aR.rotation.set(0,0,-.15);u.lL.rotation.x=u.lR.rotation.x=0;b.rotation.set(0,0,0);b.position.y=0;
 const w=Math.sin(time*9)*Math.min(mv/5,1);u.lL.rotation.x=w*.7;u.lR.rotation.x=-w*.7;
 if(s==='idle'){u.aL.rotation.x=-.8;u.aR.rotation.x=-.8;b.position.y=Math.sin(time*3)*.03}
 if(s==='punch'){u.aR.rotation.x=-1.6*sw;u.aL.rotation.x=-.8;b.rotation.y=-.3*sw}
 if(s==='kick'){u.lR.rotation.x=-1.6*sw;b.rotation.x=-.25*sw;u.aL.rotation.x=-.5;u.aR.rotation.x=-.5}
 if(s==='grab'){u.aL.rotation.x=u.aR.rotation.x=-1.5*Math.min(1,pr*3)}
 if(s==='block'){u.aL.rotation.set(-2.3,0,-.6);u.aR.rotation.set(-2.3,0,.6)}
 if(s==='dash')b.rotation.x=.6;
 if(s==='down'||s==='ko'){b.rotation.x=-1.5;b.position.y=-.7;b.position.z=-.5;u.aL.rotation.x=u.aR.rotation.x=0}else b.position.z=0;
 p.car.traverse(o=>{if(o.isMesh&&o.material.emissive)o.material.emissive.setScalar(p.flash>0?p.flash*.6:0)});p.flash=Math.max(0,(p.flash||0)-.06)}
/* ---- split screen ---- */
function layout(n,W,H){const c=n===2?(W>=H?2:1):n<=4?2:3,r=Math.ceil(n/c),o=[];for(let i=0;i<n;i++){const y=Math.floor(i/c),k=Math.min(c,n-y*c),x=i-y*c;o.push({x:Math.round(x*W/k),y:Math.round(y*H/r),w:Math.round((x+1)*W/k)-Math.round(x*W/k),h:Math.round((y+1)*H/r)-Math.round(y*H/r)})}return o}
function hud(p){const el=document.createElement('div');el.style.cssText='position:fixed;pointer-events:none;overflow:hidden;box-shadow:inset 0 0 0 2px #000d;z-index:4;font:900 11px Inter,sans-serif;letter-spacing:1px';
 el.innerHTML='<div class="f" style="position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse,#f003 30%,#f00c 100%)"></div><div class="m" style="position:absolute;left:0;right:0;top:36%;text-align:center;font-size:20px;letter-spacing:3px;text-shadow:0 2px 10px #000"></div><div style="position:absolute;left:12px;right:12px;bottom:12px"><div class="n" style="margin-bottom:5px;text-shadow:0 2px 6px #000"></div><div style="height:12px;border-radius:6px;background:#0008;border:1px solid #fff3;overflow:hidden"><div class="h" style="height:100%;background:linear-gradient(90deg,#ff4d6d,#ffb84d)"></div></div><div style="margin-top:4px;height:6px;border-radius:4px;background:#0008;overflow:hidden"><div class="s" style="height:100%;background:linear-gradient(90deg,#59f4ff,#9b85ff)"></div></div></div>';
 document.body.appendChild(el);const q=s=>el.querySelector(s);p.hud={el,f:q('.f'),m:q('.m'),n:q('.n'),h:q('.h'),s:q('.s'),key:'',lh:100}}
function frame(ms){now=ms;const dt=Math.min((ms-last)/1000,.04);last=ms;upd(dt);shake=Math.max(0,shake-dt*2.2);const L=[...P.values()],W=innerWidth,H=innerHeight,time=ms/1000;
 if(ms-(frame.tl||0)>100){frame.tl=ms;for(const p of L)if(p.conn&&p.conn.open)p.conn.send({type:'tel',hp:Math.round(p.hp/p.mhp*100),meter:Math.round(p.meter),hit:p.hurt&&ms-p.hurt<120?1:0})}
 if(!L.length||!started){const a=time*.15;sc.userData.c=sc.userData.c||new T.PerspectiveCamera(55,1,.1,300);const c=sc.userData.c;c.aspect=W/H;c.updateProjectionMatrix();c.position.set(Math.cos(a)*20,9,Math.sin(a)*20);c.lookAt(0,1.5,0);R.setScissorTest(false);R.setViewport(0,0,W,H);for(const p of L)anim(p,time);R.render(sc,c)}
 else{R.setScissorTest(true);const rc=layout(L.length,W,H);for(const p of L)anim(p,time);
  L.forEach((p,i)=>{if(!p.hud)hud(p);if(!p.cam){p.cam=new T.PerspectiveCamera(60,1,.1,300);p.cp=new T.Vector3(p.x,6,p.z-8)}
   const r=rc[i],h=p.hud,key=r.x+','+r.y+','+r.w+','+r.h;if(h.key!==key){h.key=key;const s=h.el.style;s.left=r.x+'px';s.top=r.y+'px';s.width=r.w+'px';s.height=r.h+'px'}
   {const t=p.name+' • '+CLS[p.cls].n+'  🏆'+p.wins;if(h.n.textContent!==t){h.n.textContent=t;h.n.style.color=p.color}}h.h.style.width=p.hp/p.mhp*100+'%';h.s.style.width=p.meter+'%';
   h.m.textContent=ms<p.mt?p.msg:'';if(p.flash>.9){h.f.style.transition='none';h.f.style.opacity=1}else{h.f.style.transition='opacity .4s';h.f.style.opacity=0}
   const[dx,dz]=p.d,tg=p.cp.set(p.x-dx*7.5,5.2,p.z-dz*7.5),cam=p.cam;cam.position.lerp(tg,1-Math.pow(.002,dt));cam.position.x+=(Math.random()-.5)*shake;cam.position.y+=(Math.random()-.5)*shake;cam.aspect=r.w/r.h;cam.updateProjectionMatrix();cam.lookAt(p.x+dx*3.5,1.8,p.z+dz*3.5);
   const y=H-r.y-r.h;R.setViewport(r.x,y,r.w,r.h);R.setScissor(r.x,y,r.w,r.h);R.render(sc,cam)})}
 requestAnimationFrame(frame)}
addEventListener('resize',()=>R.setSize(innerWidth,innerHeight));requestAnimationFrame(frame);
})();
