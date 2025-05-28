# Jammy 🎵

A comprehensive web application that visualizes your Spotify listening habits, displaying top artists, songs, genres, and listening patterns using the Spotify Web API.

## 🌟 Features

- **OAuth2 Authentication** with Spotify
- **Top Artists Analysis** - Discover your most played artists
- **Top Songs Visualization** - See your favorite tracks
- **Genre Distribution** - Analyze your music taste across genres
- **Recently Played Tracks** - View your recent listening history
- **User Session Management** - Secure authentication and data persistence
- **Real-time Analytics** - Live data from your Spotify account

## 🛠️ Tech Stack

### Backend
- **Django 5.1** - Web framework
- **Django REST Framework 3.15.2** - API development
- **Python 3.11** - Programming language
- **PostgreSQL 17.5** - Database
- **Spotipy 2.24.0** - Spotify Web API wrapper
- **Redis 5.0.8** - Caching and session management

### Frontend
- **Next.js 15.3.2** - React framework with App Router
- **TypeScript 5** - Type-safe JavaScript
- **React 19.1.0** - UI library
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Adminer** - Database administration interface

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** 
- **Python 3.11+** (for local development)
- **Spotify Developer Account** (required)

### 1. Clone Repository

``` bash
git clone https://github.com/VPhilavong/Jammy.git
```

### 2. Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:8000/callback/`
4. Note your `Client ID` and `Client Secret`

### 3. Environment Configuration

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
```

### 4. Docker Setup

```bash

# Build and start all services
docker-compose up --build

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Database Admin: http://localhost:8080
# Database: localhost:4545
```

## 📁 Project Structure

```
Jammy/
├── backend/                    # Django backend
│   ├── api/                   # API endpoints
│   ├── config/                # Django settings and configuration
│   ├── dashboard/             # Main application views
│   ├── spotify/               # Spotify integration logic
│   │   ├── models.py         # Database models
│   │   └── views.py          # API views
│   ├── manage.py             # Django management script
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile           # Backend container configuration
├── frontend/                  # Next.js frontend
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # React components
│   ├── lib/                  # Utility functions
│   ├── package.json          # Node.js dependencies
│   └── Dockerfile           # Frontend container configuration
├── docker-compose.yml        # Multi-container orchestration
├── .env                      # Environment variables
└── README.md                # This file
```

## 🔌 API Endpoints

### Authentication
- `GET /login/` - Initiate Spotify OAuth flow
- `GET /callback/` - Handle Spotify OAuth callback

### Analytics
- `GET /api/top-artists/` - Get user's top artists
- `GET /api/top-tracks/` - Get user's top tracks
- `GET /api/recent-tracks/` - Get recently played tracks
- `GET /api/genres/` - Get genre distribution
- `GET /api/user-profile/` - Get user profile information

## 🗄️ Database Models

### SpotifyToken
Manages user authentication tokens for Spotify API access.

| Field | Type | Description |
|-------|------|-------------|
| `user` | CharField | Unique user identifier |
| `created_at` | DateTimeField | Token creation timestamp |
| `refresh_token` | CharField | Spotify refresh token |
| `access_token` | CharField | Spotify access token |
| `expires_in` | DateTimeField | Token expiration time |
| `token_type` | CharField | Token type identifier |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SPOTIFY_CLIENT_ID` | Your Spotify app's client ID | Yes | - |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify app's client secret | Yes | - |
| `SPOTIFY_REDIRECT_URI` | OAuth redirect URI | Yes | `http://localhost:8000/callback/` |
| `DB_NAME` | PostgreSQL database name | Yes | `jammy_db` |
| `DB_USER` | PostgreSQL username | Yes | `jammy_user` |
| `DB_PASSWORD` | PostgreSQL password | Yes | - |

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | Next.js development server |
| `backend` | 8000 | Django API server |
| `db` | 4545 | PostgreSQL database |
| `adminer` | 8080 | Database administration interface |

## 🐛 Troubleshooting

### Common Issues

#### 1. Spotify Authentication Failed
```bash
# Check your Spotify app settings
- Verify CLIENT_ID and CLIENT_SECRET in .env
- Ensure REDIRECT_URI matches your Spotify app settings exactly
- Check if your Spotify app is in Development Mode (limited to 25 users)
```

#### 2. Docker Issues
```bash
# Check if ports are available
docker-compose down
docker-compose up --build

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
```

#### 3. Database Connection Issues
```bash
# Reset database
docker-compose down -v
docker-compose up --build

# Check database health
docker-compose ps
```

#### 4. CORS Issues
```bash
# Verify these settings in backend/config/settings.py:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   # Backend tests
   cd backend && python manage.py test
   
   # Frontend tests
   cd frontend && npm run test
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for all new frontend code
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed

## 👤 Author

**Vincent Philavong** ([@VPhilavong](https://github.com/VPhilavong))

## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for providing music data
- [Spotipy](https://spotipy.readthedocs.io/) for the excellent Python Spotify wrapper
- [Next.js](https://nextjs.org/) for the amazing React framework
- [Django REST Framework](https://www.django-rest-framework.org/) for robust API development

## 📊 Project Status

- ✅ **Authentication**: Spotify OAuth integration
- ✅ **Backend**: Django API with PostgreSQL
- ✅ **Frontend**: Next.js with TypeScript
- ✅ **Containerization**: Docker setup
- 🔄 **In Progress**: Advanced analytics features
- 📋 **Planned**: Social features, playlist recommendations

---

**Last Updated**: May 27, 2025

For support or questions, please [open an issue](https://github.com/VPhilavong/Jammy/issues) on GitHub.
