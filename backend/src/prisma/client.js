import pkg from "@prisma/client";
const { PrismaClient } = pkg;


const prisma = new PrismaClient();

const prismaBackupPostgres = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_BACKUP_POSTGRES || process.env.DATABASE_URL
    }
  }
});


const prismaMySQL = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_MYSQL || process.env.DATABASE_URL
    }
  }
});

let currentDatabase = "primary"; 

export default prisma;
export { prismaBackupPostgres, prismaMySQL, currentDatabase };

export function switchDatabase(target) {
  if (["primary", "backup_postgres", "mysql"].includes(target)) {
    currentDatabase = target;
    return { success: true, message: `Переключено на ${target}` };
  }
  return { success: false, message: "Неверная база данных" };
}

export function getCurrentDatabase() {
  return currentDatabase;
}

export function getCurrentPrismaClient() {
  switch (currentDatabase) {
    case "backup_postgres":
      return prismaBackupPostgres;
    case "mysql":
      return prismaMySQL;
    default:
      return prisma;
  }
}
