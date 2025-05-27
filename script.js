(()=>{
  const SEQ = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const canvas = document.getElementById('wheel');
  const ctx = canvas.getContext('2d');
  const spinBtn = document.getElementById('spin-btn');
  const resultEl = document.getElementById('result');
  const messageEl = document.getElementById('message');
  const balanceEl = document.getElementById('balance');
  const spinSfx = document.getElementById('spin-sfx');
  const winSfx = document.getElementById('win-sfx');

  let balance = 1000;
  let currentBet = null;
  let bets = [];

  // build pockets UI
  const table = document.querySelector('.table');
  SEQ.slice(1).forEach(n=>{
    const el = document.createElement('div');
    el.classList.add('pocket', REDS.has(n)?'red':'black');
    el.dataset.pocket = n;
    el.textContent = n;
    table.appendChild(el);
  });
  document.querySelector('[data-pocket="0"]').addEventListener('click', e=>selectPocket(e));
  table.addEventListener('click', e=>selectPocket(e));

  document.querySelectorAll('.chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
      btn.classList.add('selected');
      currentBet = +btn.dataset.value;
    });
  });

  document.getElementById('clear-btn').addEventListener('click', ()=>{
    bets=[]; document.querySelectorAll('.pocket').forEach(p=>p.classList.remove('selected'));
    messageEl.textContent = '';
  });

  function selectPocket(e){
    if (!currentBet) return alert('Select a chip first');
    const pocket = +e.target.dataset.pocket;
    if (balance < currentBet) return alert('Insufficient balance');
    balance -= currentBet;
    balanceEl.textContent = balance;
    bets.push({pocket, amount: currentBet});
    e.target.classList.add('selected');
  }

  // wheel draw
  const SIZE = 500, CENTER = SIZE/2, RADIUS = CENTER-20, SLICE = 2*Math.PI/SEQ.length;
  canvas.width = SIZE; canvas.height = SIZE;
  let angle=0, vel=0;

  function draw(){
    ctx.clearRect(0,0,SIZE,SIZE);
    ctx.save(); ctx.translate(CENTER,CENTER); ctx.rotate(angle);
    SEQ.forEach((n,i)=>{
      const start = i*SLICE;
      ctx.beginPath(); ctx.moveTo(0,0);
      ctx.arc(0,0,RADIUS,start,start+SLICE);
      ctx.fillStyle = n===0?'#006600':REDS.has(n)?'#cc0000':'#111'; ctx.fill();
      ctx.strokeStyle='#333'; ctx.lineWidth=2;
      ctx.moveTo(RADIUS*Math.cos(start),RADIUS*Math.sin(start));
      ctx.lineTo((RADIUS-15)*Math.cos(start),(RADIUS-15)*Math.sin(start)); ctx.stroke();
      ctx.save(); ctx.rotate(start+SLICE/2);
      ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(RADIUS*0.07)}px sans-serif`;
      ctx.textAlign='right'; ctx.fillText(n,RADIUS-20,8);
      ctx.restore();
    });
    ctx.restore();
  }
  draw();

  spinBtn.addEventListener('click', ()=>{
    if (bets.length===0) return alert('Place at least one bet');
    spinSfx.play();
    vel = 0.8 + Math.random()*0.4;
    const start = performance.now(), decay=0.996;
    function animate(now){
      const dt=now-start;
      vel *= decay**(dt/16);
      angle += vel*(dt/16);
      draw();
      if (vel>0.002) requestAnimationFrame(animate);
      else finalize();
    }
    requestAnimationFrame(animate);
  });

  function finalize(){
    const idx = Math.floor(((2*Math.PI-angle%(2*Math.PI))%(2*Math.PI))/SLICE);
    const winNum = SEQ[idx];
    resultEl.innerHTML = `Result: <strong>${winNum}</strong>`;
    let payout=0;
    bets.forEach(b=>{ if(b.pocket===winNum) payout += b.amount*35; });
    if (payout>0){ balance+=payout; balanceEl.textContent=balance; messageEl.textContent=`You win $${payout}!`; winSfx.play(); }
    else messageEl.textContent=`No wins this round.`;
    bets=[];
    document.querySelectorAll('.pocket').forEach(p=>p.classList.remove('selected'));
  }
})();
