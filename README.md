# EduAid Portal

A Government of India Initiative Simulator designed to help students discover and apply for scholarships, access benefits, and manage their documents seamlessly.

## Prerequisites
Before you begin, ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (Version 16 or higher recommended)
- [Git](https://git-scm.com/) (Optional: only needed if cloning the repository)

## How to Download
If the code is hosted on a Git repository, you can clone it using your terminal:
```bash
git clone <repository_url>
cd Miniproject-main
```
If you downloaded a ZIP file instead, extract it and navigate into the root project folder in your terminal.

## Setup & Running the Application

This project is split into two separate servers: the `backend` API and the `frontend` React application. **You will need to run both concurrently in two separate terminal windows.**

### 1. Start the Backend Server
Open a new terminal window, navigate into the project directory, and run the following commands:

```bash
# Navigate to the backend directory
cd backend

# Install the necessary dependencies
npm install

# Start the server
npm start
```
*The backend should successfully start and run on `http://localhost:5000`.*

### 2. Start the Frontend Application
Open a **second** terminal window, navigate into the project directory, and run the following commands:

```bash
# Navigate to the frontend directory
cd frontend

# Install the necessary dependencies
npm install

# Start the React application
npm start
```
*The frontend development server will launch and automatically open your default browser at `http://localhost:3000`.*

## Troubleshooting
- **Port already in use**: If either port 5000 or 3000 is already in use by another application on your PC, you can either stop that application or modify the ports in the respective `package.json` / `.env` files.
- **Dependency Errors**: Try deleting the `node_modules` folder in both directories and re-running `npm install`.
