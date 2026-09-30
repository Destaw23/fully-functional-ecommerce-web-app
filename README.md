# ⚡ ElectroMerce - Full-Stack Multi-Vendor Electronics E-Commerce Platform

A feature-rich, high-performance, responsive multi-vendor e-commerce web application built for buying, selling, and delivering electronics. Designed with a **React 19 + Vite** frontend, a **Django REST Framework** backend, and an **offline-native SVG analytics dashboard**.

---

## 🚀 Key Features

### 🛒 Customer Experience
- **Responsive Product Catalog**: Adaptive grid layout (`1` to `4` columns dynamically adjusting to mobile, tablet, and desktop screens).
- **Search & Filter Drawer**: Real-time category filtering, price range sorting, rating filters, and touch/swipeable mobile drawers.
- **Cart & Smooth Checkout**: Session/User-synced shopping cart, shipping address entry, payment method selection, and order placement.
- **Wishlist & Order Tracking**: Instant product favoriting and detailed order lifecycle history.
- **Storefront Directory**: View individual merchant storefronts, product catalogs, and vendor locations.

### 🏪 Vendor & Merchant Portal
- **Store Creation & Setup**: Merchants can apply, create customized digital storefronts, and manage listings.
- **Inventory Management**: Create, update, or remove electronics listings and monitor stock levels.

### 🚚 Logistics & Courier Delivery Dashboard
- **Delivery Command Center**: Assign couriers to orders, update package tracking status (*Pending -> Assigned -> Picked Up -> Out for Delivery -> Delivered*).
- **Interactive Delivery Map**: Live map interface for customer address visualization and route navigation.

### 🛡️ Admin Control Panel
- **Offline-Native Sales & Orders Chart**: Built with pure React + SVG — no external CDN dependencies required, working 100% online and offline.
- **Independent Scroll Data Tables**: User management, order registry, stock catalog, category manager, and vendor store approvals.
- **Responsive Navigation**: Adaptive header and combined Admin/Profile dropdown built specifically for compact screens.

---

## 🛠️ Tech Stack

### **Frontend**
- **Core**: React 19, Vite 8, React Router v7
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **HTTP Client**: Axios with JWT Bearer Interceptors
- **Notifications & UX**: React Toastify, Custom Modal Drawers

### **Backend**
- **Framework**: Django 5 + Django REST Framework (DRF)
- **Authentication**: JWT (JSON Web Tokens) with simple-jwt authentication
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Media Storage**: Django File Storage / Cloud Media Hosting

---

## 📥 Getting Started (Local Development)

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [Git](https://git-scm.com/)

---

### **1. Clone the Repository**
```bash
git clone https://github.com/Destaw23/fully-functional-ecommerce-web-app.git
cd fully-functional-ecommerce-web-app
```

---

### **2. Backend Setup (Django)**

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows**:
     ```bash
     py -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

5. Create an Admin superuser account:
   ```bash
   python manage.py createsuperuser
   ```

6. Start the Django backend development server:
   ```bash
   python manage.py runserver
   ```
   *(Backend API will run at `http://127.0.0.1:8000/`)*

---

### **3. Frontend Setup (React + Vite)**

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(Frontend app will run at `http://localhost:5173/`)*

---

## 🌐 Free Production Deployment Guide

| Component | Platform | Free Tier |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | Unlimited Bandwidth & Deployments |
| **Backend** | **Render** | Free Web Service |
| **Database** | **Neon.tech** | Free Serverless PostgreSQL |

### **Deploy Steps**:
1. **Database**: Create a free PostgreSQL instance on [Neon.tech](https://neon.tech) and copy `DATABASE_URL`.
2. **Backend**: Connect repo to [Render.com](https://render.com), set Root Directory to `backend`, Build Command: `pip install -r requirements.txt && python manage.py migrate`, Start Command: `gunicorn core.wsgi:application`.
3. **Frontend**: Connect repo to [Vercel.com](https://vercel.com), set Root Directory to `frontend`, add `VITE_API_URL` environment variable pointing to your Render API.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Destaw23/fully-functional-ecommerce-web-app/issues).

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with ❤️ by [Destaw23](https://github.com/Destaw23).
