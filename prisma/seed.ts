import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl || databaseUrl,
    },
  },
});

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
  const digitalProducts = await prisma.category.upsert({
    where: { slug: 'digital-products' },
    update: {},
    create: {
      name: 'Digital Products',
      slug: 'digital-products',
      description: 'Source code, websites, templates and digital assets',
      order: 1,
      isActive: true,
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      order: 2,
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
      order: 3,
      isActive: true,
    },
  });

  const booksEducation = await prisma.category.upsert({
    where: { slug: 'books-education' },
    update: {},
    create: {
      name: 'Books & Education',
      slug: 'books-education',
      description: 'Books, courses and educational materials',
      order: 4,
      isActive: true,
    },
  });

  console.log('✅ Categories created');
  console.log('- Digital Products:', digitalProducts.id);
  console.log('- Electronics:', electronics.id);
  console.log('- Fashion:', fashion.id);
  console.log('- Books & Education:', booksEducation.id);

  // ==================== DIGITAL PRODUCTS SHOP ====================
  console.log('🏪 Creating Digital Products...');

  const digitalProductsData = [
    {
      name: 'E-commerce Website Template',
      sku: 'DG-EC-001',
      price: 99.99,
      description: 'Full-featured e-commerce template built with React and Node.js',
      shortDesc: 'Modern e-commerce template',
      attributes: { tech: 'React, Node.js', license: 'MIT' },
    },
    {
      name: 'Admin Dashboard Template',
      sku: 'DG-AD-002',
      price: 79.99,
      description: 'Beautiful admin dashboard with charts and analytics',
      shortDesc: 'Professional admin dashboard',
      attributes: { tech: 'Vue.js, TypeScript', license: 'Commercial' },
    },
    {
      name: 'Landing Page Template Pack',
      sku: 'DG-LP-003',
      price: 49.99,
      description: '10 responsive landing page templates',
      shortDesc: 'Landing page collection',
      attributes: { tech: 'HTML5, CSS3, JavaScript', license: 'MIT' },
    },
    {
      name: 'Mobile App Source Code - Social Media',
      sku: 'DG-MA-004',
      price: 199.99,
      description: 'Complete social media app with real-time chat',
      shortDesc: 'Social media mobile app',
      attributes: { tech: 'React Native, Firebase', license: 'Commercial' },
    },
    {
      name: 'CRM System Full Source',
      sku: 'DG-CR-005',
      price: 299.99,
      description: 'Customer relationship management system',
      shortDesc: 'Enterprise CRM solution',
      attributes: { tech: 'Angular, .NET Core', license: 'Extended' },
    },
    {
      name: 'Blog Platform Source Code',
      sku: 'DG-BP-006',
      price: 89.99,
      description: 'Modern blogging platform with SEO optimization',
      shortDesc: 'SEO-optimized blog platform',
      attributes: { tech: 'Next.js, MongoDB', license: 'MIT' },
    },
    {
      name: 'Restaurant Website Template',
      sku: 'DG-RW-007',
      price: 59.99,
      description: 'Restaurant website with online ordering',
      shortDesc: 'Restaurant & ordering site',
      attributes: { tech: 'WordPress, WooCommerce', license: 'GPL' },
    },
    {
      name: 'Portfolio Template for Designers',
      sku: 'DG-PT-008',
      price: 39.99,
      description: 'Creative portfolio template',
      shortDesc: 'Designer portfolio template',
      attributes: { tech: 'HTML5, CSS3, GSAP', license: 'MIT' },
    },
    {
      name: 'Real Estate Listing Platform',
      sku: 'DG-RE-009',
      price: 249.99,
      description: 'Complete real estate listing website',
      shortDesc: 'Real estate platform',
      attributes: { tech: 'Laravel, Vue.js', license: 'Commercial' },
    },
    {
      name: 'Invoice & Billing System',
      sku: 'DG-IB-010',
      price: 149.99,
      description: 'Professional invoicing and billing software',
      shortDesc: 'Invoicing system',
      attributes: { tech: 'React, Express', license: 'Commercial' },
    },
    {
      name: 'Education LMS Platform',
      sku: 'DG-LM-011',
      price: 399.99,
      description: 'Learning management system with video courses',
      shortDesc: 'LMS platform',
      attributes: { tech: 'Django, PostgreSQL', license: 'Extended' },
    },
    {
      name: 'Job Board Website',
      sku: 'DG-JB-012',
      price: 179.99,
      description: 'Job listing and application platform',
      shortDesc: 'Job board platform',
      attributes: { tech: 'Ruby on Rails', license: 'Commercial' },
    },
    {
      name: 'Booking System Source Code',
      sku: 'DG-BS-013',
      price: 159.99,
      description: 'Appointment and booking management system',
      shortDesc: 'Booking management',
      attributes: { tech: 'PHP, MySQL', license: 'Commercial' },
    },
    {
      name: 'Chat Application Source',
      sku: 'DG-CA-014',
      price: 129.99,
      description: 'Real-time messaging application',
      shortDesc: 'Real-time chat app',
      attributes: { tech: 'Socket.io, Node.js', license: 'MIT' },
    },
    {
      name: 'Inventory Management System',
      sku: 'DG-IM-015',
      price: 189.99,
      description: 'Stock and inventory tracking system',
      shortDesc: 'Inventory tracker',
      attributes: { tech: 'ASP.NET, SQL Server', license: 'Commercial' },
    },
    {
      name: 'Event Management Platform',
      sku: 'DG-EM-016',
      price: 169.99,
      description: 'Event ticketing and management system',
      shortDesc: 'Event platform',
      attributes: { tech: 'Vue.js, Firebase', license: 'Commercial' },
    },
    {
      name: 'Food Delivery App Source',
      sku: 'DG-FD-017',
      price: 279.99,
      description: 'Complete food delivery mobile app',
      shortDesc: 'Food delivery solution',
      attributes: { tech: 'Flutter, Node.js', license: 'Extended' },
    },
    {
      name: 'Fitness Tracking App',
      sku: 'DG-FT-018',
      price: 149.99,
      description: 'Mobile fitness and workout tracker',
      shortDesc: 'Fitness tracker app',
      attributes: { tech: 'React Native', license: 'Commercial' },
    },
    {
      name: 'Music Streaming Platform',
      sku: 'DG-MS-019',
      price: 349.99,
      description: 'Audio streaming platform with playlists',
      shortDesc: 'Music streaming app',
      attributes: { tech: 'React, AWS', license: 'Extended' },
    },
    {
      name: 'Task Management System',
      sku: 'DG-TM-020',
      price: 99.99,
      description: 'Project and task management tool',
      shortDesc: 'Task manager',
      attributes: { tech: 'Svelte, Supabase', license: 'MIT' },
    },
    {
      name: 'Weather App Source Code',
      sku: 'DG-WA-021',
      price: 29.99,
      description: 'Weather forecast mobile application',
      shortDesc: 'Weather app',
      attributes: { tech: 'Swift, iOS', license: 'MIT' },
    },
    {
      name: 'Expense Tracker App',
      sku: 'DG-ET-022',
      price: 69.99,
      description: 'Personal finance and expense tracking',
      shortDesc: 'Expense tracker',
      attributes: { tech: 'Kotlin, Android', license: 'MIT' },
    },
    {
      name: 'Recipe Website Template',
      sku: 'DG-RC-023',
      price: 49.99,
      description: 'Food recipe sharing platform',
      shortDesc: 'Recipe platform',
      attributes: { tech: 'Gatsby, GraphQL', license: 'MIT' },
    },
    {
      name: 'URL Shortener Service',
      sku: 'DG-US-024',
      price: 39.99,
      description: 'Custom URL shortening service',
      shortDesc: 'URL shortener',
      attributes: { tech: 'Go, Redis', license: 'MIT' },
    },
    {
      name: 'QR Code Generator Platform',
      sku: 'DG-QR-025',
      price: 79.99,
      description: 'Dynamic QR code generation and tracking',
      shortDesc: 'QR code platform',
      attributes: { tech: 'Python, FastAPI', license: 'Commercial' },
    },
  ];

  for (const prod of digitalProductsData) {
    await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.sku.toLowerCase(),
        sku: prod.sku,
        description: prod.description,
        shortDesc: prod.shortDesc,
        categoryId: digitalProducts.id,
        basePrice: prod.price,
        stock: 9999, // Digital products have unlimited stock
        status: 'PUBLISHED',
        isActive: true,
        isFeatured: Math.random() > 0.7,
        attributes: prod.attributes,
      },
    });
  }

  console.log('✅ Digital Products created (25 products)');

  // ==================== ELECTRONICS SHOP ====================
  console.log('🏪 Creating Electronics Products...');

  const electronicsData = [
    {
      name: 'iPhone 15 Pro Max',
      sku: 'EL-IP-001',
      price: 1199.99,
      description: 'Latest iPhone with A17 Pro chip',
      shortDesc: 'Premium smartphone',
      attributes: { brand: 'Apple', storage: '256GB', color: 'Titanium' },
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      sku: 'EL-SG-002',
      price: 1099.99,
      description: 'Flagship Samsung phone with S Pen',
      shortDesc: 'Android flagship',
      attributes: { brand: 'Samsung', storage: '512GB', color: 'Phantom Black' },
    },
    {
      name: 'MacBook Pro 16"',
      sku: 'EL-MB-003',
      price: 2499.99,
      description: 'M3 Max chip with 36GB RAM',
      shortDesc: 'Professional laptop',
      attributes: { brand: 'Apple', ram: '36GB', processor: 'M3 Max' },
    },
    {
      name: 'Dell XPS 15',
      sku: 'EL-DX-004',
      price: 1899.99,
      description: 'Intel i9 with NVIDIA RTX 4060',
      shortDesc: 'High-performance laptop',
      attributes: { brand: 'Dell', ram: '32GB', processor: 'Intel i9' },
    },
    {
      name: 'iPad Pro 12.9"',
      sku: 'EL-IP-005',
      price: 1099.99,
      description: 'M2 chip tablet with Magic Keyboard',
      shortDesc: 'Premium tablet',
      attributes: { brand: 'Apple', storage: '256GB', screen: '12.9 inch' },
    },
    {
      name: 'Sony WH-1000XM5',
      sku: 'EL-SW-006',
      price: 399.99,
      description: 'Noise cancelling headphones',
      shortDesc: 'Premium headphones',
      attributes: { brand: 'Sony', type: 'Over-ear', connectivity: 'Bluetooth' },
    },
    {
      name: 'AirPods Pro 2',
      sku: 'EL-AP-007',
      price: 249.99,
      description: 'Active noise cancellation earbuds',
      shortDesc: 'True wireless earbuds',
      attributes: { brand: 'Apple', type: 'In-ear', feature: 'ANC' },
    },
    {
      name: 'Apple Watch Ultra 2',
      sku: 'EL-AW-008',
      price: 799.99,
      description: 'Rugged smartwatch for athletes',
      shortDesc: 'Sports smartwatch',
      attributes: { brand: 'Apple', display: 'Titanium', water_resistance: '100m' },
    },
    {
      name: 'Samsung 55" OLED TV',
      sku: 'EL-ST-009',
      price: 1499.99,
      description: '4K OLED Smart TV with AI upscaling',
      shortDesc: '4K OLED Television',
      attributes: { brand: 'Samsung', size: '55 inch', resolution: '4K' },
    },
    {
      name: 'LG 65" QNED TV',
      sku: 'EL-LT-010',
      price: 1799.99,
      description: 'Quantum dot LED 4K TV',
      shortDesc: '4K QNED TV',
      attributes: { brand: 'LG', size: '65 inch', resolution: '4K' },
    },
    {
      name: 'PlayStation 5',
      sku: 'EL-PS-011',
      price: 499.99,
      description: 'Latest gaming console from Sony',
      shortDesc: 'Gaming console',
      attributes: { brand: 'Sony', storage: '1TB', type: 'Console' },
    },
    {
      name: 'Xbox Series X',
      sku: 'EL-XB-012',
      price: 499.99,
      description: 'Microsoft gaming console 4K 120fps',
      shortDesc: 'Gaming console',
      attributes: { brand: 'Microsoft', storage: '1TB', type: 'Console' },
    },
    {
      name: 'Nintendo Switch OLED',
      sku: 'EL-NS-013',
      price: 349.99,
      description: 'Portable gaming console with OLED',
      shortDesc: 'Portable console',
      attributes: { brand: 'Nintendo', screen: 'OLED', type: 'Portable' },
    },
    {
      name: 'Canon EOS R6 Mark II',
      sku: 'EL-CR-014',
      price: 2499.99,
      description: 'Full-frame mirrorless camera',
      shortDesc: 'Professional camera',
      attributes: { brand: 'Canon', megapixels: '24MP', type: 'Mirrorless' },
    },
    {
      name: 'DJI Mini 4 Pro',
      sku: 'EL-DJ-015',
      price: 759.99,
      description: 'Compact drone with 4K camera',
      shortDesc: 'Camera drone',
      attributes: { brand: 'DJI', camera: '4K', weight: '249g' },
    },
    {
      name: 'GoPro Hero 12 Black',
      sku: 'EL-GP-016',
      price: 399.99,
      description: 'Action camera with 5.3K video',
      shortDesc: 'Action camera',
      attributes: { brand: 'GoPro', video: '5.3K', waterproof: 'Yes' },
    },
    {
      name: 'Logitech MX Master 3S',
      sku: 'EL-LM-017',
      price: 99.99,
      description: 'Wireless ergonomic mouse',
      shortDesc: 'Premium mouse',
      attributes: { brand: 'Logitech', type: 'Wireless', dpi: '8000' },
    },
    {
      name: 'Keychron K2 Keyboard',
      sku: 'EL-KK-018',
      price: 89.99,
      description: 'Mechanical wireless keyboard',
      shortDesc: 'Mechanical keyboard',
      attributes: { brand: 'Keychron', switches: 'Gateron', connectivity: 'Bluetooth' },
    },
    {
      name: 'Anker PowerBank 20000mAh',
      sku: 'EL-AP-019',
      price: 49.99,
      description: 'High-capacity portable charger',
      shortDesc: 'Power bank',
      attributes: { brand: 'Anker', capacity: '20000mAh', ports: '2x USB-C' },
    },
    {
      name: 'Samsung T7 SSD 1TB',
      sku: 'EL-SS-020',
      price: 129.99,
      description: 'Portable solid state drive',
      shortDesc: 'External SSD',
      attributes: { brand: 'Samsung', capacity: '1TB', speed: '1050MB/s' },
    },
    {
      name: 'Ring Video Doorbell',
      sku: 'EL-RV-021',
      price: 99.99,
      description: 'Smart doorbell with HD video',
      shortDesc: 'Smart doorbell',
      attributes: { brand: 'Ring', video: '1080p', feature: 'Motion detection' },
    },
    {
      name: 'Nest Thermostat',
      sku: 'EL-NT-022',
      price: 129.99,
      description: 'Smart learning thermostat',
      shortDesc: 'Smart thermostat',
      attributes: { brand: 'Google', type: 'Smart', connectivity: 'WiFi' },
    },
    {
      name: 'Amazon Echo Dot 5th Gen',
      sku: 'EL-AE-023',
      price: 49.99,
      description: 'Smart speaker with Alexa',
      shortDesc: 'Smart speaker',
      attributes: { brand: 'Amazon', assistant: 'Alexa', connectivity: 'WiFi' },
    },
    {
      name: 'Philips Hue Starter Kit',
      sku: 'EL-PH-024',
      price: 199.99,
      description: 'Smart lighting system',
      shortDesc: 'Smart lights',
      attributes: { brand: 'Philips', bulbs: '4x E27', colors: '16 million' },
    },
    {
      name: 'Roomba j7+ Robot Vacuum',
      sku: 'EL-RJ-025',
      price: 799.99,
      description: 'Self-emptying robot vacuum',
      shortDesc: 'Robot vacuum',
      attributes: { brand: 'iRobot', feature: 'Auto-empty', mapping: 'Smart' },
    },
  ];

  for (const prod of electronicsData) {
    await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.sku.toLowerCase(),
        sku: prod.sku,
        description: prod.description,
        shortDesc: prod.shortDesc,
        categoryId: electronics.id,
        basePrice: prod.price,
        stock: Math.floor(Math.random() * 50) + 10,
        status: 'PUBLISHED',
        isActive: true,
        isFeatured: Math.random() > 0.7,
        attributes: prod.attributes,
      },
    });
  }

  console.log('✅ Electronics Products created (25 products)');

  // ==================== FASHION SHOP ====================
  console.log('🏪 Creating Fashion Products...');

  const fashionData = [
    {
      name: 'Classic White T-Shirt',
      sku: 'FS-TS-001',
      price: 29.99,
      description: '100% organic cotton t-shirt',
      shortDesc: 'Basic cotton tee',
      attributes: { material: 'Cotton', fit: 'Regular', gender: 'Unisex' },
    },
    {
      name: 'Slim Fit Jeans',
      sku: 'FS-JN-002',
      price: 79.99,
      description: 'Stretch denim jeans',
      shortDesc: 'Comfortable jeans',
      attributes: { material: 'Denim', fit: 'Slim', color: 'Dark Blue' },
    },
    {
      name: 'Leather Jacket',
      sku: 'FS-LJ-003',
      price: 299.99,
      description: 'Genuine leather biker jacket',
      shortDesc: 'Premium leather jacket',
      attributes: { material: 'Leather', style: 'Biker', lining: 'Polyester' },
    },
    {
      name: 'Wool Blend Coat',
      sku: 'FS-WC-004',
      price: 249.99,
      description: 'Elegant winter coat',
      shortDesc: 'Winter coat',
      attributes: { material: 'Wool Blend', season: 'Winter', closure: 'Button' },
    },
    {
      name: 'Running Sneakers',
      sku: 'FS-RS-005',
      price: 129.99,
      description: 'Lightweight running shoes',
      shortDesc: 'Sport sneakers',
      attributes: { brand: 'Nike', type: 'Running', sole: 'Rubber' },
    },
    {
      name: 'Canvas Sneakers',
      sku: 'FS-CS-006',
      price: 69.99,
      description: 'Classic canvas shoes',
      shortDesc: 'Casual sneakers',
      attributes: { material: 'Canvas', style: 'Classic', color: 'White' },
    },
    {
      name: 'Summer Dress',
      sku: 'FS-SD-007',
      price: 89.99,
      description: 'Floral print summer dress',
      shortDesc: 'Floral dress',
      attributes: { material: 'Cotton', length: 'Midi', pattern: 'Floral' },
    },
    {
      name: 'Business Suit',
      sku: 'FS-BS-008',
      price: 399.99,
      description: 'Two-piece formal suit',
      shortDesc: 'Formal suit',
      attributes: { material: 'Wool', pieces: '2', fit: 'Tailored' },
    },
    {
      name: 'Polo Shirt',
      sku: 'FS-PS-009',
      price: 49.99,
      description: 'Classic polo shirt',
      shortDesc: 'Casual polo',
      attributes: { material: 'Pique Cotton', collar: 'Polo', fit: 'Regular' },
    },
    {
      name: 'Hoodie Sweatshirt',
      sku: 'FS-HS-010',
      price: 59.99,
      description: 'Comfortable pullover hoodie',
      shortDesc: 'Casual hoodie',
      attributes: { material: 'Cotton Blend', style: 'Pullover', pocket: 'Kangaroo' },
    },
    {
      name: 'Yoga Pants',
      sku: 'FS-YP-011',
      price: 69.99,
      description: 'High-waist yoga leggings',
      shortDesc: 'Fitness leggings',
      attributes: { material: 'Spandex', fit: 'Compression', waist: 'High' },
    },
    {
      name: 'Sports Bra',
      sku: 'FS-SB-012',
      price: 39.99,
      description: 'High-support sports bra',
      shortDesc: 'Athletic bra',
      attributes: { support: 'High', material: 'Nylon', closure: 'Hook' },
    },
    {
      name: 'Winter Beanie',
      sku: 'FS-WB-013',
      price: 24.99,
      description: 'Knit winter hat',
      shortDesc: 'Warm beanie',
      attributes: { material: 'Acrylic', style: 'Cuff', season: 'Winter' },
    },
    {
      name: 'Baseball Cap',
      sku: 'FS-BC-014',
      price: 29.99,
      description: 'Adjustable baseball cap',
      shortDesc: 'Casual cap',
      attributes: { material: 'Cotton', closure: 'Adjustable', brim: 'Curved' },
    },
    {
      name: 'Leather Belt',
      sku: 'FS-LB-015',
      price: 49.99,
      description: 'Genuine leather belt',
      shortDesc: 'Dress belt',
      attributes: { material: 'Leather', width: '35mm', buckle: 'Metal' },
    },
    {
      name: 'Silk Tie',
      sku: 'FS-ST-016',
      price: 39.99,
      description: 'Classic silk necktie',
      shortDesc: 'Formal tie',
      attributes: { material: 'Silk', width: 'Standard', pattern: 'Striped' },
    },
    {
      name: 'Leather Wallet',
      sku: 'FS-LW-017',
      price: 79.99,
      description: 'Bifold leather wallet',
      shortDesc: "Men's wallet",
      attributes: { material: 'Leather', style: 'Bifold', slots: '8 cards' },
    },
    {
      name: 'Designer Handbag',
      sku: 'FS-DH-018',
      price: 599.99,
      description: 'Luxury leather handbag',
      shortDesc: 'Premium handbag',
      attributes: { material: 'Leather', style: 'Tote', closure: 'Magnetic' },
    },
    {
      name: 'Backpack',
      sku: 'FS-BP-019',
      price: 89.99,
      description: 'Waterproof laptop backpack',
      shortDesc: 'Travel backpack',
      attributes: { capacity: '30L', laptop: '15 inch', material: 'Nylon' },
    },
    {
      name: 'Sunglasses',
      sku: 'FS-SG-020',
      price: 149.99,
      description: 'Polarized UV protection',
      shortDesc: 'Designer sunglasses',
      attributes: { lens: 'Polarized', frame: 'Acetate', UV: '100%' },
    },
    {
      name: 'Wristwatch',
      sku: 'FS-WW-021',
      price: 299.99,
      description: 'Automatic mechanical watch',
      shortDesc: 'Luxury watch',
      attributes: { movement: 'Automatic', material: 'Stainless Steel', waterproof: '50m' },
    },
    {
      name: 'Scarf',
      sku: 'FS-SC-022',
      price: 44.99,
      description: 'Cashmere blend scarf',
      shortDesc: 'Winter scarf',
      attributes: { material: 'Cashmere Blend', length: '180cm', season: 'Winter' },
    },
    {
      name: 'Gloves',
      sku: 'FS-GL-023',
      price: 34.99,
      description: 'Touchscreen leather gloves',
      shortDesc: 'Winter gloves',
      attributes: { material: 'Leather', lining: 'Fleece', feature: 'Touchscreen' },
    },
    {
      name: 'Socks Pack',
      sku: 'FS-SK-024',
      price: 19.99,
      description: '6-pack cotton socks',
      shortDesc: 'Athletic socks',
      attributes: { material: 'Cotton', quantity: '6 pairs', style: 'Crew' },
    },
    {
      name: 'Underwear Set',
      sku: 'FS-UW-025',
      price: 39.99,
      description: '3-pack boxer briefs',
      shortDesc: 'Comfort underwear',
      attributes: { material: 'Cotton', quantity: '3 pieces', fit: 'Regular' },
    },
  ];

  for (const prod of fashionData) {
    await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.sku.toLowerCase(),
        sku: prod.sku,
        description: prod.description,
        shortDesc: prod.shortDesc,
        categoryId: fashion.id,
        basePrice: prod.price,
        stock: Math.floor(Math.random() * 100) + 20,
        status: 'PUBLISHED',
        isActive: true,
        isFeatured: Math.random() > 0.7,
        attributes: prod.attributes,
      },
    });
  }

  console.log('✅ Fashion Products created (25 products)');

  // ==================== BOOKS & EDUCATION SHOP ====================
  console.log('🏪 Creating Books & Education Products...');

  const booksEducationData = [
    {
      name: 'JavaScript: The Complete Guide',
      sku: 'BE-JS-001',
      price: 49.99,
      description: 'Comprehensive JavaScript programming book',
      shortDesc: 'JavaScript guide',
      attributes: { author: 'David Flanagan', pages: '1096', format: 'Hardcover' },
    },
    {
      name: 'Python for Data Science',
      sku: 'BE-PY-002',
      price: 59.99,
      description: 'Learn Python for data analysis',
      shortDesc: 'Python data science',
      attributes: { author: 'Jake VanderPlas', pages: '548', format: 'Paperback' },
    },
    {
      name: 'Clean Code',
      sku: 'BE-CC-003',
      price: 44.99,
      description: 'A handbook of agile software craftsmanship',
      shortDesc: 'Code quality guide',
      attributes: { author: 'Robert Martin', pages: '464', format: 'Paperback' },
    },
    {
      name: 'Design Patterns',
      sku: 'BE-DP-004',
      price: 54.99,
      description: 'Elements of reusable object-oriented software',
      shortDesc: 'Software patterns',
      attributes: { author: 'Gang of Four', pages: '395', format: 'Hardcover' },
    },
    {
      name: 'The Pragmatic Programmer',
      sku: 'BE-PP-005',
      price: 39.99,
      description: 'Your journey to mastery',
      shortDesc: 'Programming mastery',
      attributes: { author: 'Hunt & Thomas', pages: '352', format: 'Paperback' },
    },
    {
      name: 'Introduction to Algorithms',
      sku: 'BE-IA-006',
      price: 89.99,
      description: 'Comprehensive algorithms textbook',
      shortDesc: 'Algorithms guide',
      attributes: { author: 'CLRS', pages: '1312', format: 'Hardcover' },
    },
    {
      name: "You Don't Know JS",
      sku: 'BE-YD-007',
      price: 119.99,
      description: '6-book series on JavaScript',
      shortDesc: 'JS book series',
      attributes: { author: 'Kyle Simpson', books: '6', format: 'Set' },
    },
    {
      name: 'Head First Design Patterns',
      sku: 'BE-HF-008',
      price: 49.99,
      description: 'Brain-friendly guide to patterns',
      shortDesc: 'Design patterns',
      attributes: { author: 'Freeman & Robson', pages: '694', format: 'Paperback' },
    },
    {
      name: 'Refactoring',
      sku: 'BE-RF-009',
      price: 54.99,
      description: 'Improving the design of existing code',
      shortDesc: 'Code refactoring',
      attributes: { author: 'Martin Fowler', pages: '448', format: 'Hardcover' },
    },
    {
      name: 'Database System Concepts',
      sku: 'BE-DB-010',
      price: 79.99,
      description: 'Comprehensive database textbook',
      shortDesc: 'Database systems',
      attributes: { author: 'Silberschatz', pages: '1376', format: 'Hardcover' },
    },
    {
      name: 'Machine Learning Yearning',
      sku: 'BE-ML-011',
      price: 39.99,
      description: 'Technical strategy for AI engineers',
      shortDesc: 'ML strategy guide',
      attributes: { author: 'Andrew Ng', pages: '118', format: 'Paperback' },
    },
    {
      name: 'Deep Learning',
      sku: 'BE-DL-012',
      price: 69.99,
      description: 'MIT Press deep learning book',
      shortDesc: 'Deep learning guide',
      attributes: { author: 'Goodfellow et al', pages: '800', format: 'Hardcover' },
    },
    {
      name: 'React Course - Complete Bundle',
      sku: 'BE-RC-013',
      price: 199.99,
      description: '50 hours of React video training',
      shortDesc: 'React video course',
      attributes: { format: 'Video', duration: '50 hours', level: 'All levels' },
    },
    {
      name: 'AWS Certified Solutions Course',
      sku: 'BE-AW-014',
      price: 149.99,
      description: 'Complete AWS certification prep',
      shortDesc: 'AWS certification',
      attributes: { format: 'Video', duration: '40 hours', certification: 'SAA-C03' },
    },
    {
      name: 'Full Stack Web Development',
      sku: 'BE-FS-015',
      price: 299.99,
      description: 'Bootcamp-style complete course',
      shortDesc: 'Full stack course',
      attributes: { format: 'Video', duration: '100 hours', projects: '20+' },
    },
    {
      name: 'Docker & Kubernetes Guide',
      sku: 'BE-DK-016',
      price: 44.99,
      description: 'Container orchestration mastery',
      shortDesc: 'DevOps guide',
      attributes: { author: 'Nigel Poulton', pages: '384', format: 'Paperback' },
    },
    {
      name: 'System Design Interview',
      sku: 'BE-SD-017',
      price: 39.99,
      description: "Insider's guide to system design",
      shortDesc: 'Interview prep',
      attributes: { author: 'Alex Xu', pages: '280', format: 'Paperback' },
    },
    {
      name: 'Cracking the Coding Interview',
      sku: 'BE-CI-018',
      price: 49.99,
      description: '189 programming questions',
      shortDesc: 'Interview questions',
      attributes: { author: 'Gayle McDowell', pages: '708', format: 'Paperback' },
    },
    {
      name: 'Eloquent JavaScript',
      sku: 'BE-EJ-019',
      price: 34.99,
      description: 'Modern introduction to programming',
      shortDesc: 'JS programming',
      attributes: { author: 'Marijn Haverbeke', pages: '472', format: 'Paperback' },
    },
    {
      name: 'CSS: The Definitive Guide',
      sku: 'BE-CS-020',
      price: 59.99,
      description: 'Visual presentation for the web',
      shortDesc: 'CSS guide',
      attributes: { author: 'Eric Meyer', pages: '1096', format: 'Paperback' },
    },
    {
      name: 'Git for Professionals',
      sku: 'BE-GI-021',
      price: 29.99,
      description: 'Version control mastery',
      shortDesc: 'Git guide',
      attributes: { author: 'Jon Loeliger', pages: '456', format: 'Paperback' },
    },
    {
      name: 'Linux Command Line',
      sku: 'BE-LC-022',
      price: 39.99,
      description: 'Complete introduction to Linux',
      shortDesc: 'Linux guide',
      attributes: { author: 'William Shotts', pages: '504', format: 'Paperback' },
    },
    {
      name: 'Node.js Design Patterns',
      sku: 'BE-ND-023',
      price: 49.99,
      description: 'Scalable Node.js applications',
      shortDesc: 'Node.js patterns',
      attributes: { author: 'Mario Casciaro', pages: '664', format: 'Paperback' },
    },
    {
      name: 'Microservices Patterns',
      sku: 'BE-MP-024',
      price: 54.99,
      description: 'Building microservices architecture',
      shortDesc: 'Microservices guide',
      attributes: { author: 'Chris Richardson', pages: '520', format: 'Paperback' },
    },
    {
      name: 'TypeScript Deep Dive',
      sku: 'BE-TS-025',
      price: 44.99,
      description: 'Complete TypeScript guide',
      shortDesc: 'TypeScript guide',
      attributes: { author: 'Basarat Syed', pages: '368', format: 'Paperback' },
    },
  ];

  for (const prod of booksEducationData) {
    await prisma.product.create({
      data: {
        name: prod.name,
        slug: prod.sku.toLowerCase(),
        sku: prod.sku,
        description: prod.description,
        shortDesc: prod.shortDesc,
        categoryId: booksEducation.id,
        basePrice: prod.price,
        stock: Math.floor(Math.random() * 80) + 15,
        status: 'PUBLISHED',
        isActive: true,
        isFeatured: Math.random() > 0.7,
        attributes: prod.attributes,
      },
    });
  }

  console.log('✅ Books & Education Products created (25 products)');

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
