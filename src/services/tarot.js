const majorArcana = [
  {
    name: "The Fool",
    upright: "new beginnings, spontaneity, curiosity, trust in the process.",
    reversed: "impulsiveness, risky moves, lack of preparation."
  },
  {
    name: "The Magician",
    upright: "focus, willpower, and resources to act with intention.",
    reversed: "scattered energy, self-doubt, or manipulation."
  },
  {
    name: "The High Priestess",
    upright: "intuition, reflection, and quiet inner clarity.",
    reversed: "ignoring intuition, confusion, or hidden facts."
  },
  {
    name: "The Empress",
    upright: "care, creativity, comfort, and nurturing energy.",
    reversed: "overindulgence, stagnation, or unmet emotional needs."
  },
  {
    name: "The Emperor",
    upright: "structure, responsibility, and practical leadership.",
    reversed: "rigidity, control issues, or stubbornness."
  },
  {
    name: "The Hierophant",
    upright: "tradition, learning, guidance, and proven methods.",
    reversed: "rebellion, resistance to advice, or questioning norms."
  },
  {
    name: "The Lovers",
    upright: "alignment, meaningful choice, and honest connection.",
    reversed: "mixed signals, indecision, or value misalignment."
  },
  {
    name: "The Chariot",
    upright: "drive, direction, and momentum through discipline.",
    reversed: "haste, inner conflict, or loss of direction."
  },
  {
    name: "Strength",
    upright: "inner resilience, calm confidence, and patience.",
    reversed: "fatigue, frustration, or low self-control."
  },
  {
    name: "The Hermit",
    upright: "pause, introspection, and wise self-reflection.",
    reversed: "isolation, withdrawal, or avoidance."
  },
  {
    name: "Wheel of Fortune",
    upright: "turning point, timing, and changing circumstances.",
    reversed: "feeling stuck in loops or resisting change."
  },
  {
    name: "Justice",
    upright: "fairness, accountability, and objective judgment.",
    reversed: "bias, denial, or imbalance."
  },
  {
    name: "The Hanged Man",
    upright: "new perspective, surrender, and strategic pause.",
    reversed: "stalling, passivity, or unhelpful sacrifice."
  },
  {
    name: "Death",
    upright: "ending a chapter and making space for renewal.",
    reversed: "fear of change or clinging to the past."
  },
  {
    name: "Temperance",
    upright: "balance, moderation, and steady integration.",
    reversed: "extremes, impatience, or poor pacing."
  },
  {
    name: "The Devil",
    upright: "attachments, temptations, and limiting habits.",
    reversed: "awareness, release, and reclaiming control."
  },
  {
    name: "The Tower",
    upright: "disruption, breakthrough, and necessary reset.",
    reversed: "prolonged tension or avoiding inevitable change."
  },
  {
    name: "The Star",
    upright: "hope, inspiration, healing, and renewed faith.",
    reversed: "discouragement, doubt, or temporary low morale."
  },
  {
    name: "The Moon",
    upright: "emotion, uncertainty, and active imagination.",
    reversed: "anxiety, confusion, or misreading signals."
  },
  {
    name: "The Sun",
    upright: "clarity, joy, vitality, and visible progress.",
    reversed: "burnout risk, inflated expectations, or delays."
  },
  {
    name: "Judgement",
    upright: "awakening, reflection, and conscious reset.",
    reversed: "self-criticism, avoidance, or unresolved past issues."
  },
  {
    name: "The World",
    upright: "completion, integration, and earned fulfillment.",
    reversed: "unfinished business or delayed closure."
  }
];

const suits = [
  {
    name: "Wands",
    themePos: "energy, initiative, and personal drive",
    themeNeg: "rush, burnout, and friction from overactivity"
  },
  {
    name: "Cups",
    themePos: "emotion, relationships, and mood",
    themeNeg: "emotional swings, sensitivity, and idealization"
  },
  {
    name: "Swords",
    themePos: "thoughts, decisions, and communication",
    themeNeg: "overthinking, stress, and sharp conflict"
  },
  {
    name: "Pentacles",
    themePos: "practical work, money, body, and routines",
    themeNeg: "stagnation, scarcity fears, and overcontrol"
  }
];

const rankPatterns = [
  {
    name: "Ace",
    pos: "fresh potential, new impulse, and a clean start",
    neg: "hesitation or a missed opening"
  },
  {
    name: "Two",
    pos: "early planning, choices, and balancing options",
    neg: "indecision and unstable priorities"
  },
  {
    name: "Three",
    pos: "growth, collaboration, and first visible results",
    neg: "distraction or waiting for others to act"
  },
  {
    name: "Four",
    pos: "stability, structure, and consolidation",
    neg: "stagnation or comfort-zone lock"
  },
  {
    name: "Five",
    pos: "learning through friction and adaptation",
    neg: "drama, conflict cycles, or stubborn tension"
  },
  {
    name: "Six",
    pos: "gradual improvement and transition",
    neg: "difficulty letting go of what is over"
  },
  {
    name: "Seven",
    pos: "strategy, experimentation, and self-check",
    neg: "self-doubt, mixed motives, or confusion"
  },
  {
    name: "Eight",
    pos: "momentum, speed, and productive intensity",
    neg: "overload and pace mismatch"
  },
  {
    name: "Nine",
    pos: "persistence, resilience, and final effort",
    neg: "fatigue, anxiety, or near-finish burnout"
  },
  {
    name: "Ten",
    pos: "cycle completion and threshold to next stage",
    neg: "exhaustion and excessive pressure"
  },
  {
    name: "Page",
    pos: "curiosity, learning, and a message worth noting",
    neg: "naivety, inconsistency, or low follow-through"
  },
  {
    name: "Knight",
    pos: "action, courage, and strong forward movement",
    neg: "impulsiveness and rushed decisions"
  },
  {
    name: "Queen",
    pos: "mature care, grounded empathy, and composure",
    neg: "overcontrol, emotional reactivity, or tension"
  },
  {
    name: "King",
    pos: "ownership, strategic leadership, and clarity",
    neg: "rigidity, dominance, or emotional distance"
  }
];

function buildMinorArcana() {
  const cards = [];
  for (const suit of suits) {
    for (const rank of rankPatterns) {
      cards.push({
        name: `${rank.name} of ${suit.name}`,
        upright: `${rank.pos} in the area of ${suit.themePos}.`,
        reversed: `${rank.neg} in the area of ${suit.themeNeg}.`
      });
    }
  }
  return cards;
}

const tarotDeck = [...majorArcana, ...buildMinorArcana()];

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

function getShuffledIndices(seed) {
  const indices = tarotDeck.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const r = seededRandom(seed + i);
    const j = Math.floor(r * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export function getDailyTarotSpread(chatId) {
  const today = new Date().toISOString().split("T")[0];
  const seed = hash(String(chatId) + ":" + today);

  const indices = getShuffledIndices(seed);
  const chosen = indices.slice(0, 3);

  const cards = chosen.map((idx, i) => {
    const card = tarotDeck[idx];
    const orientationRandom = seededRandom(seed + 100 + i);
    const isReversed = orientationRandom > 0.5;
    return {
      position: i + 1,
      name: card.name,
      orientation: isReversed ? "reversed" : "upright",
      meaning: isReversed ? card.reversed : card.upright
    };
  });

  const lines = [];
  lines.push(`🃏 *Daily tarot spread* (${today})`);
  lines.push("");
  lines.push("_This is for reflection and entertainment, not a fixed prediction._");
  lines.push("");

  for (const c of cards) {
    lines.push(`*${c.position}. ${c.name} (${c.orientation})*\n${c.meaning}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function getDailyTarotHint(chatId) {
  const today = new Date().toISOString().split("T")[0];
  const seed = hash(String(chatId) + ":" + today);
  const indices = getShuffledIndices(seed);
  const idx = indices[0];
  const card = tarotDeck[idx];
  const isReversed = seededRandom(seed + 100) > 0.5;
  const orientation = isReversed ? "reversed" : "upright";
  const meaning = isReversed ? card.reversed : card.upright;

  return `🧭 *Tarot hint:* *${card.name}* (${orientation}) - ${meaning}`;
}
