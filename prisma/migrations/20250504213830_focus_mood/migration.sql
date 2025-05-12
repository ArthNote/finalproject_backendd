-- CreateTable
CREATE TABLE "mood_entry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "energy" INTEGER NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mood_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mood_entry_id_key" ON "mood_entry"("id");

-- CreateIndex
CREATE UNIQUE INDEX "focus_session_id_key" ON "focus_session"("id");

-- AddForeignKey
ALTER TABLE "mood_entry" ADD CONSTRAINT "mood_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_session" ADD CONSTRAINT "focus_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
