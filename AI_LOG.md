AI Usage Disclosure – Full Transparency

This project was built using AI tools intentionally and responsibly. Below is a complete and honest breakdown of how AI tools were used, what they generated, and what I reviewed or modified.

---

## 1️⃣ Initial Boilerplate – Bolt.new

**Tool Used:** Bolt.new
**Purpose:** Generate initial full-stack boilerplate

I started by using **Bolt.new** to scaffold a basic full-stack application. The generated setup included:

* Basic NestJS backend structure
* MongoDB connection setup
* Basic CRUD operations for tasks
* Initial frontend with simple task listing
* Basic authentication wiring

### What I Reviewed & Modified:

* Refactored folder structure to match modular NestJS best practices
* Rewrote parts of the authentication flow to properly implement JWT strategy
* Implemented proper DTO validation using `class-validator`
* Added role field to the User schema (`admin | member`)
* Removed redundant or unclear boilerplate code
* Cleaned up inconsistent naming and unused dependencies
* Standardized error handling with proper HTTP status codes

Bolt provided a starting structure, but the RBAC logic, permission checks, and architectural clarity were implemented and refined manually.

---

## 2️⃣ UI Enhancements – V0

**Tool Used:** V0
**Purpose:** Improve frontend UI structure and layout

After backend stabilization, I used **V0** to enhance the frontend UI.

Generated/assisted areas:

* Dashboard layout structure
* Card-based task UI
* Sidebar layout
* Auth page UI structure
* Basic component layout ideas

### What I Reviewed & Modified:

* Integrated generated UI into my existing auth flow
* Connected UI to real backend APIs
* Fixed type mismatches
* Adjusted state management to use AuthContext properly
* Ensured RBAC logic reflected correctly in UI
* Removed unnecessary styling complexity
* Simplified components to keep functional clarity over design

V0 was used primarily for UI structure inspiration and scaffolding — business logic and API wiring were manually verified and connected.

---

## 3️⃣ Real-Time Notifications – GitHub Copilot

**Tool Used:** GitHub Copilot
**Purpose:** Assistance while implementing WebSocket logic

Copilot was used inside the editor while writing:

* NestJS WebSocket Gateway setup
* Emitting task update events
* Basic Socket.io client subscription logic

### What I Reviewed & Modified:

* Verified authentication handshake logic
* Ensured only authenticated users could connect
* Cleaned up unnecessary event emissions
* Structured gateway lifecycle correctly
* Ensured events only emitted after successful DB operations
* Refactored naming for clarity and consistency

Copilot accelerated typing and syntax generation but all architectural decisions were made manually.

---

## 4️⃣ Code & Documentation Enhancement – ChatGPT (GPT)

**Tool Used:** ChatGPT
**Purpose:** Refinement, explanation clarity, and documentation polishing

GPT was used for:

* Improving structure of ARCHITECTURE.md
* Enhancing README clarity
* Refining explanation of JWT flow
* Improving trade-offs section
* Reviewing wording and grammar
* Improving code clarity in some service logic

### What I Reviewed & Modified:

* Verified all technical explanations matched actual implementation
* Corrected areas where AI made assumptions
* Removed generic or incorrect boilerplate explanations
* Ensured documentation reflects actual behavior, not theoretical best case

GPT was used as a refinement tool — not as an unchecked code generator.

---

# 🧠 How I Used AI Responsibly

For every AI-generated section:

* I reviewed the code line-by-line
* I tested functionality manually
* I removed unnecessary abstractions
* I ensured I could explain every part in plain language
* I rewrote sections I did not fully understand

No code was blindly copied without review.

---

# ⚖️ What Was Built Independently

The following required manual reasoning and implementation:

* Role-Based Access Control logic (Admin vs Member enforcement)
* Permission checks inside task service methods
* Embedding role in JWT payload
* Guard configuration and decorator wiring
* Database seeding logic
* API filtering logic
* Architectural decision-making
* Error-handling consistency
* Integration between frontend and backend


---

# 🎯 Final Note

AI tools were used as productivity accelerators, not replacements for understanding.

I can explain:

* JWT authentication flow end-to-end
* How Guards work in NestJS
* How RBAC is enforced at API level
* How frontend auth state is maintained
* How WebSocket lifecycle works
* Every schema, DTO, and service method
