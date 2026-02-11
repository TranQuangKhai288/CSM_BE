import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Helper functions
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Vietnamese names for realistic data
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const lastNames = ['Văn An', 'Thị Bình', 'Minh Châu', 'Hoàng Dũng', 'Thị Hoa', 'Văn Hùng', 'Thị Lan', 'Minh Khoa', 'Văn Long', 'Thị Mai', 'Văn Nam', 'Thị Nga', 'Minh Phương', 'Văn Quân', 'Thị Thảo'];

// Email domains
const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

// Phone prefixes (Vietnam)
const phonePrefix = ['090', '091', '094', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'];

// Order statuses
const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const paymentStatuses = ['PENDING', 'PAID', 'FAILED'];

// Vietnamese cities
const cities = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang', 'Huế', 'Vũng Tàu'];
const districts = ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 7', 'Quận 10', 'Bình Thạnh', 'Tân Bình', 'Gò Vấp'];
const streets = ['Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Lý Thường Kiệt', 'Điện Biên Phủ', 'Võ Văn Tần', 'Pasteur'];

function generateCustomer(index: number) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}${index}@${randomItem(emailDomains)}`;
    const phone = `${randomItem(phonePrefix)}${randomInt(1000000, 9999999)}`;

    const city = randomItem(cities);
    const district = randomItem(districts);
    const street = randomItem(streets);
    const houseNumber = randomInt(1, 999);

    const addresses = [
        {
            type: 'shipping',
            firstName,
            lastName,
            address1: `${houseNumber} ${street}`,
            address2: district,
            city,
            postalCode: `${randomInt(100000, 999999)}`,
            country: 'Vietnam',
            phone,
            isDefault: true,
        }
    ];

    // 30% chance to have billing address
    if (Math.random() > 0.7) {
        addresses.push({
            type: 'billing',
            firstName,
            lastName,
            address1: `${randomInt(1, 999)} ${randomItem(streets)}`,
            address2: randomItem(districts),
            city: randomItem(cities),
            postalCode: `${randomInt(100000, 999999)}`,
            country: 'Vietnam',
            phone,
            isDefault: false,
        });
    }

    return {
        email,
        firstName,
        lastName,
        phone,
        addresses: JSON.parse(JSON.stringify(addresses)),
        isActive: Math.random() > 0.1, // 90% active
    };
}

async function main() {
    console.log('🚀 BẮT ĐẦU SEED DỮ LIỆU CUSTOMERS VÀ ORDERS...');

    // Get existing products for orders
    const products = await prisma.product.findMany({
        where: { isActive: true },
        take: 100,
    });

    if (products.length === 0) {
        console.log('⚠️  Không tìm thấy sản phẩm. Vui lòng chạy seed.ts trước!');
        return;
    }

    console.log(`📦 Tìm thấy ${products.length} sản phẩm để tạo đơn hàng`);

    // 1. CREATE CUSTOMERS
    console.log('👥 Đang tạo Customers...');
    const customerCount = 50;
    const createdCustomers: any[] = [];

    for (let i = 0; i < customerCount; i++) {
        const customerData = generateCustomer(i);

        try {
            const customer = await prisma.customer.upsert({
                where: { email: customerData.email },
                update: {},
                create: customerData,
            });
            createdCustomers.push(customer);
        } catch (error) {
            console.log(`   ⚠️  Bỏ qua customer ${customerData.email} (đã tồn tại)`);
        }
    }

    console.log(`✅ Đã tạo ${createdCustomers.length} customers`);

    // 2. CREATE ORDERS
    console.log('📋 Đang tạo Orders...');
    const orderCount = 100;
    let createdOrdersCount = 0;

    // Date range: last 3 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    for (let i = 0; i < orderCount; i++) {
        const customer = randomItem(createdCustomers);
        const orderDate = randomDate(startDate, endDate);

        // Random 1-5 items per order
        const itemCount = randomInt(1, 5);
        const orderItems: any[] = [];
        let subtotal = 0;

        for (let j = 0; j < itemCount; j++) {
            const product = randomItem(products);
            const quantity = randomInt(1, 3);
            const price = Number(product.salePrice || product.basePrice);
            const total = price * quantity;

            orderItems.push({
                productId: product.id,
                name: product.name,
                sku: product.sku,
                quantity,
                price: price,
                total: total,
            });

            subtotal += total;
        }

        // Calculate totals
        const discount = Math.random() > 0.7 ? randomInt(10000, 100000) : 0;
        const tax = Math.floor(subtotal * 0.1); // 10% VAT
        const shipping = randomInt(15000, 50000);
        const total = subtotal - discount + tax + shipping;

        // Determine status based on order date
        const daysSinceOrder = Math.floor((endDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        let status = 'PENDING';
        let paymentStatus = 'PENDING';

        if (daysSinceOrder > 30) {
            status = randomItem(['DELIVERED', 'CANCELLED']);
            paymentStatus = status === 'DELIVERED' ? 'PAID' : randomItem(['FAILED', 'PENDING']);
        } else if (daysSinceOrder > 14) {
            status = randomItem(['SHIPPED', 'DELIVERED', 'PROCESSING']);
            paymentStatus = status === 'DELIVERED' ? 'PAID' : randomItem(['PAID', 'PENDING']);
        } else if (daysSinceOrder > 7) {
            status = randomItem(['CONFIRMED', 'PROCESSING', 'SHIPPED']);
            paymentStatus = randomItem(['PAID', 'PENDING']);
        } else if (daysSinceOrder > 3) {
            status = randomItem(['CONFIRMED', 'PROCESSING']);
            paymentStatus = randomItem(['PAID', 'PENDING']);
        }

        // Get shipping address from customer
        const addresses = customer.addresses as any;
        const shippingAddress = Array.isArray(addresses) && addresses.length > 0
            ? addresses.find((a: any) => a.type === 'shipping') || addresses[0]
            : null;

        const orderData: any = {
            orderNumber: `ORD${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
            customerId: customer.id,
            status,
            paymentStatus,
            paymentMethod: randomItem(['COD', 'Bank Transfer', 'Credit Card', 'E-Wallet']),
            subtotal,
            discount,
            tax,
            shipping,
            total,
            shippingAddress: shippingAddress ? JSON.parse(JSON.stringify(shippingAddress)) : null,
            notes: Math.random() > 0.7 ? `Ghi chú đơn hàng ${i + 1}` : null,
            trackingNumber: status === 'SHIPPED' || status === 'DELIVERED' ? `TRK${randomInt(100000000, 999999999)}` : null,
            createdAt: orderDate,
            updatedAt: orderDate,
            items: {
                create: orderItems,
            },
        };

        try {
            await prisma.order.create({
                data: orderData,
            });
            createdOrdersCount++;

            // Update customer stats
            if (status === 'DELIVERED') {
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        totalOrders: { increment: 1 },
                        totalSpent: { increment: total },
                        loyaltyPoints: { increment: Math.floor(total / 10000) }, // 1 point per 10k VND
                    },
                });
            }
        } catch (error: any) {
            console.log(`   ⚠️  Lỗi tạo order ${i + 1}: ${error.message}`);
        }
    }

    console.log(`✅ Đã tạo ${createdOrdersCount} orders`);

    // 3. SUMMARY
    const totalCustomers = await prisma.customer.count();
    const totalOrders = await prisma.order.count();
    const totalOrderItems = await prisma.orderItem.count();

    console.log('\n📊 THỐNG KÊ SAU KHI SEED:');
    console.log(`   - Tổng Customers: ${totalCustomers}`);
    console.log(`   - Tổng Orders: ${totalOrders}`);
    console.log(`   - Tổng Order Items: ${totalOrderItems}`);
    console.log('\n🎉 HOÀN TẤT SEED CUSTOMERS VÀ ORDERS!');
}

main()
    .catch((e) => {
        console.error('❌ Lỗi Seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
