/* ==========================================================================
   Map Generation & Events & Rest
========================================================================== */
function generateActMap() {
  game.map.floors = [];
  for(let f=0; f<20; f++) {
    let row = [];
    if(f===9) row.push({ id: `f${f}n0`, type: 'Chest', next: [] });
    else if(f===18) row.push({ id: `f${f}n0`, type: 'Rest', next: [] });
    else if(f===19) row.push({ id: `f${f}n0`, type: 'Boss', next: [] });
    else {
      let count = Math.floor(Math.random()*3)+2;
      for(let n=0; n<count; n++) {
        let type = 'Combat'; let r = Math.random();
        if(f>0) {
          if(r < 0.15) type = 'Shop';
          else if(r < 0.3 && f>=4) type = 'Elite';
          else if(r < 0.5) type = 'Unknown';
        }
        row.push({ id: `f${f}n${n}`, type: type, next: [] });
      }
    }
    if(f>0) {
      let prevRow = game.map.floors[f-1];
      prevRow.forEach(p => {
        let t = Math.floor(Math.random() * row.length); p.next.push(row[t].id);
        if(row.length > 1 && Math.random()<0.3) p.next.push(row[(t+1)%row.length].id);
      });
    }
    game.map.floors.push(row);
  }
  game.map.floor = 0; game.map.currentNodeId = null; renderMap();
}

function selectMapNode(node, f) {
  game.map.currentNodeId = node.id; renderMap();
  setTimeout(() => {
    switch(node.type) {
      case 'Combat': case 'Elite': case 'Boss': startCombat(node.type); break;
      case 'Chest': alert('상자에서 100 골드를 얻었습니다!'); game.player.gold += 100; advanceFloor(); break;
      case 'Rest': showScreen('rest-screen'); break;
      case 'Shop': openShop(); break;
      case 'Unknown': handleUnknown(); break;
    }
  }, 300);
}

function advanceFloor() {
  game.map.floor++;
  if(game.map.floor >= 20) {
    game.map.act++;
    if(game.map.act > 3) { alert('3막 보스를 물리치고 최종 승리했습니다!'); location.reload(); } 
    else { alert(`${game.map.act}막으로 넘어갑니다!`); generateActMap(); showScreen('map-screen'); }
  } else { showScreen('map-screen'); renderMap(); }
}

function handleUnknown() {
  let r = Math.random();
  if(r < 0.2) { alert('[미지] 숨겨진 상자에서 100 골드를 획득했습니다!'); game.player.gold += 100; advanceFloor(); }
  else if(r < 0.5) { alert('[미지] 적이 매복해 있었습니다!'); startCombat('Normal'); }
  else { if(Math.random() < 0.5) showEventSerpent(); else showEventOoze(); }
}

function setEventContent(title, desc, options) {
  showScreen('event-screen'); document.getElementById('event-title').innerText = title; document.getElementById('event-desc').innerText = desc;
  let optHtml = ''; options.forEach((opt, idx) => { optHtml += `<button class="option-btn" id="evt-btn-${idx}">${opt.text}</button>`; });
  document.getElementById('event-options').innerHTML = optHtml;
  options.forEach((opt, idx) => { document.getElementById(`evt-btn-${idx}`).onclick = opt.action; });
}

function showEventSerpent() {
  setEventContent('[백용의 제단]', '황금 안공을 가진 거대한 뱀이 당신의 주위를 맴돌며 속삭입니다. 금화를 줄 테니 저주를 받아들이겠는가?', [
    { text: '동의한다 (175 골드 획득, 저주 "의심" 덱에 추가)', action: () => {
        game.player.gold += 175; game.player.deck.push(createCard('doubt')); alert('175 골드와 "의심" 카드를 얻었습니다.'); advanceFloor();
    }},
    { text: '거절한다', action: () => { advanceFloor(); } }
  ]);
}

function showEventOoze() {
  game.eventParams.oozeChance = 25; renderOoze();
}
function renderOoze() {
  setEventContent('[의문의 부적]', '녹슨 고철 더미 속에 강력한 유물이 보입니다. 손을 집어넣어 꺼내시겠습니까? 상처를 입을 수 있습니다.', [
    { text: `손을 넣는다 (성공 확률 ${game.eventParams.oozeChance}%, 실패 시 체력 5 감소)`, action: () => {
        if(Math.random() * 100 < game.eventParams.oozeChance) { game.player.relics.push('Vajra'); alert('유물 [금강저]를 획득했습니다!'); advanceFloor(); } 
        else {
          game.player.hp -= 5; alert('앗! 고철에 긁혀 5의 데미지를 입었습니다.');
          if(game.player.hp <= 0) { alert('사망했습니다!'); location.reload(); }
          else { game.eventParams.oozeChance += 25; renderOoze(); }
        }
    }},
    { text: '떠난다', action: () => { advanceFloor(); } }
  ]);
}

function restHeal() {
  let heal = Math.floor(game.player.maxHp * 0.3); game.player.hp = Math.min(game.player.maxHp, game.player.hp + heal);
  alert(`체력을 ${heal} 회복했습니다.`); advanceFloor();
}
function restUpgrade() {
  let upgradable = game.player.deck.filter(c => !c.isUpgraded && c.type !== 'Curse' && c.type !== 'Status');
  if(upgradable.length > 0) {
    let target = upgradable[Math.floor(Math.random()*upgradable.length)];
    target.isUpgraded = true; alert(`[${target.name}] 카드가 강화되었습니다!`);
  } else alert('강화할 카드가 없습니다.');
  advanceFloor();
}
