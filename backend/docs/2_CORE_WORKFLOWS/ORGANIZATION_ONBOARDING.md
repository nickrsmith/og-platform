# Core Workflow: Organization Onboarding & Provisioning

This document describes the end-to-end workflow for a new user successfully applying for and being granted an organization on the Empressa platform. This is a multi-step process that involves an admin review, off-chain record creation, and the provisioning of essential on-chain and P2P resources.

There are two primary paths for organization creation:

1. **User Application:** A new user signs up and submits a request to create an organization.
2. **Admin Creation:** A platform administrator manually creates an organization and invites a user to become its Principal.

Both paths converge on the same automated provisioning logic once an organization record is created with a designated Principal user.

## Sequence Diagram

This diagram illustrates the "User Application" path, which is the more complex of the two.

```mermaid
sequenceDiagram
    actor User
    participant RM as Royalty Marketplace (Frontend)
    participant CoreAPI as core-api
    participant AdminDash as Admin Dashboard (Frontend)
    participant AdminSvc as admin-service
    participant BlockchainSvc as blockchain-service
    participant LensManager as lens-manager

    %% --- Stage 1: User Application ---
    User->>RM: Signs up and submits "Register Organization" form
    RM->>CoreAPI: POST /organizations/requests
    CoreAPI->>DB: INSERT INTO organization_creation_requests (status: PENDING)
    CoreAPI-->>RM: 202 Accepted
    Note over RM: User sees "Application Pending" screen.

    %% --- Stage 2: Admin Approval ---
    actor Admin
    Admin->>AdminDash: Views pending requests list
    Admin->>AdminDash: Clicks "Approve" for user's request
    AdminDash->>AdminSvc: POST /organizations/requests/:id/approve
    
    AdminSvc->>DB: UPDATE organization_creation_requests (status: APPROVED)
    AdminSvc->>DB: INSERT INTO organizations (name, principalUserId, ...)
    AdminSvc->>DB: INSERT INTO organization_members (role: Principal)
    
    %% --- Stage 3: Automated Resource Provisioning (Triggered by AdminSvc) ---
    Note over AdminSvc: Begins provisioning resources for the new organization.

    AdminSvc->>LensManager: POST /sites (creates P2P Site Program)
    LensManager-->>AdminSvc: Returns new siteAddress
    
    AdminSvc->>DB: UPDATE organizations SET siteAddress = ?
    
    AdminSvc->>CoreAPI: (Internal) POST /internal/enqueue-contract-creation
    CoreAPI->>BlockchainSvc: Enqueues 'CREATE_ORG_CONTRACT' job via BullMQ
    CoreAPI-->>AdminSvc: 202 Accepted (Job enqueued)
    
    AdminSvc-->>AdminDash: 200 OK (Approval successful)

    %% --- Stage 4: Background On-Chain Provisioning ---
    BlockchainSvc->>BlockchainSvc: Worker picks up job
    BlockchainSvc->>Blockchain: Submits `createOrgContract()` transaction
    BlockchainSvc->>Rabbit: Publishes 'transaction.finalized.confirmed' event
    
    participant Reconciliation as ReconciliationProcessor
    Reconciliation-->>Rabbit: Listens for event
    Reconciliation->>DB: UPDATE organizations SET contractAddress = ?
    
    Note over Reconciliation: The org's on-chain contract is now provisioned.

    %% --- Stage 5: Granting Creator Role (Example) ---
    User->>RM: Invites a new team member
    RM->>CoreAPI: POST /organizations/me/invites
    CoreAPI->>BlockchainSvc: Enqueues 'GRANT_CREATOR_ROLE' job
    BlockchainSvc->>BlockchainSvc: Worker picks up job
    BlockchainSvc->>Blockchain: Submits `addCreator()` transaction
    
```

## Step-by-Step Explanation

### Part A: User Application and Admin Approval

1. **User Submits Application (`royalty-marketplace`):**
    * A newly registered user who does not belong to an organization is directed to the "Register Your Organization" form.
    * Upon submission, the frontend sends a `POST /organizations/requests` request to the `core-api`.
    * The `core-api` creates a record in the `organization_creation_requests` table with a `PENDING` status.

2. **Admin Review (`admin-dashboard`):**
    * An administrator sees the new pending request in their dashboard.
    * After reviewing the details, the admin clicks "Approve". This sends a request to the `admin-service`.

3. **Approval and Initial Record Creation (`admin-service`):**
    * The `admin-service` updates the request's status to `APPROVED`.
    * Crucially, it creates the official `Organization` record in the database, linking it to the applicant as the `principalUserId`.
    * It also creates an `OrganizationMember` record, for
