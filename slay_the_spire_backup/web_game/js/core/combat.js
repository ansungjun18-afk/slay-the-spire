/* ==========================================================================
   Core Mechanics (Damage, Osty, Doom, Buffs)
========================================================================== */
function calcDamage(baseDmg, attacker, defender) {
  let dmg = baseDmg + (attacker.buffs.strength || 0);
  if(defender.buffs && defender.buffs.vulnerable > 0) dmg *= 1.5;
  if(attacker.buffs && attacker.buffs.weak > 0) dmg *= 0.75;
  return Math.floor(Math.max(0, dmg));
}

function gainSummon(amount) {
  let s = game.player.summon;
  if (!s.active) {
    s.active = true; s.maxHp = amount; s.hp = amount;
    log(`오스트가 체력 ${amount}으로 소환/부활했습니다!`);
  } else {
    s.maxHp += amount; s.hp += amount;
    log(`오스트의 소환 수치가 ${amount} 증가했습니다.`);
  }
}

function takeDamage(target, amount) {
  if (amount <= 0) return 0;
  let finalDmg = amount; let blocked = 0;
  
  if (target === game.player) {
    blocked = Math.min(finalDmg, target.block || 0);
    target.block -= blocked; finalDmg -= blocked;
    
    let ostyBlocked = 0;
    if (finalDmg > 0 && target.summon.active) {
      ostyBlocked = Math.min(finalDmg, target.summon.hp);
      target.summon.hp -= ostyBlocked; finalDmg -= ostyBlocked;
      if (target.summon.hp <= 0) {
        target.summon.active = false;
        log(`오스트가 방어하다가 파괴되었습니다!`);
      }
    }
    
    target.hp -= finalDmg;
    log(`플레이어 피격! (데미지: ${finalDmg}, 방어도흡수: ${blocked}, 골골이흡수: ${ostyBlocked})`);
    
    if (target.hp <= 0 && target.buffs.lichForm > 0 && target.summon.active) {
      log(`[리치 형태] 발동! 오스트를 희생하여 부활합니다.`);
      target.summon.active = false; target.hp = target.buffs.lichForm; target.buffs.lichForm = 0;
      return finalDmg;
    }
    if (target.hp <= 0) { alert('전투 중 사망했습니다... 게임 오버!'); location.reload(); }
  } else {
    blocked = Math.min(finalDmg, target.block || 0);
    target.block -= blocked; finalDmg -= blocked;
    target.hp -= finalDmg;
    log(`적에게 ${finalDmg} 데미지!`);
  }
  return finalDmg;
}

function attack(defender, baseDmg) {
  let dmg = calcDamage(baseDmg, game.player, defender);
  let dealt = takeDamage(defender, dmg);
  if (game.player.buffs.reaperForm > 0 && defender === game.enemy) applyDoom(defender, dealt);
  return dealt;
}

function attackOsty(defender, baseDmg) {
  if (!game.player.summon.active) {
    log(`오스트가 사망하여 공격할 수 없습니다!`); return 0;
  }
  let dmg = baseDmg; // Ignore Player Strength and Weak
  if (defender.buffs && defender.buffs.vulnerable > 0) dmg *= 1.5;
  dmg = Math.floor(dmg);
  let dealt = takeDamage(defender, dmg);
  if (game.player.buffs.reaperForm > 0 && defender === game.enemy) applyDoom(defender, dealt);
  return dealt;
}

function attackPlayer(baseDmg) {
  let dmg = calcDamage(baseDmg, game.enemy, game.player);
  takeDamage(game.player, dmg);
}

function gainBlock(amount) {
  let b = amount + (game.player.buffs.dexterity || 0);
  game.player.block += Math.max(0, b);
  log(`방어도 ${Math.max(0, b)} 획득!`);
}

function applyDebuff(target, type, amount) {
  if(!target.buffs[type]) target.buffs[type] = 0; target.buffs[type] += amount;
  let tName = type === 'vulnerable' ? '취약' : (type === 'weak' ? '약화' : type);
  log(`${target.name||'대상'}에게 ${tName} ${amount} 부여!`);
}

function applyDoom(target, amount) {
  if (!target.buffs['doom']) target.buffs['doom'] = 0; target.buffs['doom'] += amount;
  log(`${target.name||'대상'}에게 종말 ${amount} 부여!`);
}

function checkDoomDeath(target) {
  if (target.buffs['doom'] && target.buffs['doom'] >= target.hp) {
    log(`[종말] 종말 스택(${target.buffs['doom']})이 체력 이상이 되어 즉사합니다!`);
    target.hp = 0;
    if (target === game.player && target.buffs.lichForm > 0 && target.summon.active) {
       target.summon.active = false; target.hp = target.buffs.lichForm; target.buffs.lichForm = 0; target.buffs['doom'] = 0;
       log(`[리치 형태] 종말로부터 부활합니다!`); return false;
    }
    return true;
  }
  return false;
}
