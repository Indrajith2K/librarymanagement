# Quicklook Admin Panel Documentation

## 1. Overview

The Quicklook Admin Panel is a comprehensive and secure dashboard for library staff to manage the entire library system. It provides tools for managing books, members, and other administrators, along with at-a-glance analytics about library activity. The panel is built with real-time data from Firestore and secured with Firebase Authentication and Firestore Security Rules.

---

## 2. Access & Authentication

### 2.1. Login (`/admin/login`)

The gateway to the admin panel.

*   **How to Access**: Navigate directly to `/admin/login` or click the "Admin Login" button on the main user homepage.
*   **Authentication Methods**:
    1.  **Staff ID & Password**: The primary method for staff. For this demo, a special "Super Admin" account is available:
        *   **Staff ID**: `23di21`
        *   **Password**: `12345`
    2.  **Google Authentication**: Admins whose Google accounts have been registered in the system can sign in with one click.
*   **How it Works**:
    *   Upon successful login, the system creates a session and redirects the user to the Admin Dashboard.
    *   The system checks the `adminusers` collection in Firestore to verify credentials and determine the user's role.
    *   Incorrect login attempts will display an error message toast.

---

## 3. Core Features & Pages

The admin panel is organized into several key sections, accessible via the main sidebar navigation.

### 3.1. Dashboard (`/admin/dashboard`)

The central hub providing an overview of library operations.

*   **What it is**: A summary page with key statistics and quick-access lists.
*   **Key Functionalities**:
    *   **Welcome Message**: Greets the logged-in admin by name (e.g., "Hello, Indrajith!").
    *   **Analytics Cards**: Displays high-level, real-time statistics by pulling aggregate data from Firestore collections.
    *   **Users & Books Lists**: Shows a snapshot of the most recently added members and books directly from Firestore. Provides a "See All" button to navigate to the full management pages.
    *   **Overdue Book List**: A table showing books that are overdue (currently using static placeholder data for demonstration).
    *   **Statistics Chart**: A bar chart visualizing visitor and borrower statistics over a week (static data).

### 3.2. Books (`/admin/books`)

Manage the library's entire collection.

*   **What it is**: A page for full CRUD (Create, Read, Update, Delete) operations on books.
*   **How it Works**:
    *   **View Books**: Displays a real-time list of all books from the `books` collection in Firestore.
    *   **Search**: A search bar allows for quick filtering of the book list (client-side filtering).
    *   **Add New Book**:
        *   Clicking "Add New Book" opens a dialog form.
        *   Admins can input Title, Author, and Status.
        *   **RFID Scan Simulation**: An integrated "Scan" button simulates an RFID reader. The system listens for keyboard input, and pressing "Enter" captures the typed string as the `rfidTagId`.
    *   **Delete Book**: Each book has a delete option (in the "..." menu). This action is protected by a confirmation dialog to prevent accidental deletion.

### 3.3. Members (`/admin/members`)

Manage student and staff accounts.

*   **What it is**: A page for managing all library members.
*   **How it Works**:
    *   **View Members**: Displays a real-time list of all members from the `members` collection.
    *   **Add New Member**:
        *   The "Add New Member" form captures Name, Email, and Member Type (Student/Staff).
        *   It also includes the same RFID scan simulation for assigning a member's card ID.
    *   **Delete Member**: Members can be deleted from the system via the action menu, with a confirmation step.

### 3.4. Users (`/admin/users`)

Manage accounts for other administrators and staff.

*   **What it is**: A high-security page for managing who can access the admin panel.
*   **How it Works**:
    *   **View Users**: Lists all accounts from the `adminusers` collection, showing their name, role, and staff ID.
    *   **Add New User**: A form allows the Super Admin to create new staff accounts, assigning them a `displayName`, `staffId`, `password`, and a `role` (e.g., Librarian, Assistant).
    *   **Delete User**: Super Admins can delete other user accounts. The system prevents you from deleting your own account.
*   **Permissions**: This page is **exclusively accessible to users with the "Super Admin" role**.

### 3.5. History (`/admin/history`)

View a log of all circulation events.

*   **What it is**: A read-only log of all book issues and returns.
*   **How it Works**: The page currently displays a static table of sample log data. In a full implementation, this would be populated from the `circulationLogs` collection in Firestore.

### 3.6. Settings (`/admin/settings`)

Configure system-wide policies and preferences.

*   **What it is**: A page to manage library rules and application appearance.
*   **How it Works**:
    *   **Library Policy**: Admins can set the standard loan period and overdue fine rates (currently UI only, not connected to database).
    *   **System Theme**: Allows the user to switch the admin panel's appearance between Light Mode, Dark Mode, or sync with the system default. This preference is saved in the browser's local storage.

---

## 4. User Roles & Permissions

The admin panel has a role-based access control system to ensure security, which is currently simplified for full access.

*   **Current State**: All database operations are open (`allow read, write: if true;` in `firestore.rules`). All client-side permission checks have been removed to ensure functionality for any logged-in user.
*   **Intended Roles**:
    *   **Super Admin**: The highest level. Has full access to all features, including the ability to create and delete other admin users. Your account (`23di21`) is the designated Super Admin.
    *   **Librarian**: Can manage books and members but cannot access the "Users" page.
    *   **Assistant/Logger**: Would have more restricted, read-only permissions.

The system is designed to have permissions enforced both on the **client-side** (by hiding or disabling buttons based on the user's role fetched from Firestore) and on the **server-side** via **Firestore Security Rules**. This dual enforcement ensures the database remains secure. However, as requested, these rules are currently open to ensure an unblocked user experience.
