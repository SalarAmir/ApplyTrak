### ApplyTrak
ApplyTrak is a Chrome extension designed to help users track internship application emails. It integrates with Gmail to monitor sent emails and detect responses, providing a simple interface to manage application statuses. The backend is powered by Fastify and Supabase, enabling secure storage and retrieval of email data.

Key Features
Gmail Integration: Authenticate with Gmail to track sent emails and check for responses.
Email Tracking: Automatically monitor internship application emails and update their status (e.g., "Sent", "Response Received").
React Chrome Extension: A user-friendly frontend built with React to display tracked emails.
REST API: Manage email records via a Fastify-based API with endpoints for adding, fetching, and deleting emails.
Supabase Backend: Store email and token data securely in a Supabase database.
Technologies
Frontend: React, Chrome Extension API
Backend: Fastify, Node.js
Database: Supabase
APIs: Gmail API, Google OAuth 2.0
