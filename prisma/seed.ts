import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// --- CẤU HÌNH CONFIG ---
const CONFIG = {
  productsPerCategory: { min: 30, max: 40 }, // Số lượng ngẫu nhiên từ 30 -> 40
};

// --- CÁC HÀM HỖ TRỢ (UTILS) ---

// Random số nguyên trong khoảng
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Random phần tử trong mảng
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Tạo Slug từ tên
const generateSlug = (name: string) => {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
      .replace(/[^a-z0-9]/g, '-') // Thay ký tự đặc biệt bằng gạch ngang
      .replace(/-+/g, '-') // Xóa gạch ngang kép
      .replace(/^-|-$/g, '') +
    '-' +
    randomInt(1000, 9999)
  ); // Thêm số đuôi để tránh trùng tuyệt đối
};

// Tính toán giá bán (Base), giá vốn (Cost) và giá khuyến mãi (Sale)
function calculatePricing(
  basePrice: number,
  categoryType: 'DIGITAL' | 'ELECTRONICS' | 'FASHION' | 'BOOKS'
) {
  // Biên độ lợi nhuận và khả năng Sale tùy theo ngành hàng
  let costRatio = 0.5; // Mặc định vốn 50%
  let saleChance = 0.5; // Mặc định 50% cơ hội sale
  let maxDiscount = 0.2; // Mặc định giảm tối đa 20%

  switch (categoryType) {
    case 'DIGITAL':
      costRatio = 0.15; // Sản phẩm số vốn cực thấp (công sức dev)
      saleChance = 0.8; // Thường xuyên giảm giá để kích cầu
      maxDiscount = 0.4; // Có thể giảm sâu tới 40%
      break;
    case 'ELECTRONICS':
      costRatio = 0.85; // Đồ điện tử lãi mỏng (vốn chiếm 85%)
      saleChance = 0.3; // Ít giảm giá sâu
      maxDiscount = 0.1; // Chỉ giảm tối đa 10%
      break;
    case 'FASHION':
      costRatio = 0.35; // Thời trang lãi cao (vốn 35%)
      saleChance = 0.6; // Hay sale xả kho
      maxDiscount = 0.5; // Sale shock 50%
      break;
    case 'BOOKS':
      costRatio = 0.6;
      saleChance = 0.4;
      maxDiscount = 0.25;
      break;
  }

  // Làm tròn tiền về đơn vị nghìn (VD: 153.200 -> 154.000)
  const round = (num: number) => Math.ceil(num / 1000) * 1000;

  const costPrice = round(basePrice * costRatio);

  // Logic Sale: Random xem có sale không, và sale bao nhiêu %
  const hasSale = Math.random() < saleChance;
  let salePrice: number | null = null;

  if (hasSale) {
    const discountPercent = Math.random() * maxDiscount; // Random từ 0 -> maxDiscount
    salePrice = round(basePrice * (1 - discountPercent));
    // Đảm bảo giá sale không thấp hơn giá vốn + 5% lợi nhuận tối thiểu
    if (salePrice < costPrice * 1.05) {
      salePrice = round(costPrice * 1.05);
    }
  }

  return { basePrice, costPrice, salePrice };
}

// --- GENERATORS CHO TỪNG DANH MỤC ---

// 1. DIGITAL PRODUCTS GENERATOR
function generateDigitalProduct(index: number) {
  const techs = [
    'React',
    'Next.js',
    'Vue.js',
    'Node.js',
    'Flutter',
    'React Native',
    'Laravel',
    'PHP',
    'Python',
    'Go',
  ];
  const types = [
    'Template',
    'Source Code',
    'UI Kit',
    'Plugin',
    'Dashboard',
    'Landing Page',
    'SaaS Starter',
  ];
  const adjs = ['Pro', 'Ultimate', 'Premium', 'Modern', 'Clean', 'Fast', 'Secure', 'Dark Mode'];

  const tech = randomItem(techs);
  const type = randomItem(types);
  const adj = randomItem(adjs);

  const name = `${adj} ${tech} ${type} ${index}`; // Thêm index để đảm bảo tên khác nhau
  const basePrice = randomInt(500, 5000) * 1000; // 500k -> 5tr

  return {
    name,
    basePrice,
    type: 'DIGITAL' as const,
    attributes: [
      { key: 'tech_stack', label: 'Công nghệ', value: tech },
      { key: 'version', label: 'Phiên bản', value: `v${randomInt(1, 3)}.${randomInt(0, 9)}` },
      { key: 'license', label: 'Giấy phép', value: Math.random() > 0.7 ? 'Thương mại' : 'Cá nhân' },
      { key: 'support', label: 'Hỗ trợ', value: `${randomInt(3, 12)} tháng` },
      { key: 'file_type', label: 'Định dạng file', value: 'ZIP, Documentation' },
    ],
  };
}

// 2. ELECTRONICS GENERATOR (Tập trung PC/Xeon của Kai)
function generateElectronicsProduct(index: number) {
  const subCats = ['CPU', 'VGA', 'Mainboard', 'RAM', 'Laptop', 'Phone', 'Monitor'];
  const subCat = randomItem(subCats);

  let name = '';
  let basePrice = 0;
  let attributes: any[] = [];

  // Logic tạo tên và thuộc tính chi tiết theo từng loại linh kiện
  switch (subCat) {
    case 'CPU':
      const cpuBrands = [
        'Intel Core i3',
        'Intel Core i5',
        'Intel Core i7',
        'Intel Core i9',
        'Intel Xeon E5',
        'AMD Ryzen 5',
        'AMD Ryzen 7',
      ];
      const brand = randomItem(cpuBrands);
      const suffix = brand.includes('Xeon')
        ? `${randomInt(2650, 2699)} v${randomInt(3, 4)}`
        : `${randomInt(12, 14)}${randomInt(100, 900)}K`;
      name = `${brand} ${suffix}`;
      basePrice = brand.includes('Xeon')
        ? randomInt(500, 3000) * 1000
        : randomInt(3000, 15000) * 1000;
      attributes = [
        {
          key: 'socket',
          label: 'Socket',
          value: brand.includes('Xeon') ? 'LGA 2011-3' : 'LGA 1700',
        },
        {
          key: 'cores',
          label: 'Số nhân',
          value: brand.includes('Xeon') ? randomInt(12, 24) : randomInt(6, 16),
        },
        {
          key: 'threads',
          label: 'Số luồng',
          value: brand.includes('Xeon') ? randomInt(24, 48) : randomInt(12, 32),
        },
        { key: 'tdp', label: 'TDP', value: `${randomInt(65, 150)}W` },
      ];
      break;

    case 'Mainboard':
      const mbBrands = ['Asus', 'Gigabyte', 'MSI', 'Huananzhi', 'ASRock'];
      const mbBrand = randomItem(mbBrands);
      const chipset = mbBrand === 'Huananzhi' ? 'X99' : randomItem(['Z790', 'B760', 'Z690']);
      const mbName =
        mbBrand === 'Huananzhi'
          ? `${randomItem(['TF', 'F8', 'T8', 'QD4'])} Gaming`
          : `${randomItem(['Rog Strix', 'Aorus', 'TUF', 'Pro'])}`;
      name = `Mainboard ${mbBrand} ${chipset} ${mbName}`;
      basePrice = randomInt(1500, 10000) * 1000;
      attributes = [
        { key: 'chipset', label: 'Chipset', value: chipset },
        { key: 'socket', label: 'Socket', value: chipset === 'X99' ? 'LGA 2011-3' : 'LGA 1700' },
        { key: 'ram_type', label: 'Loại RAM', value: chipset === 'X99' ? 'DDR3/DDR4 ECC' : 'DDR5' },
        { key: 'size', label: 'Kích thước', value: 'ATX' },
      ];
      break;

    case 'VGA':
      const vgaChips = ['RTX 3060', 'RTX 4060', 'RTX 4070 Ti', 'RTX 4090', 'RX 6600', 'RX 7800 XT'];
      const vgaMakers = ['MSI', 'Asus', 'Gigabyte', 'Colorful', 'Zotac'];
      const vgaChip = randomItem(vgaChips);
      name = `VGA ${randomItem(vgaMakers)} ${vgaChip} ${randomItem(['Gaming X', 'OC', 'Eagle', 'TUF'])}`;
      basePrice = randomInt(5000, 50000) * 1000;
      attributes = [
        { key: 'vram', label: 'VRAM', value: `${randomItem([8, 12, 16, 24])}GB` },
        { key: 'chipset', label: 'Chip đồ họa', value: vgaChip.includes('RTX') ? 'NVIDIA' : 'AMD' },
        { key: 'fans', label: 'Số quạt', value: randomItem([2, 3]) },
      ];
      break;

    default: // Laptop, Phone, Monitor (Sinh ngẫu nhiên đơn giản hơn)
      const devices = [
        'iPhone 15',
        'Samsung S24',
        'MacBook Pro',
        'Dell XPS',
        'LG Gram',
        'Sony Bravia',
      ];
      name = `${randomItem(devices)} ${randomItem(['Pro', 'Max', 'Ultra', 'Plus'])} ${randomInt(2024, 2025)}`;
      basePrice = randomInt(10000, 80000) * 1000;
      attributes = [
        { key: 'brand', label: 'Thương hiệu', value: 'Chính hãng' },
        { key: 'warranty', label: 'Bảo hành', value: '12 Tháng' },
        { key: 'condition', label: 'Tình trạng', value: 'Mới 100%' },
      ];
  }

  return { name, basePrice, type: 'ELECTRONICS' as const, attributes };
}

// 3. FASHION GENERATOR
function generateFashionProduct(index: number) {
  const items = ['Áo Thun', 'Áo Polo', 'Áo Khoác', 'Quần Jeans', 'Quần Kaki', 'Váy', 'Đầm'];
  const materials = ['Cotton', 'Linen', 'Denim', 'Kaki', 'Lụa', 'Nỉ'];
  const styles = ['Slim Fit', 'Regular', 'Oversize', 'Streetwear', 'Vintage', 'Basic'];

  const item = randomItem(items);
  const material = randomItem(materials);
  const style = randomItem(styles);

  const name = `${item} ${material} ${style} ${randomInt(100, 999)}`;
  const basePrice = randomInt(150, 1500) * 1000;

  return {
    name,
    basePrice,
    type: 'FASHION' as const,
    attributes: [
      { key: 'material', label: 'Chất liệu', value: material },
      { key: 'style', label: 'Phong cách', value: style },
      { key: 'gender', label: 'Giới tính', value: randomItem(['Nam', 'Nữ', 'Unisex']) },
      { key: 'origin', label: 'Xuất xứ', value: 'Việt Nam' },
      { key: 'season', label: 'Mùa', value: randomItem(['Xuân Hè', 'Thu Đông', 'Bốn mùa']) },
    ],
  };
}

// 4. BOOKS GENERATOR
function generateBookProduct(index: number) {
  const topics = [
    'JavaScript',
    'Python',
    'AI/Machine Learning',
    'DevOps',
    'Kinh Tế',
    'Tâm Lý Học',
    'Tiểu Thuyết',
  ];
  const prefixes = ['Giáo trình', 'Cẩm nang', 'Tự học', 'Làm chủ', 'Nghệ thuật', 'Tuyệt kỹ'];

  const topic = randomItem(topics);
  const name = `${randomItem(prefixes)} ${topic} ${randomItem(['Cơ bản', 'Nâng cao', 'Toàn tập', 'Cho người mới'])}`;
  const basePrice = randomInt(80, 500) * 1000;

  return {
    name,
    basePrice,
    type: 'BOOKS' as const,
    attributes: [
      { key: 'author', label: 'Tác giả', value: `Tác giả ${randomInt(1, 50)}` },
      { key: 'pages', label: 'Số trang', value: randomInt(200, 1200) },
      {
        key: 'publisher',
        label: 'Nhà xuất bản',
        value: randomItem(['NXB Trẻ', 'NXB Kim Đồng', 'NXB Thế Giới', "O'Reilly"]),
      },
      {
        key: 'language',
        label: 'Ngôn ngữ',
        value: Math.random() > 0.3 ? 'Tiếng Việt' : 'Tiếng Anh',
      },
      { key: 'year', label: 'Năm xuất bản', value: randomInt(2018, 2024) },
    ],
  };
}

// --- MAIN FUNCTION ---

async function main() {
  console.log('🏭 BẮT ĐẦU QUY TRÌNH SEED DỮ LIỆU NÂNG CAO...');

  // 1. TẠO USER & ROLE (Cơ bản)
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'Quản trị viên',
      slug: 'admin',
      permissions: JSON.parse(JSON.stringify(['*'])),
      isActive: true,
    },
  });
  const staffRole = await prisma.role.upsert({
    where: { slug: 'staff' },
    update: {},
    create: {
      name: 'Nhân viên',
      slug: 'staff',
      permissions: JSON.parse(JSON.stringify(['orders.*'])),
      isActive: true,
    },
  });

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Quản trị',
      lastName: 'Viên',
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log('✅ Đã khởi tạo User & Role');

  // 2. TẠO CATEGORIES
  const categoryConfigs = [
    {
      name: 'Sản phẩm số',
      slug: 'san-pham-so',
      type: 'DIGITAL',
      generator: generateDigitalProduct,
    },
    {
      name: 'Điện tử & PC',
      slug: 'dien-tu',
      type: 'ELECTRONICS',
      generator: generateElectronicsProduct,
    },
    { name: 'Thời trang', slug: 'thoi-trang', type: 'FASHION', generator: generateFashionProduct },
    { name: 'Sách & Khóa học', slug: 'sach', type: 'BOOKS', generator: generateBookProduct },
  ];

  for (const [index, catConfig] of categoryConfigs.entries()) {
    // Tạo category trong DB
    const category = await prisma.category.upsert({
      where: { slug: catConfig.slug },
      update: {},
      create: { name: catConfig.name, slug: catConfig.slug, order: index + 1 },
    });

    console.log(`📦 Đang generate sản phẩm cho danh mục: ${catConfig.name}...`);

    const productCount = randomInt(CONFIG.productsPerCategory.min, CONFIG.productsPerCategory.max);

    // !!! FIX TẠI ĐÂY: Thêm : any[] để tránh lỗi Type 'never'
    const productsData: any[] = [];

    for (let i = 0; i < productCount; i++) {
      // 1. Generate dữ liệu thô từ hàm factory
      const rawData = catConfig.generator(i);

      // 2. Tính toán giá chi tiết
      const pricing = calculatePricing(rawData.basePrice, catConfig.type as any);

      // 3. Tạo các trường bổ sung (SKU, Slug, Meta)
      const sku = `${catConfig.type.substring(0, 2)}-${randomInt(10000, 99999)}-${i}`; // VD: DI-48291-1
      const slug = generateSlug(rawData.name);

      // 4. Push vào mảng chờ insert
      productsData.push({
        name: rawData.name,
        slug: slug,
        sku: sku,
        description: `<p>Mô tả chi tiết cho sản phẩm <strong>${rawData.name}</strong>.</p>
                      <p>Sản phẩm này thuộc dòng ${catConfig.name} chất lượng cao, được tuyển chọn kỹ lưỡng.</p>
                      <ul>
                        ${rawData.attributes.map((attr: any) => `<li>${attr.label}: ${attr.value}</li>`).join('')}
                      </ul>
                      <p>Cam kết bảo hành chính hãng và hỗ trợ kỹ thuật trọn đời.</p>`,
        shortDesc: `Sản phẩm ${rawData.name} chính hãng giá tốt nhất thị trường.`,
        categoryId: category.id,
        basePrice: pricing.basePrice,
        salePrice: pricing.salePrice,
        costPrice: pricing.costPrice,
        stock: randomInt(0, 200), // Random tồn kho
        lowStock: 10,
        status: 'PUBLISHED',
        isActive: true,
        isFeatured: Math.random() > 0.85, // 15% xác suất là sản phẩm nổi bật
        attributes: JSON.parse(JSON.stringify(rawData.attributes)), // Lưu JSON
        // SEO Fields
        metaTitle: `${rawData.name} - Giá Rẻ Chính Hãng | Kai Store`,
        metaDesc: `Mua ngay ${rawData.name} với giá ưu đãi ${pricing.salePrice || pricing.basePrice}. Giao hàng toàn quốc.`,
        metaKeywords: rawData.attributes.map((a: any) => a.value).join(', '),
      });
    }

    // Insert từng sản phẩm
    for (const prod of productsData) {
      const exists = await prisma.product.findFirst({
        where: { OR: [{ sku: prod.sku }, { slug: prod.slug }] },
      });

      if (!exists) {
        await prisma.product.create({ data: prod });
      }
    }

    console.log(`   -> Đã tạo ${productsData.length} sản phẩm cho ${catConfig.name}`);
  }

  // 3. SETTINGS
  await prisma.setting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: {
      key: 'site_name',
      value: JSON.parse(JSON.stringify({ value: 'Kai Tech Store' })),
      group: 'general',
      isPublic: true,
    },
  });
  await prisma.setting.upsert({
    where: { key: 'currency' },
    update: {},
    create: {
      key: 'currency',
      value: JSON.parse(JSON.stringify({ code: 'VND', symbol: '₫' })),
      group: 'general',
      isPublic: true,
    },
  });

  console.log('🎉 TOÀN BỘ QUÁ TRÌNH SEED HOÀN TẤT!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
