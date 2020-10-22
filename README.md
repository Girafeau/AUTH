# Service d'authentification ☂️

```
GET /authentication?client_id=<ID>&redirect_uri=<URI>&grant_type=authorization_code&response_type=code&state=<HASH_STATE>
```

```
POST /access

{
    "client_id": <ID>,
    "client_secret": <SECRET>,
    "grant_type": "authorization_code",
    "authorization_code": <CODE>
}
```

```
GET /secure
```
