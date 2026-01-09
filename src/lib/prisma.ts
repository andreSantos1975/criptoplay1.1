import { PrismaClient } from '@prisma/client'


const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = prismaClientSingleton()
    }
    const value = (globalForPrisma.prisma as any)[prop];
    
    if (typeof value === 'function') {
      return value.bind(globalForPrisma.prisma);
    }
    return value;
  }
});

export default prisma

if (process.env.NODE_ENV !== 'production') {
  // In development, we don't need to assign the proxy back to globalForPrisma,
  // because the proxy itself checks globalForPrisma.prisma (the real instance).
  // This avoids type issues and circular references.
}
