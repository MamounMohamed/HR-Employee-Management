# HR Employee Management System

A modern, full-stack HR Employee Management System built with **Laravel** (Backend) and **React** (Frontend) powered by **Vite**, featuring a premium dark-themed UI with robust validation and efficient data handling.

## 🎯 Features

### Backend (Laravel + API)
- ✅ **Layered Architecture**: Route → Controller → Service → Repository
- ✅ **RESTful API** with Laravel Sanctum authentication
- ✅ **Enums** for fixed domains (roles, status, pagination)
- ✅ **DTOs** for data transfer between layers
- ✅ **Form Request Validation** for all inputs
- ✅ **API Resources** for consistent response formatting
- ✅ **Soft Deletes** for employee deactivation
- ✅ **Role-Based Access Control** (HR only)

### Frontend (React + Vite SPA)
- ✅ **Modern React Architecture** with Hooks and Context
- ✅ **Fast Build & HMR** using Vite
- ✅ **Premium Dark Theme** with glassmorphism aesthetics
- ✅ **Client-Side Validation** using `react-hook-form`
- ✅ **Dynamic Pagination** with numbered pages
- ✅ **Loading States** with spinners for better UX
- ✅ **Modal-Based Forms** for create/edit
- ✅ **Real-time Search** with debouncing
- ✅ **Responsive Design** for all screen sizes

## 📁 Project Structure

```
HR-Employee-Management/
├── app/
│   ├── DTOs/               # Data Transfer Objects
│   ├── Enums/              # PHP Enums
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   ├── Requests/       # Form Requests
│   │   └── Resources/      # API Resources
│   ├── Models/
│   ├── Repositories/       # Database Logic
│   └── Services/           # Business Logic
├── database/
│   ├── factories/          # Model Factories
│   └── seeders/            # Database Seeders
├── resources/
│   ├── css/                # Global Styles
│   ├── js/
│   │   ├── components/     # React Components (Navbar, Modals)
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Page Components (Login, Dashboard)
│   │   ├── api.js          # API Wrapper
│   │   └── app.jsx         # React Entry Point
│   └── views/
│       └── spa.blade.php   # App Entry View
└── routes/
    └── api.php             # API Routes
```

## 🚀 Installation

### Prerequisites
- PHP >= 8.2
- Composer
- MySQL/PostgreSQL/SQLite
- Node.js & NPM

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repo_url>
   cd HR-Employee-Management
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node dependencies**
   ```bash
   npm install
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure database** in `.env`
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=hr_management
   DB_USERNAME=root
   DB_PASSWORD=
   ```

6. **Run migrations and seeders**
   ```bash
   php artisan migrate:fresh --seed
   ```
   *Note: Seeding creates ~100 users for testing.*

7. **Build Frontend Assets**
   ```bash
   npm run build
   ```
   *Or for development:*
   ```bash
   npm run dev
   ```

8. **Start the Laravel server**
   ```bash
   php artisan serve
   ```

9. **Access the application**
   - Open your browser and navigate to: `http://localhost:8000`

## 🔐 Test Credentials

### HR User (Full Access)
- **Email**: `hr@example.com`
- **Password**: `password123`

### Regular Employee (No Access to Dashboard)
- **Email**: `john@example.com`
- **Password**: `password123`

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Employee Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List active employees |
| POST | `/api/employees` | Create new employee |
| GET | `/api/employees/{id}` | Get employee details |
| PUT | `/api/employees/{id}` | Update employee |
| DELETE | `/api/employees/{id}/deactivate` | Deactivate employee |

*Query Parameters: `search`, `page`, `per_page`, `only_inactive`*

## 🎨 UI Features

- **React Hook Form**: Robust client-side validation with immediate feedback.
- **Loading Spinners**: Visual indicators for API actions and data fetching.
- **Pagination**: Numbered pagination controls for large datasets.
- **Search**: Debounced search for efficient API usage.

## 🤝 Troubleshooting

**Validation Issues?**
- Ensure `npm run build` is run after changes.
- Client-side validation runs immediately on change.
- Server-side validation errors are caught and displayed on the form.

**Pagination Issues?**
- Ensure database is seeded correctly: `php artisan migrate:fresh --seed`.

---

**Built with ❤️ using Laravel & React**
