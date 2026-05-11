# 🔒 Backend Security Requirements (CRITICAL)

After the bot attack (4k fake accounts, 10k fake routes, email hijacking), the frontend now sends security tokens that the backend **MUST** validate.

## 1. Cloudflare Turnstile Verification (CAPTCHA)

The frontend sends `captcha_token` on login and registration. The backend must verify it.

### Implementation (Django)

```python
# settings.py
TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY')

# utils/captcha.py
import requests

def verify_turnstile(token, remote_ip=None):
    """Verify Cloudflare Turnstile token. Returns True if valid."""
    if not token or token == 'CAPTCHA_UNAVAILABLE':
        return False  # Reject if no token (unless you want graceful degradation)
    
    response = requests.post(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        data={
            'secret': settings.TURNSTILE_SECRET_KEY,
            'response': token,
            'remoteip': remote_ip,
        }
    )
    result = response.json()
    return result.get('success', False)
```

### Add to register and login views:

```python
# views.py
from utils.captcha import verify_turnstile

class RegisterView(APIView):
    def post(self, request):
        captcha_token = request.data.get('captcha_token', '')
        if not verify_turnstile(captcha_token, request.META.get('REMOTE_ADDR')):
            return Response({'error': 'Verificación de seguridad fallida'}, status=400)
        # ... rest of registration logic
```

## 2. Rate Limiting (Django REST Framework)

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/minute',
        'user': '60/minute',
        'register': '3/hour',
        'login': '10/minute',
        'create_route': '5/hour',
        'join_route': '20/hour',
        'send_message': '60/minute',
    }
}

# throttles.py
from rest_framework.throttling import AnonRateThrottle

class RegisterThrottle(AnonRateThrottle):
    rate = '3/hour'

class LoginThrottle(AnonRateThrottle):
    rate = '10/minute'

class CreateRouteThrottle(UserRateThrottle):
    rate = '5/hour'
```

## 3. Email Change Protection

The frontend now sends `current_password` when the user changes their email. The backend must:

```python
# In the user update view (PATCH /auth/me/)
class UserUpdateView(APIView):
    def patch(self, request):
        user = request.user
        new_email = request.data.get('email')
        new_password = request.data.get('password')
        current_password = request.data.get('current_password')
        
        # If email or password is being changed, require current password
        if new_email and new_email != user.email:
            if not current_password or not user.check_password(current_password):
                return Response({'error': 'Contraseña actual incorrecta'}, status=403)
            # Also: send confirmation email to NEW address before actually changing
        
        if new_password:
            if not current_password or not user.check_password(current_password):
                return Response({'error': 'Contraseña actual incorrecta'}, status=403)
```

## 4. IDOR Protection (CRITICAL)

The attacker modified other users' emails. This means the backend has an IDOR vulnerability.

**Fix:** Ensure `/auth/me/` ONLY allows modifying the authenticated user's own data:

```python
class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        user = request.user  # ONLY the authenticated user
        # NEVER accept a user ID from the request body for non-admin endpoints
        serializer = UserSerializer(user, data=request.data, partial=True)
        # ...
```

## 5. JWT Token Security

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # Short-lived
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

## 6. Heroku Environment Variables to Set

```bash
heroku config:set TURNSTILE_SECRET_KEY=0x4AAAAAAA_your_secret_key
heroku config:set DJANGO_ALLOWED_HOSTS=rutasenmoto-9b54b67b1a59.herokuapp.com
heroku config:set CORS_ALLOWED_ORIGINS=https://rutillas.app,https://lensordr.github.io
```

## 7. IP-Based Abuse Detection (Optional but Recommended)

```python
# middleware.py
from django.core.cache import cache

class AbuseDetectionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        ip = self.get_client_ip(request)
        key = f'requests:{ip}'
        count = cache.get(key, 0)
        
        if count > 100:  # 100 requests per minute from same IP
            return JsonResponse({'error': 'Too many requests'}, status=429)
        
        cache.set(key, count + 1, 60)
        return self.get_response(request)
```

## Priority Order

1. **CAPTCHA verification** — stops bot registration immediately
2. **Rate limiting** — prevents mass creation even if CAPTCHA is bypassed
3. **IDOR fix** — prevents email hijacking
4. **Email change requires password** — defense in depth
5. **JWT short expiry** — limits damage window
6. **IP blocking** — catches persistent attackers
