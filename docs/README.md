# MADE Documentation

Welcome to the MADE (Museum Archive & Digital Exhibition) project documentation.

## 📚 Documentation Index

### Architecture Documentation

- **[Frontend Architecture](./FRONTEND_ARCHITECTURE.md)** - Complete guide to the React/TypeScript frontend
  - Technology stack (React, Vite, React Query, TypeScript)
  - Folder structure and organization
  - API layer, Actions (React Query hooks), Contexts
  - Component architecture
  - State management patterns
  - Best practices and code examples

- **[Backend Architecture](./BACKEND_ARCHITECTURE.md)** - Complete guide to the Django REST Framework backend
  - Technology stack (Django, DRF, PostgreSQL)
  - App-based architecture
  - Models, Serializers, ViewSets patterns
  - URL routing and permissions
  - Authentication and authorization
  - Database schema and relationships
  - Best practices and code examples

### Additional Documentation

- **[Database Schema](../backend/DATABASE_SCHEMA.md)** - Detailed database design and relationships
- **[Contributing Guidelines](../contribution_guidelines.md)** - How to contribute to the project
- **[Week 1 Issues](../week1_issues.md)** - Initial project setup and issues

## 🏗️ Project Overview

MADE is an inventory management system for a video game museum/archive. It tracks:

- **Collection Items**: Games and objects in the collection
- **Locations**: Where items are stored (floor, storage, events)
- **Boxes**: Physical storage containers
- **Movement Requests**: Workflow for moving items between locations
- **Users**: Admin and volunteer access management

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Docker Setup

```bash
docker-compose up --build
```

## 📁 Project Structure

```
made/
├── backend/                # Django REST Framework backend
│   ├── core/              # Project settings
│   ├── users/             # User management
│   ├── inventory/         # Inventory tracking
│   └── requests/          # Movement requests
│
├── frontend/              # React TypeScript frontend
│   ├── src/
│   │   ├── api/          # API service layer
│   │   ├── actions/      # React Query hooks
│   │   ├── contexts/     # React contexts
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Utility functions
│   │   └── lib/          # Types and constants
│   └── public/
│
├── docs/                  # Documentation (you are here!)
│   ├── README.md
│   ├── FRONTEND_ARCHITECTURE.md
│   └── BACKEND_ARCHITECTURE.md
│
└── docker-compose.yml     # Docker orchestration
```

## 🔑 Key Concepts

### Frontend

- **Actions**: React Query hooks that handle data fetching and mutations
- **API Layer**: Axios-based service layer for backend communication
- **Contexts**: Global state management (auth, theme)
- **Components**: Organized by domain (common, layout, items, requests)

### Backend

- **Apps**: Modular Django apps (users, inventory, requests)
- **ViewSets**: DRF ViewSets provide automatic CRUD + custom actions
- **Serializers**: Handle validation and data transformation
- **Models**: Business logic and database schema

## 🔐 Authentication

- **Backend**: Token-based authentication via Django REST Framework
- **Frontend**: Token stored in localStorage, added to requests via interceptor
- **Roles**: ADMIN (full access) and VOLUNTEER (limited access)

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
pytest --cov  # With coverage
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:ci  # CI mode with coverage
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Current user

### Inventory
- `GET /api/inventory/items/` - List items
- `POST /api/inventory/items/` - Create item
- `GET /api/inventory/items/{id}/` - Get item
- `GET /api/inventory/items/{id}/history/` - Item history
- `GET /api/inventory/locations/` - List locations
- `GET /api/inventory/boxes/` - List boxes

### Requests
- `GET /api/requests/movement-requests/` - List requests
- `POST /api/requests/movement-requests/` - Create request
- `POST /api/requests/movement-requests/{id}/approve/` - Approve (admin)
- `POST /api/requests/movement-requests/{id}/reject/` - Reject (admin)

## 🛠️ Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**
   - Follow architecture patterns in the docs
   - Write tests for new features
   - Update documentation if needed

3. **Test your changes**
   ```bash
   # Backend
   cd backend && pytest
   
   # Frontend
   cd frontend && npm test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

5. **Create pull request**
   - Reference related issues
   - Describe changes clearly
   - Wait for review

## 📖 Learning Resources

### Frontend
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Vite Guide](https://vitejs.dev/guide/)

### Backend
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Pytest Documentation](https://docs.pytest.org/)

## 🤝 Contributing

Please read [CONTRIBUTING.md](../contribution_guidelines.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is part of UofT Blueprint's work. See the project repository for license details.

## 💬 Support

- Check the architecture docs for implementation patterns
- Review existing code for examples
- Ask questions in team channels
- Create issues for bugs or feature requests

---

**Last Updated**: November 2025
