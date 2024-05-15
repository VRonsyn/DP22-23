import { PrismaClient } from "@prisma/client";
// eslint-disable-next-line node/no-unpublished-import
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

const globalForPrisma = global as unknown as {
  prisma: DeepMockProxy<PrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma || mockDeep<PrismaClient>();
globalForPrisma.prisma = prisma;

export default prisma as PrismaClient;

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
