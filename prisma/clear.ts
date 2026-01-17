import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Lấy tham số từ dòng lệnh (nếu muốn xóa cụ thể)
  // Ví dụ: npm run db:clear -- --keep-users
  const args = process.argv.slice(2);
  const keepUsers = args.includes('--keep-users');
  const keepSettings = args.includes('--keep-settings');

  console.log('🗑️  Bắt đầu dọn dẹp cơ sở dữ liệu...');

  // --- NHÓM 1: DỮ LIỆU HOẠT ĐỘNG & LIÊN KẾT (Xóa trước) ---
  // Phải xóa OrderItem trước Order, xóa Variant trước Product...

  console.log('   - Đang xóa Logs & Analytics...');
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.inventoryLog.deleteMany();

  console.log('   - Đang xóa Đơn hàng & Giỏ hàng...');
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  // await prisma.cartItem.deleteMany(); // Nếu sau này có Cart

  console.log('   - Đang xóa Sản phẩm & Biến thể...');
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  console.log('   - Đang xóa Danh mục...');
  // Lưu ý: Category có quan hệ cha-con, deleteMany của Prisma xử lý được nếu set onDelete: SetNull
  await prisma.category.deleteMany();

  console.log('   - Đang xóa Khách hàng & Mã giảm giá...');
  await prisma.customer.deleteMany();
  await prisma.discount.deleteMany();

  console.log('   - Đang xóa Nội dung CMS...');
  await prisma.page.deleteMany();
  await prisma.media.deleteMany();

  // --- NHÓM 2: CẤU HÌNH HỆ THỐNG (Tùy chọn giữ lại) ---

  if (!keepSettings) {
    console.log('   - Đang xóa Cài đặt hệ thống...');
    await prisma.setting.deleteMany();
  } else {
    console.log('   ℹ️  Đã giữ lại Settings.');
  }

  // --- NHÓM 3: USER & PHÂN QUYỀN (Tùy chọn giữ lại) ---
  // User thường được giữ lại để đỡ công tạo lại Admin khi dev

  if (!keepUsers) {
    console.log('   - Đang xóa Users & Roles...');
    await prisma.refreshToken.deleteMany(); // Phải xóa token trước user
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  } else {
    console.log('   ℹ️  Đã giữ lại Users & Roles.');
  }

  console.log('✅ Dọn dẹp hoàn tất! Database đã sạch sẽ.');
}

main()
  .catch((e) => {
    console.error('❌ Có lỗi khi dọn dẹp:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
