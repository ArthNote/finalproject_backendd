import cron from "node-cron";
import { db } from "./prisma";
import { GameProgress } from "./gameprogress";
import { checkAndGenerateGoals } from "./goalGenerator";

const gameProgress = new GameProgress();

cron.schedule("0 0 * * *", async () => {
  try {
    const users = await db.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await gameProgress.updateStreak(user.id);
      await checkAndGenerateGoals(user.id);
    }

    console.log("Daily cron job completed successfully");
  } catch (error) {
    console.error("Error in daily cron job:", error);
  }
});

cron.schedule("0 0 * * 0", async () => {
  try {
    const users = await db.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await checkAndGenerateGoals(user.id);
    }

    console.log("Weekly cron job completed successfully");
  } catch (error) {
    console.error("Error in weekly cron job:", error);
  }
});

cron.schedule("0 0 1 * *", async () => {
  try {
    const users = await db.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      await checkAndGenerateGoals(user.id);
    }

    console.log("Monthly cron job completed successfully");
  } catch (error) {
    console.error("Error in monthly cron job:", error);
  }
});
