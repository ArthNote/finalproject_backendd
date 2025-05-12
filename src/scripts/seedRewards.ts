import { db } from "../lib/prisma";
import { RewardType } from "../../prisma/src/app/generated/prisma/client";

const rewards = [
  {
    title: "bold_tech",
    description: "Unlock bold theme for a modern look",
    type: "THEME" as RewardType,
    unlockLevel: 2,
    icon: "moon",
  },
  {
    title: "amber_minimal",
    description: "Unlock amber theme for a clean look",
    type: "THEME" as RewardType,
    unlockLevel: 3,
    icon: "moon",
  },
  {
    title: "bubblegum",
    description: "Unlock bubblegum theme for a playful look",
    type: "THEME" as RewardType,
    unlockLevel: 4,
    icon: "moon",
  },
  {
    title: "cyberpunk",
    description: "Unlock cyberpunk theme for a futuristic look",

    type: "THEME" as RewardType,
    unlockLevel: 5,
    icon: "moon",
  },
  {
    title: "twitter",
    description: "Unlock Twitter theme for a social media look",
    type: "THEME" as RewardType,
    unlockLevel: 6,
    icon: "moon",
  },
];

async function seedRewards() {
  try {
    await db.reward.createMany({
      data: rewards,
      skipDuplicates: true,
    });
    console.log("Rewards seeded successfully");
  } catch (error) {
    console.error("Error seeding rewards:", error);
  } finally {
    await db.$disconnect();
  }
}

seedRewards();
