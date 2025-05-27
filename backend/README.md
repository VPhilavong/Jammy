# Jammy Backend Documentation

## Overview

Jammy's backend is a Django-based REST API that powers Spotify analytics, letting users visualize their music preferences and listening habits. It handles authentication, communicates with the Spotify Web API, manages user tokens, and serves data for the frontend.

## Tech Stack

- **Django 5.1**: Web framework
- **Django REST Framework**: API development
- **Python 3.11**
- **PostgreSQL**: Database
- **Docker**: For containerization and multi-service orchestration

## Project Structure

```
backend/
├── api/         # API endpoints (views, serializers)
├── config/      # Django settings and URL routing
├── spotify/     # Spotify integration logic and token management
│   ├── migrations/
│   ├── models.py
│   └── views.py
├── manage.py    # Django management script
├── requirements.txt
└── Dockerfile   # Backend container configuration
```

## Setup Instructions

### Prerequisites

- Python 3.11+
- Spotify Developer Account (for API credentials)
- PostgreSQL database
- Docker & Docker Compose (recommended for local development)

### Environment Configuration

Create a `.env` file in the root directory:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/callback/
DB_NAME=jammy_db
DB_USER=jammy_user
DB_PASSWORD=your_secure_password
```

### Development Setup (without Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Dockerized Setup

```bash
docker-compose up --build
```
- Backend API: http://localhost:8000
- Database Admin (Adminer): http://localhost:8080

## API Endpoints

### Authentication
- `GET /login/` &rarr; Initiates Spotify OAuth flow
- `GET /callback/` &rarr; Handles Spotify OAuth callback

### Analytics
- `GET /top_artists/` &rarr; Get user's top artists
- `GET /top_tracks/` &rarr; Get user's top tracks
- `GET /genres/` &rarr; Get genre distribution
- `GET /recommendations/` &rarr; Get recommended tracks
- `GET /get_artist/<artist_name>/` &rarr; Search for an artist by name

### Example: Top Artists Endpoint
```python
@api_view(['GET'])
def top_artists(request):
    access_token = spotify.get_user_tokens(request.session.session_key).access_token
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'limit': 50, 'time_range': 'short_term'}
    endpoint = 'https://api.spotify.com/v1/me/top/artists'
    response = requests.get(endpoint, headers=headers, params=params)
    return Response(response.json())
```

## Database Models

### SpotifyToken

| Field         | Type           | Description                       |
|---------------|----------------|-----------------------------------|
| user          | CharField      | Unique user identifier            |
| created_at    | DateTimeField  | Token creation timestamp          |
| refresh_token | CharField      | Spotify refresh token             |
| access_token  | CharField      | Spotify access token              |
| expires_in    | DateTimeField  | Token expiration time             |
| token_type    | CharField      | Token type identifier             |

## Configuration

### Environment Variables

| Variable               | Description                      | Required | Default                           |
|------------------------|----------------------------------|----------|------------------------------------|
| `SPOTIFY_CLIENT_ID`    | Spotify app's client ID          | Yes      | -                                  |
| `SPOTIFY_CLIENT_SECRET`| Spotify app's client secret      | Yes      | -                                  |
| `SPOTIFY_REDIRECT_URI` | OAuth redirect URI               | Yes      | `http://localhost:8000/callback/`  |
| `DB_NAME`              | PostgreSQL database name         | Yes      | `jammy_db`                         |
| `DB_USER`              | PostgreSQL username              | Yes      | `jammy_user`                       |
| `DB_PASSWORD`          | PostgreSQL password              | Yes      | -                                  |

### Docker Services

| Service     | Port  | Description                        |
|-------------|-------|------------------------------------|
| frontend    | 3000  | Next.js frontend                   |
| backend     | 8000  | Django API server                  |
| db          | 4545  | PostgreSQL database                |
| adminer     | 8080  | Database administration interface  |

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## Troubleshooting

For the most up-to-date troubleshooting and advanced usage, see the [backend/README.md](https://github.com/VPhilavong/Jammy/blob/main/backend/README.md) and [main README.md](https://github.com/VPhilavong/Jammy/blob/main/README.md).

---

**Note:**  
This summary is based on the top 10 code search results. For more details or to see additional files and endpoints, please refer to the [full GitHub repository](https://github.com/VPhilavong/Jammy).
