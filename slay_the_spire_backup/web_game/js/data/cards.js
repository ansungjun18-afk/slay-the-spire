/* ==========================================================================
   Card Database
========================================================================== */
const DB_CARDS = {
  // Ironclad
  'strike_r': { name: '타격', cost: 1, type: 'Attack', rarity: 'Basic', play: (t, u) => attack(t, u?9:6), getDesc: u => `적에게 ${u?9:6} 데미지를 줍니다.` },
  'defend_r': { name: '수비', cost: 1, type: 'Skill', rarity: 'Basic', play: (t, u) => gainBlock(u?8:5), getDesc: u => `방어도 ${u?8:5}을 얻습니다.` },
  'bash': { name: '바시', cost: 2, type: 'Attack', rarity: 'Basic', play: (t, u) => { attack(t, u?10:8); applyDebuff(t, 'vulnerable', u?3:2); }, getDesc: u => `적에게 ${u?10:8} 데미지를 줍니다. 취약 ${u?3:2}턴을 부여합니다.` },
  'reckless_charge': { name: '무모한 돌진', cost: 1, type: 'Attack', rarity: 'Common', play: (t, u) => { attack(t, u?14:10); addCardToPile('dazed', 'drawPile', u?2:1); }, getDesc: u => `적에게 ${u?14:10} 데미지를 줍니다. 뽑을 카드 더미에 부상을 ${u?2:1}장 섞어 넣습니다.` },
  'demon_form': { name: '악마의 형태', cost: 3, type: 'Power', rarity: 'Rare', play: (t, u) => { game.player.buffs.demonForm += (u?3:2); }, getDesc: u => `매 턴 시작 시 힘을 ${u?3:2} 얻습니다.` },
  
  // Necrobinder
  'strike_n': { name: '타격', cost: 1, type: 'Attack', rarity: 'Basic', play: (t, u) => attack(t, u?9:6), getDesc: u => `적에게 ${u?9:6} 데미지를 줍니다.` },
  'defend_n': { name: '수비', cost: 1, type: 'Skill', rarity: 'Basic', play: (t, u) => gainBlock(u?8:5), getDesc: u => `방어도 ${u?8:5}을 얻습니다.` },
  'unleash': { name: '풀어놓기', cost: 1, type: 'Attack', rarity: 'Basic', play: (t, u) => { let ostHp = game.player.summon.active ? game.player.summon.hp : 0; attackOsty(t, (u?9:6) + ostHp); }, getDesc: u => `골골이가 피해를 ${u?9:6} 줍니다. 골골이의 현재 체력만큼 피해량이 증가합니다.` },
  'bodyguard': { name: '호위', cost: 1, type: 'Skill', rarity: 'Basic', play: (t, u) => gainSummon(u?7:5), getDesc: u => `소환 ${u?7:5}.` },
  
  'poke': { name: '쑤시기', cost: 0, type: 'Attack', rarity: 'Common', play: (t, u) => attackOsty(t, u?9:6), getDesc: u => `골골이가 피해를 ${u?9:6} 줍니다.` },
  'reave': { name: '강탈', cost: 1, type: 'Attack', rarity: 'Common', play: (t, u) => { attack(t, u?11:9); addCardToPile('soul', 'drawPile', 1); }, getDesc: u => `피해를 ${u?11:9} 줍니다. 뽑을 카드 더미에 영혼을 1장 섞어 넣습니다.` },
  'defile': { name: '모독', cost: 1, type: 'Attack', rarity: 'Common', volatile: true, play: (t, u) => attack(t, u?17:13), getDesc: u => `휘발성. 피해를 ${u?17:13} 줍니다.` },
  'graveblast': { name: '무덤 폭발', cost: 1, type: 'Attack', rarity: 'Common', exhausts: true, play: (t, u) => { attack(t, u?6:4); if (game.player.discardPile.length > 0) { game.player.hand.push(game.player.discardPile.pop()); } }, getDesc: u => `피해를 ${u?6:4} 줍니다. 버린 카드 더미에서 카드를 1장 가져옵니다. 소멸.` },
  'blight_strike': { name: '역병 타격', cost: 1, type: 'Attack', rarity: 'Common', play: (t, u) => { let d = attack(t, u?10:8); applyDoom(t, d); }, getDesc: u => `피해를 ${u?10:8} 줍니다. 가한 피해량만큼 종말을 부여합니다.` },
  'reap': { name: '수확', cost: 3, type: 'Attack', rarity: 'Uncommon', retain: true, play: (t, u) => attack(t, u?33:27), getDesc: u => `보존. 피해를 ${u?33:27} 줍니다.` },
  
  'grave_warden': { name: '무덤지기', cost: 1, type: 'Skill', rarity: 'Common', play: (t, u) => { gainBlock(u?11:8); addCardToPile('soul', 'drawPile', 1); }, getDesc: u => `방어도를 ${u?11:8} 얻습니다. 뽑을 카드 더미에 영혼을 1장 섞어 넣습니다.` },
  'defy': { name: '반항', cost: 1, type: 'Skill', rarity: 'Common', volatile: true, play: (t, u) => { gainBlock(u?9:6); applyDebuff(t, 'weak', 1); }, getDesc: u => `휘발성. 방어도를 ${u?9:6} 얻습니다. 약화를 1 부여합니다.` },
  'negative_pulse': { name: '비관적인 맥박', cost: 1, type: 'Skill', rarity: 'Uncommon', play: (t, u) => { gainBlock(u?6:5); applyDoom(game.enemy, u?11:7); }, getDesc: u => `방어도를 ${u?6:5} 얻습니다. 모든 적에게 종말을 ${u?11:7} 부여합니다.` },
  'scourge': { name: '징벌', cost: 1, type: 'Skill', rarity: 'Uncommon', play: (t, u) => { applyDoom(game.enemy, u?16:13); drawCards(u?2:1); }, getDesc: u => `종말을 ${u?16:13} 부여합니다. 카드를 ${u?2:1}장 뽑습니다.` },
  
  'eradicate': { name: '척결', cost: 'X', type: 'Attack', rarity: 'Rare', retain: true, play: (t, u) => { let x = game.player.energy; game.player.energy = 0; for(let i=0; i<x; i++) attack(t, u?14:11); }, getDesc: u => `보존. 모든 에너지를 소모하여 피해를 ${u?14:11}만큼 X번 줍니다.` },
  'the_scythe': { name: '사신의 낫', cost: 2, type: 'Attack', rarity: 'Rare', exhausts: true, play: function(t, u) { attack(t, this.bonusDmg || 13); this.bonusDmg = (this.bonusDmg || 13) + (u?4:3); }, getDesc: function(u) { return `피해를 ${this.bonusDmg || 13} 줍니다. 피해량이 영구적으로 ${u?4:3} 증가합니다. 소멸.`; } },
  'reaper_form': { name: '사신의 형상', cost: 3, type: 'Power', rarity: 'Rare', play: (t, u) => { game.player.buffs.reaperForm = 1; }, getDesc: u => `공격 카드로 피해를 줄 때마다, 동일한 만큼의 종말을 부여합니다.` },
  'pagestorm': { name: '서류 폭풍', cost: 1, type: 'Power', rarity: 'Uncommon', play: (t, u) => { game.player.buffs.pagestorm = 1; }, getDesc: u => `휘발성 카드를 뽑을 때마다, 카드를 1장 뽑습니다.` },
  'neurosurge': { name: '정신 폭주', cost: 0, type: 'Power', rarity: 'Rare', play: (t, u) => { game.player.energy += (u?4:3); drawCards(2); game.player.buffs.neurosurge = 1; }, getDesc: u => `에너지를 ${u?4:3} 얻고 카드를 2장 뽑습니다. 매 턴 시작 시, 자신에게 종말을 3 부여합니다.` },
  
  // Colorless
  'swift_strike': { name: '신속한 타격', cost: 0, type: 'Attack', rarity: 'UncommonColorless', play: (t, u) => attack(t, u?10:7), getDesc: u => `피해를 ${u?10:7} 줍니다.` },
  'apotheosis': { name: '신성화', cost: 2, type: 'Skill', rarity: 'RareColorless', exhausts: true, play: (t, u) => { game.player.deck.forEach(c => c.isUpgraded = true); game.player.hand.forEach(c => c.isUpgraded = true); }, getDesc: u => `이 전투 동안 덱의 모든 카드를 강화합니다. 소멸.` },

  'soul': { name: '영혼', cost: 0, type: 'Skill', rarity: 'Token', exhausts: true, play: (t, u) => { drawCards(1); log('영혼이 인도를 해 카드를 뽑습니다.'); }, getDesc: u => `카드를 1장 뽑습니다. 소멸.` },
  'dazed': { name: '부상', cost: '—', type: 'Status', rarity: 'Token', play: ()=>{}, getDesc: u => `사용 불가. 턴 종료 시 소멸합니다.`, unplayable: true, ethereal: true },
  'doubt': { name: '의심', cost: '—', type: 'Curse', rarity: 'Token', play: ()=>{}, getDesc: u => `사용 불가. 턴 종료 시 약화 1을 얻습니다.`, unplayable: true }
};

function createCard(id) {
  let base = DB_CARDS[id];
  return {
    id: id, name: base.name, cost: base.cost, type: base.type, isUpgraded: false,
    exhausts: base.exhausts, volatile: base.volatile, retain: base.retain, ethereal: base.ethereal, unplayable: base.unplayable,
    bonusDmg: base.id === 'the_scythe' ? 13 : 0,
    effect: function(target) { base.play.call(this, target, this.isUpgraded); },
    getDesc: function() { return base.getDesc.call(this, this.isUpgraded); }
  };
}
