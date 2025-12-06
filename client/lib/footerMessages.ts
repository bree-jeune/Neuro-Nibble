export type FooterScreen = "home" | "tasks" | "reflect" | "profile";

export const footerMessages: Record<FooterScreen, string[]> = {
  home: [
    "Small steps count.",
    "Momentum over perfection.",
    "You can stop whenever.",
    "Progress isn't linear.",
    "Starting is the hardest part.",
  ],
  tasks: [
    "Small steps count.",
    "Momentum over perfection.",
    "You can stop whenever.",
    "Done is better than perfect.",
    "One bite at a time.",
  ],
  reflect: [
    "Your feelings are valid.",
    "No fixing, just dumping.",
    "Rest is productive.",
    "Gentle weeks are valid.",
    "You don't have to figure it out today.",
  ],
  profile: [
    "You are not a machine.",
    "Adjust to fit your brain.",
    "There is no 'right' way.",
    "Your needs matter.",
    "Be kind to yourself.",
  ],
};

export function getRandomMessage(screen: FooterScreen): string {
  const messages = footerMessages[screen];
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}
