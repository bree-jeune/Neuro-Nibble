import type { EnergyLevel, Step } from "@/lib/types";

interface BrainDumpParseResult {
  title: string;
  suggestedEnergy: EnergyLevel;
  steps: Step[];
}

const OVERWHELM_WORDS =
  /overwhelmed|tired|stuck|exhausted|anxious|can't|cant|cannot|don't know|dont know|frozen|too much|burned out|burnt out/i;
const URGENT_WORDS =
  /deadline|today|now|late|urgent|bill|appointment|overdue|due|asap|tomorrow/i;
const BUILD_WORDS = /build|create|finish|project|draft|write|make|plan/i;
const ADMIN_WORDS =
  /bill|appointment|paperwork|email|inbox|call|form|bank|invoice|schedule/i;

function makeStep(
  idBase: string,
  index: number,
  text: string,
  minutes: number,
): Step {
  return {
    id: `${idBase}_${index}`,
    text,
    minutes,
    completed: false,
  };
}

function getSuggestedEnergy(text: string): EnergyLevel {
  if (OVERWHELM_WORDS.test(text) || text.length > 180) {
    return "low";
  }

  if (BUILD_WORDS.test(text) && !URGENT_WORDS.test(text)) {
    return "high";
  }

  if (URGENT_WORDS.test(text) || ADMIN_WORDS.test(text)) {
    return "medium";
  }

  return "medium";
}

function getTitle(text: string): string {
  const firstLine = text
    .split(/\n|\.|!|\?/)[0]
    .replace(/\s+/g, " ")
    .trim();

  if (!firstLine) {
    return "Untitled brain dump";
  }

  return firstLine.length > 80
    ? `${firstLine.slice(0, 77).trim()}...`
    : firstLine;
}

export function parseBrainDumpToBites(text: string): BrainDumpParseResult {
  const trimmed = text.trim();
  const suggestedEnergy = getSuggestedEnergy(trimmed);
  const lower = trimmed.toLowerCase();
  const idBase = `brain_dump_${Date.now()}`;
  const firstStep =
    trimmed.length > 180
      ? "Highlight the one thing that matters most"
      : "Open or find the thing";

  let stepTexts = [
    firstStep,
    "Name the next smallest action",
    "Do only that piece",
    "Write what comes next",
  ];

  if (ADMIN_WORDS.test(lower)) {
    stepTexts = [
      firstStep,
      "Find the login, paper, message, or contact",
      "Do the smallest admin action",
      "Write down the next follow-up",
    ];
  } else if (BUILD_WORDS.test(lower)) {
    stepTexts = [
      firstStep,
      "Open the project space",
      "Make one small visible change",
      "Save and name the next move",
    ];
  } else if (URGENT_WORDS.test(lower)) {
    stepTexts = [
      firstStep,
      "Find the deadline or next required action",
      "Do the part that reduces risk first",
      "Write what remains for later",
    ];
  }

  const minutes =
    suggestedEnergy === "low" ? 2 : suggestedEnergy === "medium" ? 5 : 10;

  return {
    title: getTitle(trimmed),
    suggestedEnergy,
    steps: stepTexts.map((step, index) =>
      makeStep(idBase, index, step, index === 0 ? 2 : minutes),
    ),
  };
}
