# Mengede - Addis Ababa Transit Network

Mengede is a modern, full-stack web application designed to digitize and streamline the discovery of informal minibus transit hubs and routes across Addis Ababa and its neighboring commuter towns. 

By bridging the gap between physical transit infrastructure and digital accessibility, Mengede provides a frictionless public interface for commuters to discover routes, coupled with a secured, decoupled REST API and an administrative moderation hub for managing geographical transit data.

### ✨ Key Features
* **Zero-Login Public Map:** A frictionless, interactive map allowing commuters to search and view transit terminals, routes, and fares instantly without an account.
* **Community Issue Reporting:** A crowdsourced feedback loop allowing public users to report incorrect fares, relocated terminals, or missing routes directly from the map.
* **Secure Admin Moderation Hub:** A protected dashboard for administrators to manage geographical coordinates, curate routes, and resolve community reports.
* **Localized Geospatial Search:** Debounced Mapbox autocomplete geocoding, strictly bounded to the Greater Addis Ababa region to ensure high geographical accuracy.
* **Resilient Routing:** Advanced error handling and coordinate validation for Mapbox routing anomalies to ensure the map remains functional and visually clean.

### 🛠 Tech Stack
* **Frontend:** React, Tailwind CSS, react-hot-toast, Mapbox GL JS
* **Backend:** Node.js, Express.js, JSON Web Tokens (JWT), express-rate-limit
* **Database:** PostgreSQL (hosted on Supabase), Prisma ORM
* **Deployment:** Vercel (Frontend SPA), Render (Backend API)

### 👨💻 Developer
**Abel Hadush** (CTC-1889-26)
* **Role:** Solo Developer (End-to-End Full-Stack Development including UI/UX, Mapbox integrations, Node/Express API, and PostgreSQL/Prisma database architecture).

### 📚 Project Resources
* **Live Site:** [https://mengede.vercel.app](https://mengede.vercel.app)
* **Project Documentation:** [View Project Report](https://drive.google.com/file/d/1ApSqd5fthc4w3lIzHg6O7KA-i4-exvVs/view?usp=drive_link)
* **Video Demonstration:** [Watch Video Demo](https://drive.google.com/file/d/1XpZqd5fthc4w3lIzHg6O7KA-i4-exvVs/vew?usp=sharing)
