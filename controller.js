(()=>{const $=s=>document.querySelector(s),st={mx:0,mz:0,punch:0,kick:0,grab:0,block:0,dash:0};let cls=0,conn,peer,ok=0,last=0;
const buzz=m=>{try{navigator.vibrate&&navigator.vibrate(m)}catch(e){}};
$('#rm').value=(new URLSearchParams(location.search).get('room')||'').toUpperCase();
$('#cls').onclick=e=>{const b=e.target.closest('button');if(!b)return;cls=+b.dataset.c;document.querySelectorAll('#cls button').forEach(x=>x.classList.toggle('on',x===b))};
$('#go').onclick=()=>{const room=$('#rm').value.trim().toUpperCase();if(!room)return;$('#info').textContent='Connecting…';
 try{document.documentElement.requestFullscreen()}catch(e){}
 peer=new Peer(undefined,{debug:0});peer.on('error',e=>$('#info').textContent=e.type==='peer-unavailable'?'Room not found':'Connection failed');
 peer.on('open',()=>{conn=peer.connect(room,{reliable:true});conn.on('data',d=>{
  if(d.type==='init'){ok=1;$('#join').hidden=true;$('#pad').hidden=false;$('#me').textContent=$('#nm').value||d.name;$('#me').style.color=d.color;conn.send({type:'name',name:$('#nm').value.trim(),cls});buzz(40);loop()}
  if(d.type==='full')$('#info').textContent='Room is full (4 max)';
  if(d.type==='tel'){$('#hp').style.width=d.hp+'%';$('#mt').style.width=d.meter+'%';if(d.hit)buzz([90,40,90])}});
  conn.on('close',()=>{ok=0;$('#info').textContent='Disconnected';$('#join').hidden=false;$('#pad').hidden=true})})};
function loop(){const n=performance.now();if(ok&&n-last>33){last=n;conn.send({type:'in',in:st})}requestAnimationFrame(loop)}
const stick=$('#stick'),knob=$('#knob');let sp=null;
function mv(e){const r=stick.getBoundingClientRect(),R=r.width/2;let x=(e.clientX-r.left-R)/R,y=(e.clientY-r.top-R)/R;const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}
 knob.style.transform=`translate(${x*R*.7}px,${y*R*.7}px)`;st.mx=Math.abs(x)<.12?0:x;st.mz=Math.abs(y)<.12?0:-y}
stick.onpointerdown=e=>{sp=e.pointerId;stick.setPointerCapture(sp);mv(e)};stick.onpointermove=e=>{if(e.pointerId===sp)mv(e)};
['pointerup','pointercancel'].forEach(t=>stick['on'+t]=e=>{if(e.pointerId!==sp)return;sp=null;st.mx=st.mz=0;knob.style.transform=''});
document.querySelectorAll('#btns button').forEach(b=>{const k=b.dataset.k;
 b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);st[k]=1;b.classList.add('on');buzz(12)};
 ['pointerup','pointercancel'].forEach(t=>b['on'+t]=()=>{st[k]=0;b.classList.remove('on')});b.oncontextmenu=e=>e.preventDefault()});
document.addEventListener('contextmenu',e=>e.preventDefault());
})();
