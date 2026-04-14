const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../src/models/UserModel');
const Supermarket = require('../src/models/SupermarketModel');
const Product = require('../src/models/ProductModel');
const Order = require('../src/models/OrderModel');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/haha_supermarket';

const seedDatabase = async () => {
  try {
    console.log('='.repeat(50));
    console.log('SEEDING HAHA PLATFORM DATABASE');
    console.log('='.repeat(50));
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    await User.deleteMany();
    await Supermarket.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    console.log('Cleared existing data');
    
    const password = await bcrypt.hash('password123', 10);

    // Create Admin
    const admin = await User.create({
      name: 'HAHA Admin',
      email: 'admin@haha.rw',
      password,
      role: 'admin',
      phone: '+250 788 000 001',
      location: 'Kigali, Rwanda'
    });
    console.log(`Admin created: ${admin.email} / password123`);

    // Create Vendors
    const vendor1 = await User.create({
      name: 'John Kimani',
      email: 'vendor@haha.rw',
      password,
      role: 'vendor',
      phone: '+250 788 000 002',
      location: 'Kigali'
    });
    console.log(`Vendor created: ${vendor1.email} / password123`);

    const vendor2 = await User.create({
      name: 'Marie Uwase',
      email: 'vendor2@haha.rw',
      password,
      role: 'vendor',
      phone: '+250 788 000 003',
      location: 'Gisenyi'
    });
    console.log(`Vendor created: ${vendor2.email} / password123`);

    // Create Customers
    const customer = await User.create({
      name: 'Test Customer',
      email: 'customer@haha.rw',
      password,
      role: 'customer',
      phone: '+250 788 000 004',
      location: 'Kigali'
    });
    console.log(`Customer created: ${customer.email} / password123`);

    const customers = await User.create([
      { name: 'Alice Mukamana', email: 'alice@example.com', password, role: 'customer', phone: '+250 788 111 111', location: 'Kigali' },
      { name: 'Bob Nshimiyimana', email: 'bob@example.com', password, role: 'customer', phone: '+250 788 222 222', location: 'Huye' },
      { name: 'Clare Ingabire', email: 'clare@example.com', password, role: 'customer', phone: '+250 788 333 333', location: 'Ruhengeri' },
    ]);
    console.log('Additional customers created');

    // Create Supermarkets
    const supermarket1 = await Supermarket.create({
      name: 'City Supermarket',
      description: 'Your one-stop shop for fresh groceries and household items. Quality products at affordable prices.',
      location: 'KN 123 Avenue, Kigali City',
      phone: '+250 788 100 100',
      email: 'info@citysupermarket.rw',
      ownerId: vendor1._id,
      status: 'approved'
    });

    const supermarket2 = await Supermarket.create({
      name: 'Fresh Mart Rwanda',
      description: 'Specializing in fresh produce and organic foods. Quality you can trust for your family.',
      location: 'KG 567 Street, Gisenyi',
      phone: '+250 788 200 200',
      email: 'contact@freshmart.rw',
      ownerId: vendor2._id,
      status: 'approved'
    });

    const supermarket3 = await Supermarket.create({
      name: 'Budget Grocers',
      description: 'Affordable prices for everyday essentials. Serving the community since 2015.',
      location: 'Muhima Sector, Kigali',
      phone: '+250 788 300 300',
      email: 'hello@budgetgrocers.rw',
      ownerId: vendor1._id,
      status: 'approved'
    });

    await Supermarket.create({
      name: 'New Market Plus',
      description: 'Coming soon with amazing deals!',
      location: 'Nyarugenge, Kigali',
      phone: '+250 788 400 400',
      email: 'new@marketplus.rw',
      ownerId: customer._id,
      status: 'pending'
    });

    console.log(`Created ${3} approved supermarkets`);

    // Create Products
    const products = [
      // Supermarket 1 - City Supermarket
      { name: 'Inyama y\'inyuganda (Beef)', description: 'Fresh beef from local farms. Perfect for roasting or grilling.', price: 2500, category: 'Foods', stock: 50, supermarketId: supermarket1._id },
      { name: 'Ibijumba (Potatoes)', description: 'Fresh locally grown Irish potatoes.', price: 300, category: 'Vegetables', stock: 200, supermarketId: supermarket1._id },
      { name: 'Amashu (Cabbage)', description: 'Green cabbage, rich in vitamins.', price: 200, category: 'Vegetables', stock: 150, supermarketId: supermarket1._id },
      { name: 'Coca Cola 2L', description: 'Refreshing Coca Cola soda bottle.', price: 1200, category: 'Drinks', stock: 100, supermarketId: supermarket1._id },
      { name: 'Fanta Orange 1.5L', description: 'Sweet orange flavored soda.', price: 900, category: 'Drinks', stock: 80, supermarketId: supermarket1._id },
      { name: 'Soap (Savon)', description: 'Premium washing soap for all fabrics.', price: 1500, category: 'Hygiene', stock: 60, supermarketId: supermarket1._id },
      { name: 'Toothpaste', description: 'Cavity protection toothpaste.', price: 2500, category: 'Hygiene', stock: 45, supermarketId: supermarket1._id },
      { name: 'Bread (Uburo)', description: 'Fresh baked bread 500g.', price: 800, category: 'Foods', stock: 70, supermarketId: supermarket1._id },
      { name: 'Milk (Mukamiro)', description: 'Fresh long-life milk 1L.', price: 1800, category: 'Drinks', stock: 55, supermarketId: supermarket1._id },

      // Supermarket 2 - Fresh Mart
      { name: 'Ibiringiti (Carrots)', description: 'Fresh organic carrots.', price: 400, category: 'Vegetables', stock: 100, supermarketId: supermarket2._id },
      { name: 'Tomato (Indomie tomato)', description: 'Ripe red tomatoes.', price: 350, category: 'Vegetables', stock: 120, supermarketId: supermarket2._id },
      { name: 'Orange Juice', description: 'Natural orange juice 1L.', price: 2200, category: 'Drinks', stock: 40, supermarketId: supermarket2._id },
      { name: 'Chicken (Inkoko)', description: 'Fresh whole chicken.', price: 4500, category: 'Foods', stock: 30, supermarketId: supermarket2._id },
      { name: 'Rice (Riz)', description: 'Premium long grain rice 5kg.', price: 8500, category: 'Foods', stock: 60, supermarketId: supermarket2._id },
      { name: 'Shampoo', description: 'Moisturizing hair shampoo.', price: 3200, category: 'Hygiene', stock: 55, supermarketId: supermarket2._id },
      { name: 'Banana (Imineke)', description: 'Fresh yellow bananas.', price: 500, category: 'Vegetables', stock: 80, supermarketId: supermarket2._id },

      // Supermarket 3 - Budget Grocers
      { name: 'Beans (Ibijumba)', description: 'Red kidney beans 1kg.', price: 1200, category: 'Foods', stock: 100, supermarketId: supermarket3._id },
      { name: 'Maize Flour (Ubugali)', description: 'Fine maize flour 2kg.', price: 1500, category: 'Foods', stock: 80, supermarketId: supermarket3._id },
      { name: 'Sugar', description: 'White crystalline sugar 1kg.', price: 1100, category: 'Foods', stock: 90, supermarketId: supermarket3._id },
      { name: 'Salt', description: 'Iodized table salt 500g.', price: 400, category: 'Foods', stock: 150, supermarketId: supermarket3._id },
      { name: 'Cooking Oil', description: 'Sunflower cooking oil 2L.', price: 4500, category: 'Foods', stock: 40, supermarketId: supermarket3._id },
      { name: 'Water 500ml', description: 'Purified drinking water.', price: 300, category: 'Drinks', stock: 200, supermarketId: supermarket3._id },
      { name: 'Body Lotion', description: 'Nourishing body lotion.', price: 2800, category: 'Hygiene', stock: 35, supermarketId: supermarket3._id },
      { name: 'Detergent', description: 'Multi-purpose cleaning detergent.', price: 2200, category: 'Hygiene', stock: 50, supermarketId: supermarket3._id },
      { name: 'Pasta', description: 'Italian pasta 500g.', price: 1800, category: 'Foods', stock: 65, supermarketId: supermarket3._id },
    ];

    const createdProducts = await Product.insertMany(
      products.map(p => ({ ...p, isAvailable: p.stock > 0 }))
    );
    console.log(`Created ${createdProducts.length} products`);

    // Create sample orders
    const allCustomers = [customer, ...customers];
    const sampleOrder = await Order.create({
      customerId: customer._id,
      items: [
        {
          productId: createdProducts[0]._id,
          name: createdProducts[0].name,
          price: createdProducts[0].price,
          quantity: 2,
          supermarketId: supermarket1._id
        },
        {
          productId: createdProducts[3]._id,
          name: createdProducts[3].name,
          price: createdProducts[3].price,
          quantity: 3,
          supermarketId: supermarket1._id
        }
      ],
      totalAmount: (2500 * 2) + (1200 * 3),
      deliveryFee: 500,
      grandTotal: (2500 * 2) + (1200 * 3) + 500,
      status: 'completed',
      deliveryAddress: {
        street: 'KG 123 Street',
        city: 'Kigali',
        district: 'Kigali City',
        phone: '+250 788 000 004'
      },
      paymentMethod: 'cash',
      paymentStatus: 'paid'
    });
    console.log('Sample order created');

    console.log('\n========================================');
    console.log('SEEDING COMPLETE!');
    console.log('========================================');
    console.log('\nDemo Accounts:');
    console.log('  Admin:    admin@haha.rw / password123');
    console.log('  Vendor:   vendor@haha.rw / password123');
    console.log('  Vendor 2: vendor2@haha.rw / password123');
    console.log('  Customer: customer@haha.rw / password123');
    console.log('\n========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
