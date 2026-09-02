# Shifting Orbits Foundation - Unified Student Lifecycle & Career Readiness Platform

Backend platform for **Shifting Orbits Foundation (SOF)** supporting students across the **Sethu Program (Grades 11-12)** and **Stambha Program (Higher Education & Career Readiness)**.

## Key Features
- **Student 360° Profile**: Unified view of academics, attendance, skills, goals, and interactions.
- **Rule-based Support Priority Scoring**: 5-signal weighted evaluation to detect early student support needs.
- **Real-Time Communication**: WebSocket / Socket.IO notifications for urgent support requests and follow-ups.
- **AI Career & Coordinator Assistance**: Context-grounded career Q&A, note summarization, skill gap analysis, and natural language search.
- **Role-Based Access Control**: Secure token lifecycle (JWT + refresh token rotation) with RBAC for Students, Coordinators, and Admins.

## Tech Stack
- **Runtime**: Node.js (v22+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time**: Socket.IO
- **Validation**: Zod
- **Testing**: Jest + Supertest + In-Memory MongoDB
