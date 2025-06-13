-- =====================================================
-- GID-CENTRIC BUSINESS AUTOMATION PLATFORM
-- PostgreSQL 15 Schema
-- =====================================================
-- Core principle: Everything revolves around Google IDs
-- - Drive File IDs (GIDs) for all documents
-- - People API resourceNames for all contacts
-- - Gmail Message IDs and Thread IDs for emails
-- - Calendar Event IDs for meetings
-- All automation driven by these identifiers
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For email/name searching
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =====================================================
-- SECTION 1: GOOGLE PEOPLE/CONTACTS (Using resourceName)
-- =====================================================

-- All people in the system (employees, customers, partners)
CREATE TABLE people (
    -- Google People API fields
    resource_name text PRIMARY KEY, -- 'people/c4975894400662151399'
    resource_id text GENERATED ALWAYS AS (substring(resource_name from 'people/(.*)')) STORED,
    etag text, -- For change detection
    
    -- Previous identities (resourceNames can change!)
    previous_resource_names text[],
    
    -- Core contact data
    primary_email text UNIQUE NOT NULL,
    emails jsonb DEFAULT '[]', -- Array of {value, type, formattedType}
    names jsonb, -- {displayName, familyName, givenName, displayNameLastFirst}
    phones jsonb DEFAULT '[]', -- Array of {value, type, formattedType}
    
    -- Organization data
    organizations jsonb DEFAULT '[]', -- Array of {name, title, department}
    
    -- Person classification for our system
    person_type text NOT NULL CHECK (person_type IN ('employee', 'customer_contact', 'partner_contact', 'other')),
    
    -- For customers/partners, link to organization
    organization_id uuid, -- References organizations table
    
    -- Addresses
    addresses jsonb DEFAULT '[]', -- Array of {formattedValue, type, streetAddress, city, region, postalCode, country}
    
    -- Important dates
    birthdays jsonb, -- {date, text}
    events jsonb DEFAULT '[]', -- Custom events like start date, anniversary
    
    -- Google Workspace specific
    is_workspace_user boolean DEFAULT false,
    workspace_domain text,
    
    -- Metadata from People API
    sources jsonb, -- Where this data comes from (CONTACT, PROFILE, DOMAIN_CONTACT)
    metadata jsonb, -- {sources, objectType, deleted}
    
    -- Our tracking
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    last_synced_at timestamp,
    
    -- Indexing for search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(names->>'displayName', '')), 'A') ||
        setweight(to_tsvector('english', coalesce(primary_email, '')), 'B')
    ) STORED
);

-- Organizations (customers, partners) - separate from people
CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_code text UNIQUE NOT NULL, -- 'ACME_CORP'
    legal_name text NOT NULL,
    display_name text NOT NULL,
    
    -- Organization type
    org_type text NOT NULL CHECK (org_type IN ('customer', 'partner', 'vendor')),
    status text NOT NULL CHECK (status IN ('prospect', 'active', 'inactive', 'churned')),
    
    -- Customer lifecycle
    customer_status text CHECK (customer_status IN ('prospect', 'piloting', 'licensed', 'churned', 'suspended')),
    
    -- Google Drive organization
    drive_root_folder_gid text UNIQUE, -- Root folder for this organization
    
    -- Domain for email matching
    email_domains text[], -- ['acme.com', 'acme.co.uk']
    
    -- Metadata
    industry text,
    size_category text,
    tags text[],
    custom_attributes jsonb DEFAULT '{}',
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Link people to organizations with roles
CREATE TABLE organization_contacts (
    organization_id uuid NOT NULL REFERENCES organizations(id),
    person_resource_name text NOT NULL REFERENCES people(resource_name),
    role text NOT NULL, -- 'primary', 'billing', 'technical', 'executive'
    is_primary boolean DEFAULT false,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    notes text,
    
    PRIMARY KEY (organization_id, person_resource_name, role)
);

-- Our employees (subset of people)
CREATE TABLE employees (
    person_resource_name text PRIMARY KEY REFERENCES people(resource_name),
    employee_email text UNIQUE NOT NULL, -- Denormalized for performance
    
    -- Employment details
    employee_id text UNIQUE, -- Internal ID if needed
    department text,
    title text,
    manager_resource_name text REFERENCES employees(person_resource_name),
    
    -- System access
    system_role text DEFAULT 'employee' CHECK (system_role IN ('employee', 'manager', 'senior_admin', 'system_admin')),
    
    -- Capabilities for task assignment
    capabilities text[], -- ['contract_review', 'technical_setup', 'training']
    max_concurrent_tasks integer DEFAULT 5,
    
    -- Google Workspace sync settings
    gmail_sync_enabled boolean DEFAULT true,
    calendar_sync_enabled boolean DEFAULT true,
    drive_sync_enabled boolean DEFAULT true,
    last_email_sweep timestamp,
    
    -- Availability
    working_hours jsonb DEFAULT '{"timezone": "America/New_York", "start": "09:00", "end": "17:00"}',
    out_of_office boolean DEFAULT false,
    ooo_start date,
    ooo_end date,
    ooo_delegate_resource_name text REFERENCES employees(person_resource_name),
    
    -- Status
    employment_status text DEFAULT 'active' CHECK (employment_status IN ('active', 'on_leave', 'terminated')),
    hire_date date,
    termination_date date
);

-- =====================================================
-- SECTION 2: EMAIL TRACKING (Message IDs & Thread IDs)
-- =====================================================

-- All emails in the system
CREATE TABLE emails (
    -- Primary identifiers
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id text NOT NULL, -- RFC822 Message-ID: '<CADXLpi=abc123@mail.gmail.com>'
    gmail_message_id text NOT NULL, -- Gmail's internal ID: '18d5a2b7c9e'
    thread_id text NOT NULL, -- Gmail thread ID (user-specific!)
    employee_email text NOT NULL, -- Which employee's inbox this is from
    
    -- Unique constraint: same message can be in multiple inboxes
    UNIQUE (message_id, employee_email),
    
    -- Threading information
    in_reply_to text, -- Parent message ID
    references text[], -- Full chain of message IDs
    conversation_id uuid, -- Our unified conversation ID
    
    -- Participants (using resourceNames where possible)
    from_email text NOT NULL,
    from_resource_name text REFERENCES people(resource_name),
    to_emails text[] NOT NULL,
    cc_emails text[],
    bcc_emails text[], -- Only visible if employee was sender
    
    -- Link participants to people
    participant_resource_names text[], -- Array of people resourceNames
    
    -- Email content identifiers
    subject text NOT NULL,
    subject_normalized text, -- Remove Re:/Fwd: for matching
    snippet text, -- First 200 chars
    
    -- Timestamps
    date_sent timestamp NOT NULL,
    internal_date timestamp NOT NULL, -- When received in inbox
    
    -- Organization association
    organization_id uuid REFERENCES organizations(id),
    is_customer_communication boolean DEFAULT false,
    
    -- Labels and status
    gmail_labels text[], -- ['INBOX', 'IMPORTANT', 'auto-respond']
    is_unread boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    is_draft boolean DEFAULT false,
    
    -- Attachments
    has_attachments boolean DEFAULT false,
    attachment_count integer DEFAULT 0,
    
    -- Automation triggers
    automation_labels text[], -- Labels that trigger automation
    automation_status text CHECK (automation_status IN ('pending', 'processing', 'completed', 'failed')),
    automation_processed_at timestamp,
    
    -- Metadata
    gmail_history_id text, -- For incremental sync
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Email attachments with GIDs
CREATE TABLE email_attachments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id uuid NOT NULL REFERENCES emails(id),
    
    -- Attachment details
    filename text NOT NULL,
    mime_type text,
    size_bytes bigint,
    
    -- If saved to Drive
    drive_file_gid text UNIQUE, -- The GID if we saved it
    drive_parent_folder_gid text, -- Where we saved it
    
    -- Status
    is_inline boolean DEFAULT false,
    saved_to_drive boolean DEFAULT false,
    saved_at timestamp
);

-- Unified email conversations
CREATE TABLE email_conversations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Conversation identifiers
    root_message_id text, -- First message in chain
    subject_normalized text, -- Core subject without Re:/Fwd:
    
    -- Participants
    organization_id uuid REFERENCES organizations(id),
    participant_emails text[], -- All unique participants
    participant_resource_names text[], -- Linked people
    
    -- Stats
    message_count integer DEFAULT 1,
    last_message_at timestamp,
    
    -- Status
    status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'spam')),
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 3: GOOGLE DRIVE DOCUMENTS (GID-centric)
-- =====================================================

-- All files/folders we track
CREATE TABLE drive_items (
    -- Google Drive identifiers
    gid text PRIMARY KEY, -- Google Drive file/folder ID
    
    -- File metadata
    name text NOT NULL,
    mime_type text NOT NULL,
    is_folder boolean GENERATED ALWAYS AS (mime_type = 'application/vnd.google-apps.folder') STORED,
    
    -- Naming convention parsing
    name_prefix text, -- '[TEMPLATE]', '[DRAFT]', '[READY]', etc.
    name_status text, -- Extracted status from prefix
    name_assignee text, -- '@john' from filename
    
    -- Parent folder
    parent_gid text REFERENCES drive_items(gid),
    
    -- Organization/project association
    organization_id uuid REFERENCES organizations(id),
    project_id uuid, -- References projects table
    
    -- Template tracking
    created_from_template_gid text REFERENCES drive_items(gid),
    is_template boolean DEFAULT false,
    
    -- File metadata
    created_time timestamp,
    modified_time timestamp,
    
    -- Owner/creator
    owner_email text,
    owner_resource_name text REFERENCES people(resource_name),
    created_by_email text,
    last_modified_by_email text,
    
    -- Permissions summary
    shared_with_emails text[],
    is_public boolean DEFAULT false,
    
    -- Automation metadata
    automation_status text,
    workflow_step text,
    
    -- Our tracking
    first_seen_at timestamp DEFAULT CURRENT_TIMESTAMP,
    last_synced_at timestamp,
    is_deleted boolean DEFAULT false
);

-- Track permission changes for automation
CREATE TABLE drive_permissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    gid text NOT NULL REFERENCES drive_items(gid),
    
    -- Permission details
    permission_id text NOT NULL, -- Google's permission ID
    role text NOT NULL CHECK (role IN ('owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader')),
    type text NOT NULL CHECK (type IN ('user', 'group', 'domain', 'anyone')),
    
    -- Who has permission
    email_address text,
    person_resource_name text REFERENCES people(resource_name),
    
    -- Metadata
    granted_at timestamp DEFAULT CURRENT_TIMESTAMP,
    granted_by_email text,
    expires_at timestamp,
    
    UNIQUE (gid, permission_id)
);

-- Document workflow states
CREATE TABLE document_workflows (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    gid text NOT NULL REFERENCES drive_items(gid),
    
    -- Workflow definition
    workflow_type text NOT NULL, -- 'contract_approval', 'document_review'
    current_status text NOT NULL,
    current_assignee_email text,
    
    -- Status history
    status_history jsonb DEFAULT '[]', -- Array of {status, assignee, timestamp}
    
    -- Deadlines
    due_date timestamp,
    sla_hours integer,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp
);

-- =====================================================
-- SECTION 4: CALENDAR EVENTS (Event IDs)
-- =====================================================

-- Calendar events we track
CREATE TABLE calendar_events (
    -- Google Calendar identifiers
    event_id text NOT NULL, -- Google Calendar event ID
    calendar_id text NOT NULL, -- Which calendar (usually email)
    ical_uid text, -- For cross-system compatibility
    recurring_event_id text, -- Parent if this is instance of recurring
    
    PRIMARY KEY (event_id, calendar_id),
    
    -- Event details
    summary text,
    description text,
    location text,
    meet_link text, -- Extracted Google Meet URL
    
    -- Timing
    start_time timestamp NOT NULL,
    end_time timestamp NOT NULL,
    all_day boolean DEFAULT false,
    
    -- Organizer
    organizer_email text NOT NULL,
    organizer_resource_name text REFERENCES people(resource_name),
    
    -- Attendees
    attendee_emails text[],
    attendee_resource_names text[], -- Linked to people
    attendee_responses jsonb, -- {email: response_status}
    
    -- Organization association
    organization_id uuid REFERENCES organizations(id),
    is_customer_meeting boolean DEFAULT false,
    
    -- Meeting metadata
    meeting_type text, -- 'kickoff', 'review', 'training'
    project_id uuid, -- References projects
    
    -- Linked documents
    agenda_gid text REFERENCES drive_items(gid),
    notes_gid text REFERENCES drive_items(gid),
    
    -- Event chain (for templated sequences)
    event_chain_id uuid,
    chain_position integer,
    
    -- Status
    status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    last_synced_at timestamp
);

-- Event chains for onboarding/pilots
CREATE TABLE event_chains (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_name text NOT NULL,
    chain_type text NOT NULL, -- 'onboarding', 'pilot', 'project'
    
    -- Association
    organization_id uuid REFERENCES organizations(id),
    project_id uuid,
    
    -- Timing
    anchor_date date NOT NULL, -- Start date
    
    -- Template
    created_from_template text,
    
    -- Status
    status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by_email text NOT NULL
);

-- =====================================================
-- SECTION 5: AUTOMATION FRAMEWORK
-- =====================================================

-- Automation triggers based on Google events
CREATE TABLE automation_triggers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_name text UNIQUE NOT NULL,
    trigger_type text NOT NULL CHECK (trigger_type IN ('email_label', 'file_status', 'calendar_event', 'time_based')),
    
    -- Conditions (what to watch for)
    conditions jsonb NOT NULL,
    /* Examples:
    Email: {"labels": ["auto-respond"], "from_domain": "@customer.com"}
    File: {"name_prefix": "[READY]", "mime_type": "application/vnd.google-apps.document"}
    Calendar: {"meeting_type": "kickoff", "attendee_accepted": true}
    */
    
    -- What to do
    action_template text NOT NULL,
    action_config jsonb DEFAULT '{}',
    
    -- Control
    is_active boolean DEFAULT true,
    priority integer DEFAULT 50,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by_email text NOT NULL
);

-- Automation executions
CREATE TABLE automation_executions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id uuid NOT NULL REFERENCES automation_triggers(id),
    
    -- What triggered this
    trigger_source_type text NOT NULL, -- 'email', 'drive', 'calendar'
    trigger_source_id text NOT NULL, -- message_id, gid, or event_id
    
    -- Execution
    started_at timestamp DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp,
    status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    
    -- Results
    actions_taken jsonb DEFAULT '[]',
    error_message text,
    
    -- Created artifacts
    created_gids text[], -- Files created
    created_event_ids text[], -- Calendar events created
    sent_message_ids text[] -- Emails sent
);

-- Automation chains (linked automations)
CREATE TABLE automation_chains (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_name text NOT NULL,
    
    -- What started it
    root_execution_id uuid NOT NULL REFERENCES automation_executions(id),
    
    -- Chain metadata
    total_steps integer,
    completed_steps integer DEFAULT 0,
    current_step text,
    
    -- Context
    organization_id uuid REFERENCES organizations(id),
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'paused')),
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp
);

-- =====================================================
-- SECTION 6: TEMPLATES (Document & Process)
-- =====================================================

-- Document templates in Drive
CREATE TABLE document_templates (
    gid text PRIMARY KEY REFERENCES drive_items(gid),
    template_code text UNIQUE NOT NULL, -- '[TEMPLATE]_Contract_Standard'
    template_name text NOT NULL,
    category text NOT NULL,
    
    -- Variables to replace
    variables jsonb DEFAULT '[]', -- [{name: 'customer_name', required: true}]
    
    -- Usage rules
    for_customer_types text[],
    for_project_types text[],
    
    -- Version
    version integer DEFAULT 1,
    parent_template_gid text REFERENCES document_templates(gid),
    is_active boolean DEFAULT true,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Process templates
CREATE TABLE process_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_code text UNIQUE NOT NULL,
    template_name text NOT NULL,
    category text NOT NULL, -- 'onboarding', 'pilot', 'support'
    
    -- Process definition
    steps jsonb NOT NULL,
    /* Example:
    [
      {
        "step": 1,
        "name": "Create folder structure",
        "type": "create_folders",
        "config": {"template": "standard_folders"},
        "assigned_to": "system"
      },
      {
        "step": 2,
        "name": "Send welcome email",
        "type": "send_email",
        "config": {"template": "welcome_packet"},
        "assigned_to": "{{sales_rep}}"
      }
    ]
    */
    
    -- Variables
    required_variables text[],
    
    -- Metadata
    estimated_days integer,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 7: PROJECTS & DEPLOYMENTS
-- =====================================================

-- Projects (pilots, implementations)
CREATE TABLE projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code text UNIQUE NOT NULL,
    project_name text NOT NULL,
    
    -- Type and status
    project_type text NOT NULL CHECK (project_type IN ('pilot', 'implementation', 'migration', 'support')),
    status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    
    -- Association
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Google Drive
    project_folder_gid text UNIQUE REFERENCES drive_items(gid),
    
    -- Team (using resourceNames)
    project_manager_resource_name text REFERENCES people(resource_name),
    team_member_resource_names text[],
    
    -- Timeline
    start_date date,
    end_date date,
    go_live_date date,
    
    -- Created from template
    created_from_process_template_id uuid REFERENCES process_templates(id),
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Project tasks
CREATE TABLE project_tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL REFERENCES projects(id),
    
    -- Task details
    task_name text NOT NULL,
    description text,
    sequence_number integer NOT NULL,
    
    -- Assignment (using email for @mentions)
    assigned_to_email text,
    assigned_to_resource_name text REFERENCES people(resource_name),
    
    -- Status from filename conventions
    status text NOT NULL DEFAULT 'not_started',
    
    -- Deliverables (GIDs)
    deliverable_gids text[],
    
    -- Timeline
    due_date date,
    completed_at timestamp,
    
    UNIQUE (project_id, sequence_number)
);

-- =====================================================
-- SECTION 8: DEPLOYMENTS & LICENSING
-- =====================================================

-- Customer deployments
CREATE TABLE deployments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_code text UNIQUE NOT NULL,
    organization_id uuid NOT NULL REFERENCES organizations(id),
    
    -- Deployment details
    deployment_type text NOT NULL CHECK (deployment_type IN ('pilot', 'production', 'demo')),
    environment text NOT NULL CHECK (environment IN ('cloud', 'on_premise', 'hybrid')),
    
    -- Licensing
    license_type text CHECK (license_type IN ('pilot', 'subscription', 'perpetual')),
    license_start date,
    license_end date,
    
    -- Status
    status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'suspended', 'terminated')),
    
    -- Google Drive
    deployment_folder_gid text REFERENCES drive_items(gid),
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 9: HISTORICAL TRACKING & AUDIT
-- =====================================================

-- Universal change log for all Google objects
CREATE TABLE change_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What changed
    object_type text NOT NULL CHECK (object_type IN ('email', 'drive_item', 'calendar_event', 'person')),
    object_id text NOT NULL, -- message_id, gid, event_id, or resource_name
    
    -- Change details
    action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'shared', 'moved')),
    changes jsonb, -- What specifically changed
    
    -- Who/when
    changed_by_email text,
    changed_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    -- Context
    organization_id uuid REFERENCES organizations(id),
    automation_execution_id uuid REFERENCES automation_executions(id)
);

-- =====================================================
-- SECTION 10: INDEXES FOR PERFORMANCE
-- =====================================================

-- People indexes
CREATE INDEX idx_people_email ON people(primary_email);
CREATE INDEX idx_people_type ON people(person_type);
CREATE INDEX idx_people_org ON people(organization_id);
CREATE INDEX idx_people_search ON people USING GIN(search_vector);

-- Email indexes
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_thread ON emails(thread_id, employee_email);
CREATE INDEX idx_emails_conversation ON emails(conversation_id);
CREATE INDEX idx_emails_org ON emails(organization_id);
CREATE INDEX idx_emails_automation ON emails(automation_status) WHERE automation_status = 'pending';
CREATE INDEX idx_emails_labels ON emails USING GIN(gmail_labels);

-- Drive indexes
CREATE INDEX idx_drive_items_parent ON drive_items(parent_gid);
CREATE INDEX idx_drive_items_org ON drive_items(organization_id);
CREATE INDEX idx_drive_items_template ON drive_items(created_from_template_gid);
CREATE INDEX idx_drive_items_status ON drive_items(name_status);
CREATE INDEX idx_drive_items_assignee ON drive_items(name_assignee);

-- Calendar indexes
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX idx_calendar_events_chain ON calendar_events(event_chain_id);

-- Automation indexes
CREATE INDEX idx_automation_executions_trigger ON automation_executions(trigger_id);
CREATE INDEX idx_automation_executions_source ON automation_executions(trigger_source_type, trigger_source_id);

-- =====================================================
-- SECTION 11: VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active automations by organization
CREATE VIEW v_organization_automations AS
SELECT 
    o.display_name as organization,
    ae.trigger_source_type,
    ae.status,
    ae.started_at,
    ae.completed_at,
    at.trigger_name
FROM automation_executions ae
JOIN automation_triggers at ON ae.trigger_id = at.id
LEFT JOIN organizations o ON ae.organization_id = o.id
WHERE ae.started_at > CURRENT_DATE - INTERVAL '7 days';

-- Document workflow status
CREATE VIEW v_document_workflows AS
SELECT 
    di.name as document_name,
    di.name_status as status,
    di.name_assignee as assigned_to,
    dw.workflow_type,
    dw.due_date,
    o.display_name as organization
FROM drive_items di
LEFT JOIN document_workflows dw ON di.gid = dw.gid
LEFT JOIN organizations o ON di.organization_id = o.id
WHERE di.name_prefix IN ('[DRAFT]', '[READY]', '[REVIEW]', '[APPROVED]');

-- Email automation queue
CREATE VIEW v_email_automation_queue AS
SELECT 
    e.id,
    e.subject,
    e.from_email,
    e.gmail_labels,
    e.automation_labels,
    o.display_name as organization,
    p.names->>'displayName' as from_name
FROM emails e
LEFT JOIN organizations o ON e.organization_id = o.id
LEFT JOIN people p ON e.from_resource_name = p.resource_name
WHERE e.automation_status = 'pending'
ORDER BY e.date_sent DESC;

-- =====================================================
-- SECTION 12: FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Parse filename conventions
CREATE OR REPLACE FUNCTION parse_drive_filename()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract status from [STATUS] prefix
    NEW.name_prefix = substring(NEW.name from '^\[([^\]]+)\]');
    NEW.name_status = NEW.name_prefix;
    
    -- Extract assignee from @person pattern
    NEW.name_assignee = substring(NEW.name from '@(\w+)');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parse_drive_filename_trigger BEFORE INSERT OR UPDATE ON drive_items
    FOR EACH ROW EXECUTE FUNCTION parse_drive_filename();

-- Link emails to organizations
CREATE OR REPLACE FUNCTION link_email_to_organization()
RETURNS TRIGGER AS $$
DECLARE
    v_domain text;
    v_org_id uuid;
BEGIN
    -- Extract domain from from_email
    v_domain = substring(NEW.from_email from '@(.+)$');
    
    -- Find matching organization
    SELECT id INTO v_org_id
    FROM organizations
    WHERE v_domain = ANY(email_domains)
    LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        NEW.organization_id = v_org_id;
        NEW.is_customer_communication = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER link_email_to_organization_trigger BEFORE INSERT ON emails
    FOR EACH ROW EXECUTE FUNCTION link_email_to_organization();

-- Track changes in universal log
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO change_log (object_type, object_id, action, changes)
    VALUES (
        TG_ARGV[0], -- object_type passed as argument
        CASE 
            WHEN TG_ARGV[0] = 'email' THEN NEW.message_id
            WHEN TG_ARGV[0] = 'drive_item' THEN NEW.gid
            WHEN TG_ARGV[0] = 'calendar_event' THEN NEW.event_id
            WHEN TG_ARGV[0] = 'person' THEN NEW.resource_name
        END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN TG_OP = 'UPDATE' THEN 'updated'
            WHEN TG_OP = 'DELETE' THEN 'deleted'
        END,
        to_jsonb(NEW) - to_jsonb(OLD)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply change logging
CREATE TRIGGER log_email_changes AFTER INSERT OR UPDATE ON emails
    FOR EACH ROW EXECUTE FUNCTION log_changes('email');
CREATE TRIGGER log_drive_changes AFTER INSERT OR UPDATE ON drive_items
    FOR EACH ROW EXECUTE FUNCTION log_changes('drive_item');
CREATE TRIGGER log_calendar_changes AFTER INSERT OR UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION log_changes('calendar_event');

-- =====================================================
-- SECTION 13: WEBAPP AUTHENTICATION & API
-- =====================================================

-- WebApp users (can be employees or external)
CREATE TABLE webapp_users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    person_resource_name text REFERENCES people(resource_name),
    
    -- Authentication
    auth_provider text NOT NULL CHECK (auth_provider IN ('google', 'password', 'api_key')),
    google_id text UNIQUE, -- For Google OAuth
    password_hash text, -- For password auth (external users)
    
    -- User type
    user_type text NOT NULL CHECK (user_type IN ('employee', 'customer', 'partner', 'api')),
    
    -- Status
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    email_verified_at timestamp,
    
    -- Security
    mfa_enabled boolean DEFAULT false,
    mfa_secret text,
    
    -- Metadata
    last_login_at timestamp,
    last_login_ip inet,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- API keys for service-to-service auth
CREATE TABLE api_keys (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash text UNIQUE NOT NULL, -- SHA256 of actual key
    key_prefix text NOT NULL, -- First 8 chars for identification
    name text NOT NULL,
    
    -- Owner
    webapp_user_id uuid REFERENCES webapp_users(id),
    
    -- Permissions
    scopes text[] DEFAULT ARRAY['read'], -- 'read', 'write', 'admin'
    allowed_ips inet[], -- IP whitelist
    
    -- Rate limiting
    rate_limit_per_hour integer DEFAULT 1000,
    rate_limit_per_day integer DEFAULT 10000,
    
    -- Usage tracking
    last_used_at timestamp,
    last_used_ip inet,
    total_requests bigint DEFAULT 0,
    
    -- Status
    is_active boolean DEFAULT true,
    expires_at timestamp,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    revoked_at timestamp
);

-- WebApp sessions
CREATE TABLE webapp_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token text UNIQUE NOT NULL,
    webapp_user_id uuid NOT NULL REFERENCES webapp_users(id),
    
    -- Session data
    ip_address inet,
    user_agent text,
    
    -- Expiry
    expires_at timestamp NOT NULL,
    
    -- Activity
    last_activity_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting
CREATE TABLE rate_limits (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What's being limited
    limit_type text NOT NULL CHECK (limit_type IN ('api_key', 'user', 'ip')),
    limit_key text NOT NULL, -- api_key_id, user_id, or ip address
    
    -- Window
    window_start timestamp NOT NULL,
    window_type text NOT NULL CHECK (window_type IN ('hour', 'day')),
    
    -- Counts
    request_count integer DEFAULT 1,
    
    -- Unique constraint
    UNIQUE (limit_type, limit_key, window_start, window_type)
);

-- API request logs
CREATE TABLE api_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Request details
    method text NOT NULL,
    path text NOT NULL,
    query_params jsonb,
    request_body_size integer,
    
    -- Authentication
    auth_type text CHECK (auth_type IN ('api_key', 'session', 'none')),
    api_key_id uuid REFERENCES api_keys(id),
    webapp_user_id uuid REFERENCES webapp_users(id),
    
    -- Response
    status_code integer,
    response_time_ms integer,
    response_body_size integer,
    
    -- Metadata
    ip_address inet,
    user_agent text,
    
    -- Errors
    error_message text,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 14: WEBAPP NOTIFICATIONS & SIDEBAR
-- =====================================================

-- Sidebar tasks/nudges for employees
CREATE TABLE sidebar_tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who this is for
    employee_email text NOT NULL,
    employee_resource_name text REFERENCES people(resource_name),
    
    -- Task details
    task_type text NOT NULL CHECK (task_type IN ('review', 'approve', 'respond', 'follow_up', 'complete')),
    title text NOT NULL,
    description text,
    
    -- Priority/urgency
    priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    due_at timestamp,
    
    -- What it's about
    related_object_type text CHECK (related_object_type IN ('email', 'document', 'project', 'customer')),
    related_object_id text, -- message_id, gid, project_id, etc.
    
    -- Action needed
    action_url text, -- Deep link to WebApp
    quick_actions jsonb, -- Array of {label, action, params}
    
    -- Status
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
    
    -- Metadata
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp,
    dismissed_at timestamp
);

-- Notifications
CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Recipient
    webapp_user_id uuid NOT NULL REFERENCES webapp_users(id),
    
    -- Notification details
    type text NOT NULL, -- 'task_assigned', 'document_shared', 'automation_complete'
    title text NOT NULL,
    message text,
    
    -- Link
    action_url text,
    
    -- Status
    is_read boolean DEFAULT false,
    read_at timestamp,
    
    -- Delivery
    delivered_via text[] DEFAULT ARRAY['webapp'], -- 'webapp', 'email', 'slack'
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 15: EXTERNAL USER ACCESS
-- =====================================================

-- External user permissions (customers viewing their data)
CREATE TABLE external_permissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who has permission
    webapp_user_id uuid NOT NULL REFERENCES webapp_users(id),
    
    -- What they can see
    permission_type text NOT NULL CHECK (permission_type IN ('organization', 'project', 'document')),
    permission_scope text NOT NULL, -- organization_id, project_id, or gid
    
    -- Level of access
    access_level text NOT NULL CHECK (access_level IN ('view', 'comment', 'edit')),
    
    -- Restrictions
    can_download boolean DEFAULT false,
    can_share boolean DEFAULT false,
    
    -- Expiry
    expires_at timestamp,
    
    -- Who granted it
    granted_by_user_id uuid REFERENCES webapp_users(id),
    granted_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (webapp_user_id, permission_type, permission_scope)
);

-- External user activity
CREATE TABLE external_user_activity (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    webapp_user_id uuid NOT NULL REFERENCES webapp_users(id),
    
    -- What they did
    action text NOT NULL, -- 'viewed', 'downloaded', 'commented'
    object_type text NOT NULL, -- 'document', 'project'
    object_id text NOT NULL, -- gid or project_id
    
    -- Metadata
    ip_address inet,
    user_agent text,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 16: WEBAPP CONFIGURATION
-- =====================================================

-- System configuration
CREATE TABLE system_config (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    
    -- Change tracking
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id uuid REFERENCES webapp_users(id)
);

-- Insert default configuration
INSERT INTO system_config (key, value, description) VALUES
('google_workspace_domain', '"company.com"', 'Primary Google Workspace domain'),
('automation_enabled', 'true', 'Global automation toggle'),
('email_sync_interval_minutes', '15', 'How often to sync emails'),
('drive_sync_interval_minutes', '30', 'How often to sync drive files'),
('calendar_sync_interval_minutes', '60', 'How often to sync calendar'),
('max_automation_chain_depth', '20', 'Maximum automation chain depth'),
('sidebar_refresh_seconds', '300', 'How often sidebar refreshes'),
('api_rate_limit_default', '{"hour": 1000, "day": 10000}', 'Default API rate limits');

-- Feature flags
CREATE TABLE feature_flags (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name text UNIQUE NOT NULL,
    description text,
    
    -- Targeting
    is_enabled boolean DEFAULT false,
    enabled_for_users text[], -- Specific user emails
    enabled_for_organizations uuid[], -- Specific organizations
    rollout_percentage integer DEFAULT 0, -- 0-100
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 17: BACKGROUND JOBS & QUEUES
-- =====================================================

-- Background job queue
CREATE TABLE job_queue (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Job details
    job_type text NOT NULL, -- 'sync_emails', 'process_automation', 'generate_report'
    job_params jsonb DEFAULT '{}',
    
    -- Priority and scheduling
    priority integer DEFAULT 50, -- Lower number = higher priority
    scheduled_for timestamp DEFAULT CURRENT_TIMESTAMP,
    
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Execution
    started_at timestamp,
    completed_at timestamp,
    
    -- Worker info
    worker_id text,
    
    -- Results
    result jsonb,
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled jobs
CREATE TABLE scheduled_jobs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name text UNIQUE NOT NULL,
    job_type text NOT NULL,
    
    -- Schedule (cron expression)
    cron_expression text NOT NULL, -- '*/15 * * * *' for every 15 minutes
    
    -- Configuration
    job_params jsonb DEFAULT '{}',
    
    -- Status
    is_active boolean DEFAULT true,
    last_run_at timestamp,
    next_run_at timestamp,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Insert default scheduled jobs
INSERT INTO scheduled_jobs (job_name, job_type, cron_expression, job_params) VALUES
('sync_all_emails', 'sync_emails', '*/15 * * * *', '{"scope": "all"}'),
('sync_drive_files', 'sync_drive', '*/30 * * * *', '{"scope": "all"}'),
('sync_calendar_events', 'sync_calendar', '0 * * * *', '{"days_ahead": 30}'),
('process_automation_queue', 'process_automations', '*/5 * * * *', '{}'),
('cleanup_old_sessions', 'cleanup_sessions', '0 2 * * *', '{"days_old": 30}'),
('generate_daily_report', 'daily_report', '0 8 * * *', '{}');

-- =====================================================
-- SECTION 18: ANALYTICS & REPORTING
-- =====================================================

-- Usage analytics
CREATE TABLE usage_analytics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dimensions
    date date NOT NULL,
    user_type text NOT NULL, -- 'employee', 'customer', 'api'
    feature text NOT NULL, -- 'email_automation', 'document_workflow', etc.
    
    -- Metrics
    event_count bigint DEFAULT 0,
    unique_users integer DEFAULT 0,
    
    -- Breakdowns
    by_organization jsonb DEFAULT '{}', -- {org_id: count}
    by_user jsonb DEFAULT '{}', -- {user_id: count}
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (date, user_type, feature)
);

-- Automation performance metrics
CREATE TABLE automation_metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Time window
    date date NOT NULL,
    hour integer, -- 0-23, NULL for daily aggregates
    
    -- Metrics
    triggers_fired integer DEFAULT 0,
    automations_completed integer DEFAULT 0,
    automations_failed integer DEFAULT 0,
    average_duration_ms integer,
    
    -- By trigger type
    by_trigger_type jsonb DEFAULT '{}', -- {email_label: 100, file_status: 50}
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (date, hour)
);

-- =====================================================
-- SECTION 19: SECURITY & COMPLIANCE
-- =====================================================

-- Audit log for compliance
CREATE TABLE audit_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who
    user_id uuid REFERENCES webapp_users(id),
    user_email text,
    ip_address inet,
    
    -- What
    action text NOT NULL, -- 'login', 'view_document', 'modify_automation'
    object_type text,
    object_id text,
    
    -- Details
    old_values jsonb,
    new_values jsonb,
    
    -- When
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Data retention policies
CREATE TABLE retention_policies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What to retain
    data_type text NOT NULL, -- 'emails', 'api_logs', 'audit_logs'
    
    -- How long
    retention_days integer NOT NULL,
    
    -- What to do after
    action_after_retention text NOT NULL CHECK (action_after_retention IN ('delete', 'archive', 'anonymize')),
    
    -- Status
    is_active boolean DEFAULT true,
    last_run_at timestamp,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Insert default retention policies
INSERT INTO retention_policies (data_type, retention_days, action_after_retention) VALUES
('api_logs', 90, 'delete'),
('audit_logs', 2555, 'archive'), -- 7 years
('email_metadata', 730, 'anonymize'), -- 2 years
('notifications', 30, 'delete'),
('rate_limits', 7, 'delete');

-- =====================================================
-- SECTION 20: INDEXES FOR WEBAPP PERFORMANCE
-- =====================================================

-- Authentication indexes
CREATE INDEX idx_webapp_users_email ON webapp_users(email);
CREATE INDEX idx_webapp_users_google_id ON webapp_users(google_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_sessions_token ON webapp_sessions(session_token);
CREATE INDEX idx_sessions_expiry ON webapp_sessions(expires_at);

-- Rate limiting indexes
CREATE INDEX idx_rate_limits_lookup ON rate_limits(limit_type, limit_key, window_start);

-- Sidebar/notification indexes
CREATE INDEX idx_sidebar_tasks_employee ON sidebar_tasks(employee_email, status);
CREATE INDEX idx_sidebar_tasks_due ON sidebar_tasks(due_at) WHERE status = 'pending';
CREATE INDEX idx_notifications_user_unread ON notifications(webapp_user_id) WHERE is_read = false;

-- Job queue indexes
CREATE INDEX idx_job_queue_pending ON job_queue(priority, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_job_queue_running ON job_queue(worker_id) WHERE status = 'running';

-- Analytics indexes
CREATE INDEX idx_usage_analytics_date ON usage_analytics(date);
CREATE INDEX idx_automation_metrics_date ON automation_metrics(date);

-- =====================================================
-- SECTION 21: WEBAPP SECURITY FUNCTIONS
-- =====================================================

-- Hash API keys
CREATE OR REPLACE FUNCTION hash_api_key(key text)
RETURNS text AS $
BEGIN
    RETURN encode(digest(key, 'sha256'), 'hex');
END;
$ LANGUAGE plpgsql IMMUTABLE;

-- Check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_limit_type text,
    p_limit_key text,
    p_limit integer
) RETURNS boolean AS $
DECLARE
    v_count integer;
    v_window_start timestamp;
BEGIN
    -- Calculate window start (beginning of current hour)
    v_window_start := date_trunc('hour', CURRENT_TIMESTAMP);
    
    -- Get or create rate limit record
    INSERT INTO rate_limits (limit_type, limit_key, window_start, window_type, request_count)
    VALUES (p_limit_type, p_limit_key, v_window_start, 'hour', 1)
    ON CONFLICT (limit_type, limit_key, window_start, window_type)
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO v_count;
    
    -- Check if over limit
    RETURN v_count <= p_limit;
END;
$ LANGUAGE plpgsql;

-- Clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $
BEGIN
    DELETE FROM webapp_sessions WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM rate_limits WHERE window_start < CURRENT_TIMESTAMP - INTERVAL '1 week';
END;
$ LANGUAGE plpgsql;

-- Log API request
CREATE OR REPLACE FUNCTION log_api_request(
    p_method text,
    p_path text,
    p_auth_type text,
    p_user_id uuid,
    p_api_key_id uuid,
    p_ip inet,
    p_user_agent text
) RETURNS uuid AS $
DECLARE
    v_log_id uuid;
BEGIN
    INSERT INTO api_logs (method, path, auth_type, webapp_user_id, api_key_id, ip_address, user_agent)
    VALUES (p_method, p_path, p_auth_type, p_user_id, p_api_key_id, p_ip, p_user_agent)
    RETURNING id INTO v_log_id;
    
    -- Update API key usage if applicable
    IF p_api_key_id IS NOT NULL THEN
        UPDATE api_keys 
        SET last_used_at = CURRENT_TIMESTAMP,
            last_used_ip = p_ip,
            total_requests = total_requests + 1
        WHERE id = p_api_key_id;
    END IF;
    
    RETURN v_log_id;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 22: FINAL VIEWS FOR WEBAPP
-- =====================================================

-- Active users summary
CREATE VIEW v_active_users AS
SELECT 
    wu.email,
    wu.user_type,
    wu.last_login_at,
    COUNT(DISTINCT s.id) as active_sessions,
    COUNT(DISTINCT al.id) as api_calls_today
FROM webapp_users wu
LEFT JOIN webapp_sessions s ON wu.id = s.webapp_user_id AND s.expires_at > CURRENT_TIMESTAMP
LEFT JOIN api_logs al ON wu.id = al.webapp_user_id AND al.created_at > CURRENT_DATE
WHERE wu.is_active = true
GROUP BY wu.id, wu.email, wu.user_type, wu.last_login_at;

-- API usage summary
CREATE VIEW v_api_usage AS
SELECT 
    ak.name as api_key_name,
    ak.key_prefix,
    wu.email as owner_email,
    ak.total_requests,
    ak.last_used_at,
    COUNT(al.id) as requests_today
FROM api_keys ak
JOIN webapp_users wu ON ak.webapp_user_id = wu.id
LEFT JOIN api_logs al ON ak.id = al.api_key_id AND al.created_at > CURRENT_DATE
WHERE ak.is_active = true
GROUP BY ak.id, ak.name, ak.key_prefix, wu.email, ak.total_requests, ak.last_used_at;

-- System health dashboard
CREATE VIEW v_system_health AS
SELECT 
    'emails_synced_today' as metric,
    COUNT(*) as value
FROM emails WHERE created_at > CURRENT_DATE
UNION ALL
SELECT 
    'active_automations' as metric,
    COUNT(*) as value
FROM automation_executions WHERE status = 'running'
UNION ALL
SELECT 
    'pending_jobs' as metric,
    COUNT(*) as value
FROM job_queue WHERE status = 'pending'
UNION ALL
SELECT 
    'active_users_today' as metric,
    COUNT(DISTINCT webapp_user_id) as value
FROM api_logs WHERE created_at > CURRENT_DATE;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- =====================================================
-- GID-CENTRIC BUSINESS AUTOMATION PLATFORM
-- Complete PostgreSQL 15 Schema with Security
-- =====================================================

-- Continue from previous schema sections...

-- =====================================================
-- SECTION 23: AUTHENTICATION & OTP VERIFICATION
-- =====================================================

-- OTP verification for external users
CREATE TABLE otp_verifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who is verifying
    email text NOT NULL,
    phone_number text NOT NULL,
    
    -- The OTP
    otp_code text NOT NULL,
    otp_hash text NOT NULL, -- For secure comparison
    
    -- Verification details
    verification_type text NOT NULL CHECK (verification_type IN ('login', 'signup', 'password_reset')),
    attempts integer DEFAULT 0,
    max_attempts integer DEFAULT 3,
    
    -- Status
    is_verified boolean DEFAULT false,
    verified_at timestamp,
    expires_at timestamp NOT NULL,
    
    -- IP tracking for security
    request_ip inet,
    verified_ip inet,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Pre-approved external accounts
CREATE TABLE preapproved_accounts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Account details
    email text UNIQUE NOT NULL,
    organization_id uuid REFERENCES organizations(id),
    phone_number text NOT NULL,
    
    -- Approval details
    approved_by_user_id uuid REFERENCES webapp_users(id),
    approved_at timestamp DEFAULT CURRENT_TIMESTAMP,
    approval_notes text,
    
    -- Access level
    access_type text NOT NULL CHECK (access_type IN ('customer_portal', 'partner_portal', 'limited_access')),
    expires_at timestamp,
    
    -- Status
    is_active boolean DEFAULT true,
    account_created boolean DEFAULT false,
    account_created_at timestamp
);

-- Session security tokens
CREATE TABLE security_tokens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash text UNIQUE NOT NULL,
    token_type text NOT NULL CHECK (token_type IN ('refresh', 'access', 'csrf')),
    
    -- Owner
    webapp_user_id uuid REFERENCES webapp_users(id),
    session_id uuid REFERENCES webapp_sessions(id),
    
    -- Expiry
    expires_at timestamp NOT NULL,
    
    -- Usage
    last_used_at timestamp,
    use_count integer DEFAULT 0,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 24: GOOGLE WORKSPACE SYNC STATE
-- =====================================================

-- Track sync state for each resource
CREATE TABLE sync_state (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What we're syncing
    resource_type text NOT NULL CHECK (resource_type IN ('gmail', 'drive', 'calendar', 'people')),
    resource_id text NOT NULL, -- email address, folder GID, calendar ID
    
    -- Sync tokens/cursors
    sync_token text, -- For incremental sync
    history_id text, -- Gmail history ID
    page_token text, -- Drive changes page token
    sync_token_expires_at timestamp,
    
    -- Last sync info
    last_sync_at timestamp,
    last_successful_sync_at timestamp,
    last_error text,
    error_count integer DEFAULT 0,
    
    -- Items synced
    items_synced_count bigint DEFAULT 0,
    
    UNIQUE (resource_type, resource_id)
);

-- Drive watch notifications
CREATE TABLE drive_watches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Watch details
    channel_id text UNIQUE NOT NULL,
    resource_id text NOT NULL, -- File/folder GID
    
    -- Watch configuration
    webhook_url text NOT NULL,
    expiration timestamp NOT NULL,
    
    -- Status
    is_active boolean DEFAULT true,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Gmail push notifications
CREATE TABLE gmail_watches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Watch details
    email_address text NOT NULL,
    history_id text NOT NULL,
    
    -- Webhook details
    webhook_url text NOT NULL,
    expiration timestamp NOT NULL,
    
    -- Status
    is_active boolean DEFAULT true,
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (email_address)
);

-- =====================================================
-- SECTION 25: ADVANCED AUTOMATION RULES
-- =====================================================

-- Complex automation conditions
CREATE TABLE automation_conditions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id uuid NOT NULL REFERENCES automation_triggers(id),
    
    -- Condition logic
    condition_group integer NOT NULL, -- For AND/OR grouping
    condition_type text NOT NULL CHECK (condition_type IN ('field_equals', 'field_contains', 'field_matches_regex', 'time_window', 'organization_type')),
    
    -- What to check
    field_path text NOT NULL, -- JSON path for complex objects
    operator text NOT NULL CHECK (operator IN ('=', '!=', 'contains', 'not_contains', 'matches', '>', '<', 'in', 'not_in')),
    expected_value jsonb NOT NULL,
    
    -- Logic
    combine_with_next text CHECK (combine_with_next IN ('AND', 'OR')),
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Automation action templates
CREATE TABLE automation_action_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_code text UNIQUE NOT NULL,
    template_name text NOT NULL,
    
    -- Action definition
    action_type text NOT NULL CHECK (action_type IN ('create_document', 'send_email', 'create_folder', 'schedule_meeting', 'create_task', 'update_field', 'call_webhook')),
    
    -- Configuration template
    config_template jsonb NOT NULL,
    /* Example configs:
    create_document: {
        "template_gid": "{{template_id}}",
        "destination_folder": "{{project_folder}}",
        "name_pattern": "[DRAFT]_{{document_type}}_{{customer_name}}_{{date}}",
        "variables": {
            "customer_name": "{{organization.display_name}}",
            "project_name": "{{project.name}}"
        }
    }
    */
    
    -- Variables required
    required_variables text[],
    
    -- Usage restrictions
    allowed_trigger_types text[],
    
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SECTION 26: ENHANCED SECURITY FUNCTIONS
-- =====================================================

-- Generate secure OTP
CREATE OR REPLACE FUNCTION generate_otp(
    p_email text,
    p_phone text,
    p_type text
) RETURNS text AS $$
DECLARE
    v_otp text;
    v_hash text;
BEGIN
    -- Generate 6-digit OTP
    v_otp := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    v_hash := encode(digest(v_otp || p_email, 'sha256'), 'hex');
    
    -- Store OTP
    INSERT INTO otp_verifications (email, phone_number, otp_code, otp_hash, verification_type, expires_at)
    VALUES (p_email, p_phone, v_otp, v_hash, p_type, CURRENT_TIMESTAMP + INTERVAL '10 minutes');
    
    RETURN v_otp;
END;
$$ LANGUAGE plpgsql;

-- Verify OTP
CREATE OR REPLACE FUNCTION verify_otp(
    p_email text,
    p_otp text,
    p_ip inet
) RETURNS boolean AS $$
DECLARE
    v_record otp_verifications%ROWTYPE;
    v_hash text;
BEGIN
    -- Get latest OTP for email
    SELECT * INTO v_record
    FROM otp_verifications
    WHERE email = p_email
      AND is_verified = false
      AND expires_at > CURRENT_TIMESTAMP
      AND attempts < max_attempts
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Increment attempts
    UPDATE otp_verifications
    SET attempts = attempts + 1
    WHERE id = v_record.id;
    
    -- Check OTP
    v_hash := encode(digest(p_otp || p_email, 'sha256'), 'hex');
    
    IF v_hash = v_record.otp_hash THEN
        -- Mark as verified
        UPDATE otp_verifications
        SET is_verified = true,
            verified_at = CURRENT_TIMESTAMP,
            verified_ip = p_ip
        WHERE id = v_record.id;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Check if user can access
CREATE OR REPLACE FUNCTION check_user_access(
    p_email text,
    p_resource_type text,
    p_resource_id text,
    p_access_level text
) RETURNS boolean AS $$
DECLARE
    v_user_id uuid;
    v_user_type text;
    v_has_access boolean := false;
BEGIN
    -- Get user info
    SELECT id, user_type INTO v_user_id, v_user_type
    FROM webapp_users
    WHERE email = p_email AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Employees have full access
    IF v_user_type = 'employee' THEN
        RETURN true;
    END IF;
    
    -- Check external permissions
    SELECT EXISTS(
        SELECT 1
        FROM external_permissions
        WHERE webapp_user_id = v_user_id
          AND permission_type = p_resource_type
          AND permission_scope = p_resource_id
          AND (access_level = p_access_level OR 
               (p_access_level = 'view' AND access_level IN ('edit', 'comment')) OR
               (p_access_level = 'comment' AND access_level = 'edit'))
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 27: DRIVE FOLDER MANAGEMENT FUNCTIONS
-- =====================================================

-- Create folder structure from template
CREATE OR REPLACE FUNCTION create_folder_structure(
    p_parent_gid text,
    p_template_code text,
    p_organization_id uuid,
    p_project_id uuid DEFAULT NULL
) RETURNS TABLE(folder_gid text, folder_path text) AS $$
DECLARE
    v_template RECORD;
    v_folder_gid text;
    v_structure jsonb;
BEGIN
    -- Get template structure
    SELECT structure INTO v_structure
    FROM folder_templates
    WHERE template_code = p_template_code;
    
    -- This returns a table that will be populated by the application
    -- after creating folders via Google Drive API
    RETURN QUERY
    SELECT 
        NULL::text as folder_gid,
        jsonb_array_elements_text(v_structure) as folder_path;
END;
$$ LANGUAGE plpgsql;

-- Track document workflow state changes
CREATE OR REPLACE FUNCTION update_document_workflow_state()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status text;
    v_new_status text;
    v_workflow RECORD;
BEGIN
    -- Extract old and new status
    v_old_status := OLD.name_status;
    v_new_status := NEW.name_status;
    
    -- Check if status changed
    IF v_old_status IS DISTINCT FROM v_new_status THEN
        -- Get or create workflow
        SELECT * INTO v_workflow
        FROM document_workflows
        WHERE gid = NEW.gid;
        
        IF NOT FOUND THEN
            -- Infer workflow type from document name
            INSERT INTO document_workflows (
                gid, 
                workflow_type, 
                current_status, 
                current_assignee_email
            )
            VALUES (
                NEW.gid,
                CASE 
                    WHEN NEW.name ILIKE '%contract%' THEN 'contract_approval'
                    WHEN NEW.name ILIKE '%proposal%' THEN 'proposal_review'
                    ELSE 'document_review'
                END,
                v_new_status,
                NEW.name_assignee
            );
        ELSE
            -- Update workflow
            UPDATE document_workflows
            SET current_status = v_new_status,
                current_assignee_email = NEW.name_assignee,
                status_history = status_history || jsonb_build_object(
                    'status', v_new_status,
                    'assignee', NEW.name_assignee,
                    'timestamp', CURRENT_TIMESTAMP
                )
            WHERE gid = NEW.gid;
        END IF;
        
        -- Check for automation triggers
        INSERT INTO job_queue (job_type, job_params, priority)
        VALUES (
            'check_workflow_automation',
            jsonb_build_object(
                'gid', NEW.gid,
                'old_status', v_old_status,
                'new_status', v_new_status,
                'organization_id', NEW.organization_id
            ),
            30  -- High priority
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER document_workflow_state_trigger
AFTER UPDATE ON drive_items
FOR EACH ROW
WHEN (OLD.name_status IS DISTINCT FROM NEW.name_status)
EXECUTE FUNCTION update_document_workflow_state();

-- =====================================================
-- SECTION 28: EMAIL AUTOMATION FUNCTIONS
-- =====================================================

-- Process email for automation
CREATE OR REPLACE FUNCTION process_email_automation()
RETURNS TRIGGER AS $$
DECLARE
    v_trigger RECORD;
    v_condition_met boolean;
BEGIN
    -- Skip if already processed
    IF NEW.automation_status IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check all email triggers
    FOR v_trigger IN 
        SELECT * FROM automation_triggers 
        WHERE trigger_type = 'email_label' 
          AND is_active = true
    LOOP
        -- Check if email matches trigger conditions
        v_condition_met := false;
        
        -- Check label condition
        IF v_trigger.conditions->>'labels' IS NOT NULL THEN
            v_condition_met := (
                SELECT COUNT(*) > 0
                FROM jsonb_array_elements_text(v_trigger.conditions->'labels') AS required_label
                WHERE required_label = ANY(NEW.gmail_labels)
            );
        END IF;
        
        -- Check domain condition
        IF v_condition_met AND v_trigger.conditions->>'from_domain' IS NOT NULL THEN
            v_condition_met := NEW.from_email LIKE '%' || (v_trigger.conditions->>'from_domain');
        END IF;
        
        -- If conditions met, queue automation
        IF v_condition_met THEN
            NEW.automation_status := 'pending';
            
            INSERT INTO automation_executions (
                trigger_id,
                trigger_source_type,
                trigger_source_id,
                status
            ) VALUES (
                v_trigger.id,
                'email',
                NEW.message_id,
                'pending'
            );
            
            -- Queue for processing
            INSERT INTO job_queue (
                job_type,
                job_params,
                priority,
                scheduled_for
            ) VALUES (
                'execute_automation',
                jsonb_build_object(
                    'trigger_id', v_trigger.id,
                    'email_id', NEW.id,
                    'message_id', NEW.message_id
                ),
                CASE 
                    WHEN 'urgent' = ANY(NEW.gmail_labels) THEN 10
                    WHEN 'important' = ANY(NEW.gmail_labels) THEN 20
                    ELSE 50
                END,
                CURRENT_TIMESTAMP
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_automation_trigger
AFTER INSERT ON emails
FOR EACH ROW
EXECUTE FUNCTION process_email_automation();

-- =====================================================
-- SECTION 29: SIDEBAR TASK GENERATION
-- =====================================================

-- Generate sidebar tasks based on rules
CREATE OR REPLACE FUNCTION generate_sidebar_task(
    p_type text,
    p_title text,
    p_description text,
    p_employee_email text,
    p_priority text,
    p_due_hours integer,
    p_related_type text,
    p_related_id text,
    p_quick_actions jsonb DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    v_task_id uuid;
    v_employee_resource_name text;
BEGIN
    -- Get employee resource name
    SELECT person_resource_name INTO v_employee_resource_name
    FROM employees
    WHERE employee_email = p_employee_email;
    
    -- Create task
    INSERT INTO sidebar_tasks (
        employee_email,
        employee_resource_name,
        task_type,
        title,
        description,
        priority,
        due_at,
        related_object_type,
        related_object_id,
        quick_actions
    ) VALUES (
        p_employee_email,
        v_employee_resource_name,
        p_type,
        p_title,
        p_description,
        p_priority,
        CASE 
            WHEN p_due_hours IS NOT NULL THEN CURRENT_TIMESTAMP + (p_due_hours || ' hours')::interval
            ELSE NULL
        END,
        p_related_type,
        p_related_id,
        COALESCE(p_quick_actions, '[]'::jsonb)
    ) RETURNING id INTO v_task_id;
    
    -- Send notification
    INSERT INTO notifications (
        webapp_user_id,
        type,
        title,
        message,
        action_url
    )
    SELECT 
        wu.id,
        'task_assigned',
        'New Task: ' || p_title,
        p_description,
        '/tasks/' || v_task_id
    FROM webapp_users wu
    WHERE wu.email = p_employee_email;
    
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate tasks for document reviews
CREATE OR REPLACE FUNCTION auto_generate_review_tasks()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate task when document needs review
    IF NEW.name_status = 'READY' AND NEW.name_assignee IS NOT NULL THEN
        PERFORM generate_sidebar_task(
            'review',
            'Review: ' || NEW.name,
            'Please review this document and update its status',
            NEW.name_assignee || '@' || current_setting('app.company_domain'),
            CASE 
                WHEN NEW.name ILIKE '%urgent%' THEN 'urgent'
                WHEN NEW.name ILIKE '%contract%' THEN 'high'
                ELSE 'normal'
            END,
            CASE 
                WHEN NEW.name ILIKE '%urgent%' THEN 4
                WHEN NEW.name ILIKE '%contract%' THEN 24
                ELSE 48
            END,
            'document',
            NEW.gid,
            jsonb_build_array(
                jsonb_build_object(
                    'label', 'Open Document',
                    'action', 'open_drive',
                    'params', jsonb_build_object('gid', NEW.gid)
                ),
                jsonb_build_object(
                    'label', 'Approve',
                    'action', 'update_status',
                    'params', jsonb_build_object('status', 'APPROVED')
                ),
                jsonb_build_object(
                    'label', 'Request Changes',
                    'action', 'update_status',
                    'params', jsonb_build_object('status', 'REJECTED')
                )
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_review_tasks_trigger
AFTER UPDATE ON drive_items
FOR EACH ROW
WHEN (NEW.name_status = 'READY' AND NEW.name_assignee IS NOT NULL)
EXECUTE FUNCTION auto_generate_review_tasks();

-- =====================================================
-- SECTION 30: CALENDAR EVENT AUTOMATION
-- =====================================================

-- Create event chain from template
CREATE OR REPLACE FUNCTION create_event_chain(
    p_template_name text,
    p_organization_id uuid,
    p_project_id uuid,
    p_anchor_date date,
    p_created_by_email text
) RETURNS uuid AS $$
DECLARE
    v_chain_id uuid;
    v_template RECORD;
    v_event RECORD;
BEGIN
    -- Create chain record
    INSERT INTO event_chains (
        chain_name,
        chain_type,
        organization_id,
        project_id,
        anchor_date,
        created_from_template,
        created_by_email
    ) VALUES (
        p_template_name,
        CASE 
            WHEN p_template_name ILIKE '%onboarding%' THEN 'onboarding'
            WHEN p_template_name ILIKE '%pilot%' THEN 'pilot'
            ELSE 'project'
        END,
        p_organization_id,
        p_project_id,
        p_anchor_date,
        p_template_name,
        p_created_by_email
    ) RETURNING id INTO v_chain_id;
    
    -- Queue job to create events via Calendar API
    INSERT INTO job_queue (
        job_type,
        job_params,
        priority
    ) VALUES (
        'create_calendar_events',
        jsonb_build_object(
            'chain_id', v_chain_id,
            'template_name', p_template_name,
            'anchor_date', p_anchor_date
        ),
        20
    );
    
    RETURN v_chain_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 31: INITIALIZATION DATA
-- =====================================================

-- Default folder templates
INSERT INTO folder_templates (template_code, template_name, description, structure) VALUES
('standard_customer', 'Standard Customer Folders', 'Basic folder structure for all customers', 
 '["01_Contracts", "02_Projects", "03_Communications", "04_Training", "05_Reports", "06_Support"]'::jsonb),
('pilot_structure', 'Pilot Program Structure', 'Optimized for pilot programs',
 '["01_Pilot_Agreement", "02_Setup", "03_Testing", "04_Feedback", "05_Results"]'::jsonb),
('enterprise_complete', 'Enterprise Complete', 'Full structure for large customers',
 '["01_Legal", "02_Projects", "03_Architecture", "04_Security", "05_Training", "06_Support", "07_Billing", "08_Reports"]'::jsonb)
ON CONFLICT (template_code) DO NOTHING;

-- Default automation triggers
INSERT INTO automation_triggers (trigger_name, trigger_type, conditions, action_template, action_config) VALUES
('auto_respond_support', 'email_label', 
 '{"labels": ["support", "auto-respond"], "from_domain": "@customer.com"}'::jsonb,
 'send_auto_reply',
 '{"template": "support_acknowledgment", "cc_team": true}'::jsonb),
 
('contract_ready_for_review', 'file_status',
 '{"old_status": "DRAFT", "new_status": "READY", "name_contains": "contract"}'::jsonb,
 'assign_review_task',
 '{"assignee_role": "legal", "sla_hours": 24}'::jsonb),
 
('welcome_new_customer', 'file_status',
 '{"old_status": "SENT", "new_status": "SIGNED", "name_contains": "agreement"}'::jsonb,
 'customer_onboarding_sequence',
 '{"create_folders": true, "send_welcome": true, "schedule_kickoff": true}'::jsonb)
ON CONFLICT (trigger_name) DO NOTHING;

-- Default process templates
INSERT INTO process_templates (template_code, template_name, category, steps, required_variables, estimated_days) VALUES
('customer_onboarding', 'Customer Onboarding', 'onboarding',
 '[
   {"step": 1, "name": "Create folder structure", "type": "create_folders", "config": {"template": "standard_customer"}, "assigned_to": "system"},
   {"step": 2, "name": "Send welcome packet", "type": "send_email", "config": {"template": "welcome_packet"}, "assigned_to": "{{account_manager}}"},
   {"step": 3, "name": "Schedule kickoff meeting", "type": "schedule_meeting", "config": {"duration": 60, "attendees": ["{{customer_email}}", "{{account_manager}}"]}, "assigned_to": "{{account_manager}}"},
   {"step": 4, "name": "Create project in system", "type": "create_project", "config": {}, "assigned_to": "system"},
   {"step": 5, "name": "Assign implementation team", "type": "assign_team", "config": {}, "assigned_to": "{{project_manager}}"}
 ]'::jsonb,
 ARRAY['customer_name', 'customer_email', 'account_manager', 'project_manager'],
 7),
 
('pilot_program', 'Pilot Program', 'pilot',
 '[
   {"step": 1, "name": "Setup pilot environment", "type": "technical_setup", "config": {}, "assigned_to": "{{technical_lead}}"},
   {"step": 2, "name": "Initial training", "type": "schedule_training", "config": {"sessions": 2}, "assigned_to": "{{customer_success}}"},
   {"step": 3, "name": "Weekly check-ins", "type": "recurring_meetings", "config": {"frequency": "weekly", "duration": 30}, "assigned_to": "{{account_manager}}"},
   {"step": 4, "name": "Collect feedback", "type": "survey", "config": {"template": "pilot_feedback"}, "assigned_to": "system"},
   {"step": 5, "name": "Pilot review", "type": "document", "config": {"template": "pilot_results"}, "assigned_to": "{{account_manager}}"}
 ]'::jsonb,
 ARRAY['customer_name', 'technical_lead', 'customer_success', 'account_manager'],
 30)
ON CONFLICT (template_code) DO NOTHING;

-- =====================================================
-- SECTION 32: PERFORMANCE OPTIMIZATION
-- =====================================================

-- Materialized view for customer health scores
CREATE MATERIALIZED VIEW mv_customer_health AS
WITH email_metrics AS (
    SELECT 
        organization_id,
        COUNT(*) FILTER (WHERE date_sent > CURRENT_DATE - INTERVAL '30 days') as emails_30d,
        COUNT(*) FILTER (WHERE date_sent > CURRENT_DATE - INTERVAL '7 days') as emails_7d,
        MAX(date_sent) as last_email_date
    FROM emails
    WHERE organization_id IS NOT NULL
    GROUP BY organization_id
),
document_metrics AS (
    SELECT 
        organization_id,
        COUNT(*) as total_documents,
        COUNT(*) FILTER (WHERE modified_time > CURRENT_DATE - INTERVAL '30 days') as active_documents,
        MAX(modified_time) as last_document_activity
    FROM drive_items
    WHERE organization_id IS NOT NULL
    GROUP BY organization_id
),
meeting_metrics AS (
    SELECT 
        organization_id,
        COUNT(*) FILTER (WHERE start_time > CURRENT_DATE - INTERVAL '30 days') as meetings_30d,
        COUNT(*) FILTER (WHERE start_time > CURRENT_DATE) as upcoming_meetings
    FROM calendar_events
    WHERE organization_id IS NOT NULL AND is_customer_meeting = true
    GROUP BY organization_id
),
task_metrics AS (
    SELECT 
        p.organization_id,
        COUNT(*) FILTER (WHERE pt.status = 'completed') as completed_tasks,
        COUNT(*) FILTER (WHERE pt.status != 'completed' AND pt.due_date < CURRENT_DATE) as overdue_tasks,
        COUNT(*) as total_tasks
    FROM project_tasks pt
    JOIN projects p ON pt.project_id = p.id
    GROUP BY p.organization_id
)
SELECT 
    o.id as organization_id,
    o.display_name,
    o.customer_status,
    COALESCE(em.emails_30d, 0) as emails_last_30d,
    COALESCE(em.emails_7d, 0) as emails_last_7d,
    em.last_email_date,
    COALESCE(dm.active_documents, 0) as active_documents,
    dm.last_document_activity,
    COALESCE(mm.meetings_30d, 0) as meetings_last_30d,
    COALESCE(mm.upcoming_meetings, 0) as upcoming_meetings,
    COALESCE(tm.completed_tasks, 0) as completed_tasks,
    COALESCE(tm.overdue_tasks, 0) as overdue_tasks,
    -- Calculate health score
    CASE
        WHEN o.customer_status != 'licensed' THEN 'N/A'
        WHEN em.emails_7d = 0 AND mm.upcoming_meetings = 0 THEN 'at_risk'
        WHEN tm.overdue_tasks > 2 THEN 'needs_attention'
        WHEN em.emails_30d > 10 AND mm.meetings_30d > 0 THEN 'healthy'
        ELSE 'normal'
    END as health_status,
    CURRENT_TIMESTAMP as calculated_at
FROM organizations o
LEFT JOIN email_metrics em ON o.id = em.organization_id
LEFT JOIN document_metrics dm ON o.id = dm.organization_id
LEFT JOIN meeting_metrics mm ON o.id = mm.organization_id
LEFT JOIN task_metrics tm ON o.id = tm.organization_id
WHERE o.org_type = 'customer';

-- Refresh customer health scores periodically
CREATE OR REPLACE FUNCTION refresh_customer_health()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_health;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh
INSERT INTO scheduled_jobs (job_name, job_type, cron_expression, job_params) 
VALUES ('refresh_customer_health', 'refresh_materialized_view', '0 */4 * * *', '{"view_name": "mv_customer_health"}')
ON CONFLICT (job_name) DO NOTHING;

-- =====================================================
-- SECTION 33: FINAL INDEXES & CONSTRAINTS
-- =====================================================

-- Additional performance indexes
CREATE INDEX idx_emails_thread_conversation ON emails(thread_id, conversation_id);
CREATE INDEX idx_drive_items_workflow ON drive_items(name_status, name_assignee) WHERE name_status IS NOT NULL;
CREATE INDEX idx_calendar_events_meeting ON calendar_events(organization_id, is_customer_meeting, start_time);
CREATE INDEX idx_sidebar_tasks_pending ON sidebar_tasks(employee_email, status, due_at) WHERE status = 'pending';
CREATE INDEX idx_job_queue_scheduled ON job_queue(scheduled_for, status) WHERE status = 'pending';

-- Partial indexes for common queries
CREATE INDEX idx_emails_unprocessed ON emails(created_at) WHERE automation_status = 'pending';
CREATE INDEX idx_drive_items_templates ON drive_items(is_template) WHERE is_template = true;
CREATE INDEX idx_webapp_users_active ON webapp_users(email, user_type) WHERE is_active = true;

-- Foreign key indexes for joins
CREATE INDEX idx_org_contacts_person ON organization_contacts(person_resource_name);
CREATE INDEX idx_org_contacts_org ON organization_contacts(organization_id);
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_automation_conditions_trigger ON automation_conditions(trigger_id);

-- =====================================================
-- GRANTS FOR APPLICATION ROLES
-- =====================================================

-- Create application roles
CREATE ROLE automation_service;
CREATE ROLE webapp_service;
CREATE ROLE readonly_service;

-- Grant permissions to automation service
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO automation_service;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO automation_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO automation_service;

-- Grant permissions to webapp service  
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO webapp_service;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO webapp_service;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO webapp_service;

-- Grant read-only permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_service;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO readonly_service;

-- =====================================================
-- END OF COMPLETE SCHEMA
-- =====================================================