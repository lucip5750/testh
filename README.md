# LMDB Streaming NodeJS Server

This project is a simple NodeJS HTTP server that streams all entries from an LMDB store using [lmdb-js](https://github.com/DoctorEvidence/lmdb-js). Entries are streamed as JSON, with proper handling of network back-pressure and client disconnects.

## Features
- Streams all LMDB entries as a JSON array
- Handles network back-pressure (pauses/resumes streaming as needed)
- Cleans up if the client disconnects
- Includes a script to seed the database with mock data

## Installation

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Seed the database with mock data**
   ```sh
   node seed.js
   ```

4. **Start the server**
   ```sh
   node server.js
   ```

5. **Fetch all entries**
   Open your browser or use `curl`/Postman to visit:
   ```
   http://localhost:3000/entries
   ```
   You will receive a streamed JSON array of all entries in the LMDB store.

## Project Structure
- `server.js` — Main HTTP server
- `seed.js` — Script to populate the LMDB store with mock data
- `data/` — LMDB database files (auto-created)

## Notes
- `node_modules` is excluded from git via `.gitignore`.
- To add more mock data, edit `seed.js` and re-run it.

## Requirements
- Node.js 16 or higher

---

Feel free to modify and extend this project as needed! 