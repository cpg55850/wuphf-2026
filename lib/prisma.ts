import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

const prisma =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : (globalForPrisma.prisma ??= new PrismaClient()) // assigns a new client only if the cached value is null or undefined.

export { prisma, Prisma }
