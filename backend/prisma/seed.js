const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const employeeHash = await bcrypt.hash('employee123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@isg.com' },
    update: {},
    create: {
      email: 'admin@isg.com',
      passwordHash: adminHash,
      fullName: 'Sistem Yöneticisi',
      role: 'admin',
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'calisan@isg.com' },
    update: {},
    create: {
      email: 'calisan@isg.com',
      passwordHash: employeeHash,
      fullName: 'Ahmet Yılmaz',
      role: 'employee',
    },
  });

  await prisma.dangerZone.deleteMany();
  await prisma.dangerZone.createMany({
    data: [
      {
        name: 'Yüksek Gerilim Alanı',
        latitude: 40.1885,
        longitude: 29.061,
        radiusM: 50,
        isActive: true,
      },
      {
        name: 'Kimyasal Depo',
        latitude: 40.19,
        longitude: 29.063,
        radiusM: 30,
        isActive: true,
      },
      {
        name: 'İnşaat Sahası A',
        latitude: 40.187,
        longitude: 29.058,
        radiusM: 80,
        isActive: true,
      },
    ],
  });

  console.log('Seed completed:');
  console.log('  Admin: admin@isg.com / admin123');
  console.log('  Employee: calisan@isg.com / employee123');
  console.log('  Danger zones: 3');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
