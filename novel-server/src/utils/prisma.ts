import { Prisma, PrismaClient } from '../../prisma/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// 从 Prisma7 开始，Prisma client 在使用时要传入数据库对应的驱动适配器
const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),

    // TODO: ??? DATABASE_URL 怎么没用？适配器这里也要设置？
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

/**
 * Prisma client 单体
 */
export const prisma = new PrismaClient({ adapter });