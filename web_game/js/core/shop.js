/* ==========================================================================
   Shop System
========================================================================== */
function openShop() {
  let p = game.player;
  game.shopParams.items = [];
  
  const randPrice = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const getCards = (type, isColorless, rarity) => {
    let pool = Object.keys(DB_CARDS).filter(k => {
      let c = DB_CARDS[k];
      if(c.type === 'Status' || c.type === 'Curse' || c.rarity === 'Token' || c.rarity === 'Basic') return false;
      if(typeof rarity === 'string' && c.rarity !== rarity) return false;
      if(isColorless) {
        if(!c.rarity.includes('Colorless')) return false;
      } else {
        if(c.rarity.includes('Colorless')) return false;
        if(type && c.type !== type) return false;
        if(DB_CARDS[k].class && DB_CARDS[k].class !== p.charClass && DB_CARDS[k].class !== 'Colorless' && DB_CARDS[k].class !== 'Any') return false;
      }
      return true;
    });
    shuffle(pool);
    return pool;
  };

  const chooseRandomUnique = (pool, count) => {
    const copied = pool.slice();
    shuffle(copied);
    return copied.slice(0, Math.min(count, copied.length));
  };

  let shopCards = [];
  shopCards.push(...chooseRandomUnique(getCards('Attack', false), 2));
  shopCards.push(...chooseRandomUnique(getCards('Skill', false), 2));
  shopCards.push(...chooseRandomUnique(getCards('Power', false), 1));

  // Add two extra non-colorless cards to round out the shop
  let extraPool = getCards(null, false).filter(k => !shopCards.includes(k));
  shopCards.push(...chooseRandomUnique(extraPool, 2));

  let saleIndex = Math.floor(Math.random() * shopCards.length);
  let cardItems = shopCards.map((k, i) => {
    let r = DB_CARDS[k].rarity;
    let price = r === 'Common' ? randPrice(45,55) :
                r === 'Uncommon' ? randPrice(67,82) :
                randPrice(135,165);
    let isSale = i === saleIndex;
    if(isSale) price = Math.floor(price * 0.8);
    if(p.relics.includes('Membership')) price = Math.floor(price * 0.5);
    return { type: 'card', id: k, price: price, isSale: isSale, purchased: false };
  });

  let availableRelics = Object.keys(DB_RELICS).filter(k => !p.relics.includes(k) && DB_RELICS[k].rarity !== 'Starter');
  let shopRelics = availableRelics.filter(k => DB_RELICS[k].type === 'Shop');
  let nonShopRelics = availableRelics.filter(k => DB_RELICS[k].type !== 'Shop');

  const chooseRelics = (pool, count, fallbackPool) => {
    let chosen = [];
    let copy = pool.slice();
    shuffle(copy);
    while(chosen.length < count && copy.length > 0) {
      let candidate = copy.pop();
      if(!chosen.includes(candidate)) chosen.push(candidate);
    }
    if(chosen.length < count && fallbackPool) {
      let extra = fallbackPool.filter(k => !chosen.includes(k));
      shuffle(extra);
      chosen.push(...extra.slice(0, count - chosen.length));
    }
    return chosen;
  };

  let relicChoices = chooseRelics(nonShopRelics, 2, availableRelics);
  let shopChoice = chooseRelics(shopRelics, 1, availableRelics.filter(k => !relicChoices.includes(k)));
  let relicItems = [...relicChoices, ...shopChoice].map(k => {
    let r = DB_RELICS[k].rarity;
    let price = r === 'Common' ? randPrice(135,165) : r === 'Uncommon' ? randPrice(225,275) : randPrice(275,325);
    if(DB_RELICS[k].type === 'Shop') price = randPrice(135,165);
    if(p.relics.includes('Membership')) price = Math.floor(price * 0.5);
    return { type: 'relic', id: k, price: price, purchased: false };
  });

  let pPool = Object.keys(DB_POTIONS);
  let potionItems = [];
  for(let i=0; i<3; i++) {
    let k = pPool[Math.floor(Math.random() * pPool.length)];
    let r = DB_POTIONS[k].rarity;
    let price = r === 'Common' ? randPrice(45,55) : r === 'Uncommon' ? randPrice(67,82) : randPrice(90,110);
    if(p.relics.includes('Membership')) price = Math.floor(price * 0.5);
    potionItems.push({ type: 'potion', id: k, price: price, purchased: false });
  }

  game.shopParams.items = [...cardItems, ...relicItems, ...potionItems];
  renderShop();
  showScreen('shop-screen');
}

function buyShopItem(index) {
  let item = game.shopParams.items[index];
  if(item.purchased) return;
  if(game.player.gold < item.price) { alert("골드가 부족합니다!"); return; }
  
  game.player.gold -= item.price;
  item.purchased = true;
  
  if(item.type === 'card') {
    game.player.deck.push(createCard(item.id));
  } else if(item.type === 'relic') {
    game.player.relics.push(item.id);
    if(DB_RELICS[item.id].onBuy) DB_RELICS[item.id].onBuy();
  } else if(item.type === 'potion') {
    game.player.potions.push(item.id);
    updatePotionUI();
  }
  renderShop();
}

function buyCardRemoval() {
  let cost = game.shopParams.removeCost;
  if(game.player.relics.includes('Membership')) cost = Math.floor(cost * 0.5);
  
  if(game.player.gold < cost) { alert("골드가 부족합니다!"); return; }
  
  let html = '<h3 style="color:#fff;">제거할 카드를 선택하세요</h3><div class="hand-area" style="flex-wrap:wrap; height:auto; overflow-y:auto; max-height:400px; justify-content:center; gap:20px;">';
  game.player.deck.forEach((c, idx) => {
    html += `<div class="card" onclick="executeCardRemoval(${idx}, ${cost})" style="transform:none; cursor:pointer;">
      <div class="card-cost">${c.cost}</div><div class="card-name">${c.name}</div><div class="card-desc">${c.getDesc()}</div>
    </div>`;
  });
  html += '</div><button class="btn" onclick="renderShop()" style="margin-top:20px;">취소</button>';
  
  document.getElementById('shop-relics-potions').innerHTML = html;
  document.getElementById('shop-cards').innerHTML = ''; 
  document.getElementById('shop-remove-btn').style.display = 'none';
}

function executeCardRemoval(index, cost) {
  game.player.gold -= cost;
  game.shopParams.removeCost += 25; 
  let removed = game.player.deck.splice(index, 1)[0];
  alert(`[${removed.name}] 카드를 제거했습니다.`);
  renderShop();
}
