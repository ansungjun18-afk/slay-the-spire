/* ==========================================================================
   Shop System
========================================================================== */
function openShop() {
  let p = game.player;
  game.shopParams.items = [];
  
  const randPrice = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const getCards = (type, isColorless) => {
    let pool = Object.keys(DB_CARDS).filter(k => {
      let c = DB_CARDS[k];
      if(c.type === 'Status' || c.type === 'Curse' || c.rarity === 'Token' || c.rarity === 'Basic') return false;
      if(isColorless) return c.rarity.includes('Colorless');
      if(type && c.type !== type) return false;
      if(p.charClass === 'Necrobinder' && k.includes('_r')) return false;
      if(p.charClass === 'Ironclad' && k.includes('_n')) return false;
      if(!isColorless && c.rarity.includes('Colorless')) return false;
      return true;
    });
    shuffle(pool); return pool;
  };

  let attacks = getCards('Attack', false);
  let skills = getCards('Skill', false);
  let powers = getCards('Power', false);
  
  let shopCards = [attacks.pop(), attacks.pop(), skills.pop(), skills.pop(), powers.pop()];
  let colorless = getCards(null, true);
  let uncCol = colorless.find(k => DB_CARDS[k].rarity === 'UncommonColorless') || 'swift_strike';
  let rareCol = colorless.find(k => DB_CARDS[k].rarity === 'RareColorless') || 'apotheosis';
  shopCards.push(uncCol, rareCol);

  let saleIndex = Math.floor(Math.random() * 5);
  let cardItems = shopCards.map((k, i) => {
    let r = DB_CARDS[k].rarity;
    let price = r === 'Common' ? randPrice(45,55) :
                r === 'Uncommon' ? randPrice(67,82) :
                r === 'Rare' ? randPrice(135,165) :
                r === 'UncommonColorless' ? randPrice(81,99) : randPrice(162,198);
    let isSale = i === saleIndex;
    if(isSale) price = Math.floor(price * 0.8);
    if(p.relics.includes('Membership')) price = Math.floor(price * 0.5);
    return { type: 'card', id: k, price: price, isSale: isSale, purchased: false };
  });

  let rPool = Object.keys(DB_RELICS).filter(k => !p.relics.includes(k) && DB_RELICS[k].rarity !== 'Starter');
  let attR = rPool.find(k => DB_RELICS[k].type === 'Attack') || 'Vajra';
  let utiR = rPool.find(k => DB_RELICS[k].type === 'Utility') || 'Anchor';
  let shpR = rPool.find(k => DB_RELICS[k].type === 'Shop') || 'Waffle';
  
  let relicItems = [attR, utiR, shpR].map(k => {
    let r = DB_RELICS[k].rarity;
    let price = r === 'Common' ? randPrice(135,165) : r === 'Uncommon' ? randPrice(225,275) : randPrice(275,325);
    if(r === 'Shop') price = randPrice(135,165);
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
