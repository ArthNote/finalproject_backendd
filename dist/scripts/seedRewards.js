"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
const rewards = [
    {
        title: "bold_tech",
        description: "Unlock bold theme for a modern look",
        type: "THEME",
        unlockLevel: 2,
        icon: "moon",
    },
    {
        title: "amber_minimal",
        description: "Unlock amber theme for a clean look",
        type: "THEME",
        unlockLevel: 3,
        icon: "moon",
    },
    {
        title: "bubblegum",
        description: "Unlock bubblegum theme for a playful look",
        type: "THEME",
        unlockLevel: 4,
        icon: "moon",
    },
    {
        title: "cyberpunk",
        description: "Unlock cyberpunk theme for a futuristic look",
        type: "THEME",
        unlockLevel: 5,
        icon: "moon",
    },
    {
        title: "twitter",
        description: "Unlock Twitter theme for a social media look",
        type: "THEME",
        unlockLevel: 6,
        icon: "moon",
    },
];
function seedRewards() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma_1.db.reward.createMany({
                data: rewards,
                skipDuplicates: true,
            });
            console.log("Rewards seeded successfully");
        }
        catch (error) {
            console.error("Error seeding rewards:", error);
        }
        finally {
            yield prisma_1.db.$disconnect();
        }
    });
}
seedRewards();
