# Comprehensive Technical Specification & API Documentation

**Project:** Enterprise Learning Management System (LMS) Platform  
**Target Architecture:** Node.js, NestJS, MongoDB, Redis Caching  
**Target Infrastructure:** Single VPS (4 Cores, 8GB RAM, 100GB NVMe)

---

## 1. Project Architecture & Infrastructure Constraints

To maximize the performance of a single **4 Core, 8GB RAM VPS**, the system architecture adheres to the following paradigms:

1. **Decoupled Video Streaming:** Video transcoding (FFmpeg processing) and delivery are explicitly completely decoupled from the VPS. Videos are uploaded to external secured object storage (e.g., AWS S3 or Bunny.net) and distributed globally via a CDN (e.g., Cloudflare/CloudFront) using **HLS (HTTP Live Streaming)**. The VPS only stores metadata URLs.
2. **Memory Allocation Strategy:**
   - **NestJS App Instance:** Allocated up to ~2.5 GB RAM via PM2 clustering (2-3 cluster instances matching available cores).
   - **MongoDB (Mongoose):** Allocated ~3.5 GB RAM with strict index optimizations to reduce disk I/O.
   - **Redis Cache:** Allocated ~1 GB RAM configured with an `allkeys-lru` eviction policy.
3. **Database Caching Layer:** Redis sits directly in front of MongoDB to cache static, frequently accessed information (e.g., global configurations, course directories, published module timelines). This reduces database lock contention during concurrent traffic peaks.

---

## 2. Role-Based Access Control (RBAC) Hierarchy

The platform isolates system interactions into explicit access levels:

- **Super Admin:** Master system authority. Access to financial/payment approvals, global configurations, administrative user provisioning, audit metrics, and content management.
- **Admin:** Operational authority. Focuses on manual payment clearances, student enrollments, content reviews, and course state alterations.
- **Teacher:** Content creation authority. Restrained to specific assigned courses. Allowed to build modules, upload lecture documents, and publish quiz banks.
- **Student:** Consumer access. Allowed to consume unlocked content, stream optimized video playheads, submit quizzes, and register device sessions.

---

## 3. Global API Specifications

### Base URLs

- **Development Target:** `http://localhost:3000/api/v1`
- **Production Gateway:** `https://api.lmsplatform.com/api/v1`

### Universal Response Standards

All payloads wrap their data nodes inside a standard outer envelope structure for simplified parsing:

#### Success Envelope (2xx)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Action executed successfully",
  "data": {}
}
```

#### Error Envelope (4xx/5xx)

```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Specific error explanation string"
}
```

## 4. Complete API Endpoint Directory

All secured routes require the inclusion of standard HTTP Authorization headers:

```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### Module 4.1: Authentication & Anti-Piracy Device Guard

#### 4.1.1 Authenticate User & Register Device Fingerprint

Authenticates incoming client signatures against the user registry. Enforces active concurrency rules (Maximum 1 Mobile Device and 1 Desktop Browser Session simultaneously). If a limit is exceeded, returns a 403 authorization lock.

**HTTP Method:** POST

**Path:** `/auth/login`

**Headers:**

- `Content-Type: application/json`
- `User-Agent: <Client Browser Platform Signature>`

**Request Payload:**

```json
{
  "email": "student@example.com",
  "password": "SecurePassword123",
  "deviceId": "df7a884c-3e21-49cf-8921-9e7bf331a980",
  "deviceName": "Chrome Browser - Windows 11"
}
```

**Success Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Authentication verified successfully.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NDNmMWIyNWEzZjJiMTEyOWM4YjQ1NjciLCJyb2xlIjoiU3R1ZGVudCJ9...",
    "user": {
      "id": "643f1b25a3f2b1129c8b4567",
      "name": "John Doe",
      "email": "student@example.com",
      "role": "Student"
    },
    "sessionState": {
      "activeSessionsCount": 1,
      "currentSessionId": "sess_89123847"
    }
  }
}
```

**Error Response (403 Forbidden - Security Lock):**

```json
{
  "success": false,
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Active device limit breached. This account is actively bound to another terminal instance. Revoke prior sessions before proceeding."
}
```

### Module 4.2: Course & Content Management

#### 4.2.1 Create Course Module

Initializes a new module partition inside a course shell container.

**HTTP Method:** POST

**Path:** `/courses/:courseId/modules`

**Roles Authorized:** Super Admin, Admin, Teacher

**Request Payload:**

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
    "moduleId": "643f2002a3f2b1129c8b4588",
    "courseId": "643f1fd0a3f2b1129c8b4580",
    "title": "Module 3: Scalable Backend Architecture with NestJS",
    "sequenceOrder": 3,
    "createdAt": "2026-07-09T12:00:00.000Z"
  }
}
```

#### 4.2.2 Upload Lecture Document / Sheet Notes

Streams multi-part structural uploads directly to local buffers before updating external production paths to avoid blocking the single-server Event Loop.

**HTTP Method:** POST

**Path:** `/modules/:moduleId/sheets`

**Roles Authorized:** Super Admin, Admin, Teacher

**Headers:**

- `Content-Type: multipart/form-data`

**Multipart Payload Form Fields:**

- `file`: [Binary PDF Payload]
- `title`: "NestJS Architecture Sheet Blueprint v1"
- `isDownloadable`: true

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Lecture document sheet processed and linked to target module successfully.",
  "data": {
    "sheetId": "643f2115a3f2b1129c8b4599",
    "moduleId": "643f2002a3f2b1129c8b4588",
    "title": "NestJS Architecture Sheet Blueprint v1",
    "fileUrl": "https://cdn.lmsplatform.com/sheets/nestjs-architecture-sheet-blueprint-v1.pdf",
    "isDownloadable": true
  }
}
```

### Module 4.3: Quiz Engine (MCQs)

#### 4.3.1 Append Quiz Question Entry

Appends an automated multiple-choice question schema to a structural quiz template. Supports explicit float parameter values for negative scoring penalty logic.

**HTTP Method:** POST

**Path:** `/quizzes/:quizId/questions`

**Roles Authorized:** Super Admin, Admin, Teacher

**Request Payload:**

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
    "questionId": "643f309fa3f2b1129c8b4610",
    "quizId": "643f3010a3f2b1129c8b4600",
    "questionText": "Which provider token decorator handles cross-module IoC dependency token evaluation within NestJS frameworks?",
    "negativeMarking": 0.25
  }
}
```

### Module 4.4: Manual Payment Clearing & Course Enrollment

#### 4.4.1 Submit Manual Payment Transaction Claim

Submitted by students following out-of-band transfers over local Mobile Financial Services (MFS) like bKash, Nagad, or Rocket. Consumes unique system Transaction IDs (transactionId) to prevent duplicate entry attempts.

**HTTP Method:** POST

**Path:** `/payments/manual-claim`

**Request Payload:**

```json
{
  "courseId": "643f1fd0a3f2b1129c8b4580",
  "gateway": "bKash",
  "senderNumber": "01712345678",
  "transactionId": "BKX9283JS1",
  "amountPaid": 4500.0
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Manual payment processing claim registered. Admin verification pending.",
  "data": {
    "claimId": "643f4001a3f2b1129c8b4700",
    "status": "PENDING",
    "transactionId": "BKX9283JS1",
    "amountPaid": 4500.0
  }
}
```

#### 4.4.2 Resolve Payment Status Verification

Executed by administrators to transition payment claims from a PENDING validation phase to an APPROVED or REJECTED state. Approving the record automatically triggers enrollment hooks.

**HTTP Method:** PATCH

**Path:** `/payments/claims/:claimId/verify`

**Roles Authorized:** Super Admin, Admin

**Request Payload:**

```json
{
  "status": "APPROVED",
  "adminRemarks": "Transaction confirmed on bKash merchant ledger statement matching ledger date."
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment verified. Enrollment instance activated.",
  "data": {
    "claimId": "643f4001a3f2b1129c8b4700",
    "status": "APPROVED",
    "enrollmentId": "643f4150a3f2b1129c8b4722",
    "activatedAt": "2026-07-09T12:53:21.000Z"
  }
}
```

## 5. System Test Documentation & Implementation Guide

To verify application stability under simulated traffic profiles on your single VPS, follow the implementation verification suite details outlined below.

### 5.1 Test Environment Context Verification

Ensure your configurations are set to non-production thresholds before running performance tools:

```bash
# Verify instance memory parameters
node -e "console.log(v8.getHeapStatistics().heap_size_limit / 1024 / 1024)"
```

---

## 6. Conclusion

This comprehensive specification provides the foundation for building a scalable, secure Enterprise Learning Management System optimized for single VPS deployment. The architecture leverages external CDN for video delivery, Redis caching for performance optimization, and MongoDB for flexible data storage while maintaining strict RBAC controls across all operations.
