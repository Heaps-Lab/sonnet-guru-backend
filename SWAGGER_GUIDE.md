# 📚 Swagger API Documentation Guide

## 🌐 Access Swagger UI

Once the application is running, access the interactive API documentation at:

### Local Development

```
http://localhost:3000/api/v1/docs
```

### Production

```
https://api.yourdomain.com/api/v1/docs
```

## ✨ Features

- **Interactive API Testing** - Test all endpoints directly from the browser
- **Request/Response Examples** - See sample requests and responses
- **Authentication Support** - Test authenticated endpoints with JWT tokens
- **Auto-generated Documentation** - Always up-to-date with code
- **Try It Out** - Execute real API calls from the documentation

## 🔐 Testing Authenticated Endpoints

### Step 1: Register/Login

1. Expand the **Authentication** section
2. Click on `POST /api/v1/auth/login`
3. Click **"Try it out"**
4. Fill in the request body:
   ```json
   {
     "email": "admin@lmsplatform.com",
     "password": "Admin@123456",
     "deviceId": "test-device-123",
     "deviceName": "Swagger UI Browser"
   }
   ```
5. Click **"Execute"**
6. Copy the `accessToken` from the response

### Step 2: Authorize

1. Click the **"Authorize"** button at the top right (🔒 icon)
2. In the popup, paste your JWT token (without "Bearer " prefix)
3. Click **"Authorize"**
4. Click **"Close"**

### Step 3: Test Protected Endpoints

Now you can test endpoints that require authentication:

- `GET /api/v1/users` - Get all users
- Any future protected endpoints

## 📖 Swagger UI Interface Guide

### Top Section

- **Authorize Button** - Set JWT token for authenticated requests
- **Servers Dropdown** - Switch between Local/Production
- **API Title & Version** - LMS Platform API v1.0.0

### API Tags (Categories)

- 🔐 **Authentication** - Login, Register
- 👥 **Users** - User management
- 📚 **Courses** - Course management (coming soon)
- 📖 **Modules** - Module management (coming soon)
- 📝 **Quizzes** - Quiz management (coming soon)
- 💳 **Payments** - Payment processing (coming soon)

### Endpoint Details

Each endpoint shows:

- **HTTP Method** (GET, POST, PATCH, DELETE)
- **Endpoint Path**
- **Summary** - Brief description
- **Parameters** - Query params, path params, body
- **Request Body** - Schema with examples
- **Responses** - All possible response codes with examples

### Try It Out

Click "Try it out" on any endpoint to:

1. See editable request fields
2. Modify parameters/body
3. Click "Execute"
4. View response in real-time
5. See curl command for terminal use

## 🎨 Customization

The Swagger UI is customized with:

- **Custom Title** - "LMS Platform API Docs"
- **Hidden Top Bar** - Cleaner interface
- **Persistent Auth** - Token saved across refreshes
- **Sorted Operations** - Alphabetically organized

## 📝 Example Workflows

### Workflow 1: Register and Login

```
1. POST /api/v1/auth/register
   Body: { name, email, password }

2. POST /api/v1/auth/login
   Body: { email, password, deviceId, deviceName }

3. Copy accessToken from response
4. Click "Authorize" and paste token
```

### Workflow 2: Admin Operations

```
1. Login as admin (admin@lmsplatform.com)
2. Authorize with token
3. GET /api/v1/users - View all users
4. Create courses (when implemented)
5. Verify payments (when implemented)
```

### Workflow 3: Export API Spec

Download OpenAPI spec:

```
http://localhost:3000/api/v1/docs-json
```

Or YAML format:

```
http://localhost:3000/api/v1/docs-yaml
```

## 🔧 Configuration

Swagger is configured in `src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('LMS Platform API')
  .setDescription('...')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build();
```

## 🚀 Production Considerations

### Disable Swagger in Production (Optional)

Edit `src/main.ts`:

```typescript
// Only enable Swagger in non-production
if (process.env.NODE_ENV !== 'production') {
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
}
```

### Or Protect with Basic Auth

```typescript
SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customSiteTitle: 'LMS API Docs',
  // Add basic auth
  customCssUrl: 'https://cdn.example.com/swagger-ui.css',
});
```

## 📱 Testing with Postman

### Import from Swagger

1. Open Swagger UI
2. Access: `http://localhost:3000/api/v1/docs-json`
3. Copy the JSON
4. In Postman: Import → Raw text → Paste → Import

## 🎯 Response Examples

### Success (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

### Created (201)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Resource created",
  "data": { ... }
}
```

### Error (400)

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed"
}
```

### Unauthorized (401)

```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

### Forbidden (403)

```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

## 🔗 Additional Resources

- **Swagger Official Docs**: https://swagger.io/docs/
- **NestJS Swagger**: https://docs.nestjs.com/openapi/introduction
- **OpenAPI Specification**: https://spec.openapis.org/oas/latest.html

## 💡 Tips

1. **Use "Try it out"** for instant API testing
2. **Copy curl commands** for terminal testing
3. **Save tokens** by enabling persistent auth
4. **Check response schemas** before implementing clients
5. **Export spec** for client SDK generation
6. **Bookmark** the docs URL for quick access

## 🐛 Troubleshooting

### Swagger UI Not Loading

```bash
# Check if app is running
curl http://localhost:3000/api/v1

# Check Swagger endpoint
curl http://localhost:3000/api/v1/docs

# Check browser console for errors
```

### Authorization Not Working

1. Make sure you clicked "Authorize" button
2. Token should not include "Bearer " prefix
3. Check token hasn't expired (default: 7 days)
4. Try logging in again to get fresh token

### Can't See New Endpoints

1. Rebuild the application: `bun run build`
2. Restart the server
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## 📊 Current API Status

### ✅ Implemented & Documented

- Authentication (Register, Login)
- Users (Get All)

### 🔨 Coming Soon

- Courses CRUD
- Modules CRUD
- Quizzes CRUD
- Payments Management
- File Uploads
- Enrollments

## 🎉 Start Using Swagger

1. **Start the server:**

   ```bash
   bun run start:dev
   ```

2. **Open browser:**

   ```
   http://localhost:3000/api/v1/docs
   ```

3. **Start testing!** 🚀

---

**Happy API Testing!** 📚
