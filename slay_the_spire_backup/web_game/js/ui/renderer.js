/* ==========================================================================
   Global UI Renderer
========================================================================== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active')); 
  document.getElementById(id).classList.add('active'); 
  updateUI();
}

function updateUI() {
  let g = document.getElementById('top-gold'); if(g) g.innerText = game.player.gold;
  let hp = document.getElementById('top-hp'); if(hp) hp.innerText = game.player.hp + '/' + game.player.maxHp;
  let act = document.getElementById('top-act'); if(act) act.innerText = game.map.act;
  let floor = document.getElementById('top-floor'); if(floor) floor.innerText = game.map.floor + 1;
  
  if(document.getElementById('battle-screen').classList.contains('active')) updateBattleUI();
}

function renderMap() {
  let container = document.getElementById('map-container'); container.innerHTML = '';
  let iconMap = { 'Combat': '⚔️', 'Elite': '💀', 'Shop': '💰', 'Rest': '🔥', 'Chest': '🎁', 'Unknown': '❓', 'Boss': '👹' };
  
  for(let f = game.map.floors.length - 1; f >= 0; f--) {
    let rowDiv = document.createElement('div'); rowDiv.className = 'map-floor';
    let label = document.createElement('div'); label.className = 'floor-label'; label.innerText = `층 ${f+1}`; rowDiv.appendChild(label);
    
    game.map.floors[f].forEach(node => {
      let nDiv = document.createElement('div'); nDiv.className = 'map-node'; nDiv.innerText = iconMap[node.type];
      
      let selectable = false;
      if(game.map.floor === f) {
        if(f === 0) selectable = true;
        else {
          let curr = game.map.floors[f-1].find(x => x.id === game.map.currentNodeId);
          if(curr && curr.next.includes(node.id)) selectable = true;
        }
      }
      if(!selectable) nDiv.classList.add('disabled'); else nDiv.onclick = () => { selectMapNode(node, f); };
      if(game.map.currentNodeId === node.id) nDiv.classList.add('current');
      
      rowDiv.appendChild(nDiv);
    });
    container.appendChild(rowDiv);
  }
  updateUI();
}

function renderShop() {
  let shopGold = document.getElementById('shop-gold');
  if(shopGold) shopGold.innerText = game.player.gold;
  
  let cardsHtml = '';
  let relicsHtml = '';
  
  game.shopParams.items.forEach((item, idx) => {
    let pur = item.purchased ? 'purchased' : '';
    if(item.type === 'card') {
      let c = createCard(item.id);
      cardsHtml += `<div class="card ${pur}" onclick="buyShopItem(${idx})" style="transform:none; cursor:pointer;">
        ${item.isSale ? '<div class="sale-badge">SALE</div>' : ''}
        <div class="card-cost">${c.cost}</div><div class="card-name">${c.name}</div><div class="card-desc">${c.getDesc()}</div>
        <div class="shop-price-tag">${item.price} G</div>
      </div>`;
    } else if(item.type === 'relic') {
      let r = DB_RELICS[item.id];
      relicsHtml += `<div class="shop-item-box ${pur}" onclick="buyShopItem(${idx})">
        <div style="font-weight:bold; color:#4fa; font-size:1.1em;">[유물] ${r.name}</div>
        <div style="font-size:0.8em; color:#ccc; margin-top:5px; text-align:center;">${r.desc}</div>
        <div class="shop-price-tag">${item.price} G</div>
      </div>`;
    } else if(item.type === 'potion') {
      let p = DB_POTIONS[item.id];
      relicsHtml += `<div class="shop-item-box ${pur}" onclick="buyShopItem(${idx})">
        <div style="font-weight:bold; color:#f4f; font-size:1.1em;">[포션] ${p.name}</div>
        <div style="font-size:0.8em; color:#ccc; margin-top:5px; text-align:center;">${p.desc}</div>
        <div class="shop-price-tag">${item.price} G</div>
      </div>`;
    }
  });
  
  document.getElementById('shop-cards').innerHTML = cardsHtml;
  document.getElementById('shop-relics-potions').innerHTML = relicsHtml;
  
  let removeCost = game.shopParams.removeCost;
  if(game.player.relics.includes('Membership')) removeCost = Math.floor(removeCost * 0.5);
  document.getElementById('shop-remove-btn').innerText = `카드 제거 서비스 (${removeCost} 골드)`;
  document.getElementById('shop-remove-btn').style.display = 'block';
}

function updatePotionUI() {
  let bar = document.getElementById('battle-potions');
  if(!bar) return;
  let html = '';
  game.player.potions.forEach((p, idx) => {
    html += `<button class="btn" style="padding:8px 15px; font-size:1em; background:#f4f; color:#fff;" onclick="usePotion(${idx})">${DB_POTIONS[p].name}</button> `;
  });
  bar.innerHTML = html;
}

function updateBattleUI() {
  let p = game.player; let e = game.enemy;
  
  document.getElementById('p-energy').innerText = p.energy;
  document.getElementById('p-maxenergy').innerText = p.maxEnergy;
  document.getElementById('p-hp').innerText = Math.max(0, p.hp);
  document.getElementById('p-maxhp').innerText = p.maxHp;
  document.getElementById('p-block').innerText = p.block;
  document.getElementById('p-block-icon').style.display = p.block > 0 ? 'flex' : 'none';
  document.getElementById('p-hp-fill').style.width = Math.max(0, p.hp/p.maxHp*100) + '%';
  document.getElementById('p-buffs').innerHTML = renderBuffs(p.buffs);
  
  if(p.charClass === 'Necrobinder' && p.summon) {
    document.getElementById('summon-area').style.display = 'block';
    if (p.summon.active) {
      document.getElementById('sum-hp').innerText = p.summon.hp;
      document.getElementById('sum-maxhp').innerText = p.summon.maxHp;
      document.getElementById('sum-hp-fill').style.width = Math.max(0, p.summon.hp/p.summon.maxHp*100) + '%';
      document.getElementById('sum-hp-fill').style.background = '#4fa';
    } else {
      document.getElementById('sum-hp').innerText = 0;
      document.getElementById('sum-hp-fill').style.width = '0%';
    }
  } else { document.getElementById('summon-area').style.display = 'none'; }

  if(e) {
    document.getElementById('e-name').innerText = e.name;
    document.getElementById('e-hp').innerText = Math.max(0, e.hp);
    document.getElementById('e-maxhp').innerText = e.maxHp;
    document.getElementById('e-block').innerText = e.block;
    document.getElementById('e-block-icon').style.display = e.block > 0 ? 'flex' : 'none';
    document.getElementById('e-hp-fill').style.width = Math.max(0, e.hp/e.maxHp*100) + '%';
    document.getElementById('e-buffs').innerHTML = renderBuffs(e.buffs);
    if(e.currentIntent) {
      document.getElementById('e-intent').innerText = e.currentIntent.desc;
    }
  }
  
  let handHtml = '';
  p.hand.forEach((c, idx) => {
    let unplayable = DB_CARDS[c.id].unplayable || p.energy < (c.cost === '—' ? 99 : c.cost) ? 'unplayable' : '';
    handHtml += `<div class="card ${unplayable}" onclick="${unplayable ? '' : `playCard(${idx})`}">
        <div class="card-cost">${c.cost}</div><div class="card-name">${c.name}${c.isUpgraded?'+':''}</div><div class="card-desc">${c.getDesc()}</div>
      </div>`;
  });
  document.getElementById('hand-container').innerHTML = handHtml;
  
  document.getElementById('draw-count').innerText = p.drawPile.length;
  document.getElementById('discard-count').innerText = p.discardPile.length;
  document.getElementById('exhaust-count').innerText = p.exhaustPile.length;
  document.getElementById('end-turn-btn').disabled = !game.battle.isPlayerTurn;
}

function renderBuffs(buffs) {
  let html = '';
  for(let k in buffs) { if(buffs[k] > 0) {
    let kn = k;
    if(k==='strength') kn='힘'; else if(k==='dexterity') kn='민첩'; else if(k==='vulnerable') kn='취약'; else if(k==='weak') kn='약화';
    else if(k==='enrage') kn='분노'; else if(k==='demonForm') kn='악마의형태'; else if(k==='lichForm') kn='리치형태';
    else if(k==='doom') kn='<span style="color:#ff5555; font-weight:bold;">종말</span>';
    else if(k==='pagestorm') kn='서류폭풍'; else if(k==='reaperForm') kn='사신의형상'; else if(k==='neurosurge') kn='정신폭주';
    html += `<span class="buff-badge">${kn}: ${buffs[k]}</span>`;
  }}
  return html;
}
