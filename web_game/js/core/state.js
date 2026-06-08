/* ==========================================================================
   State Management & Utilities
========================================================================== */
const game = {
  player: {
    name: '플레이어', charClass: '',
    hp: 80, maxHp: 80, energy: 3, maxEnergy: 3, gold: 99,
    deck: [], hand: [], drawPile: [], discardPile: [], exhaustPile: [], relics: [], potions: [],
    buffs: { strength: 0, dexterity: 0, vulnerable: 0, weak: 0, frail: 0, demonForm: 0, lichForm: 0, reaperForm: 0, pagestorm: 0, neurosurge: 0, doom: 0 },
    summon: { active: false, hp: 0, maxHp: 0 }
  },
  enemy: null,
  map: { act: 1, floor: 0, floors: [], currentNodeId: null, visited: [] },
  battle: { turn: 1, isPlayerTurn: false },
  eventParams: {},
  shopParams: { removeCost: 75, items: [] }
};

function log(msg) {
  let box = document.getElementById('battle-log');
  if(!box) return;
  box.innerHTML += `<div>> ${msg}</div>`;
  box.scrollTop = box.scrollHeight;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function addCardToPile(id, pileName, count) {
  for(let i=0; i<count; i++) { 
    game.player[pileName].push(createCard(id)); 
    log(`${DB_CARDS[id].name} 카드가 추가되었습니다.`); 
  }
}
