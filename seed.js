const { open } = require('lmdb');
const path = require('path');

// Initialize LMDB
const db = open({
    path: path.join(__dirname, 'data'),
    compression: true
});

// Helper function to generate random data
function generateRandomData() {
    const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const products = [
        { name: 'Laptop', basePrice: 999.99, category: 'Electronics' },
        { name: 'Smartphone', basePrice: 699.99, category: 'Electronics' },
        { name: 'Headphones', basePrice: 199.99, category: 'Electronics' },
        { name: 'Tablet', basePrice: 499.99, category: 'Electronics' },
        { name: 'Smartwatch', basePrice: 299.99, category: 'Electronics' },
        { name: 'Camera', basePrice: 799.99, category: 'Electronics' },
        { name: 'Printer', basePrice: 249.99, category: 'Electronics' },
        { name: 'Monitor', basePrice: 349.99, category: 'Electronics' },
        { name: 'Keyboard', basePrice: 129.99, category: 'Electronics' },
        { name: 'Mouse', basePrice: 49.99, category: 'Electronics' }
    ];
    const categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty', 'Toys', 'Food', 'Health', 'Automotive'];
    const statuses = ['active', 'inactive', 'pending', 'suspended'];
    const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto'];

    return {
        firstNames,
        lastNames,
        products,
        categories,
        statuses,
        paymentMethods
    };
}

// Generate mock data
function generateMockData() {
    const data = generateRandomData();
    const mockData = [];
    const now = new Date();

    // Generate 3000 users
    for (let i = 1; i <= 3000; i++) {
        mockData.push({
            key: `user:${i}`,
            value: {
                name: `${data.firstNames[Math.floor(Math.random() * data.firstNames.length)]} ${data.lastNames[Math.floor(Math.random() * data.lastNames.length)]}`,
                email: `user${i}@example.com`,
                age: Math.floor(Math.random() * 50) + 18,
                status: data.statuses[Math.floor(Math.random() * data.statuses.length)],
                createdAt: new Date(now - Math.random() * 10000000000).toISOString(),
                lastLogin: new Date(now - Math.random() * 86400000).toISOString(),
                preferences: {
                    newsletter: Math.random() > 0.5,
                    theme: Math.random() > 0.5 ? 'dark' : 'light',
                    language: Math.random() > 0.5 ? 'en' : 'es'
                },
                address: {
                    street: `${Math.floor(Math.random() * 1000) + 1} ${['Main', 'Oak', 'Pine', 'Maple', 'Cedar'][Math.floor(Math.random() * 5)]} St`,
                    city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'][Math.floor(Math.random() * 10)],
                    state: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC'][Math.floor(Math.random() * 10)],
                    zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
                },
                phone: `+1${Math.floor(Math.random() * 900000000) + 1000000000}`,
                loyaltyPoints: Math.floor(Math.random() * 1000)
            }
        });
    }

    // Generate 4000 products
    for (let i = 1; i <= 4000; i++) {
        const product = data.products[Math.floor(Math.random() * data.products.length)];
        const price = (product.basePrice * (0.8 + Math.random() * 0.4)).toFixed(2);
        const category = product.category;
        const subcategory = ['Premium', 'Standard', 'Basic', 'Limited Edition', 'Seasonal'][Math.floor(Math.random() * 5)];
        
        mockData.push({
            key: `product:${i}`,
            value: {
                name: `${subcategory} ${product.name} ${i}`,
                price: price,
                stock: Math.floor(Math.random() * 100),
                category: category,
                subcategory: subcategory,
                rating: (Math.random() * 5).toFixed(1),
                reviews: Math.floor(Math.random() * 1000),
                inStock: Math.random() > 0.2,
                description: `High-quality ${product.name.toLowerCase()} with amazing features`,
                specifications: {
                    color: ['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green'][Math.floor(Math.random() * 7)],
                    weight: `${Math.floor(Math.random() * 5) + 1}kg`,
                    dimensions: `${Math.floor(Math.random() * 50) + 10}x${Math.floor(Math.random() * 30) + 5}x${Math.floor(Math.random() * 20) + 2}cm`,
                    material: ['Metal', 'Plastic', 'Wood', 'Glass', 'Ceramic'][Math.floor(Math.random() * 5)],
                    warranty: `${Math.floor(Math.random() * 3) + 1} year${Math.floor(Math.random() * 3) + 1 > 1 ? 's' : ''}`
                },
                tags: ['new', 'popular', 'bestseller', 'sale', 'featured'].filter(() => Math.random() > 0.5),
                sku: `SKU${Math.floor(Math.random() * 1000000)}`,
                supplier: `Supplier ${Math.floor(Math.random() * 100) + 1}`,
                lastRestock: new Date(now - Math.random() * 30 * 86400000).toISOString()
            }
        });
    }

    // Generate 2500 orders
    for (let i = 1; i <= 2500; i++) {
        const userId = Math.floor(Math.random() * 3000) + 1;
        const numProducts = Math.floor(Math.random() * 5) + 1;
        const products = [];
        let total = 0;

        for (let j = 0; j < numProducts; j++) {
            const productId = Math.floor(Math.random() * 4000) + 1;
            const quantity = Math.floor(Math.random() * 3) + 1;
            products.push({
                productId: `product:${productId}`,
                quantity: quantity
            });
            // Find product price from mockData
            const product = mockData.find(item => item.key === `product:${productId}`);
            if (product) {
                total += parseFloat(product.value.price) * quantity;
            }
        }

        const orderDate = new Date(now - Math.random() * 10000000000);
        const status = ['pending', 'completed', 'cancelled', 'shipped', 'delivered', 'returned'][Math.floor(Math.random() * 6)];
        mockData.push({
            key: `order:${i}`,
            value: {
                userId: `user:${userId}`,
                products: products,
                total: total.toFixed(2),
                status: status,
                paymentMethod: data.paymentMethods[Math.floor(Math.random() * data.paymentMethods.length)],
                createdAt: orderDate.toISOString(),
                shippingAddress: {
                    street: `${Math.floor(Math.random() * 1000) + 1} ${['Main', 'Oak', 'Pine', 'Maple', 'Cedar'][Math.floor(Math.random() * 5)]} St`,
                    city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'][Math.floor(Math.random() * 10)],
                    state: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'FL', 'OH', 'GA', 'NC'][Math.floor(Math.random() * 10)],
                    zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
                },
                trackingNumber: `TRK${Math.floor(Math.random() * 1000000)}`,
                estimatedDelivery: new Date(orderDate.getTime() + 7 * 86400000).toISOString(),
                actualDelivery: status === 'delivered' ? new Date(orderDate.getTime() + (5 + Math.random() * 5) * 86400000).toISOString() : null,
                notes: Math.random() > 0.7 ? 'Special handling required' : null,
                discount: Math.random() > 0.8 ? (Math.random() * 20).toFixed(2) : '0.00',
                tax: (total * 0.08).toFixed(2)
            }
        });
    }

    // Generate 300 settings entries
    for (let i = 1; i <= 300; i++) {
        mockData.push({
            key: `settings:${i}`,
            value: {
                name: `Setting ${i}`,
                value: Math.random() > 0.5,
                lastModified: new Date(now - Math.random() * 10000000000).toISOString(),
                modifiedBy: `user:${Math.floor(Math.random() * 3000) + 1}`,
                category: ['system', 'user', 'security', 'notification', 'payment', 'shipping', 'inventory', 'marketing'][Math.floor(Math.random() * 8)],
                description: `Configuration setting for ${['system', 'user', 'security', 'notification', 'payment', 'shipping', 'inventory', 'marketing'][Math.floor(Math.random() * 8)]} module`,
                version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`
            }
        });
    }

    // Generate 200 stats entries
    for (let i = 1; i <= 200; i++) {
        const date = new Date(now - i * 86400000);
        mockData.push({
            key: `stats:daily:${i}`,
            value: {
                date: date.toISOString().split('T')[0],
                visitors: Math.floor(Math.random() * 5000) + 1000,
                sales: Math.floor(Math.random() * 100) + 10,
                revenue: (Math.random() * 10000).toFixed(2),
                topProducts: Array.from({length: 5}, (_, i) => `product:${Math.floor(Math.random() * 4000) + 1}`),
                averageOrderValue: (Math.random() * 200).toFixed(2),
                newUsers: Math.floor(Math.random() * 50),
                activeUsers: Math.floor(Math.random() * 200) + 100,
                conversionRate: (Math.random() * 5).toFixed(2),
                peakHour: Math.floor(Math.random() * 24),
                bounceRate: (Math.random() * 30).toFixed(2),
                averageSessionDuration: Math.floor(Math.random() * 1800) + 300,
                mobileUsers: Math.floor(Math.random() * 70) + 30,
                returningCustomers: Math.floor(Math.random() * 40) + 10,
                cartAbandonmentRate: (Math.random() * 20).toFixed(2)
            }
        });
    }

    return mockData;
}

async function seedDatabase() {
    try {
        // Clear existing data
        await db.clearAsync();
        
        // Generate and insert mock data
        const mockData = generateMockData();
        for (const item of mockData) {
            await db.put(item.key, item.value);
        }
        
        console.log('Successfully seeded database with mock data');
        
        // Verify the data
        let count = 0;
        for await (const _ of db.getKeys()) {
            count++;
        }
        console.log(`Total entries in database: ${count}`);
        
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close the database connection
        await db.close();
    }
}

// Run the seeding function
seedDatabase(); 