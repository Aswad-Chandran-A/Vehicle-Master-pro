🚛 Vehicle Master: RTO Compliance Portal
-------------------------------------------------

Executive Summary

Vehicle Master is a strategic compliance management solution tailored for the Indian logistics sector. It eliminates the manual overhead of tracking vehicle legalities by synchronizing with the Vahan RTO database. This system ensures fleet managers stay ahead of document expirations, avoiding heavy penalties and operational downtime.

The Problem
Fleet managers (like Rajesh) struggle with manual spreadsheet tracking for hundreds of trucks. Missing an insurance or PUC renewal leads to immediate grounding and legal fines.

The Solution
A technical framework that provides:

Automated Verification: Real-time data sync with RTO records.

Proactive Risk Management: Color-coded compliance status and automated alerts.

Audit-Ready Infrastructure: A secure digital vault for all legal paperwork.

📂 Master Documentation Index
For a comprehensive view of all project artifacts, including the Requirement Traceability Matrix (RTM), Data Dictionary, and Stakeholder Matrix, please refer to the master sheet below:

[!IMPORTANT]
🔗 View Master Project Documentation (Google Sheets)
https://docs.google.com/spreadsheets/d/1aunzMguja7fJIFgbvXrARp_WqN4r2-hD3bvk3_6au64/edit?gid=956115041#gid=956115041

🛠️ System Architecture
------------------------
1. Functional Decomposition
The system is modularized to separate data ingestion from the core compliance logic.

Code snippet
mindmap
  root((Vehicle Master Portal))
    Vehicle Onboarding
      Reg Number Search
      Vahan API Handshake
      Data Validation
    Compliance Engine
      Days-to-Expiry Math
      Status Mapping (Red/Yellow/Green)
      Notification Triggers
    Document Vault
      Secure File Upload
      Digital Storage
      Inline Preview
    Reporting & Analytics
      Dashboard KPIs
      CSV Export Engine

2. Data Architecture (ERD)
A normalized schema designed for high-speed lookups and relationship integrity.

Code snippet
erDiagram
    VEHICLE ||--o{ COMPLIANCE_DOC : contains
    VEHICLE ||--o{ ALERT_LOG : triggers
    VEHICLE {
        int vehicle_id PK
        string reg_number UK
        string make
        string model
    }
    COMPLIANCE_DOC {
        int doc_id PK
        int vehicle_id FK
        string doc_type
        date expiry_date
        string file_path
    }

3. Interaction Logic (Sequence Diagram)
How the system handles a new vehicle onboarding request.

Code snippet
sequenceDiagram
    actor User as Fleet Manager
    participant UI as Streamlit UI
    participant API as Mock Vahan API
    participant DB as SQLite DB

    User->>UI: Enter Reg Number
    UI->>API: POST /sync/vahan
    API-->>UI: Return Vehicle Data
    UI->>User: Auto-populate form
    User->>UI: Click 'Save'
    UI->>DB: INSERT into Vehicles
    DB-->>UI: Success Confirmation


📋 Portfolio Artifacts
Business Requirements (BRD): Defined via stakeholder interviews and gap analysis.

Functional Specifications (FSD): Technical deep-dive into the API and Logic Engine.

User Stories: 7 Agile stories with Gherkin (Given-When-Then) acceptance criteria.

RTM: Mapping requirements to test cases for 100% development coverage.

🚀 Key Features
RTO Sync: Instant verification of Make, Model, and Expiry dates.

Compliance Dashboard: High-visibility UI with automated row highlighting.

WhatsApp Simulation: Proactive "push" notifications for upcoming renewals.

One-Click Reporting: CSV exports ready for financial audits.

💻 Tech Stack
Frontend: Streamlit (Python)

Backend: Python 3.x

Database: SQLite (Relational)

API Modeling: RESTful / JSON

Diagramming: Mermaid.js