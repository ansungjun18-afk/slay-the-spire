/* ==========================================================================
   Battle Core Loop & Initialization
========================================================================== */
function startGame(charClass) {
  document.getElementById('top-bar').style.display = 'flex';
  game.player.charClass = charClass;
  document.getElementById('top-class').innerText = charClass;
  
  if(charClass === 'Ironclad') {
    game.player.maxHp = 80; game.player.hp = 80;
    game.player.relics.push('BurningBlood');
    for(let i=0; i<5; i++) game.player.deck.push(createCard('strike_r'));
    for(let i=0; i<4; i++) game.player.deck.push(createCard('defend_r'));
    game.player.deck.push(createCard('bash'));
  } else {
    game.player.maxHp = 70; game.player.hp = 70;
    game.player.relics.push('BoundReliquary');
    for(let i=0; i<5; i++) game.player.deck.push(createCard('strike_n'));
    for(let i=0; i<5; i++) game.player.deck.push(createCard('defend_n'));
    game.player.deck.push(createCard('unleash'));
    game.player.deck.push(createCard('bodyguard'));
  }
  
  game.map.act = 1; showScreen('map-screen'); generateActMap(); 
}

function startCombat(type) {
  showScreen('battle-screen'); document.getElementById('battle-log').innerHTML = '';
  
  let p = game.player; p.energy = p.maxEnergy; p.block = 0; p.timesLostHpThisCombat = 0;
  p.buffs = { strength: 0, dexterity: 0, vulnerable: 0, weak: 0, frail: 0, demonForm: 0, lichForm: 0, doom: 0, reaperForm: 0, pagestorm: 0, neurosurge: 0 };
  
  if (p.relics.includes('Vajra')) p.buffs.strength += 1;
  if (p.relics.includes('Anchor')) gainBlock(10);
  
  if (p.charClass === 'Necrobinder') {
    p.summon = { active: false, hp: 0, maxHp: 0 };
    gainSummon(6);
  }
  
  p.drawPile = [...p.deck]; shuffle(p.drawPile);
  p.hand = []; p.discardPile = []; p.exhaustPile = [];
  
  let enemyId = 'jaw_worm';
  if(type === 'Elite') enemyId = game.map.act === 1 ? 'gremlin_nob' : 'book_of_stabbing';
  else if(type === 'Boss') enemyId = 'book_of_stabbing'; 
  
  let baseDef = DB_ENEMIES[enemyId];
  game.enemy = { 
    id: enemyId, name: baseDef.name, type: baseDef.type,
    hp: baseDef.maxHp, maxHp: baseDef.maxHp, block: 0,
    buffs: { strength: 0, vulnerable: 0, weak: 0, enrage: 0, doom: 0 },
    turnCycle: 0, hits: baseDef.hits || 0
  };
  baseDef.init(game.enemy);
  game.battle.turn = 0; 
  updatePotionUI();
  startPlayerTurn();
}

function startPlayerTurn() {
  game.battle.turn++; game.battle.isPlayerTurn = true; let p = game.player;
  p.attacksPlayedThisTurn = 0;
  p.lostHpThisTurn = 0;
  p.exhaustedThisTurn = false;
  
  if(p.buffs.demonForm > 0) p.buffs.strength += p.buffs.demonForm;
  if(p.buffs.neurosurge > 0) applyDoom(p, 3);
  if(p.charClass === 'Necrobinder') {
    if(p.relics.includes('BoundReliquary')) {
      gainSummon(1);
    }
    if(p.relics.includes('ForgottenPact') && !p.summon.active) {
      p.summon.active = true; p.summon.hp = 1; p.summon.maxHp = 1; log(`잊혀진 결속: 오스트가 1의 체력으로 부활합니다!`);
    }
  }
  
  p.energy = p.maxEnergy; p.block = 0;
  if(p.buffs.vulnerable > 0) p.buffs.vulnerable--; if(p.buffs.weak > 0) p.buffs.weak--;
  
  drawCards(5);
  if(game.enemy) game.enemy.currentIntent = DB_ENEMIES[game.enemy.id].getIntent(game.enemy);
  updateUI();
}

function drawCards(amount) {
  let drawn = [];
  for(let i=0; i<amount; i++) {
    if(game.player.drawPile.length === 0) {
      if(game.player.discardPile.length === 0) break;
      game.player.drawPile = [...game.player.discardPile]; game.player.discardPile = []; shuffle(game.player.drawPile); log('버린 카드 더미를 섞습니다.');
    }
    let c = game.player.drawPile.pop(); game.player.hand.push(c); drawn.push(c);
  }
  drawn.forEach(c => {
    if (game.player.buffs.pagestorm > 0 && (DB_CARDS[c.id].volatile)) {
       log('서류 폭풍 발동! 휘발성 카드로 인해 추가 드로우!'); drawCards(1); 
    }
  });
}

function playCard(index) {
  let p = game.player; let card = p.hand[index];
  let effectiveCost = card.cost === 'X' ? 0 : (card.cost === '—' ? 99 : card.cost);
  if(p.energy < effectiveCost) return;
  
  if (card.cost !== 'X') p.energy -= card.cost;
  p.hand.splice(index, 1); log(`[${card.name}] 사용!`);
  card.effect(game.enemy);
  
  if(card.type === 'Skill' && game.enemy && game.enemy.buffs.enrage > 0) {
    game.enemy.buffs.strength += game.enemy.buffs.enrage; log(`귀족 괭이가 분노하여 힘이 ${game.enemy.buffs.enrage} 증가했습니다!`);
  }
  if(DB_CARDS[card.id].type === 'Attack') {
    game.player.attacksPlayedThisTurn = (game.player.attacksPlayedThisTurn||0) + 1;
    if(game.player.buffs.juggling && game.player.attacksPlayedThisTurn === 3) {
      let copy = createCard(card.id);
      if(card.isUpgraded) copy.isUpgraded = true;
      game.player.hand.push(copy);
      log(`[저글링] ${card.name} 복사본 획득!`);
    }
  }
  
  let cDef = DB_CARDS[card.id];
  if(cDef.type === 'Power' || card.exhausts || cDef.exhausts) {
    p.exhaustPile.push(card);
    if(p.buffs.feelNoPain > 0) gainBlock(p.buffs.feelNoPain);
    if(p.buffs.darkEmbrace) drawCards(1);
    p.exhaustedThisTurn = true;
  } else {
    p.discardPile.push(card);
  }
  
  updateUI(); checkCombatEnd();
}

function exhaustCard(index) {
  let p = game.player;
  let c = p.hand[index];
  p.hand.splice(index, 1);
  p.exhaustPile.push(c);
  if(p.buffs.feelNoPain > 0) gainBlock(p.buffs.feelNoPain);
  if(p.buffs.darkEmbrace) drawCards(1);
  p.exhaustedThisTurn = true;
  updateUI();
}

function endPlayerTurn() {
  game.battle.isPlayerTurn = false; updateUI(); let p = game.player;
  if(p.hand.some(c => c.id === 'doubt')) applyDebuff(p, 'weak', 1);
  
  for(let i = p.hand.length - 1; i >= 0; i--) {
    let c = p.hand[i]; let cDef = DB_CARDS[c.id];
    if(cDef.ethereal || cDef.volatile) { p.exhaustPile.push(c); p.hand.splice(i, 1); log(`[${c.name}] 카드가 휘발/소멸되었습니다.`); }
  }
  for(let i = p.hand.length - 1; i >= 0; i--) {
    let c = p.hand[i]; let cDef = DB_CARDS[c.id];
    if(!cDef.retain) { p.discardPile.push(c); p.hand.splice(i, 1); }
  }
  
  if (checkDoomDeath(game.player)) { alert("종말에 의해 사망했습니다!"); location.reload(); return; }
  
  updateUI(); setTimeout(startEnemyTurn, 500);
}

function startEnemyTurn() {
  let e = game.enemy; e.block = 0;
  if(e.buffs.vulnerable > 0) e.buffs.vulnerable--; if(e.buffs.weak > 0) e.buffs.weak--;
  
  log(`--- 적 턴 ---`);
  if(e.currentIntent) e.currentIntent.action();
  // clear temporary strength_down debuffs after enemy acts (mangle effect lasts one enemy turn)
  if(e.buffs && e.buffs.strength_down) {
    e.buffs.strength_down = 0;
  }
  
  if (checkDoomDeath(e)) { checkCombatEnd(); return; }
  
  e.turnCycle++; updateUI();
  if(game.player.hp > 0 && e.hp > 0) setTimeout(startPlayerTurn, 800);
}

function checkCombatEnd() {
  if (game.enemy && game.enemy.hp <= 0) {
    log('전투 승리!');
    if(game.player.relics.includes('BurningBlood')) {
      game.player.hp = Math.min(game.player.maxHp, game.player.hp + 6); log('불타는 혈액: 체력을 6 회복했습니다.');
    }
    setTimeout(showRewardScreen, 1000);
  }
}

function showRewardScreen() {
  showScreen('reward-screen');
  let goldReward = Math.floor(Math.random() * 20) + 10; game.player.gold += goldReward;
  
  let poolKeys = Object.keys(DB_CARDS).filter(k => {
    let c = DB_CARDS[k];
    if(c.type === 'Status' || c.type === 'Curse' || c.rarity === 'Token' || c.rarity === 'Basic') return false;
    if(c.rarity && c.rarity.includes('Colorless')) return false;
    if(c.class && c.class !== game.player.charClass && c.class !== 'Colorless' && c.class !== 'Any') return false;
    return true;
  });

  // Build rarity buckets
  const commons = poolKeys.filter(k => DB_CARDS[k].rarity === 'Common');
  const uncommons = poolKeys.filter(k => DB_CARDS[k].rarity === 'Uncommon');
  const rares = poolKeys.filter(k => DB_CARDS[k].rarity === 'Rare');

  // Weights: Common 60%, Uncommon 30%, Rare 10%
  const pickByRarity = () => {
    const r = Math.random() * 100;
    if (r < 60) return 'common';
    if (r < 90) return 'uncommon';
    return 'rare';
  };

  // pick up to 3 unique choices according to rarity weights, with graceful fallback
  let choices = [];
  let attempts = 0;
  while (choices.length < 3 && attempts < 50) {
    attempts++;
    let bucket = pickByRarity();
    let src = bucket === 'common' ? commons : bucket === 'uncommon' ? uncommons : rares;
    // fallback if bucket empty
    if (!src || src.length === 0) {
      src = commons.length ? commons : (uncommons.length ? uncommons : rares);
    }
    // pick random from src that's not already chosen
    let candidate = src[Math.floor(Math.random() * src.length)];
    if (!candidate) continue;
    if (!choices.includes(candidate)) choices.push(candidate);
  }
  // final fallback: if not enough choices, fill from poolKeys
  shuffle(poolKeys);
  for (let k of poolKeys) { if (choices.length >= 3) break; if (!choices.includes(k)) choices.push(k); }
  
  let html = `<h3 style="color:#fff; margin-bottom: 20px;">${goldReward} 골드를 획득했습니다!</h3><div class="hand-area">`;
  choices.forEach(k => {
    let c = createCard(k);
    const cardContent = `<div class="card-cost">${c.cost}</div><div class="card-name">${c.name}</div><div class="card-desc">${c.getDesc()}</div>`;
    html += `<div class="card" onclick="selectReward('${k}')">
        ${cardContent}
      </div>`;
  });
  html += `</div>`; document.getElementById('reward-content').innerHTML = html; updateUI();
}

function selectReward(id) { game.player.deck.push(createCard(id)); alert('카드를 덱에 추가했습니다!'); advanceFloor(); }
function skipReward() { advanceFloor(); }

// Start logic
function usePotion(idx) {
  if(!document.getElementById('battle-screen').classList.contains('active')) return;
  if(!game.battle.isPlayerTurn) { alert("내 턴에만 사용할 수 있습니다!"); return; }
  let p = game.player.potions.splice(idx, 1)[0];
  DB_POTIONS[p].effect();
  log(`[${DB_POTIONS[p].name}] 사용!`);
  updatePotionUI();
  updateUI();
}
