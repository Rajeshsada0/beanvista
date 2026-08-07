# MongoDB Migrations & Seeding Guide

## 🎯 Quick Answer

**For MongoDB, you DON'T need migrations!** Just run seeders:

```bash
php artisan db:seed
```

---

## 📚 Understanding MongoDB vs MySQL

### MySQL (Relational):
- **Needs migrations** to create tables/columns
- Schema must be defined before inserting data
- `php artisan migrate` creates table structure

### MongoDB (NoSQL):
- **No migrations needed** - schema-less!
- Collections and fields created automatically
- Just insert data directly

---

## 🚀 Running Seeders

### **Basic Seeding:**

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=DatabaseSeeder

# Run with fresh database (danger: deletes all data!)
php artisan db:seed --force
```

### **Automated Script:**

Double-click this file:
```
seed-database.bat
```

---

## 📋 Your Current Seeders

### DatabaseSeeder.php

Your seeder will create:

1. **Users:**
   - admin@cafe.com / password (Admin)
   - staff@cafe.com / password (Staff)

2. **Tables:**
   - T1, T2 (capacity 2)
   - T3, T4 (capacity 4)
   - T5 (capacity 6)

3. **Menu Items:**
   - Espresso ($3.50)
   - Cappuccino ($4.50)
   - Latte ($5.00)
   - Croissant ($3.00)
   - Cheesecake ($6.00)
   - Lemonade ($4.00)

4. **Settings** (via SettingSeeder)

---

## 🔄 Reseeding (Fresh Start)

### **Option 1: Drop Database & Reseed**

```bash
# Using Tinker
php artisan tinker
```
```php
// Drop entire database
DB::connection('mongodb')->getMongoDB()->drop();
exit
```
```bash
# Reseed
php artisan db:seed
```

### **Option 2: Drop Specific Collections**

```bash
php artisan tinker
```
```php
// Drop specific collections
DB::connection('mongodb')->getCollection('users')->drop();
DB::connection('mongodb')->getCollection('tables')->drop();
DB::connection('mongodb')->getCollection('menus')->drop();
exit
```
```bash
php artisan db:seed
```

### **Option 3: Update Existing Records**

Your seeder uses `updateOrCreate()` which:
- **Updates** if record exists (by email/table_number/name)
- **Creates** if record doesn't exist

So you can run `php artisan db:seed` multiple times safely!

---

## 🔧 Creating New Seeders

### **Step 1: Generate Seeder**

```bash
php artisan make:seeder TenantSeeder
```

### **Step 2: Edit Seeder**

`database/seeders/TenantSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;

class TenantSeeder extends Seeder
{
    public function run(): void
    {
        Tenant::updateOrCreate(
            ['slug' => 'cafe-main'],
            [
                'name' => 'Main Cafe',
                'is_active' => true,
            ]
        );

        Tenant::updateOrCreate(
            ['slug' => 'cafe-branch'],
            [
                'name' => 'Branch Cafe',
                'is_active' => true,
            ]
        );
    }
}
```

### **Step 3: Call from DatabaseSeeder**

`database/seeders/DatabaseSeeder.php`:

```php
public function run(): void
{
    // ... existing code ...
    
    $this->call([
        SettingSeeder::class,
        TenantSeeder::class,  // Add new seeder
    ]);
}
```

### **Step 4: Run**

```bash
php artisan db:seed
```

---

## 📊 Seeding with Relationships

### **MongoDB Embedded Documents:**

```php
// Seeder with embedded items
Order::create([
    'customer_id' => 1,
    'status' => 'completed',
    'items' => [  // Embedded array
        [
            'menu_id' => 1,
            'name' => 'Coffee',
            'quantity' => 2,
            'price' => 5.00
        ],
        [
            'menu_id' => 2,
            'name' => 'Cake',
            'quantity' => 1,
            'price' => 8.00
        ]
    ],
    'total_amount' => 18.00
]);
```

### **MongoDB References (Like Foreign Keys):**

```php
// Create customer first
$customer = Customer::create([
    'name' => 'John Doe',
    'email' => 'john@example.com'
]);

// Reference in order
Order::create([
    'customer_id' => $customer->id,  // MongoDB ObjectId
    'total_amount' => 50.00
]);
```

---

## 🎲 Using Factories (Optional)

### **Step 1: Create Factory**

```bash
php artisan make:factory CustomerFactory
```

### **Step 2: Define Factory**

`database/factories/CustomerFactory.php`:

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'loyalty_points' => fake()->numberBetween(0, 1000),
        ];
    }
}
```

### **Step 3: Use in Seeder**

```php
// Create 50 fake customers
\App\Models\Customer::factory(50)->create();
```

---

## 📝 Migration Files (What to Do with Them?)

Your existing migration files in `database/migrations/`:

### **Option 1: Ignore Them** ⭐ (Recommended)
- MongoDB doesn't need schema migrations
- Keep them for reference only
- Don't run `php artisan migrate`

### **Option 2: Delete Them**
- If you're sure you're using MongoDB only
- Clean up the project

### **Option 3: Keep for Data Seeding**
- Convert them to seeders
- Use them to populate initial data

---

## 🔍 Verifying Seeded Data

### **Using Tinker:**

```bash
php artisan tinker
```

```php
// Count records
User::count()          // Should show 2
Table::count()         // Should show 5
Menu::count()          // Should show 6

// View all users
User::all()

// View specific user
User::where('email', 'admin@cafe.com')->first()

// View with relationships
$order = Order::with('items')->first();
$order->items;

exit
```

### **Using MongoDB Compass (GUI):**

1. Download: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. Browse collections visually

### **Using mongosh (CLI):**

```bash
mongosh
```

```javascript
use cafe_db

// Count documents
db.users.countDocuments()
db.tables.countDocuments()
db.menus.countDocuments()

// Find all users
db.users.find()

// Find admin user
db.users.findOne({ email: "admin@cafe.com" })

exit
```

---

## 🛠️ Troubleshooting

### **Error: "Connection refused"**
```bash
# MongoDB not running
net start MongoDB
```

### **Error: "Class 'MongoDB' not found"**
```bash
# PHP extension not installed
# See: PHP84_MONGODB_SETUP.md
```

### **Error: "Unsupported driver [mongodb]"**
```bash
# Laravel package not installed
composer require mongodb/laravel-mongodb --ignore-platform-req=ext-mongodb
php artisan config:clear
```

### **Seeder Runs But No Data Appears**
```bash
# Check if connected to correct database
php artisan tinker
```
```php
DB::connection('mongodb')->getDatabaseName()
// Should show: cafe_db

// Check connection
DB::connection('mongodb')->getMongoDB()->listCollections()
exit
```

---

## 📚 Common Seeding Patterns

### **1. Conditional Seeding:**

```php
if (User::count() === 0) {
    // Only seed if empty
    User::create([...]);
}
```

### **2. Environment-Specific:**

```php
if (app()->environment('local')) {
    // Only in development
    User::factory(100)->create();
}
```

### **3. Seeding with Tenant Context:**

```php
$tenant = Tenant::first();

// Set tenant context
auth()->loginUsingId(User::where('tenant_id', $tenant->id)->first()->id);

// Seed tenant-specific data
Menu::create([
    'tenant_id' => $tenant->id,
    'name' => 'Special Coffee'
]);
```

---

## ✅ Checklist for Seeding

- [ ] MongoDB is running (`net start MongoDB`)
- [ ] PHP extension installed (`php -m | findstr mongodb`)
- [ ] Composer package installed (`composer show mongodb/laravel-mongodb`)
- [ ] Configuration cached cleared (`php artisan config:clear`)
- [ ] Database connection verified (`php test-mongodb.php`)
- [ ] Run seeder (`php artisan db:seed`)
- [ ] Verify data (`php artisan tinker` → `User::all()`)

---

## 🎯 Quick Commands

```bash
# Full setup (first time)
composer require mongodb/laravel-mongodb --ignore-platform-req=ext-mongodb
php artisan config:clear
php artisan db:seed

# Regular seeding
php artisan db:seed

# Reseed specific seeder
php artisan db:seed --class=DatabaseSeeder

# Automated seeding
seed-database.bat

# Verify data
php artisan tinker
User::count()
exit
```

---

## 🚀 Ready to Seed?

Run this now:

```bash
php artisan config:clear
php artisan db:seed
```

Or use the automated script:
```bash
seed-database.bat
```

Then login at http://127.0.0.1:8000/login with:
- Email: `admin@cafe.com`
- Password: `password`

---

**Remember:** With MongoDB, you don't need migrations. Just run seeders! 🎉
