/* ==========================================================================
   Relics & Potions Database
========================================================================== */
const DB_RELICS = {
  'BurningBlood': { name: '불타는 혈액', type: 'Starter', rarity: 'Starter', priceRange: [0,0], desc: '전투 종료 시 체력을 6 회복합니다.' },
  'BoundReliquary': { name: '구속된 성물함', type: 'Starter', rarity: 'Starter', priceRange: [0,0], desc: '매 턴 시작 시 소환을 1 얻습니다.', img: 'web_game/assets/relics/BoundReliquary.svg' },
  'Vajra': { name: '금강저', type: 'Attack', rarity: 'Common', priceRange: [135,165], desc: '매 전투 시작 시 힘을 1 얻습니다.', img: 'web_game/assets/relics/Vajra.svg' },
  'Anchor': { name: '닻', type: 'Utility', rarity: 'Common', priceRange: [135,165], desc: '매 전투 시작 시 방어도를 10 얻습니다.', img: 'web_game/assets/relics/Anchor.svg' },
  'Waffle': { name: '리의 와플', type: 'Shop', rarity: 'Shop', priceRange: [135,165], desc: '최대 체력이 7 증가하고 체력을 모두 회복합니다.', onBuy: () => { game.player.maxHp+=7; game.player.hp=game.player.maxHp; }, img: 'web_game/assets/relics/Waffle.svg' },
  'Membership': { name: '멤버십 카드', type: 'Shop', rarity: 'Shop', priceRange: [135,165], desc: '상점의 모든 상품이 50% 할인됩니다.', img: 'web_game/assets/relics/Membership.svg' }
};

const DB_POTIONS = {
  'BlockPotion': { name: '방어 포션', rarity: 'Common', priceRange: [45,55], desc: '방어도를 12 얻습니다.', effect: () => { gainBlock(12); } },
  'EnergyPotion': { name: '에너지 포션', rarity: 'Uncommon', priceRange: [67,82], desc: '에너지를 2 얻습니다.', effect: () => { game.player.energy += 2; } },
  'DexPotion': { name: '민첩 포션', rarity: 'Common', priceRange: [45,55], desc: '이번 전투 동안 민첩을 2 얻습니다.', effect: () => { game.player.buffs.dexterity += 2; } }
};
