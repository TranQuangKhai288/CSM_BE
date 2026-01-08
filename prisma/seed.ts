import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default roles
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'Administrator',
      slug: 'admin',
      description: 'Full system access',
      permissions: JSON.parse(JSON.stringify(['*'])),
      isActive: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { slug: 'manager' },
    update: {},
    create: {
      name: 'Manager',
      slug: 'manager',
      description: 'Manage products, orders, and customers',
      permissions: JSON.parse(
        JSON.stringify(['products.*', 'orders.*', 'customers.*', 'inventory.*', 'categories.*'])
      ),
      isActive: true,
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { slug: 'staff' },
    update: {},
    create: {
      name: 'Staff',
      slug: 'staff',
      description: 'View and process orders',
      permissions: JSON.parse(JSON.stringify(['orders.read', 'orders.update', 'customers.read'])),
      isActive: true,
    },
  });

  console.log('✅ Roles created');
  console.log('- Admin role:', adminRole.id);
  console.log('- Manager role:', managerRole.id);
  console.log('- Staff role:', staffRole.id);

  // Create default admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create sample categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      order: 1,
      isActive: true,
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing and accessories',
      order: 2,
      isActive: true,
    },
  });

  console.log('✅ Categories created');
  console.log('- Electronics:', electronics.id);
  console.log('- Fashion:', fashion.id);

  // Create default settings
  await prisma.setting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: {
      key: 'site_name',
      value: JSON.parse(JSON.stringify({ value: 'My E-commerce Store' })),
      group: 'general',
      isPublic: true,
    },
  });

  await prisma.setting.upsert({
    where: { key: 'currency' },
    update: {},
    create: {
      key: 'currency',
      value: JSON.parse(JSON.stringify({ code: 'USD', symbol: '$' })),
      group: 'general',
      isPublic: true,
    },
  });

  console.log('✅ Settings created');

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
