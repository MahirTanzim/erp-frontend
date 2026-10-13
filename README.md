# Mini ERP System — Frontend

A web-based interface for a Mini Enterprise Resource Planning (ERP) application. The frontend connects to a Spring Boot REST API to provide a centralized interface for managing employees, inventory, purchasing, sales, invoices, payments, and other business operations.

## Live Application

**Live Demo:** https://erp-frontend.tanzimm651.workers.dev

**Backend API:** https://erp-i5vi.onrender.com

**Backend Repository:** https://github.com/MahirTanzim/erp

## Features

- User login and authenticated access.
- Dashboard with business summaries.
- Employee and department management.
- Product and warehouse management.
- Inventory and stock movement tracking.
- Supplier management.
- Purchase order management.
- Customer and sales order management.
- Customer invoice management.
- Payment recording and outstanding balance tracking.
- Integration with the Spring Boot backend API.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling |
| JavaScript | Client-side logic and API integration |
| Bootstrap | Responsive UI components |
| Fetch API | HTTP communication with the backend |
| Cloudflare Workers | Frontend hosting |

## Project Structure

```text
erp-frontend/
├── index.html
├── dashboard.html
├── employees.html
├── departments.html
├── products.html
├── warehouses.html
├── inventory.html
├── suppliers.html
├── purchase-orders.html
├── customers.html
├── sales-orders.html
├── invoices.html
├── payments.html
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── login.js
│   ├── app.js
│   └── ...
└── README.md
```

The exact filenames may vary as the application evolves.

## Running Locally

### Prerequisites

- Git
- A modern web browser
- Visual Studio Code or another editor
- A local instance of the backend, or access to the deployed backend

### 1. Clone the repository

```bash
git clone YOUR_FRONTEND_REPOSITORY_URL
cd erp-frontend
```

Replace `YOUR_FRONTEND_REPOSITORY_URL` with the URL of this repository.

### 2. Configure the API URL

Open `js/api.js` and verify the API base URL:

```javascript
const API_BASE_URL =
    window.ERP_API_BASE_URL ||
    "https://erp-i5vi.onrender.com/api";
```

For local backend development, the API base URL can instead point to:

```text
http://localhost:8080/api
```

Make sure the backend CORS configuration allows the origin used by your local frontend.

### 3. Start the frontend

Open the project folder in Visual Studio Code and run the HTML files using the Live Server extension, or use another local static web server.

Open the local address provided by your server.

### 4. Log in

Use an account configured in your backend database. The frontend sends authentication requests to the backend API.

Never publish passwords, JWT tokens, or other credentials in this README.

## Deployment

The frontend is hosted on Cloudflare Workers and communicates with the deployed Spring Boot API on Render.

The backend uses Neon PostgreSQL for persistent data storage.

## Security Considerations

- Authentication and authorization are enforced by the backend.
- Database credentials and JWT signing secrets belong in backend environment variables.
- Frontend code is public, so never put secrets in JavaScript files.
- Do not commit `.env` files, local secret files, or repository metadata as public website assets.
- Configure the backend CORS policy to allow only the frontend origins that are required.

## Future Improvements

- Improve loading states and error messages.
- Add client-side form validation.
- Improve accessibility and responsive layouts.
- Optimize API requests and page loading.
- Add automated frontend testing.

## Author

**Mahir Tanzim**

Computer Science graduate and software developer.

## License

No license has been specified yet. All rights are reserved unless a license is added to this repository.