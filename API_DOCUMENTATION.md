# 📚 LMS Platform - API Documentation

## 🌐 Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://api.yourdomain.com/api/v1
```

## 🔐 Authentication

Most endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

## 📋 Response Format

All API responses follow this standard format:

### Success Response (2xx)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Detailed error message"
}
```

---

## 🔑 Authentication Endpoints

### 1. Register User

Create a new user account.

**Endpoint:** `POST /auth/register`

**Access:** Public

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "role": "Student"
}
```

**Fields:**

- `name` (string, required): Full name
- `email` (string, required): Valid email address
- `password` (string, required): Minimum 6 characters
- `role` (string, optional): One of: "Super Admin", "Admin", "Teacher", "Student" (default: "Student")

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "Student",
    "isActive": true,
    "createdAt": "2024-07-16T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Email already exists"
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "role": "Student"
  }'
```

---

### 2. Login & Device Registration

Authenticate user and register device session.

**Endpoint:** `POST /auth/login`

**Access:** Public

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "deviceId": "df7a884c-3e21-49cf-8921-9e7bf331a980",
  "deviceName": "Chrome Browser - Windows 11"
}
```

**Fields:**

- `email` (string, required): User email
- `password` (string, required): User password
- `deviceId` (string, required): Unique device identifier (UUID recommended)
- `deviceName` (string, required): Human-readable device description

**Success Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Authentication verified successfully.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NDNmMWIyNWEzZjJiMTEyOWM4YjQ1NjciLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6IlN0dWRlbnQiLCJzZXNzaW9uSWQiOiJzZXNzXzg5MTIzODQ3IiwiaWF0IjoxNjI2MzQ1NjAwLCJleHAiOjE2MjY5NTA0MDB9.signature",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "Student"
    },
    "sessionState": {
      "activeSessionsCount": 1,
      "currentSessionId": "sess_89123847"
    }
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

**Error Response (403 Forbidden - Device Limit):**

```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Active device limit breached. This account is actively bound to another terminal instance. Revoke prior sessions before proceeding."
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "deviceId": "df7a884c-3e21-49cf-8921-9e7bf331a980",
    "deviceName": "Chrome Browser - Windows 11"
  }'
```

---

## 👥 User Management

### 3. Get All Users

Retrieve list of all users (Admin only).

**Endpoint:** `GET /users`

**Access:** Super Admin, Admin

**Headers:**

```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:** None

**Success Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "Student",
      "isActive": true,
      "createdAt": "2024-07-16T10:30:00.000Z"
    },
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "role": "Teacher",
      "isActive": true,
      "createdAt": "2024-07-15T09:20:00.000Z"
    }
  ]
}
```

**Error Response (403 Forbidden):**

```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

**cURL Example:**

```bash
curl -X GET https://api.yourdomain.com/api/v1/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📚 Course Management (Template - Needs Implementation)

### 4. Create Course

Create a new course.

**Endpoint:** `POST /courses`

**Access:** Super Admin, Admin, Teacher

**Headers:**

```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Complete Web Development Bootcamp 2024",
  "description": "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch",
  "price": 4500.0,
  "thumbnailUrl": "https://cdn.yourdomain.com/courses/web-dev-2024.jpg",
  "isPublished": true
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Course created successfully",
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "title": "Complete Web Development Bootcamp 2024",
    "description": "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch",
    "instructorId": "650e8400-e29b-41d4-a716-446655440001",
    "price": 4500.0,
    "isPublished": true,
    "thumbnailUrl": "https://cdn.yourdomain.com/courses/web-dev-2024.jpg",
    "enrollmentCount": 0,
    "createdAt": "2024-07-16T11:00:00.000Z"
  }
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourdomain.com/api/v1/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete Web Development Bootcamp 2024",
    "description": "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB",
    "price": 4500.00,
    "isPublished": true
  }'
```

---

### 5. Get All Courses

Retrieve list of all courses.

**Endpoint:** `GET /courses`

**Access:** Public

**Query Parameters:**

- `isPublished` (boolean, optional): Filter by published status
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)

**Success Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "courses": [
      {
        "id": "750e8400-e29b-41d4-a716-446655440002",
        "title": "Complete Web Development Bootcamp 2024",
        "description": "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB",
        "price": 4500.0,
        "isPublished": true,
        "thumbnailUrl": "https://cdn.yourdomain.com/courses/web-dev-2024.jpg",
        "enrollmentCount": 25,
        "instructor": {
          "id": "650e8400-e29b-41d4-a716-446655440001",
          "name": "Jane Smith"
        },
        "createdAt": "2024-07-16T11:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

**cURL Example:**

```bash
curl -X GET "https://api.yourdomain.com/api/v1/courses?isPublished=true&page=1&limit=10"
```

---

### 6. Get Course by ID

Retrieve detailed information about a specific course.

**Endpoint:** `GET /courses/:id`

**Access:** Public

**Success Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440002",
    "title": "Complete Web Development Bootcamp 2024",
    "description": "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch",
    "price": 4500.0,
    "isPublished": true,
    "thumbnailUrl": "https://cdn.yourdomain.com/courses/web-dev-2024.jpg",
    "enrollmentCount": 25,
    "instructor": {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Smith",
      "email": "jane.smith@example.com"
    },
    "modules": [
      {
        "id": "850e8400-e29b-41d4-a716-446655440003",
        "title": "Module 1: Introduction to HTML",
        "sequenceOrder": 1,
        "isPublished": true
      }
    ],
    "createdAt": "2024-07-16T11:00:00.000Z",
    "updatedAt": "2024-07-16T11:00:00.000Z"
  }
}
```

**cURL Example:**

```bash
curl -X GET https://api.yourdomain.com/api/v1/courses/750e8400-e29b-41d4-a716-446655440002
```

---

## 📖 Module Management (Template)

### 7. Create Module

Create a new module within a course.

**Endpoint:** `POST /courses/:courseId/modules`

**Access:** Super Admin, Admin, Teacher

**Request Body:**

```json
{
  "title": "Module 3: Scalable Backend Architecture with NestJS",
  "description": "Deep-dive instruction concerning request life cycles, route guards, interceptors, and background worker queues.",
  "sequenceOrder": 3
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Course module created successfully",
  "data": {
    "id": "850e8400-e29b-41d4-a716-446655440003",
    "courseId": "750e8400-e29b-41d4-a716-446655440002",
    "title": "Module 3: Scalable Backend Architecture with NestJS",
    "description": "Deep-dive instruction concerning request life cycles",
    "sequenceOrder": 3,
    "isPublished": true,
    "createdAt": "2024-07-16T12:00:00.000Z"
  }
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourdomain.com/api/v1/courses/750e8400-e29b-41d4-a716-446655440002/modules \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Module 3: Scalable Backend Architecture with NestJS",
    "description": "Deep-dive instruction",
    "sequenceOrder": 3
  }'
```

---

### 8. Upload Lecture Document/Sheet

Upload a PDF or document to a module.

**Endpoint:** `POST /modules/:moduleId/sheets`

**Access:** Super Admin, Admin, Teacher

**Headers:**

```
Authorization: Bearer <your_jwt_token>
Content-Type: multipart/form-data
```

**Form Data:**

- `file` (file, required): PDF/document file
- `title` (string, required): Sheet title
- `isDownloadable` (boolean, optional): Allow download (default: true)

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Lecture document sheet processed and linked to target module successfully.",
  "data": {
    "sheetId": "950e8400-e29b-41d4-a716-446655440004",
    "moduleId": "850e8400-e29b-41d4-a716-446655440003",
    "title": "NestJS Architecture Sheet Blueprint v1",
    "fileUrl": "https://cdn.yourdomain.com/sheets/nestjs-architecture-sheet-blueprint-v1.pdf",
    "isDownloadable": true,
    "uploadedAt": "2024-07-16T12:30:00.000Z"
  }
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourdomain.com/api/v1/modules/850e8400-e29b-41d4-a716-446655440003/sheets \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/document.pdf" \
  -F "title=NestJS Architecture Sheet Blueprint v1" \
  -F "isDownloadable=true"
```

---

## 📝 Quiz Management (Template)

### 9. Create Quiz

Create a new quiz for a module.

**Endpoint:** `POST /quizzes`

**Access:** Super Admin, Admin, Teacher

**Request Body:**

```json
{
  "moduleId": "850e8400-e29b-41d4-a716-446655440003",
  "title": "NestJS Fundamentals Quiz",
  "description": "Test your knowledge of NestJS core concepts",
  "duration": 30,
  "totalMarks": 100,
  "passingMarks": 60
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Quiz created successfully",
  "data": {
    "id": "a50e8400-e29b-41d4-a716-446655440005",
    "moduleId": "850e8400-e29b-41d4-a716-446655440003",
    "title": "NestJS Fundamentals Quiz",
    "description": "Test your knowledge of NestJS core concepts",
    "duration": 30,
    "totalMarks": 100,
    "passingMarks": 60,
    "isPublished": true,
    "createdAt": "2024-07-16T13:00:00.000Z"
  }
}
```

---

### 10. Add Quiz Question

Add a question to an existing quiz.

**Endpoint:** `POST /quizzes/:quizId/questions`

**Access:** Super Admin, Admin, Teacher

**Request Body:**

```json
{
  "questionText": "Which provider token decorator handles cross-module IoC dependency token evaluation within NestJS frameworks?",
  "options": [
    { "optionIndex": 0, "text": "@Injectable()" },
    { "optionIndex": 1, "text": "@Inject()" },
    { "optionIndex": 2, "text": "@Module()" },
    { "optionIndex": 3, "text": "@ForwardRef()" }
  ],
  "correctOptionIndex": 1,
  "explanation": "The @Inject() decorator explicitly handles token references for non-class based configuration providers inside the IoC system container.",
  "negativeMarking": 0.25
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Multiple choice question record committed to quiz bank.",
  "data": {
    "questionId": "b50e8400-e29b-41d4-a716-446655440006",
    "quizId": "a50e8400-e29b-41d4-a716-446655440005",
    "questionText": "Which provider token decorator handles cross-module IoC...",
    "negativeMarking": 0.25,
    "addedAt": "2024-07-16T13:15:00.000Z"
  }
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourdomain.com/api/v1/quizzes/a50e8400-e29b-41d4-a716-446655440005/questions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Which provider token decorator...",
    "options": [
      {"optionIndex": 0, "text": "@Injectable()"},
      {"optionIndex": 1, "text": "@Inject()"}
    ],
    "correctOptionIndex": 1,
    "negativeMarking": 0.25
  }'
```

---

## 💳 Payment Management

### 11. Submit Manual Payment Claim

Submit a payment claim for course enrollment.

**Endpoint:** `POST /payments/manual-claim`

**Access:** Authenticated (Students)

**Request Body:**

```json
{
  "courseId": "750e8400-e29b-41d4-a716-446655440002",
  "gateway": "bKash",
  "senderNumber": "01712345678",
  "transactionId": "BKX9283JS1",
  "amountPaid": 4500.0
}
```

**Fields:**

- `courseId` (string, required): Course UUID
- `gateway` (string, required): One of: "bKash", "Nagad", "Rocket"
- `senderNumber` (string, required): Mobile number used for payment
- `transactionId` (string, required): Unique transaction ID from MFS
- `amountPaid` (number, required): Amount paid

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Manual payment processing claim registered. Admin verification pending.",
  "data": {
    "claimId": "c50e8400-e29b-41d4-a716-446655440007",
    "status": "PENDING",
    "transactionId": "BKX9283JS1",
    "amountPaid": 4500.0,
    "submittedAt": "2024-07-16T14:00:00.000Z"
  }
}
```

**Error Response (400 - Duplicate Transaction):**

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Transaction ID already exists"
}
```

**cURL Example:**

```bash
curl -X POST https://api.yourdomain.com/api/v1/payments/manual-claim \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "750e8400-e29b-41d4-a716-446655440002",
    "gateway": "bKash",
    "senderNumber": "01712345678",
    "transactionId": "BKX9283JS1",
    "amountPaid": 4500.00
  }'
```

---

### 12. Verify Payment Claim

Verify and approve/reject a payment claim (Admin only).

**Endpoint:** `PATCH /payments/claims/:claimId/verify`

**Access:** Super Admin, Admin

**Request Body:**

```json
{
  "status": "APPROVED",
  "adminRemarks": "Transaction confirmed on bKash merchant ledger statement matching ledger date."
}
```

**Fields:**

- `status` (string, required): One of: "APPROVED", "REJECTED"
- `adminRemarks` (string, required): Admin notes/comments

**Success Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment verified. Enrollment instance activated.",
  "data": {
    "claimId": "c50e8400-e29b-41d4-a716-446655440007",
    "status": "APPROVED",
    "enrollmentId": "d50e8400-e29b-41d4-a716-446655440008",
    "activatedAt": "2024-07-16T14:30:00.000Z"
  }
}
```

**cURL Example:**

```bash
curl -X PATCH https://api.yourdomain.com/api/v1/payments/claims/c50e8400-e29b-41d4-a716-446655440007/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "adminRemarks": "Transaction verified"
  }'
```

---

## 🔒 Rate Limiting

API has built-in rate limiting:

- **General endpoints:** 10 requests per 60 seconds per IP
- **Login endpoint:** 5 requests per 60 seconds per IP
- **Concurrent connections:** 10 per IP

**Rate Limit Headers:**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1626345600
```

**Rate Limit Exceeded (429 Too Many Requests):**

```json
{
  "success": false,
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

---

## 📊 HTTP Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | OK - Request successful                 |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid input             |
| 401  | Unauthorized - Authentication required  |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource not found          |
| 409  | Conflict - Resource already exists      |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error - Server error    |

---

## 🧪 Testing with Postman

### Import Collection

Create a Postman collection with environment variables:

**Environment Variables:**

```
base_url: https://api.yourdomain.com/api/v1
token: <your_jwt_token_here>
```

**Authentication Header:**

```
Authorization: Bearer {{token}}
```

### Test Flow:

1. Register a user
2. Login and save token
3. Test protected endpoints with token
4. Test admin endpoints with admin token

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all primary keys
- Passwords must be minimum 6 characters
- File uploads limited to 10MB by default
- JSON fields store arrays/objects as JSON
- Boolean values: `true` or `false` (lowercase)
- Decimal numbers: Two decimal places for prices

---

## 🎯 Coming Soon

These endpoints are planned but not yet implemented:

- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course
- `GET /modules/:id` - Get module details
- `PUT /modules/:id` - Update module
- `GET /quizzes/:id` - Get quiz details
- `POST /quizzes/:id/submit` - Submit quiz answers
- `GET /enrollments/my-courses` - Get user's enrolled courses
- `GET /analytics/*` - Analytics endpoints

---

## 📞 Support

For API issues or questions:

- Check application logs
- Review error messages
- Contact: admin@lmsplatform.com

---

**API Version:** 1.0.0  
**Last Updated:** 2024-07-16
