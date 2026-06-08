/* ==========================================================================
   Map Generation & Events & Rest
========================================================================== */
function generateActMap() {
  const TOTAL_FLOORS = 15;
  const COLUMNS = 6;
  let grid = Array(TOTAL_FLOORS).fill(null).map(() => Array(COLUMNS).fill(null));

  for(let f=0; f<TOTAL_FLOORS-1; f++) {
      let count = Math.floor(Math.random() * 3) + 4; // 4 to 6
      let cols = [0,1,2,3,4,5];
      let selectedCols = [];
      for(let i=0; i<count; i++) {
          let idx = Math.floor(Math.random() * cols.length);
          selectedCols.push(cols.splice(idx, 1)[0]);
      }
      selectedCols.sort((a,b) => a-b);
      
      let isChest = (f === 7);
      let isRest = (f === 13);
      
      selectedCols.forEach(c => {
          let type = 'Combat';
          if (isRest) type = 'Rest';
          else if (isChest) type = 'Chest';
          else {
              let r = Math.random();
              if (f > 0) {
                 if (r < 0.15) type = 'Shop';
                 else if (r < 0.3 && f >= 4) type = 'Elite';
                 else if (r < 0.5) type = 'Unknown';
              }
          }
          grid[f][c] = { id: `f${f}n${c}`, type: type, next: [], col: c, f: f };
      });
  }
  // Floor 14 Boss
  grid[14][3] = { id: `f14n3`, type: 'Boss', next: [], col: 3, f: 14 };

  // Connect nodes
  for(let f=0; f<TOTAL_FLOORS-1; f++) {
      let currNodes = grid[f].filter(n => n !== null);
      let nextNodes = grid[f+1].filter(n => n !== null);
      let edges = [];
      
      // Ensure each nextNode has at least one incoming from currNodes
      nextNodes.forEach(n2 => {
          let candidates = currNodes.filter(n1 => Math.abs(n1.col - n2.col) <= 1);
          if (candidates.length === 0) candidates = currNodes;
          let best = candidates.reduce((prev, curr) => Math.abs(curr.col - n2.col) < Math.abs(prev.col - n2.col) ? curr : prev);
          edges.push({from: best, to: n2});
      });
      
      // Ensure each currNode has at least one outgoing to nextNodes
      currNodes.forEach(n1 => {
          if (!edges.some(e => e.from === n1)) {
              let candidates = nextNodes.filter(n2 => Math.abs(n1.col - n2.col) <= 1);
              if (candidates.length === 0) candidates = nextNodes;
              let best = candidates.reduce((prev, curr) => Math.abs(curr.col - n1.col) < Math.abs(prev.col - n1.col) ? curr : prev);
              edges.push({from: n1, to: best});
          }
      });
      
      // Fix crossing edges
      edges.sort((a,b) => a.from.col - b.from.col);
      for(let i=0; i<edges.length; i++) {
          for(let j=i+1; j<edges.length; j++) {
              if (edges[i].to.col > edges[j].to.col) {
                  let temp = edges[i].to;
                  edges[i].to = edges[j].to;
                  edges[j].to = temp;
              }
          }
      }
      
      edges.forEach(e => {
          if (!e.from.next.includes(e.to.id)) {
              e.from.next.push(e.to.id);
          }
      });
  }

  game.map.floors = [];
  for(let f=0; f<TOTAL_FLOORS; f++) {
    let row = [];
    for(let c=0; c<COLUMNS; c++) {
      if (grid[f][c]) {
        grid[f][c].offsetX = (Math.random() - 0.5) * 30; 
        grid[f][c].offsetY = (Math.random() - 0.5) * 20; 
        row.push(grid[f][c]);
      } else {
        row.push({ empty: true, col: c });
      }
    }
    game.map.floors.push(row);
  }

  game.map.unknownProb = { combat: 10, shop: 3, treasure: 2 };
  game.map.floor = 0; game.map.currentNodeId = null; game.map.visited = []; renderMap();
}

function getUnknownChances() {
  const combat = game.map.unknownProb.combat;
  const shop = game.map.unknownProb.shop;
  const treasure = game.map.unknownProb.treasure;
  const event = Math.max(10, 100 - (combat + shop + treasure));
  return { combat, shop, treasure, event };
}

function increaseUnknownProbabilities() {
  game.map.unknownProb.combat = Math.min(60, game.map.unknownProb.combat + 10);
  game.map.unknownProb.shop = Math.min(18, game.map.unknownProb.shop + 3);
  game.map.unknownProb.treasure = Math.min(12, game.map.unknownProb.treasure + 2);
}

function selectMapNode(node, f) {
  game.map.currentNodeId = node.id;
  if(!game.map.visited) game.map.visited = [];
  if(!game.map.visited.includes(node.id)) game.map.visited.push(node.id);
  renderMap();
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
  if(game.map.floor >= 15) {
    game.map.act++;
    if(game.map.act > 3) { alert('3막 보스를 물리치고 최종 승리했습니다!'); location.reload(); } 
    else { alert(`${game.map.act}막으로 넘어갑니다!`); showScreen('map-screen'); generateActMap(); }
  } else { showScreen('map-screen'); renderMap(); }
}

function handleUnknown() {
  const { combat, shop, treasure } = getUnknownChances();
  let r = Math.random() * 100;

  if (r < treasure) {
    game.map.unknownProb.treasure = 2;
    alert('[미지] 숨겨진 상자에서 100 골드를 획득했습니다!');
    game.player.gold += 100;
    advanceFloor();
  } else if (r < treasure + shop) {
    game.map.unknownProb.shop = 3;
    openShop();
  } else if (r < treasure + shop + combat) {
    game.map.unknownProb.combat = 10;
    startCombat('Normal');
  } else {
    increaseUnknownProbabilities();
    if(Math.random() < 0.5) showEventSerpent(); else showEventOoze();
  }
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
