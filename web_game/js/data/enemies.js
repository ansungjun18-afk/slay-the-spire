/* ==========================================================================
   Enemy Database & AI
========================================================================== */
const DB_ENEMIES = {
  'jaw_worm': {
    name: '턱벌레', maxHp: 44, type: 'Normal',
    init: (e) => { e.hp = 44; e.turnCycle = 0; },
    getIntent: (e) => {
      let cycle = e.turnCycle % 3;
      if(cycle === 0) return { type: 'Buff', block: 6, strengthGain: 2, desc: '방어 6, 힘 +2', action: () => { e.block += 6; e.buffs.strength += 2; log('턱벌레가 방어도를 얻고 강해집니다.'); } };
      if(cycle === 1) return { type: 'Attack', damage: 11, desc: '공격', action: () => { attackPlayer(11); } };
      if(cycle === 2) return { type: 'AttackDefend', damage: 7, block: 5, desc: '공격 및 방어 5', action: () => { attackPlayer(7); e.block += 5; log('턱벌레가 방어도를 얻습니다.'); } };
    }
  },
  'gremlin_nob': {
    name: '귀족 괭이', maxHp: 86, type: 'Elite',
    init: (e) => { e.hp = 86; e.turnCycle = 0; e.buffs.enrage = 0; },
    getIntent: (e) => {
      if(e.turnCycle === 0) return { type: 'Debuff', desc: '취약 2, 분노', action: () => { applyDebuff(game.player, 'vulnerable', 2); e.buffs.enrage = 2; log('귀족 괭이가 분노 상태에 돌입했습니다!'); } };
      if(Math.random() < 0.5) return { type: 'Attack', damage: 14, desc: '강한 공격', action: () => { attackPlayer(14); } };
      else return { type: 'Attack', damage: 11, desc: '공격', action: () => { attackPlayer(11); } };
    }
  },
  'book_of_stabbing': {
    name: '책의 노예', maxHp: 160, type: 'Boss',
    init: (e) => { e.hp = 160; e.hits = 2; },
    getIntent: (e) => {
      let hits = e.hits;
      return { type: 'Attack', damage: 6, hits: hits, desc: `연속 찌르기 x${hits}`, action: () => { 
        for(let i=0; i<hits; i++) { if(game.player.hp > 0) attackPlayer(6); } 
        e.hits++; 
      }};
    }
  }
};
