export type PrismaClientLike = {
  connect: () => Promise<void>;
};

export const prisma = {
  async connect() {
    return undefined;
  },
} satisfies PrismaClientLike;