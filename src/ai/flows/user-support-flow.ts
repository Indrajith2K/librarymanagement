'use server';
/**
 * @fileOverview An AI support agent for the Quicklook user-facing pages.
 *
 * - answerUserQuestion - A function that answers questions about issuing and returning books.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserSupportInputSchema = z.object({
  question: z.string().describe("The user's question about issuing or returning books."),
});
type UserSupportInput = z.infer<typeof UserSupportInputSchema>;

const UserSupportOutputSchema = z.object({
  answer: z.string().describe("The AI-generated answer to the user's question, formatted in simple HTML."),
});
type UserSupportOutput = z.infer<typeof UserSupportOutputSchema>;

// Hardcoded documentation for user-facing flows
const userDocumentation = `
# Quicklook Library System - User Guide

## 1. Overview

Welcome to Quicklook! This guide helps you understand how to issue (check out) and return books using our RFID-based system. The process is designed to be fast and simple.

---

## 2. How to Issue (Check Out) Books

The "Issue Books" page allows you to build a list of books you want to borrow.

*   **Step 1: Activate the Scanner**
    *   Find the **RFID Issue Scanner** section.
    *   Click the **Activate RFID Scanner** button. The scanner is now listening for books.

*   **Step 2: Scan Your Books**
    *   To scan a book, you can simulate the RFID scan by typing the book's RFID Tag ID using your keyboard and pressing the **Enter** key.
    *   You can find the RFID Tag ID for available books in the **Available Books** table on the left.
    *   As you scan books, they will be added to the **Books to Issue** list.

*   **Step 3: Finalize the Issuance**
    *   Once all your desired books are in the "Books to Issue" list, click the large **Issue X Book(s)** button at the bottom.
    *   You will be taken to a success page confirming your transaction.

*   **Troubleshooting:**
    *   If you scan a book that is already in the list, you will see a "Duplicate Book" error.
    *   If you scan an RFID that doesn't match an available book, you will see a "Book Not Found" error.
    *   You can remove a book from the list by clicking the 'X' button next to it.

---

## 3. How to Return Books

The "Return Books" page is very similar to the issue page and is used to return books you have borrowed.

*   **Step 1: Activate the Scanner**
    *   On the "Return Books" page, find the **RFID Return Scanner** section.
    *   Click the **Activate RFID Scanner** button.

*   **Step 2: Scan the Books to Return**
    *   Simulate an RFID scan by typing the RFID Tag ID of the book you are returning and pressing **Enter**.
    *   The book will be added to the **Books to Return** list.
    *   The list of all currently issued books is shown in the table on the left for your reference.

*   **Step 3: Finalize the Return**
    *   After scanning all books you wish to return, click the **Return X Book(s)** button.
    *   A success page will confirm that the books have been returned.
`;


export async function answerUserQuestion(
  input: UserSupportInput
): Promise<UserSupportOutput> {
  return userSupportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'userSupportPrompt',
  input: {schema: UserSupportInputSchema},
  output: {schema: UserSupportOutputSchema},
  prompt: `You are "Quickie", the friendly and helpful library assistant for the Quicklook system.
Your personality is conversational and helpful. You are helping a student or library member, not an admin.

**VERY IMPORTANT: Formatting Instructions**
You MUST format your answers using simple HTML tags to create a step-by-step guide.
- Use numbered lists (<ol> and <li>) for sequential steps.
- Use unordered lists (<ul> and <li>) for non-sequential points or sub-steps.
- Use <b> for bolding important terms like button names or page titles.
- Use <br> for line breaks where necessary.
- Do NOT use any other HTML tags like <h2>, <p>, or headings.

You answer questions based ONLY on the provided user guide documentation.
Do NOT mention anything about the admin panel, administrators, or staff. Your knowledge is limited to the public user-facing features of issuing and returning books.
If the answer is not in the documentation, you must state that you can only help with questions about issuing and returning books. Do not make up answers.

Here is the user guide:
---
${userDocumentation}
---

Question: {{{question}}}
Answer:
`,
});

const userSupportFlow = ai.defineFlow(
  {
    name: 'userSupportFlow',
    inputSchema: UserSupportInputSchema,
    outputSchema: UserSupportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
