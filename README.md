# 🎵 Jammy

> A modern web application that transforms your Spotify listening habits into beautiful visualizations and insights.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

## ✨ Overview

Jammy is a comprehensive Spotify analytics platform that connects to your Spotify account to provide deep insights into your music listening habits. Built with modern web technologies, it offers real-time analytics, beautiful visualizations, and an intuitive user experience.

### 🎯 Key Features

- **🔐 Secure Authentication** - OAuth2 integration with Spotify
- **📊 Advanced Analytics** - Detailed insights into your listening patterns
- **🎨 Beautiful Visualizations** - Interactive charts and graphs
- **⚡ Real-time Data** - Live updates from your Spotify account
- **📱 Responsive Design** - Works seamlessly on all devices
- **🚀 High Performance** - Optimized for speed and reliability

## 🛠️ Technology Stack

### Backend
- **[Django 5.1](https://www.djangoproject.com/)** - Robust web framework
- **[Django REST Framework 3.15.2](https://www.django-rest-framework.org/)** - API development
- **[Python 3.11](https://www.python.org/)** - Programming language
- **[PostgreSQL 17.5](https://www.postgresql.org/)** - Reliable database
- **[Spotipy 2.24.0](https://spotipy.readthedocs.io/)** - Spotify Web API wrapper
- **[Redis 5.0.8](https://redis.io/)** - Caching and session management

### Frontend
- **[Next.js 15.3.2](https://nextjs.org/)** - React framework with App Router
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[React 19.1.0](https://react.dev/)** - Modern UI library
- **[Tailwind CSS 3.4.1](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### Infrastructure
- **[Docker](https://www.docker.com/)** - Containerization platform
- **[Docker Compose](https://docs.docker.com/compose/)** - Multi-container orchestration
- **[Adminer](https://www.adminer.org/)** - Database administration interface

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Docker & Docker Compose** ([Installation Guide](https://docs.docker.com/get-docker/))
- **Python 3.11+** (for local development)
- **Spotify Developer Account** ([Create Account](https://developer.spotify.com/dashboard))

### 1. Clone the Repository

```bash
git clone https://github.com/VPhilavong/Jammy.git
cd Jammy
```

### 2. Spotify App Configuration

1. Visit the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in the app details:
   - **App Name**: Jammy (or your preferred name)
   - **App Description**: Spotify Analytics Dashboard
   - **Website**: `http://localhost:3000`
   - **Redirect URI**: `http://localhost:8000/callback/`
4. Save your `Client ID` and `Client Secret`

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# Spotify Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback/

# Database Configuration
DB_NAME=jammy_db
DB_USER=jammy_user
DB_PASSWORD=your_secure_password_here
DB_HOST=db
DB_PORT=5432

# Django Configuration
SECRET_KEY=your_django_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Redis Configuration
REDIS_URL=redis://redis:6379/0
```

### 4. Launch the Application

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 5. Access the Application

Once the containers are running, access the application at:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Database Admin**: [http://localhost:8080](http://localhost:8080)
- **Database**: `localhost:4545`

## 📁 Project Architecture

```
Jammy/
├── 🔧 Configuration
│   ├── docker-compose.yml      # Multi-container orchestration
│   ├── .env                    # Environment variables
│   └── .gitignore             # Git ignore rules
├── 🐍 Backend (Django)
│   ├── api/                   # RESTful API endpoints
│   ├── config/                # Django project configuration
│   │   ├── settings.py        # Django settings
│   │   ├── urls.py            # URL routing
│   │   └── wsgi.py            # WSGI configuration
│   ├── dashboard/             # Main application logic
│   ├── spotify/               # Spotify integration
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API views
│   │   ├── serializers.py     # Data serializers
│   │   └── utils.py           # Utility functions
│   ├── manage.py              # Django management script
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Backend container
├── ⚛️ Frontend (Next.js)
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── dashboard/         # Dashboard pages
│   ├── components/            # React components
│   │   ├── ui/                # UI components
│   │   └── charts/            # Chart components
│   ├── lib/                   # Utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript type definitions
│   ├── package.json           # Node.js dependencies
│   └── Dockerfile            # Frontend container
└── 📚 Documentation
    ├── README.md              # This file
    └── docs/                  # Additional documentation
```

## 🔌 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/login/` | Initiate Spotify OAuth flow |
| `GET` | `/callback/` | Handle OAuth callback |
| `POST` | `/logout/` | End user session |

### Analytics Endpoints

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/top-artists/` | Get user's top artists | `time_range`, `limit` |
| `GET` | `/api/top-tracks/` | Get user's top tracks | `time_range`, `limit` |
| `GET` | `/api/recent-tracks/` | Get recently played tracks | `limit` |
| `GET` | `/api/genres/` | Get genre distribution | `time_range` |
| `GET` | `/api/user-profile/` | Get user profile information | - |
| `GET` | `/api/listening-history/` | Get detailed listening history | `date_range` |

### Query Parameters

- `time_range`: `short_term` (4 weeks), `medium_term` (6 months), `long_term` (all time)
- `limit`: Number of results (1-50)
- `date_range`: ISO date range for filtering

## 🗄️ Database Schema

### SpotifyToken Model

Manages user authentication tokens for Spotify API access.

```python
class SpotifyToken(models.Model):
    user = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    refresh_token = models.CharField(max_length=150)
    access_token = models.CharField(max_length=150)
    expires_in = models.DateTimeField()
    token_type = models.CharField(max_length=50)
```

### Additional Models

- **UserProfile**: Extended user information
- **ListeningHistory**: Track listening events
- **GenrePreferences**: User's genre preferences over time

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | ✅ | - |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret | ✅ | - |
| `SPOTIFY_REDIRECT_URI` | OAuth redirect URI | ✅ | `http://localhost:8000/callback/` |
| `DB_NAME` | PostgreSQL database name | ✅ | `jammy_db` |
| `DB_USER` | PostgreSQL username | ✅ | `jammy_user` |
| `DB_PASSWORD` | PostgreSQL password | ✅ | - |
| `DB_HOST` | Database host | ✅ | `db` |
| `DB_PORT` | Database port | ✅ | `5432` |
| `SECRET_KEY` | Django secret key | ✅ | - |
| `DEBUG` | Django debug mode | ❌ | `False` |
| `ALLOWED_HOSTS` | Django allowed hosts | ❌ | `localhost,127.0.0.1` |
| `REDIS_URL` | Redis connection URL | ❌ | `redis://redis:6379/0` |

### Docker Services

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| `frontend` | 3000 | Next.js development server | `http://localhost:3000` |
| `backend` | 8000 | Django API server | `http://localhost:8000/health/` |
| `db` | 4545 | PostgreSQL database | Connection test |
| `redis` | 6379 | Redis cache | Ping test |
| `adminer` | 8080 | Database administration | `http://localhost:8080` |

## 🧪 Development

### Local Development Setup

1. **Backend Development**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### Code Quality

```bash
# Python formatting
black backend/
isort backend/

# JavaScript/TypeScript formatting
npm run format

# Pre-commit hooks
pre-commit install
pre-commit run --all-files
```

## 🐛 Troubleshooting

### Common Issues

<details>
<summary><strong>🔐 Spotify Authentication Failed</strong></summary>

```bash
# Check your Spotify app settings
1. Verify CLIENT_ID and CLIENT_SECRET in .env
2. Ensure REDIRECT_URI matches your Spotify app settings exactly
3. Check if your Spotify app is in Development Mode (limited to 25 users)
4. Verify your app has the correct scopes enabled
```
</details>

<details>
<summary><strong>🐳 Docker Issues</strong></summary>

```bash
# Reset all containers
docker-compose down -v
docker-compose up --build

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Check container status
docker-compose ps

# Rebuild specific service
docker-compose up --build backend
```
</details>

<details>
<summary><strong>🗄️ Database Connection Issues</strong></summary>

```bash
# Reset database with fresh data
docker-compose down -v
docker volume prune
docker-compose up --build

# Check database health
docker-compose exec db psql -U jammy_user -d jammy_db -c "SELECT 1;"

# View database logs
docker-compose logs db
```
</details>

<details>
<summary><strong>🌐 CORS Issues</strong></summary>

```python
# Verify CORS settings in backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True
```
</details>

<details>
<summary><strong>🔄 API Rate Limiting</strong></summary>

```bash
# Spotify API has rate limits
1. Check your request frequency
2. Implement proper caching
3. Use Redis for temporary storage
4. Monitor API usage in Spotify Dashboard
```
</details>

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Set up development environment**
   ```bash
   docker-compose up --build
   ```
4. **Make your changes**
5. **Run tests and linting**
   ```bash
   npm run test
   npm run lint
   python manage.py test
   ```
6. **Commit your changes**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Follow PEP 8 for Python, Prettier for TypeScript
- **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/)
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update docs for any API changes
- **Type Safety**: Use TypeScript for all frontend code

### Code Review Process

1. All submissions require review
2. Tests must pass
3. Code coverage should not decrease
4. Documentation must be updated

## 📊 Project Roadmap

### ✅ Completed Features
- [x] Spotify OAuth integration
- [x] Real-time data fetching
- [x] User dashboard
- [x] Top artists and tracks visualization
- [x] Recent tracks display
- [x] Genre analysis
- [x] Responsive design
- [x] Docker containerization

### 🔄 In Progress
- [ ] Advanced analytics dashboard
- [ ] Export functionality (PDF, CSV)
- [ ] User preferences and settings
- [ ] Performance optimizations

### 📋 Planned Features
- [ ] Social features (compare with friends)
- [ ] Playlist recommendations
- [ ] Music discovery based on habits
- [ ] Historical trend analysis
- [ ] Mobile app (React Native)
- [ ] Spotify playlist management
- [ ] Integration with other music platforms

## 🌟 Acknowledgments

This project was made possible by these amazing open-source projects:

- **[Spotify Web API](https://developer.spotify.com/documentation/web-api/)** - For providing comprehensive music data
- **[Spotipy](https://spotipy.readthedocs.io/)** - Excellent Python wrapper for Spotify API
- **[Next.js](https://nextjs.org/)** - Amazing React framework with great developer experience
- **[Django REST Framework](https://www.django-rest-framework.org/)** - Powerful toolkit for building APIs
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives

## 👤 Author

**Vincent Philavong**
- GitHub: [@VPhilavong](https://github.com/VPhilavong)
- LinkedIn: [Vincent Philavong](https://linkedin.com/in/vphilavong)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Documentation**: Check our [Wiki](https://github.com/VPhilavong/Jammy/wiki)
- **Issues**: [Report bugs or request features](https://github.com/VPhilavong/Jammy/issues)
- **Discussions**: [Join community discussions](https://github.com/VPhilavong/Jammy/discussions)

---

<div align="center">
  <p>Made with ❤️ by Vincent Philavong</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>