import type { DopamineItem } from "@/lib/types";

export const DEFAULT_DOPAMINE_REWARDS: DopamineItem[] = [
  { id: "starter-tiny-stretch", text: "Stand up and stretch", cost: "tiny" },
  { id: "starter-tiny-water", text: "Drink water", cost: "tiny" },
  { id: "starter-tiny-window", text: "Look out a window", cost: "tiny" },
  { id: "starter-tiny-breaths", text: "Take five slow breaths", cost: "tiny" },
  {
    id: "starter-tiny-song-snippet",
    text: "Play one favorite song snippet",
    cost: "tiny",
  },
  { id: "starter-micro-song", text: "One song break", cost: "micro" },
  { id: "starter-micro-outside", text: "Step outside", cost: "micro" },
  {
    id: "starter-micro-doodle",
    text: "Doodle badly on purpose",
    cost: "micro",
  },
  {
    id: "starter-micro-scroll-timer",
    text: "Scroll guilt-free with a timer",
    cost: "micro",
  },
  { id: "starter-micro-tea", text: "Make tea or coffee", cost: "micro" },
  { id: "starter-snack-full-song", text: "Full song break", cost: "snack" },
  { id: "starter-snack-cozy-reset", text: "Cozy reset", cost: "snack" },
  { id: "starter-snack-dance", text: "Mini dance break", cost: "snack" },
  {
    id: "starter-snack-saved-video",
    text: "Watch one saved video",
    cost: "snack",
  },
  { id: "starter-snack-silence", text: "Sit in silence", cost: "snack" },
  { id: "starter-meal-walk", text: "Walk around", cost: "meal" },
  {
    id: "starter-meal-music",
    text: "Longer music break",
    cost: "meal",
  },
  { id: "starter-meal-snack", text: "Snack break", cost: "meal" },
  {
    id: "starter-meal-read",
    text: "Read something fun",
    cost: "meal",
  },
  { id: "starter-meal-reset-space", text: "Reset your space", cost: "meal" },
  {
    id: "starter-recovery-lie-down",
    text: "Lie down for a few minutes",
    cost: "recovery",
  },
  {
    id: "starter-recovery-do-nothing",
    text: "Do nothing without earning more",
    cost: "recovery",
  },
  {
    id: "starter-recovery-eyes-closed",
    text: "Eyes closed reset",
    cost: "recovery",
  },
  {
    id: "starter-recovery-brown-noise",
    text: "Brown noise break",
    cost: "recovery",
  },
  {
    id: "starter-recovery-stop",
    text: "Permission to stop",
    cost: "recovery",
  },
];
