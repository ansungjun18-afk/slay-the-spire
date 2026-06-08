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
  // Ensure the container is positioned relative for the absolute SVG
  container.style.position = 'relative';
  
  let iconMap = { 'Combat': '⚔️', 'Elite': '💀', 'Shop': '💰', 'Rest': '🔥', 'Chest': '🎁', 'Unknown': '❓', 'Boss': '👹' };
  
  // Create an SVG element for lines
  let svgNS = "http://www.w3.org/2000/svg";
  let svg = document.createElementNS(svgNS, "svg");
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.zIndex = '0';
  svg.style.pointerEvents = 'none';
  container.appendChild(svg);

  // Wrapper for HTML content to stay above SVG
  let contentWrapper = document.createElement('div');
  contentWrapper.style.position = 'relative';
  contentWrapper.style.zIndex = '1';
  contentWrapper.style.width = '100%';
  contentWrapper.style.display = 'flex';
  contentWrapper.style.flexDirection = 'column';
  contentWrapper.style.gap = '140px';
  container.appendChild(contentWrapper);
  
  for(let f = game.map.floors.length - 1; f >= 0; f--) {
    let rowDiv = document.createElement('div'); rowDiv.className = 'map-floor';
    let label = document.createElement('div'); label.className = 'floor-label'; label.innerText = `층 ${f+1}`; rowDiv.appendChild(label);
    
    game.map.floors[f].forEach(node => {
      let slotDiv = document.createElement('div');
      slotDiv.className = 'map-slot';
      if (node.empty) {
         rowDiv.appendChild(slotDiv);
         return;
      }
      
      let jitterWrap = document.createElement('div');
      let baseShift = f === 0 ? -18 : 0;
      jitterWrap.style.transform = `translate(${node.offsetX}px, ${node.offsetY + baseShift}px)`;
      jitterWrap.style.display = 'flex';
      jitterWrap.style.justifyContent = 'center';
      
      let nDiv = document.createElement('div'); 
      nDiv.className = 'map-node'; 
      nDiv.innerText = iconMap[node.type];
      nDiv.id = 'map-dom-' + node.id;
      
      let selectable = false;
      if(game.map.floor === f) {
        if(f === 0) selectable = true;
        else {
          let currNodes = game.map.floors[f-1].filter(x => !x.empty && x.id === game.map.currentNodeId);
          if(currNodes.length > 0 && currNodes[0].next.includes(node.id)) selectable = true;
        }
      }
      if(!selectable) nDiv.classList.add('disabled'); else nDiv.onclick = () => { selectMapNode(node, f); };
      if(game.map.currentNodeId === node.id) nDiv.classList.add('current');
      if(game.map.visited && game.map.visited.includes(node.id)) nDiv.classList.add('visited');
      
      jitterWrap.appendChild(nDiv);
      slotDiv.appendChild(jitterWrap);
      rowDiv.appendChild(slotDiv);
    });
    contentWrapper.appendChild(rowDiv);
  }
  
  // Draw lines after layout is computed
  requestAnimationFrame(() => {
    let containerRect = container.getBoundingClientRect();
    svg.style.height = contentWrapper.scrollHeight + 'px';
    
    for(let f = 0; f < game.map.floors.length - 1; f++) {
      let currRow = game.map.floors[f];
      currRow.forEach(node => {
        if(node.empty) return;
        let el1 = document.getElementById('map-dom-' + node.id);
        if(!el1) return;
        let rect1 = el1.getBoundingClientRect();
        // keep original center values constant so multiple edges don't shift the start
        const x1c = rect1.left + rect1.width/2 - containerRect.left + container.scrollLeft;
        const y1c = rect1.top + rect1.height/2 - containerRect.top + container.scrollTop;

        node.next.forEach(nextId => {
          let el2 = document.getElementById('map-dom-' + nextId);
          if(!el2) return;
          let rect2 = el2.getBoundingClientRect();
          let x2 = rect2.left + rect2.width/2 - containerRect.left + container.scrollLeft;
          let y2 = rect2.top + rect2.height/2 - containerRect.top + container.scrollTop;
          
          let line = document.createElementNS(svgNS, "path");
          
          // compute using the constant original center
          let dx = x2 - x1c;
          let dy = y2 - y1c;
          let len = Math.sqrt(dx*dx + dy*dy);
          if (len > 0) {
            // determine if this is the highlighted start path so we can account for stroke width
            const isStartHighlightLocal = (game.map.floor === 0 && game.map.currentNodeId === null && f === 0);
            let r1 = Math.max(rect1.width, rect1.height) / 2;
            let r2 = Math.max(rect2.width, rect2.height) / 2;
            // place the path endpoint so the stroke edge meets the node border:
            // endpoint distance = nodeRadius - (lineStrokeWidth/2)
            let strokeWidthEstimate = isStartHighlightLocal ? 4 : 3;
            // If this is the initial start-highlight, extend the path slightly into the node
            // so the dashed stroke visually touches the node border without adjusting other nodes.
            if (isStartHighlightLocal) {
              const extraOverlap = 6; // how many px deeper the start should go
              var edgeOffset1 = Math.max(0, r1 - strokeWidthEstimate / 2 - extraOverlap);
            } else {
              var edgeOffset1 = Math.max(0, r1 - strokeWidthEstimate / 2);
            }
            let edgeOffset2 = Math.max(0, r2 - strokeWidthEstimate / 2);
            let ux = dx / len;
            let uy = dy / len;
            // use local shifted coords so x1c/y1c remain unchanged for other edges
            var sx1 = x1c + ux * edgeOffset1;
            var sy1 = y1c + uy * edgeOffset1;
            var sx2 = x2 - ux * edgeOffset2;
            var sy2 = y2 - uy * edgeOffset2;
          }
          // if len was zero or loop didn't set sx1/sx2, fall back to centers
          if (typeof sx1 === 'undefined') { sx1 = x1c; sy1 = y1c; sx2 = x2; sy2 = y2; }
          let midX = (sx1 + sx2) / 2;
          let midY = (sy1 + sy2) / 2;
          let bend = Math.max(20, Math.min(80, Math.abs(dy) * 0.25));
          let offset = bend * (dx >= 0 ? 1 : -1);
          let d;
          if (Math.abs(dx) < 25) {
            d = `M ${sx1} ${sy1} L ${sx2} ${sy2}`;
          } else {
            d = `M ${sx1} ${sy1} Q ${midX - offset} ${midY}, ${sx2} ${sy2}`;
          }
          line.setAttribute('d', d);
          line.setAttribute('fill', 'none');
          
           const isCurrent = node.id === game.map.currentNodeId;
           if (isCurrent) {
             line.setAttribute('stroke', '#111');
             line.setAttribute('stroke-width', '4');
             line.setAttribute('stroke-dasharray', '8 4');
             line.setAttribute('stroke-linecap', 'round');
             line.setAttribute('id', `edge-${node.id}-${nextId}`);
           } else {
             // For start-highlight we no longer change visual styling; only endpoint was adjusted above.
             line.setAttribute('stroke', '#544131');
             line.setAttribute('stroke-width', '3');
             line.setAttribute('stroke-dasharray', '6 8');
             line.setAttribute('stroke-linecap', 'round');
             line.setAttribute('id', `edge-${node.id}-${nextId}`);
           }
          
          svg.appendChild(line);
        });
      });
    }
    // Stamp gold circles along the actual visited path segments
    if (game.map.visited && game.map.visited.length > 1) {
      for (let vi = 0; vi < game.map.visited.length - 1; vi++) {
        const fromId = game.map.visited[vi];
        const toId = game.map.visited[vi+1];
        // find the path element for this edge (direction may vary)
        let pathEl = document.getElementById(`edge-${fromId}-${toId}`) || document.getElementById(`edge-${toId}-${fromId}`);
        if (!pathEl) continue;
        try {
          const total = pathEl.getTotalLength();
          const gap = 18; // spacing between dots in px
          for (let d = gap; d < total - gap; d += gap) {
            const pt = pathEl.getPointAtLength(d);
            const dot = document.createElementNS(svgNS, 'circle');
            dot.setAttribute('cx', pt.x);
            dot.setAttribute('cy', pt.y);
            dot.setAttribute('r', '4');
            dot.setAttribute('fill', '#ffd700');
            dot.setAttribute('opacity', '1');
            svg.appendChild(dot);
          }
        } catch (e) {
          // some browsers may throw if path length not available; ignore
        }
      }
    }
    // Draw brush-like rings around visited nodes (multiple dashed circles for painterly effect)
    try {
      for (let f = 0; f < game.map.floors.length; f++) {
        for (let c = 0; c < game.map.floors[f].length; c++) {
          const node = game.map.floors[f][c];
          if (!node || node.empty) continue;
          if (!(game.map.visited && game.map.visited.includes(node.id))) continue;
          const el = document.getElementById('map-dom-' + node.id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width/2 - containerRect.left + container.scrollLeft;
          const cy = rect.top + rect.height/2 - containerRect.top + container.scrollTop;
          const baseR = Math.max(rect.width, rect.height)/2 + 18;

          // three layered circles to simulate brush strokes
          const layers = [
            {w: 12, dash: '80 30', color: '#111', op: 1},
            {w: 8, dash: '30 20', color: '#0f0f0f', op: 0.95},
            {w: 5, dash: '8 18', color: '#1a1411', op: 0.85}
          ];
          layers.forEach((l, idx) => {
            const circ = document.createElementNS(svgNS, 'circle');
            circ.setAttribute('cx', cx);
            circ.setAttribute('cy', cy);
            circ.setAttribute('r', baseR + idx*2);
            circ.setAttribute('fill', 'none');
            circ.setAttribute('stroke', l.color);
            circ.setAttribute('stroke-width', l.w);
            circ.setAttribute('stroke-linecap', 'round');
            circ.setAttribute('stroke-linejoin', 'round');
            circ.setAttribute('stroke-dasharray', l.dash);
            circ.setAttribute('opacity', l.op);
            circ.setAttribute('transform', `rotate(0 ${cx} ${cy})`);
            circ.setAttribute('stroke-dashoffset', idx * 20);
            svg.appendChild(circ);
          });
        }
      }
    } catch (e) { /* ignore drawing errors */ }
  });

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
      const cardContent = `<div class="card-cost">${c.cost}</div><div class="card-name">${c.name}</div><div class="card-desc">${c.getDesc()}</div>`;
      cardsHtml += `<div class="card ${pur}" onclick="buyShopItem(${idx})" style="transform:none; cursor:pointer;">
        ${item.isSale ? '<div class="sale-badge">SALE</div>' : ''}
        ${cardContent}
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
      // compute numeric intent (damage and hits) and show sword icon + value like "6" or "6x2"
      const dmg = typeof e.currentIntent.damage === 'number' ? e.currentIntent.damage : null;
      const hits = e.currentIntent.hits || 1;
      let intentEl = document.getElementById('e-intent');
      if(intentEl) {
        let parts = [];
        if(dmg !== null) {
          const text = dmg + (hits > 1 ? `x${hits}` : '');
          parts.push(`<div class="intent-damage"><span class="sword">⚔️</span><span class="val">${text}</span></div>`);
        }
        if(typeof e.currentIntent.block === 'number' && e.currentIntent.block > 0) {
          parts.push(`<div class="intent-block"><span class="shield">🛡️</span><span class="val">${e.currentIntent.block}</span></div>`);
        }
        // Only show icons + numbers, no textual '공격' word
        intentEl.innerHTML = parts.join('');
      }
    }
  }
  
  let handHtml = '';
  p.hand.forEach((c, idx) => {
    let unplayable = DB_CARDS[c.id].unplayable || p.energy < (c.cost === '—' ? 99 : c.cost) ? 'unplayable' : '';
    const cardContent = `<div class="card-cost">${c.cost}</div><div class="card-name">${c.name}${c.isUpgraded?'+':''}</div><div class="card-desc">${c.getDesc()}</div>`;
    handHtml += `<div class="card ${unplayable}" onclick="${unplayable ? '' : `playCard(${idx})`}">
        ${cardContent}
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
