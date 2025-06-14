const { open } = require('lmdb');
const path = require('path');

// Initialize LMDB
const db = open({
    path: path.join(__dirname, 'data'),
    compression: true
});

// Sample data
const mockData = [
    { key: 'user:1', value: { name: 'John Doe', email: 'john@example.com', age: 30 } },
    { key: 'user:2', value: { name: 'Jane Smith', email: 'jane@example.com', age: 25 } },
    { key: 'user:3', value: { name: 'Bob Johnson', email: 'bob@example.com', age: 35 } },
    { key: 'product:1', value: { name: 'Laptop', price: 999.99, stock: 50 } },
    { key: 'product:2', value: { name: 'Smartphone', price: 699.99, stock: 100 } },
    { key: 'product:3', value: { name: 'Headphones', price: 199.99, stock: 75 } },
    { key: 'order:1', value: { userId: 'user:1', products: ['product:1', 'product:3'], total: 1199.98 } },
    { key: 'order:2', value: { userId: 'user:2', products: ['product:2'], total: 699.99 } },
    { key: 'settings:global', value: { theme: 'dark', language: 'en', notifications: true } },
    { key: 'stats:daily', value: { date: '2024-03-20', visitors: 1500, sales: 25 } }
];

async function seedDatabase() {
    try {
        // Clear existing data
        await db.clearAsync();
        
        // Insert mock data
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