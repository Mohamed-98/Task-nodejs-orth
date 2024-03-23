<h2 align="center">Development Challenge, Orthoplex Solutions Inc.</h2>
<h2 align="center">User Management API</h2>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
![view](https://komarev.com/ghpvc/?username=Task-nodejs-orth&color=green&label=view)

</div>

---


## 📝 Table of Contents

- [About](#about)
- [Features](#Features)
- [Getting Started](#getting_started)
- [Running Migrations](#migrations)
- [Running the tests](#tests)
- [API Endpoints](#API_Endpoints)
- [Built Using](#built_using)
- [Author](#author)

## 🧐 About <a name = "about"></a>

This repository contains a User Management API built with Node.js and an SQL database. It allows clients to perform CRUD operations on user data and manage user authentication using JSON Web Tokens (JWT).


## 🤩 Features <a name = "Features"></a>
- Create, retrieve, update, and delete user information.
- Paginated retrieval of users.
- JWT-based authentication system.
- Password hashing with bcrypt.
- Input validation and sanitization.

## 🏁 Getting Started <a name = "getting_started"></a>

### Prerequisites

- Node.js
- MySQL

### Installing

1. Clone the repository:

```
git clone https://github.com/Mohamed-98/Task-nodejs-orth.git
```

2. Navigate to the project directory:

```
cd Task-nodejs-orth
```
3. Install dependencies:
```
npm install
```
4. Set up your `.env` file with the necessary environment variables:

## 🚀 Running Migrations <a name = "migrations"></a>
Before starting the server, it's crucial to prepare your database by running migrations. These migrations set up the necessary tables and schemas in your SQL database, ensuring the application can operate correctly.

## Manual Migration
To run migrations manually, follow these steps:
1. Ensure you have set up your `.env` file with your database credentials as outlined in the Installing section.
2. Run the migration script from the root of your project directory:
```
npm run migrate
```
This command executes the migration scripts defined in migrate.js, creating or updating tables in your database as necessary. You should see a message indicating successful completion of migrations

## ❗❗ Edit the .env file with your database credentials and JWT secret

5. Start the server:
```
node app.js
```

## 🔧 Running the tests <a name = "tests"></a>

To run the automated tests, use:
```
npm test
```

## ❗❗ API Endpoints <a name = "API_Endpoints"></a>

### 🔒 Authentication

- POST `/login` - Log in a user.
- POST `/logout` - Log out a user.
- POST `/token` - Refresh the access token using a valid refresh token.
### Usage

#### Log In
POST `/login`
```
Body:
{
"email": "user@example.com",
"password": "password123"
}
```
#### Log Out
POST `/logout`
```
Body:
{
"refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```
#### Refresh Token

POST `/token`
```
Body:
{
"refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```
Responses for each endpoint will include details specific to their function, such as authentication tokens for the `/login` and `/token` endpoints, and acknowledgment messages for `/logout`.

### Users

- POST `/users` - Create a new user.
- GET `/users` - Retrieve a list of users with pagination.
- GET `/users/:id` - Retrieve details of a specific user.
- PUT `/users/:id` - Update a specific user (superuser only).
- DELETE `/users/:id` - Delete a specific user (superuser only).


## ⛏️ Built Using <a name = "built_using"></a>

- [Node.js](https://nodejs.org/en/) - The JavaScript runtime environment.
- [Express](https://expressjs.com/) - The web application framework.
- [MySQL](https://www.mysql.com/) - The database used.
- [JWT](https://jwt.io/) - For authentication.

## ✍️ Author <a name = "author"></a>

- [@Moahmed-98](https://github.com/Mohamed-98) - Initial work

