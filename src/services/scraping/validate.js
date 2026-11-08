import { readFile } from 'node:fs/promises';

const read = async (p) => JSON.parse(await readFile(p, 'utf8'));

export async function validate() {
  const monsters = await read('data/monsters.json');
  const quests   = await read('data/quests.json');
  const items    = await read('data/items.json');

  const itemIds  = new Set(items.map((i) => i.item_id));
  const questIds = new Set(quests.map((q) => q.quest_id));
  const monsterIds = new Set(monsters.map((m) => m.monster_id ?? m.npc_id));

  let problems = 0;

  // 1. Drops i spoils dels monstres
  for (const m of monsters) {
    for (const [kind, arr] of [['drop', m.drops], ['spoil', m.spoils]]) {
      for (const d of arr ?? []) {
        if (!itemIds.has(d.item_id)) {
          console.log(`❌ ${m.name}: ${kind} → item ${d.item_id} no existeix`);
          problems++;
        }
      }
    }
    for (const q of m.quests ?? []) {
      if (!questIds.has(q)) {
        console.log(`❌ ${m.name}: quest ${q} no existeix`);
        problems++;
      }
    }
  }

  // 2. Rewards de les quests
  for (const q of quests) {
    for (const r of q.rewards ?? []) {
      if (!itemIds.has(r.item_id)) {
        console.log(`❌ Quest ${q.name}: reward item ${r.item_id} no existeix`);
        problems++;
      }
    }
  }

  // 3. Mobs dels items (relació inversa)
  for (const it of items) {
    for (const mob of it.mobs ?? []) {
      if (!monsterIds.has(mob.npc_id)) {
        console.log(`❌ Item ${it.name}: mob ${mob.npc_id} no existeix`);
        problems++;
      }
    }
  }

  console.log(`\n${problems === 0 ? '✅ Tot consistent' : `🔴 ${problems} problemes`}`);
  return problems;
}
