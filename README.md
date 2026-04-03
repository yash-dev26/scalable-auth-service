# 🔐 Scalable Auth Service

A production-ready authentication microservice built with Node.js, Express, and MongoDB.
Designed with scalability, security, and real-world backend patterns in mind.

---

## 🚀 Features

* 🔑 JWT-based authentication (Access + Refresh Tokens)
* 🔄 Secure refresh token rotation
* 📱 Multi-device session management
* 📱 Logout & Logout From All Devices
* 🔐 Password hashing using Argon2
* 📧 OTP Authentication: Email/OTP Verification Flow
* 🔁 Forgot & Reset password flow
* 🚫 Rate limiting (brute-force protection)
* 🧹 OTP expiry + auto cleanup (TTL index)
* 🔒 Session revocation (logout single/all devices)

---

## 🏗️ Architecture

This project follows a clean layered architecture:

```
Routes → Controller → Service → Repository → Database
```

* **Controller** → Handles HTTP requests/responses
* **Service** → Core business logic
* **Repository** → Database abstraction
* **Models** → MongoDB schemas

---

## 📂 Project Structure

```
src/
├── config/        # DB, server, mailer, rate limiter configs
├── controller/    # Route controllers
├── model/         # Mongoose schemas (User, Session, OTP)
├── repository/    # DB interaction layer
├── routes/        # API routes (v1)
├── service/       # Business logic
└── index.js       # Entry point
```

---

## ⚙️ Tech Stack

* Node.js
* Express
* MongoDB + Mongoose
* Argon2 (password hashing)
* JWT (authentication)
* Nodemailer (email service)
* express-rate-limit (security)

---

## 🔑 Authentication Flow

### 1. Register

* User registers with email & password
* OTP is sent to email
* Account marked unverified

### 2. Verify OTP

* OTP is verified
* Account becomes verified
* Access + Refresh tokens issued

### 3. Login

* Valid credentials required
* Session created per device
* Tokens issued

### 4. Refresh Token

* Uses HTTP-only cookie
* Rotates refresh token securely

### 5. Logout

* Revokes current session

### 6. Logout All

* Revokes all sessions across devices

---

## 🔐 Password Reset Flow

1. User requests password reset
2. OTP sent to email
3. OTP verified
4. New password set
5. All sessions revoked

---

## 📡 API Endpoints

### Auth Routes (`/api/v1/auth`)

| Method | Endpoint           | Description            |
| ------ | ------------------ | ---------------------- |
| POST   | `/register`        | Register user          |
| POST   | `/verify-otp`      | Verify account         |
| POST   | `/login`           | Login user             |
| GET    | `/me`              | Get current user       |
| POST   | `/refresh-token`   | Refresh access token   |
| POST   | `/logout`          | Logout current session |
| POST   | `/logout-all`      | Logout all sessions    |
| POST   | `/forgot-password` | Send reset OTP         |
| POST   | `/reset-password`  | Reset password         |

---

## 🔐 Security Features

* Passwords hashed using **Argon2**
* Refresh tokens stored as **hashed values**
* OTPs hashed + expiry enforced
* Rate limiting on sensitive routes
* HTTP-only cookies for refresh tokens
* Session tracking (IP + user agent)
* Token expiration:

  * Access Token → 15 minutes
  * Refresh Token → 7 days

---

## 🧪 Environment Variables

Create a `.env` file:

```
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_USER=your_email
```

---

## ▶️ Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the server

```bash
npm run dev
```

### 3. Test API

```
http://localhost:3000/api/v1/auth
```

---

## 🧠 Key Design Decisions

* **Stateless access tokens** for scalability
* **Session-based refresh tokens** for control
* **Hashing sensitive data** (passwords, OTPs, tokens)
* **Rate limiting** to prevent abuse
* **Layered architecture** for maintainability

---

## 📈 Future Improvements

* Role-based access control (RBAC)
* Email queue (BullMQ / Kafka)

---

## 🏁 Summary

This project demonstrates a **production-grade authentication system** with:

* Strong security practices
* Scalable architecture
* Real-world auth flows

---

