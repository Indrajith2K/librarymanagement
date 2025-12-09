# Quicklook Application Documentation

## 1. Overview

Quicklook is an RFID-based smart AI library management system designed to streamline the book check-in and check-out process. It features a simple, user-friendly interface for students and a separate, secure dashboard for administrators.

---

## 2. Implemented Features

### 2.1. Main User Flow

The primary interface for students is designed for quick and easy interaction.

- **ID Scan Simulation**: The homepage prompts users to "Scan your ID card." This simulates an RFID scan by capturing keyboard input. Pressing the "Enter" key after typing anything will trigger a "Verified" confirmation screen.
- **Check-in & Check-out Options**: After successful verification, the user is presented with two main actions: "Check In" and "Check Out".
  - These actions are displayed as large, clickable cards.
  - Clicking either option opens a confirmation dialog to prevent accidental submissions.
- **Book Search**: A prominent search bar is available for users to find books within the library system.
- **About Section**: A brief description explains the purpose and functionality of the Quicklook system.

### 2.2. Dedicated Pages

- **Check-in Confirmation (`/check-in`)**: A simple page confirming a successful check-in, with a button to return to the home screen.
- **Check-out Confirmation (`/check-out`)**: A similar page confirming a successful check-out.
- **Focused UI**: The check-in, check-out, and admin login pages have had their navigation bars removed to provide a more focused, distraction-free user experience.

### 2.3. Admin Section

A secure area for library staff to manage the system.

- **Admin Login Page (`/admin/login`)**:
  - Accessible via the "Admin Login" button on the main page.
  - Features a clean interface with a profile icon, and fields for "Staff ID" and "Password".
  - **Dummy Credentials**: For demonstration purposes, the login is hardcoded with the following credentials:
    - **Staff ID**: `23di21`
    - **Password**: `12345`
  - An error toast message is displayed for incorrect login attempts.
- **Admin Dashboard (`/admin/dashboard`)**:
  - A private dashboard accessible only after a successful admin login.
  - **Dedicated Header**: Features a unique floating header with a "Logout" button that redirects the admin to the homepage.
  - **Summary Cards**: Displays key statistics at a glance:
    - **Total Books Available**: Shows the total count of books ready for checkout.
    - **Books with Students**: Shows the number of books currently checked out.
    *(These cards currently display static placeholder data.)*

### 2.4. UI & UX Enhancements

- **Floating Navigation Bars**: The application features a consistent, modern floating navigation bar design.
  - Both the main user-facing header and the admin dashboard header are styled as centered, rounded components that float over the page content.
  - Spacing and alignment have been carefully adjusted to create a clean and professional look.
- **Responsive Design**: The components and layouts are built to be responsive and work across different screen sizes.
- **Component-Based Architecture**: The UI is built using reusable React components with ShadCN UI and Tailwind CSS for a consistent and maintainable codebase.

---

This document summarizes the current state of the Quicklook application. We have built a solid foundation with a clear user flow and a secure admin section.