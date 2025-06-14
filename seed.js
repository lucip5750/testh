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

    // Generate 300 users
    for (let i = 1; i <= 300; i++) {
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
                }
            }
        });
    }

    // Generate 400 products
    for (let i = 1; i <= 400; i++) {
        const product = data.products[Math.floor(Math.random() * data.products.length)];
        const price = (product.basePrice * (0.8 + Math.random() * 0.4)).toFixed(2);
        mockData.push({
            key: `product:${i}`,
            value: {
                name: `${product.name} ${i}`,
                price: price,
                stock: Math.floor(Math.random() * 100),
                category: product.category,
                rating: (Math.random() * 5).toFixed(1),
                reviews: Math.floor(Math.random() * 1000),
                inStock: Math.random() > 0.2,
                description: `High-quality ${product.name.toLowerCase()} with amazing features`,
                specifications: {
                    color: ['Black', 'White', 'Silver', 'Gold'][Math.floor(Math.random() * 4)],
                    weight: `${Math.floor(Math.random() * 5) + 1}kg`,
                    dimensions: `${Math.floor(Math.random() * 50) + 10}x${Math.floor(Math.random() * 30) + 5}x${Math.floor(Math.random() * 20) + 2}cm`
                },
                tags: ['new', 'popular', 'bestseller'].filter(() => Math.random() > 0.5)
            }
        });
    }

    // Generate 250 orders
    for (let i = 1; i <= 250; i++) {
        const userId = Math.floor(Math.random() * 300) + 1;
        const numProducts = Math.floor(Math.random() * 5) + 1;
        const products = [];
        let total = 0;

        for (let j = 0; j < numProducts; j++) {
            const productId = Math.floor(Math.random() * 400) + 1;
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
        mockData.push({
            key: `order:${i}`,
            value: {
                userId: `user:${userId}`,
                products: products,
                total: total.toFixed(2),
                status: ['pending', 'completed', 'cancelled', 'shipped'][Math.floor(Math.random() * 4)],
                paymentMethod: data.paymentMethods[Math.floor(Math.random() * data.paymentMethods.length)],
                createdAt: orderDate.toISOString(),
                shippingAddress: {
                    street: `${Math.floor(Math.random() * 1000) + 1} Main St`,
                    city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
                    state: ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)],
                    zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
                },
                trackingNumber: `TRK${Math.floor(Math.random() * 1000000)}`,
                estimatedDelivery: new Date(orderDate.getTime() + 7 * 86400000).toISOString()
            }
        });
    }

    // Generate 30 settings entries
    for (let i = 1; i <= 30; i++) {
        mockData.push({
            key: `settings:${i}`,
            value: {
                name: `Setting ${i}`,
                value: Math.random() > 0.5,
                lastModified: new Date(now - Math.random() * 10000000000).toISOString(),
                modifiedBy: `user:${Math.floor(Math.random() * 300) + 1}`,
                category: ['system', 'user', 'security', 'notification'][Math.floor(Math.random() * 4)]
            }
        });
    }

    // Generate 20 stats entries
    for (let i = 1; i <= 20; i++) {
        const date = new Date(now - i * 86400000);
        mockData.push({
            key: `stats:daily:${i}`,
            value: {
                date: date.toISOString().split('T')[0],
                visitors: Math.floor(Math.random() * 5000) + 1000,
                sales: Math.floor(Math.random() * 100) + 10,
                revenue: (Math.random() * 10000).toFixed(2),
                topProducts: Array.from({length: 5}, (_, i) => `product:${Math.floor(Math.random() * 400) + 1}`),
                averageOrderValue: (Math.random() * 200).toFixed(2),
                newUsers: Math.floor(Math.random() * 50),
                activeUsers: Math.floor(Math.random() * 200) + 100,
                conversionRate: (Math.random() * 5).toFixed(2),
                peakHour: Math.floor(Math.random() * 24)
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