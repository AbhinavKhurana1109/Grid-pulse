# **App Name**: GridPulse

## Core Features:

- Secure User Authentication: User login via Google Sign-In to protect individual datasets and enable cross-device synchronization.
- Live 10x10 Matrix Interaction: A responsive 100-box grid numbered 01 to 100, where each cell displays a persistent index in the top-left and a large, neon-blue value in the center.
- Firestore Real-time Synchronization: Instant cloud storage and real-time data sync using Firestore to ensure grid values are never lost and update across all active sessions.
- Dynamic Calculation Engine: Automated logic that calculates row-level totals on the right side and a cumulative grand total at the base of the grid in real-time.
- Futuristic Command Panel: A specialized input dashboard at the bottom of the screen featuring Box Number and Value inputs with dedicated buttons for Adding, Updating, and Clearing data.
- Export & Print Studio: One-tap utility to export the entire grid as a high-resolution PNG image or generate a print-optimized document layout.
- AI Insight Synthesis Tool: An LLM tool that analyzes the grid's numerical distribution to reason about patterns and generate a statistical trend summary for the user.
- Offline Resiliency Mode: Local storage backup and offline support that caches data and syncs with Firestore once a connection is re-established.
- Global Search & Pulse Highlighting: Search functionality to locate specific box numbers instantly, paired with visual 'pulse' animations to highlight updated cells.

## Style Guidelines:

- Primary: Midnight Space Navy (#0B1120). Accents: Neon Cyan (#3ABFF8) and glowing Aquamarine (#2DD4BF) for interactive elements.
- Dark Mode: A deep, high-contrast palette with soft glows and translucent layers to maintain a premium dashboard feel.
- Headlines and box indices use 'Space Grotesk' for a technical look; UI inputs and data use 'Inter' for maximum readability.
- Thin-stroke, vector-based icons with subtle neon outer glows to match the dashboard's technological aesthetic.
- Precision 10x10 grid with glassmorphism effects, including blurred backgrounds and ultra-thin white border-strokes.
- Fluid UI transitions with 'pulse' scale-up animations on cell updates and smooth hover states for the command panel buttons.