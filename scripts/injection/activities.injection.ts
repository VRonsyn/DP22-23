import { Overlapability, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(childId: string): Promise<void> {
  const template = await prisma.template.create({
    data: {
      visible: true,
      overlapability: Overlapability.DEFAULT,
      hasTimer: false,
      summary: "This is a summary",
      duration: 3600,
      childId,
      location: "My house",
      geoLat: 51.10291,
      geoLon: 4.21677,
    },
  });

  const task1 = await prisma.task.create({
    data: {
      referenceNumber: 0,
      summary: "Task 0",

      templateId: template.id,
    },
  });
  const task2 = await prisma.task.create({
    data: {
      referenceNumber: 1,
      summary: "Task 1",

      templateId: template.id,
    },
  });

  const activity = await prisma.activity.create({
    data: {
      templateId: template.id,
      childId,
      start: new Date(),
      done: false,
    },
  });
  await prisma.taskProgress.create({
    data: {
      taskId: task1.id,
      activityId: activity.id,
    },
  });
  await prisma.taskProgress.create({
    data: {
      taskId: task2.id,
      activityId: activity.id,
    },
  });
}

main("051fc6d6-57bb-4fae-bb9e-70d4cc9e2b15")
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    // eslint-disable-next-line no-process-exit,@typescript-eslint/no-magic-numbers
    process.exit(1);
  });
