'use server';
/**
 * @fileOverview An AI support agent for the Quicklook Admin Panel.
 *
 * - answerAdminQuestion - A function that answers questions about the admin panel.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminSupportInputSchema = z.object({
  question: z.string().describe("The user's question about the admin panel."),
});
type AdminSupportInput = z.infer<typeof AdminSupportInputSchema>;

const AdminSupportOutputSchema = z.object({
  answer: z.string().describe("The AI-generated answer to the user's question, formatted in simple HTML."),
});
type AdminSupportOutput = z.infer<typeof AdminSupportOutputSchema>;

// Hardcoded documentation content
const adminDocumentation = `
# Quicklook Admin Panel Documentation

## 1. Overview

The Quicklook Admin Panel is a comprehensive and secure dashboard for library staff to manage the entire library system. It provides tools for managing books, members, and other administrators, along with at-a-glance analytics about library activity. The panel is built with real-time data from Firestore and secured with Firebase Authentication and Firestore Security Rules.

---

## 2. Access & Authentication

### 2.1. Login (\`/admin/login\`)

The gateway to the admin panel.

*   **How to Access**: Navigate directly to \`/admin/login\` or click the "Admin Login" button on the main user homepage.
*   **Authentication Methods**: Can be logged in via Google Auth or Staff ID/Password.
*   **How it Works**:
    *   Upon successful login, the system creates a session and redirects the user to the Admin Dashboard.
    *   The system checks the \`adminusers\` collection in Firestore to verify credentials and determine the user's role.
    *   Incorrect login attempts will display an error message toast.

---

## 3. Core Features & Pages

The admin panel is organized into several key sections, accessible via the main sidebar navigation.

### 3.1. Dashboard (\`/admin/dashboard\`)

The central hub providing an overview of library operations.

*   **What it is**: A summary page with key statistics and quick-access lists.
*   **Key Functionalities**:
    *   **Welcome Message**: Greets the logged-in admin by name (e.g., "Hello, Indrajith!").
    *   **Analytics Cards**: Displays high-level, real-time statistics by pulling aggregate data from Firestore collections.
    *   **Users & Books Lists**: Shows a snapshot of the most recently added members and books directly from Firestore. Provides a "See All" button to navigate to the full management pages.
    *   **Overdue Book List**: A table showing books that are overdue (currently using static placeholder data for demonstration).
    *   **Statistics Chart**: A bar chart visualizing visitor and borrower statistics over a week (static data).

### 3.2. Books (\`/admin/books\`)

Manage the library's entire collection.

*   **What it is**: A page for full CRUD (Create, Read, Update, Delete) operations on books.
*   **How it Works**:
    *   **View Books**: Displays a real-time list of all books from the \`books\` collection in Firestore.
    *   **Search**: A search bar allows for quick filtering of the book list (client-side filtering).
    *   **Add New Book**:
        *   Clicking "Add New Book" opens a dialog form.
        *   Admins can input Title, Author, and Status.
        *   **RFID Scan Simulation**: An integrated "Scan" button simulates an RFID reader. The system listens for keyboard input, and pressing "Enter" captures the typed string as the \`rfidTagId\`.
    *   **Delete Book**: Each book has a delete option (in the "..." menu). This action is protected by a confirmation dialog to prevent accidental deletion.

### 3.3. Members (\`/admin/members\`)

Manage student and staff accounts.

*   **What it is**: A page for managing all library members.
*   **How it Works**:
    *   **View Members**: Displays a real-time list of all members from the \`members\` collection.
    *   **Add New Member**:
        *   The "Add New Member" form captures Name, Email, and Member Type (Student/Staff).
        *   It also includes the same RFID scan simulation for assigning a member's card ID.
    *   **Delete Member**: Members can be deleted from the system via the action menu, with a confirmation step.

### 3.4. Users (\`/admin/users\`)

Manage accounts for other administrators and staff.

*   **What it is**: A high-security page for managing who can access the admin panel.
*   **How it Works**:
    *   **View Users**: Lists all accounts from the \`adminusers\` collection, showing their name, role, and staff ID.
    *   **Add New User**: A form allows the Super Admin to create new staff accounts, assigning them a \`displayName\`, \`staffId\`, \`password\`, and a \`role\` (e.g., Librarian, Assistant).
    *   **Delete User**: Super Admins can delete other user accounts. The system prevents you from deleting your own account.
*   **Permissions**: This page is **exclusively accessible to users with the "Super Admin" role**.

### 3.5. History (\`/admin/history\`)

View a log of all circulation events.

*   **What it is**: A read-only log of all book issues and returns.
*   **How it Works**: The page currently displays a static table of sample log data. In a full implementation, this would be populated from the \`circulationLogs\` collection in Firestore.

### 3.6. Settings (\`/admin/settings\`)

Configure system-wide policies and preferences.

*   **What it is**: A page to manage library rules and application appearance.
*   **How it Works**:
    *   **Library Policy**: Admins can set the standard loan period and overdue fine rates (currently UI only, not connected to database).
    *   **System Theme**: Allows the user to switch the admin panel's appearance between Light Mode, Dark Mode, or sync with the system default. This preference is saved in the browser's local storage.

---

## 4. User Roles & Permissions

The admin panel has a role-based access control system to ensure security, which is currently simplified for full access.

*   **Current State**: All database operations are open (\`allow read, write: if true;\` in \`firestore.rules\`). All client-side permission checks have been removed to ensure functionality for any logged-in user.
*   **Intended Roles**:
    *   **Super Admin**: The highest level. Has full access to all features, including the ability to create and delete other admin users. The account with staffId \`23di21\` is the designated Super Admin.
    *   **Librarian**: Can manage books and members but cannot access the "Users" page.
    *   **Assistant/Logger**: Would have more restricted, read-only permissions.
`;


export async function answerAdminQuestion(
  input: AdminSupportInput
): Promise<AdminSupportOutput> {
  return adminSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminSupportPrompt',
  input: {schema: AdminSupportInputSchema},
  output: {schema: AdminSupportOutputSchema},
  prompt: `You are "Quickie", the friendly and helpful support assistant for the Quicklook Admin Panel.
Your personality is conversational and helpful.

**VERY IMPORTANT: Formatting Instructions**
You MUST format your answers using simple HTML tags to create a step-by-step guide.
- Use numbered lists (<ol> and <li>) for sequential steps.
- Use unordered lists (<ul> and <li>) for non-sequential points or sub-steps.
- Use <b> for bolding important terms like button names or page titles.
- Use <br> for line breaks where necessary.
- Do NOT use any other HTML tags like <h2>, <p>, or headings.

Example of a good response:
"Here's how to add a new book:<br><ol><li><b>Open the Admin Books Page</b><br>Go to /admin/books in your browser.</li><li><b>Click 'Add New Book'</b><br>On the Books page, find and click the <b>Add New Book</b> button.</li><li><b>Fill in Book Details</b></li></ol>"

You answer questions based ONLY on the provided documentation.
If the answer is not in the documentation, you must state that you don't have that information. Do not make up answers.
If a question is ambiguous (like asking to 'add a user', which could mean an admin user or a library member), explain both options clearly based on the documentation.

Here is the documentation:
---
${adminDocumentation}
---

Question: {{{question}}}
Answer:
`,
});

const adminSupportFlow = ai.defineFlow(
  {
    name: 'adminSupportFlow',
    inputSchema: AdminSupportInputSchema,
    outputSchema: AdminSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
