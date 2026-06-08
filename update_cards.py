import re

with open('web_game/js/data/cards.js', 'r', encoding='utf-8') as f:
    text = f.read()

parts = text.split('// Colorless')
necro_part = parts[0].split('// Necrobinder')[1]
new_necro_part = []
for line in necro_part.split('\n'):
    if line.strip().startswith("'") and 'class:' not in line:
        line = re.sub(r"rarity: '([^']+)',", r"rarity: '\1', class: 'Necrobinder',", line)
    new_necro_part.append(line)

new_text = parts[0].split('// Necrobinder')[0] + '// Necrobinder' + '\n'.join(new_necro_part) + '// Colorless' + parts[1]

with open('web_game/js/data/cards.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Updated cards.js")
