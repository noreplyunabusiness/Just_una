# rec-una // Core Network Hub

Welcome to the central backbone infrastructure for the **rec-una** revival project. This repository houses the full-stack system architecture combining a dynamic front-end media loop, an Express API backend server, and a cloud-hosted MongoDB database instance.

## 🚀 Current Architecture Features
* **User Registration & Auth:** Secure login and signup engine featuring a custom anti-bot validation key system.
* **Dynamic Community Media Loop:** Interactive feed displaying game captures, server status indicators, and network directives.
* **Automated Web Scraper API:** Integrated `axios` and `cheerio` modules that automatically parse external web links to extract preview image assets on the fly.
* **Engagement Framework:** Real-time, toggleable "Cheers" logging and comment thread injection routed directly to individual document IDs.
* **Cross-Profile Querying:** Interactive public profile modals that fetch user bio tags and server grid timestamps on command.

## 🛠️ Tech Stack & Infrastructure
* **Front-End:** Vanilla HTML5, CSS3 (Custom Dark-Orange Matrix Theme), JavaScript (Fetch API / LocalStorage Session persistence).
* **Back-End:** Node.js, Express.js.
* **Database:** MongoDB Atlas (Mongoose ODM).
* **Hosting Deployment:** Render Web Services.

## 📂 Repository File Structure
* `index.html` — The main user dashboard interface, media feed, profile panels, and authentication modals.
* `server.js` — The API server handling endpoints for authentication, profile states, commenting, cheering, and web scraping.
* `package.json` — System dependencies configuration managing Node.js environment packages.

## 🔮 Future Integration Manifest
This network hub is structurally prepped to hold the line until the primary client framework deployment phase begins. Future updates will bridge this database cluster straight into the custom client build assets.
