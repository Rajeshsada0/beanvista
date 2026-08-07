# ☕ Café Table Booking & Order Management System

## 📌 1. Overview
The system manages café table reservations, order creation/modification, and table availability. It ensures smooth operation by tracking table status (Available, Reserved, Occupied) and linking orders to tables.

---

## 🎯 2. Objectives
- Manage table availability in real-time  
- Allow booking/reserving tables  
- Create and modify customer orders  
- Automatically release tables after order completion  
- Improve café workflow and reduce manual errors  

---

## 👥 3. User Roles

### 1. Admin
- Manage tables (add/edit/delete)
- View all bookings and orders
- Manage menu items
- Generate reports

### 2. Staff (Waiter/Cashier)
- Book/reserve tables
- Create/modify orders
- Mark orders as completed
- Release tables

---

## 🧩 4. Core Modules

### 🔹 4.1 Table Management
- Add new table
  - Table ID
  - Table Name/Number
  - Capacity (e.g., 2, 4, 6 persons)
- Update/Delete table
- View table list with status:
  - 🟢 Available
  - 🟡 Reserved
  - 🔴 Occupied

---

### 🔹 4.2 Table Booking / Reservation
- Book table with:
  - Customer Name
  - Phone Number
  - Date & Time
  - Number of guests
- Change table status → **Reserved**
- Prevent double booking of same table/time
- Cancel reservation → Table becomes **Available**

---

### 🔹 4.3 Order Management

#### Create Order
- Select table
- Add items from menu
- Quantity & price auto-calculation
- Generate order ID

#### Modify Order
- Add/remove items
- Update quantity
- Recalculate total

#### Order Status
- Pending
- Preparing
- Served
- Completed

---

### 🔹 4.4 Table Status Logic

| Action | Table Status |
|--------|-------------|
| New booking | Reserved |
| Customer arrives & order created | Occupied |
| Order completed | Available |

---

### 🔹 4.5 Menu Management
- Add menu items:
  - Name
  - Category (Coffee, Snacks, Drinks)
  - Price
- Update/Delete items

---

### 🔹 4.6 Billing & Payment
- Generate bill from order
- Show:
  - Items list
  - Quantity
  - Total amount
- Payment methods:
  - Cash
  - Card
  - Online
- After payment → Order = Completed → Table Released

---

### 🔹 4.7 Reporting
- Daily sales report
- Table usage report
- Popular menu items
- Completed orders list

---

## 🗄️ 5. Database Design (Basic)

### Tables

#### 1. Tables
- id
- table_number
- capacity
- status (available/reserved/occupied)

#### 2. Reservations
- id
- table_id
- customer_name
- phone
- booking_time
- status

#### 3. Orders
- id
- table_id
- status
- total_amount
- created_at

#### 4. Order Items
- id
- order_id
- menu_id
- quantity
- price

#### 5. Menu
- id
- name
- category
- price

---

## 🔄 6. System Workflow

### 📍 Scenario 1: Table Booking
1. Staff selects table  
2. Adds customer details  
3. Table status → **Reserved**

### 📍 Scenario 2: Walk-in Customer
1. Staff selects available table  
2. Creates order  
3. Table status → **Occupied**

### 📍 Scenario 3: Order Completion
1. Staff marks order as completed  
2. Payment processed  
3. Table status → **Available**

---

## ⚙️ 7. Functional Requirements
- Real-time table status update  
- Prevent duplicate booking  
- Allow order modification anytime before completion  
- Auto-calculate total bill  
- Easy UI for staff usage  

---

## 🔒 8. Non-Functional Requirements
- Fast response time (<2 sec)
- Simple UI (tablet-friendly)
- Secure login system
- Data backup support

---

## 🚀 9. Future Enhancements
- Online booking via website/mobile app  
- QR code ordering system  
- Kitchen display system (KDS)  
- Inventory integration  
- Loyalty program  

---

## ✅ 10. Summary
This system will:
- Track tables efficiently  
- Manage reservations & orders  
- Automatically release tables after completion  
- Improve café operations

