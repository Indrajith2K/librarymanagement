# Quicklook - Smart AI Library Management System

![Quicklook Admin Dashboard](https://raw.githubusercontent.com/firebase/studio-examples/main/quicklook-readme-preview.png)

Quicklook is a modern, RFID-based smart library management system designed to streamline the book circulation process for both students and administrators. Built with a clean, user-friendly interface, it leverages a powerful tech stack including Next.js, Firebase, and Tailwind CSS to deliver a fast, real-time, and scalable solution for libraries.

---

## ✨ Features

### 👤 Student / User-Facing Interface
- **Simulated RFID Scan**: The primary homepage simulates an RFID card reader, allowing users to "scan" their ID card to begin.
- **Intuitive Actions**: After verification, users are presented with clear options to **Issue** or **Return** books.
- **Dedicated Workflows**:
  - **/issue**: A focused page for issuing books, featuring a real-time list of available books from Firestore and an RFID scanner simulation to build a checkout list.
  - **/return**: A similar page for returning books, showing all currently issued items.
- **Seamless Experience**: Confirmation dialogs prevent accidental actions, and success pages provide clear feedback after a transaction.

### 🔐 Admin Panel
A comprehensive and secure dashboard for library staff to manage the entire system.

- **Secure Authentication**: Admins can log in via **Google Authentication** or a traditional **Staff ID and Password**. The system is secured with Firebase Auth and Firestore Security Rules.
- **Main Dashboard (`/admin/dashboard`)**:
  - **At-a-Glance Analytics**: Displays key library statistics.
  - **Live Data**: Shows real-time lists of members and books directly from Firestore.
- **📚 Book Management (`/admin/books`)**:
  - Full CRUD functionality for the library's collection.
  - Add new books with a detailed form, including a simulated RFID tag scanner for easy input.
  - View, search, and delete existing books.
- **👥 Member Management (`/admin/members`)**:
  - Manage student and staff accounts.
  - Add new members with details like name, email, member type, and an optional RFID card scan.
  - View and delete member accounts.
- **⚙️ User & Role Management (`/admin/users`)**:
  - **Super Admin exclusive**: A secure page for managing other admin and staff accounts.
  - Create new users with specific roles (e.g., Librarian, Assistant).
  - Delete user accounts.
- **📜 Circulation History (`/admin/history`)**: (Coming Soon) A complete log of all circulation events (issues, returns).
- **🔧 System Settings (`/admin/settings`)**: Configure library policies like loan periods, fines, and system-wide preferences like theme switching (Light/Dark/System).

---

## 🚀 Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI**: [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore) (Real-time, NoSQL)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) (Password-based & Google Provider)
- **State Management**: React Context API and custom hooks
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🛠️ Getting Started

This project is configured to run in a cloud development environment. To run it locally, follow these steps:

### Prerequisites
- Node.js (v18 or later)
- A Firebase project with Firestore and Authentication enabled.

### 1. Set Up Firebase
1. Create a project on the [Firebase Console](https://console.firebase.google.com/).
2. In your project, go to **Project Settings** > **General**.
3. Under "Your apps", click the **Web** icon (`</>`) to create a new web app.
4. Copy the `firebaseConfig` object provided.
5. Paste this object into `src/firebase/config.ts`.

### 2. Install Dependencies
Clone the repository and install the necessary packages:
```bash
npm install
```

### 3. Run the Development Server
Start the Next.js development server:
```bash
npm run dev
```
The application will be available at `http://localhost:9002`.

### 4. Admin Access
To access the admin panel, you first need to create a "Super Admin" account.
- For this demo, the Super Admin is hardcoded with the **Staff ID**: `23di21` and **Password**: `12345`. The system will automatically create this user document in Firestore on the first login if it doesn't exist.
- Navigate to `/admin/login` and use these credentials to get started.
- Once logged in, you can use the **Users** page to create other admin accounts.
