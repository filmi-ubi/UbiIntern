"""
Google Workspace API Integration Services
Complete implementation for Drive, Gmail, Calendar, and People APIs
"""

import os
import json
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import logging

from google.oauth2 import service_account
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
import google.auth

import asyncpg
import aioredis
from celery import Celery
import phonenumbers
import pyotp
from twilio.rest import Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
CONFIG = {
    'COMPANY_DOMAIN': os.environ.get('COMPANY_DOMAIN', 'company.com'),
    'SERVICE_ACCOUNT_FILE': os.environ.get('SERVICE_ACCOUNT_FILE', 'service-account.json'),
    'POSTGRES_DSN': os.environ.get('DATABASE_URL'),
    'REDIS_URL': os.environ.get('REDIS_URL', 'redis://localhost:6379'),
    'TWILIO_ACCOUNT_SID': os.environ.get('TWILIO_ACCOUNT_SID'),
    'TWILIO_AUTH_TOKEN': os.environ.get('TWILIO_AUTH_TOKEN'),
    'TWILIO_PHONE_NUMBER': os.environ.get('TWILIO_PHONE_NUMBER'),
    'WEBHOOK_BASE_URL': os.environ.get('WEBHOOK_BASE_URL', 'https://api.company.com/webhooks')
}

# Initialize Celery for background tasks
celery_app = Celery('automation', broker=CONFIG['REDIS_URL'])

# Service account scopes
SCOPES = [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/contacts'
]

class GoogleWorkspaceService:
    """Base service for Google Workspace API interactions"""
    
    def __init__(self):
        self.credentials = None
        self.services = {}
        self._initialize_credentials()
    
    def _initialize_credentials(self):
        """Initialize service account credentials"""
        self.credentials = service_account.Credentials.from_service_account_file(
            CONFIG['SERVICE_ACCOUNT_FILE'],
            scopes=SCOPES
        )
    
    def get_service(self, service_name: str, version: str, user_email: str = None):
        """Get or create a Google API service instance"""
        key = f"{service_name}_{version}_{user_email or 'default'}"
        
        if key not in self.services:
            creds = self.credentials
            if user_email:
                # Delegate to user for domain-wide delegation
                creds = creds.with_subject(user_email)
            
            self.services[key] = build(service_name, version, credentials=creds)
        
        return self.services[key]

class DriveService(GoogleWorkspaceService):
    """Google Drive API operations"""
    
    async def create_folder_structure(self, parent_gid: str, template_code: str, 
                                    organization_id: str, project_id: str = None) -> List[Dict]:
        """Create folder structure from template"""
        service = self.get_service('drive', 'v3')
        created_folders = []
        
        # Get template from database
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            template = await conn.fetchrow(
                "SELECT structure FROM folder_templates WHERE template_code = $1",
                template_code
            )
            
            if not template:
                raise ValueError(f"Template {template_code} not found")
            
            folder_paths = json.loads(template['structure'])
            
            # Create each folder
            for path in folder_paths:
                folder_metadata = {
                    'name': path,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [parent_gid]
                }
                
                try:
                    folder = service.files().create(
                        body=folder_metadata,
                        fields='id,name,createdTime'
                    ).execute()
                    
                    created_folders.append({
                        'gid': folder['id'],
                        'name': folder['name'],
                        'parent_gid': parent_gid,
                        'created_time': folder['createdTime']
                    })
                    
                    # Record in database
                    await conn.execute("""
                        INSERT INTO drive_items (gid, name, mime_type, parent_gid, 
                                               organization_id, project_id, created_time)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """, folder['id'], folder['name'], 'application/vnd.google-apps.folder',
                        parent_gid, organization_id, project_id, 
                        datetime.fromisoformat(folder['createdTime'].replace('Z', '+00:00')))
                    
                except HttpError as error:
                    logger.error(f"Error creating folder {path}: {error}")
        
        return created_folders
    
    async def copy_from_template(self, template_gid: str, destination_folder_gid: str,
                               new_name: str, variables: Dict[str, str]) -> str:
        """Copy document from template and replace variables"""
        service = self.get_service('drive', 'v3')
        
        # Copy the file
        copy_metadata = {
            'name': new_name,
            'parents': [destination_folder_gid]
        }
        
        try:
            copied_file = service.files().copy(
                fileId=template_gid,
                body=copy_metadata
            ).execute()
            
            file_id = copied_file['id']
            
            # If it's a Google Doc, replace variables
            if copied_file.get('mimeType') == 'application/vnd.google-apps.document':
                docs_service = self.get_service('docs', 'v1')
                
                # Get document content
                document = docs_service.documents().get(documentId=file_id).execute()
                
                # Build batch update request for variable replacement
                requests = []
                for var_name, var_value in variables.items():
                    requests.append({
                        'replaceAllText': {
                            'containsText': {
                                'text': f'{{{{{var_name}}}}}',
                                'matchCase': False
                            },
                            'replaceText': var_value
                        }
                    })
                
                if requests:
                    docs_service.documents().batchUpdate(
                        documentId=file_id,
                        body={'requests': requests}
                    ).execute()
            
            # Record in database
            async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
                await conn.execute("""
                    INSERT INTO drive_items (gid, name, mime_type, parent_gid, 
                                           created_from_template_gid, created_time)
                    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                """, file_id, new_name, copied_file.get('mimeType'), 
                    destination_folder_gid, template_gid)
            
            return file_id
            
        except HttpError as error:
            logger.error(f"Error copying template: {error}")
            raise
    
    async def update_file_name(self, gid: str, new_name: str) -> bool:
        """Update file name (for status changes)"""
        service = self.get_service('drive', 'v3')
        
        try:
            service.files().update(
                fileId=gid,
                body={'name': new_name}
            ).execute()
            
            # Update in database (will trigger workflow automation)
            async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
                await conn.execute(
                    "UPDATE drive_items SET name = $1 WHERE gid = $2",
                    new_name, gid
                )
            
            return True
            
        except HttpError as error:
            logger.error(f"Error updating file name: {error}")
            return False
    
    async def set_permissions(self, gid: str, email: str, role: str = 'reader') -> str:
        """Grant permission to a file/folder"""
        service = self.get_service('drive', 'v3')
        
        permission = {
            'type': 'user',
            'role': role,
            'emailAddress': email
        }
        
        try:
            result = service.permissions().create(
                fileId=gid,
                body=permission,
                fields='id',
                sendNotificationEmail=True
            ).execute()
            
            # Record in database
            async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
                # Get person resource name
                person = await conn.fetchrow(
                    "SELECT resource_name FROM people WHERE primary_email = $1",
                    email
                )
                
                await conn.execute("""
                    INSERT INTO drive_permissions (gid, permission_id, role, type, 
                                                 email_address, person_resource_name)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, gid, result['id'], role, 'user', email, 
                    person['resource_name'] if person else None)
            
            return result['id']
            
        except HttpError as error:
            logger.error(f"Error setting permission: {error}")
            raise
    
    async def watch_file(self, gid: str, webhook_url: str) -> Dict:
        """Set up push notification for file changes"""
        service = self.get_service('drive', 'v3')
        
        channel_id = f"drive-{gid}-{datetime.now().timestamp()}"
        
        body = {
            'id': channel_id,
            'type': 'web_hook',
            'address': webhook_url,
            'expiration': int((datetime.now() + timedelta(days=7)).timestamp() * 1000)
        }
        
        try:
            result = service.files().watch(
                fileId=gid,
                body=body
            ).execute()
            
            # Record in database
            async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
                await conn.execute("""
                    INSERT INTO drive_watches (channel_id, resource_id, webhook_url, expiration)
                    VALUES ($1, $2, $3, $4)
                """, channel_id, gid, webhook_url, 
                    datetime.fromtimestamp(result['expiration'] / 1000))
            
            return result
            
        except HttpError as error:
            logger.error(f"Error setting up watch: {error}")
            raise

class GmailService(GoogleWorkspaceService):
    """Gmail API operations"""
    
    async def sync_employee_emails(self, employee_email: str, history_id: str = None):
        """Sync emails for an employee"""
        service = self.get_service('gmail', 'v1', employee_email)
        
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            # Get sync state
            sync_state = await conn.fetchrow(
                "SELECT * FROM sync_state WHERE resource_type = 'gmail' AND resource_id = $1",
                employee_email
            )
            
            if history_id or (sync_state and sync_state['history_id']):
                # Incremental sync
                start_history_id = history_id or sync_state['history_id']
                
                try:
                    history = service.users().history().list(
                        userId='me',
                        startHistoryId=start_history_id
                    ).execute()
                    
                    if 'history' in history:
                        for record in history['history']:
                            await self._process_history_record(employee_email, record, conn)
                    
                    # Update sync state
                    await conn.execute("""
                        INSERT INTO sync_state (resource_type, resource_id, history_id, last_sync_at)
                        VALUES ('gmail', $1, $2, CURRENT_TIMESTAMP)
                        ON CONFLICT (resource_type, resource_id) 
                        DO UPDATE SET history_id = $2, last_sync_at = CURRENT_TIMESTAMP
                    """, employee_email, history.get('historyId'))
                    
                except HttpError as error:
                    logger.error(f"Error in incremental sync: {error}")
                    # Fall back to full sync
                    await self._full_email_sync(employee_email, service, conn)
            else:
                # Full sync
                await self._full_email_sync(employee_email, service, conn)
    
    async def _full_email_sync(self, employee_email: str, service, conn):
        """Perform full email sync"""
        try:
            # Get messages from last 30 days
            query = f"after:{(datetime.now() - timedelta(days=30)).strftime('%Y/%m/%d')}"
            
            messages = []
            page_token = None
            
            while True:
                results = service.users().messages().list(
                    userId='me',
                    q=query,
                    pageToken=page_token
                ).execute()
                
                if 'messages' in results:
                    messages.extend(results['messages'])
                
                page_token = results.get('nextPageToken')
                if not page_token:
                    break
            
            # Process each message
            for msg in messages:
                await self._process_message(employee_email, msg['id'], service, conn)
            
            # Get current history ID
            profile = service.users().getProfile(userId='me').execute()
            
            await conn.execute("""
                INSERT INTO sync_state (resource_type, resource_id, history_id, last_sync_at)
                VALUES ('gmail', $1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (resource_type, resource_id) 
                DO UPDATE SET history_id = $2, last_sync_at = CURRENT_TIMESTAMP
            """, employee_email, profile['historyId'])
            
        except HttpError as error:
            logger.error(f"Error in full sync: {error}")
            raise
    
    async def _process_message(self, employee_email: str, message_id: str, service, conn):
        """Process a single email message"""
        try:
            msg = service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            # Parse message
            headers = {h['name']: h['value'] for h in msg['payload'].get('headers', [])}
            
            # Extract data
            email_data = {
                'message_id': headers.get('Message-ID', ''),
                'gmail_message_id': message_id,
                'thread_id': msg['threadId'],
                'employee_email': employee_email,
                'subject': headers.get('Subject', ''),
                'from_email': self._parse_email_address(headers.get('From', '')),
                'to_emails': self._parse_email_list(headers.get('To', '')),
                'cc_emails': self._parse_email_list(headers.get('Cc', '')),
                'date_sent': self._parse_date(headers.get('Date', '')),
                'internal_date': datetime.fromtimestamp(int(msg['internalDate']) / 1000),
                'snippet': msg.get('snippet', ''),
                'gmail_labels': msg.get('labelIds', []),
                'is_unread': 'UNREAD' in msg.get('labelIds', []),
                'is_starred': 'STARRED' in msg.get('labelIds', []),
                'has_attachments': self._has_attachments(msg['payload'])
            }
            
            # Get person resource name for sender
            from_person = await conn.fetchrow(
                "SELECT resource_name FROM people WHERE primary_email = $1",
                email_data['from_email']
            )
            if from_person:
                email_data['from_resource_name'] = from_person['resource_name']
            
            # Insert/update email
            await conn.execute("""
                INSERT INTO emails (
                    message_id, gmail_message_id, thread_id, employee_email,
                    subject, from_email, from_resource_name, to_emails, cc_emails,
                    date_sent, internal_date, snippet, gmail_labels,
                    is_unread, is_starred, has_attachments
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT (message_id, employee_email) DO UPDATE SET
                    gmail_labels = EXCLUDED.gmail_labels,
                    is_unread = EXCLUDED.is_unread,
                    is_starred = EXCLUDED.is_starred
            """, *email_data.values())
            
            # Process attachments
            if email_data['has_attachments']:
                await self._process_attachments(message_id, msg['payload'], conn)
            
        except Exception as error:
            logger.error(f"Error processing message {message_id}: {error}")
    
    async def send_email(self, from_email: str, to_emails: List[str], 
                        subject: str, body: str, template_id: str = None) -> str:
        """Send an email"""
        service = self.get_service('gmail', 'v1', from_email)
        
        # Build message
        message = {
            'to': ', '.join(to_emails),
            'subject': subject,
            'from': from_email
        }
        
        if template_id:
            # Load template and replace variables
            async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
                template = await conn.fetchrow(
                    "SELECT content, variables FROM email_templates WHERE template_id = $1",
                    template_id
                )
                if template:
                    body = template['content']
                    # Replace variables in body
        
        # Create MIME message
        import email.mime.text
        import email.mime.multipart
        import base64
        
        mime_message = email.mime.multipart.MIMEMultipart()
        mime_message['to'] = message['to']
        mime_message['from'] = message['from']
        mime_message['subject'] = message['subject']
        mime_message.attach(email.mime.text.MIMEText(body, 'html'))
        
        raw_message = base64.urlsafe_b64encode(
            mime_message.as_bytes()
        ).decode('utf-8')
        
        try:
            result = service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            return result['id']
            
        except HttpError as error:
            logger.error(f"Error sending email: {error}")
            raise
    
    async def add_label(self, employee_email: str, message_id: str, label: str):
        """Add a label to an email"""
        service = self.get_service('gmail', 'v1', employee_email)
        
        try:
            # Get or create label
            labels = service.users().labels().list(userId='me').execute()
            label_id = None
            
            for l in labels.get('labels', []):
                if l['name'] == label:
                    label_id = l['id']
                    break
            
            if not label_id:
                # Create label
                label_object = service.users().labels().create(
                    userId='me',
                    body={'name': label}
                ).execute()
                label_id = label_object['id']
            
            # Add label to message
            service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': [label_id]}
            ).execute()
            
            # Update in database
            async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
                await conn.execute("""
                    UPDATE emails 
                    SET gmail_labels = array_append(gmail_labels, $1),
                        automation_labels = array_append(automation_labels, $1)
                    WHERE gmail_message_id = $2 AND employee_email = $3
                """, label, message_id, employee_email)
                
        except HttpError as error:
            logger.error(f"Error adding label: {error}")
            raise
    
    async def watch_inbox(self, employee_email: str) -> Dict:
        """Set up Gmail push notifications"""
        service = self.get_service('gmail', 'v1', employee_email)
        
        request = {
            'labelIds': ['INBOX'],
            'topicName': f'projects/{CONFIG["GCP_PROJECT_ID"]}/topics/gmail-notifications'
        }
        
        try:
            result = service.users().watch(userId='me', body=request).execute()
            
            # Record in database
            async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
                await conn.execute("""
                    INSERT INTO gmail_watches (email_address, history_id, webhook_url, expiration)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (email_address) DO UPDATE SET
                        history_id = EXCLUDED.history_id,
                        expiration = EXCLUDED.expiration
                """, employee_email, result['historyId'], 
                    f"{CONFIG['WEBHOOK_BASE_URL']}/gmail/{employee_email}",
                    datetime.fromtimestamp(int(result['expiration']) / 1000))
            
            return result
            
        except HttpError as error:
            logger.error(f"Error setting up watch: {error}")
            raise
    
    def _parse_email_address(self, email_str: str) -> str:
        """Extract email address from 'Name <email>' format"""
        import re
        match = re.search(r'<(.+?)>', email_str)
        return match.group(1) if match else email_str.strip()
    
    def _parse_email_list(self, email_str: str) -> List[str]:
        """Parse comma-separated email list"""
        if not email_str:
            return []
        return [self._parse_email_address(e.strip()) for e in email_str.split(',')]
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse email date string"""
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(date_str) if date_str else datetime.now()
    
    def _has_attachments(self, payload: Dict) -> bool:
        """Check if message has attachments"""
        if 'parts' in payload:
            for part in payload['parts']:
                if part.get('filename'):
                    return True
                if 'parts' in part:
                    if self._has_attachments(part):
                        return True
        return False

class CalendarService(GoogleWorkspaceService):
    """Google Calendar API operations"""
    
    async def create_event(self, calendar_id: str, summary: str, start_time: datetime,
                          end_time: datetime, attendees: List[str], 
                          description: str = None, location: str = None) -> str:
        """Create a calendar event"""
        service = self.get_service('calendar', 'v3', calendar_id)
        
        event = {
            'summary': summary,
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'America/New_York',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'America/New_York',
            },
            'attendees': [{'email': email} for email in attendees],
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }
        
        if description:
            event['description'] = description
        if location:
            event['location'] = location
        
        # Add Google Meet
        event['conferenceData'] = {
            'createRequest': {
                'requestId': f"meet-{datetime.now().timestamp()}",
                'conferenceSolutionKey': {'type': 'hangoutsMeet'}
            }
        }
        
        try:
            result = service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1
            ).execute()
            
            # Record in database
            async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
                # Get attendee resource names
                attendee_resources = []
                for email in attendees:
                    person = await conn.fetchrow(
                        "SELECT resource_name FROM people WHERE primary_email = $1",
                        email
                    )
                    if person:
                        attendee_resources.append(person['resource_name'])
                
                # Determine if customer meeting
                is_customer = False
                org_id = None
                for email in attendees:
                    org = await conn.fetchrow("""
                        SELECT o.id FROM organizations o
                        WHERE $1 = ANY(o.email_domains)
                        OR EXISTS (
                            SELECT 1 FROM people p
                            JOIN organization_contacts oc ON p.resource_name = oc.person_resource_name
                            WHERE p.primary_email = $1 AND oc.organization_id = o.id
                        )
                    """, email.split('@')[1])
                    if org:
                        is_customer = True
                        org_id = org['id']
                        break
                
                await conn.execute("""
                    INSERT INTO calendar_events (
                        event_id, calendar_id, summary, description, location,
                        meet_link, start_time, end_time, organizer_email,
                        attendee_emails, attendee_resource_names, organization_id,
                        is_customer_meeting
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                """, result['id'], calendar_id, summary, description, location,
                    result.get('hangoutLink'), start_time, end_time, calendar_id,
                    attendees, attendee_resources, org_id, is_customer)
            
            return result['id']
            
        except HttpError as error:
            logger.error(f"Error creating event: {error}")
            raise
    
    async def create_event_chain(self, template_name: str, organization_id: str,
                               anchor_date: datetime, created_by: str) -> List[str]:
        """Create a chain of events from template"""
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            # Create chain record
            chain_id = await conn.fetchval("""
                SELECT create_event_chain($1, $2, NULL, $3, $4)
            """, template_name, organization_id, anchor_date.date(), created_by)
            
            # Get template
            template = await conn.fetchrow(
                "SELECT * FROM event_chain_templates WHERE template_name = $1",
                template_name
            )
            
            if not template:
                raise ValueError(f"Template {template_name} not found")
            
            events = json.loads(template['events'])
            created_events = []
            
            # Get organization contacts
            contacts = await conn.fetch("""
                SELECT p.primary_email
                FROM organization_contacts oc
                JOIN people p ON oc.person_resource_name = p.resource_name
                WHERE oc.organization_id = $1 AND oc.role = 'primary'
            """, organization_id)
            
            customer_emails = [c['primary_email'] for c in contacts]
            
            # Create each event
            for idx, event_template in enumerate(events):
                event_date = anchor_date + timedelta(days=event_template['offset_days'])
                
                # Determine attendees
                attendees = customer_emails.copy()
                if event_template.get('internal_attendees'):
                    attendees.extend(event_template['internal_attendees'])
                
                event_id = await self.create_event(
                    created_by,
                    event_template['name'],
                    event_date.replace(hour=10),  # Default 10 AM
                    event_date.replace(hour=11),  # 1 hour duration
                    attendees,
                    event_template.get('description'),
                    event_template.get('location', 'Google Meet')
                )
                
                created_events.append(event_id)
                
                # Link to chain
                await conn.execute("""
                    UPDATE calendar_events 
                    SET event_chain_id = $1, chain_position = $2
                    WHERE event_id = $3 AND calendar_id = $4
                """, chain_id, idx + 1, event_id, created_by)
            
            return created_events

class PeopleService(GoogleWorkspaceService):
    """Google People API operations"""
    
    async def sync_contact(self, email: str) -> str:
        """Sync or create a contact in Google Contacts"""
        service = self.get_service('people', 'v1')
        
        # Search for existing contact
        results = service.people().searchContacts(
            query=email,
            readMask='names,emailAddresses,phoneNumbers,organizations,metadata'
        ).execute()
        
        contact_data = None
        resource_name = None
        
        if results.get('results'):
            # Update existing contact
            person = results['results'][0]['person']
            resource_name = person['resourceName']
            contact_data = await self._parse_person_data(person)
        else:
            # Create new contact
            contact_data = {'emailAddresses': [{'value': email}]}
        
        # Save to database
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            if resource_name:
                # Update existing
                await conn.execute("""
                    UPDATE people 
                    SET emails = $2, names = $3, phones = $4, organizations = $5,
                        metadata = $6, last_synced_at = CURRENT_TIMESTAMP
                    WHERE resource_name = $1
                """, resource_name, json.dumps(contact_data.get('emails', [])),
                    json.dumps(contact_data.get('names')),
                    json.dumps(contact_data.get('phones', [])),
                    json.dumps(contact_data.get('organizations', [])),
                    json.dumps(contact_data.get('metadata', {})))
            else:
                # Create new person record
                await conn.execute("""
                    INSERT INTO people (
                        resource_name, primary_email, emails, person_type
                    ) VALUES (
                        $1, $2, $3, 'customer_contact'
                    )
                """, f"people/temp_{email}", email, 
                    json.dumps([{'value': email, 'type': 'work'}]))
        
        return resource_name or f"people/temp_{email}"
    
    async def create_or_update_contact(self, person_data: Dict) -> str:
        """Create or update a Google Contact"""
        service = self.get_service('people', 'v1')
        
        # Build person object
        person = {
            'names': [person_data.get('names', {})],
            'emailAddresses': [{'value': email} for email in person_data.get('emails', [])],
            'phoneNumbers': [{'value': phone} for phone in person_data.get('phones', [])],
            'organizations': person_data.get('organizations', [])
        }
        
        try:
            if person_data.get('resource_name'):
                # Update existing
                result = service.people().updateContact(
                    resourceName=person_data['resource_name'],
                    body=person,
                    updatePersonFields='names,emailAddresses,phoneNumbers,organizations'
                ).execute()
            else:
                # Create new
                result = service.people().createContact(body=person).execute()
            
            return result['resourceName']
            
        except HttpError as error:
            logger.error(f"Error creating/updating contact: {error}")
            raise
    
    async def _parse_person_data(self, person: Dict) -> Dict:
        """Parse Google Person object into our format"""
        return {
            'resource_name': person['resourceName'],
            'emails': person.get('emailAddresses', []),
            'names': person.get('names', [{}])[0],
            'phones': person.get('phoneNumbers', []),
            'organizations': person.get('organizations', []),
            'metadata': person.get('metadata', {})
        }

class AuthenticationService:
    """Handle authentication and OTP verification"""
    
    def __init__(self):
        self.twilio_client = Client(CONFIG['TWILIO_ACCOUNT_SID'], CONFIG['TWILIO_AUTH_TOKEN'])
        self.redis = None
    
    async def initialize(self):
        """Initialize Redis connection"""
        self.redis = await aioredis.create_redis_pool(CONFIG['REDIS_URL'])
    
    async def verify_employee(self, email: str) -> bool:
        """Verify if email is an employee"""
        if not email.endswith(f"@{CONFIG['COMPANY_DOMAIN']}"):
            return False
        
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            employee = await conn.fetchrow("""
                SELECT person_resource_name, employment_status
                FROM employees 
                WHERE employee_email = $1 AND employment_status = 'active'
            """, email)
            
            return employee is not None
    
    async def verify_preapproved_account(self, email: str) -> Dict:
        """Check if account is pre-approved"""
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            account = await conn.fetchrow("""
                SELECT pa.*, o.display_name as organization_name
                FROM preapproved_accounts pa
                LEFT JOIN organizations o ON pa.organization_id = o.id
                WHERE pa.email = $1 
                  AND pa.is_active = true
                  AND (pa.expires_at IS NULL OR pa.expires_at > CURRENT_TIMESTAMP)
            """, email)
            
            if account:
                return {
                    'approved': True,
                    'phone_number': account['phone_number'],
                    'access_type': account['access_type'],
                    'organization': account['organization_name']
                }
            
            return {'approved': False}
    
    async def send_otp(self, email: str, phone_number: str) -> bool:
        """Send OTP via SMS"""
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            # Generate OTP
            otp = await conn.fetchval("SELECT generate_otp($1, $2, 'login')", email, phone_number)
            
            # Format phone number
            try:
                parsed_number = phonenumbers.parse(phone_number, 'US')
                formatted_number = phonenumbers.format_number(
                    parsed_number, 
                    phonenumbers.PhoneNumberFormat.E164
                )
            except:
                logger.error(f"Invalid phone number: {phone_number}")
                return False
            
            # Send SMS
            try:
                message = self.twilio_client.messages.create(
                    body=f"Your verification code is: {otp}. Valid for 10 minutes.",
                    from_=CONFIG['TWILIO_PHONE_NUMBER'],
                    to=formatted_number
                )
                
                logger.info(f"OTP sent to {formatted_number}: {message.sid}")
                return True
                
            except Exception as e:
                logger.error(f"Error sending OTP: {e}")
                return False
    
    async def verify_otp_code(self, email: str, otp_code: str, ip_address: str) -> bool:
        """Verify OTP code"""
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            result = await conn.fetchval(
                "SELECT verify_otp($1, $2, $3::inet)",
                email, otp_code, ip_address
            )
            
            if result:
                # Mark preapproved account as used
                await conn.execute("""
                    UPDATE preapproved_accounts 
                    SET account_created = true, account_created_at = CURRENT_TIMESTAMP
                    WHERE email = $1
                """, email)
            
            return result
    
    async def create_session(self, user_id: str, ip_address: str, user_agent: str) -> str:
        """Create authenticated session"""
        import secrets
        
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=8)
        
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            await conn.execute("""
                INSERT INTO webapp_sessions (
                    session_token, webapp_user_id, ip_address, 
                    user_agent, expires_at
                ) VALUES ($1, $2, $3::inet, $4, $5)
            """, session_token, user_id, ip_address, user_agent, expires_at)
        
        # Store in Redis for fast lookup
        if self.redis:
            await self.redis.setex(
                f"session:{session_token}", 
                int(timedelta(hours=8).total_seconds()),
                user_id
            )
        
        return session_token
    
    async def validate_session(self, session_token: str) -> Optional[str]:
        """Validate session and return user ID"""
        # Check Redis first
        if self.redis:
            user_id = await self.redis.get(f"session:{session_token}")
            if user_id:
                return user_id.decode('utf-8')
        
        # Fall back to database
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            result = await conn.fetchrow("""
                SELECT webapp_user_id 
                FROM webapp_sessions 
                WHERE session_token = $1 
                  AND expires_at > CURRENT_TIMESTAMP
            """, session_token)
            
            if result:
                user_id = str(result['webapp_user_id'])
                
                # Update Redis
                if self.redis:
                    await self.redis.setex(
                        f"session:{session_token}",
                        3600,  # 1 hour
                        user_id
                    )
                
                return user_id
        
        return None

class AutomationEngine:
    """Process automation rules and execute actions"""
    
    def __init__(self):
        self.drive_service = DriveService()
        self.gmail_service = GmailService()
        self.calendar_service = CalendarService()
    
    async def check_triggers(self):
        """Check for pending automation triggers"""
        async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
            # Get pending email automations
            pending_emails = await conn.fetch("""
                SELECT e.*, at.*, ae.id as execution_id
                FROM emails e
                JOIN automation_executions ae ON ae.trigger_source_id = e.message_id
                JOIN automation_triggers at ON ae.trigger_id = at.id
                WHERE e.automation_status = 'pending'
                  AND ae.status = 'pending'
                LIMIT 10
            """)
            
            for record in pending_emails:
                await self.process_email_automation(record, conn)
            
            # Get pending drive automations
            pending_files = await conn.fetch("""
                SELECT di.*, at.*, ae.id as execution_id
                FROM drive_items di
                JOIN automation_executions ae ON ae.trigger_source_id = di.gid
                JOIN automation_triggers at ON ae.trigger_id = at.id
                WHERE di.automation_status = 'pending'
                  AND ae.status = 'pending'
                LIMIT 10
            """)
            
            for record in pending_files:
                await self.process_drive_automation(record, conn)
    
    async def process_email_automation(self, record: Dict, conn):
        """Process email-triggered automation"""
        try:
            # Update status to processing
            await conn.execute("""
                UPDATE automation_executions SET status = 'running' WHERE id = $1
            """, record['execution_id'])
            
            action_config = json.loads(record['action_config'])
            actions_taken = []
            
            # Execute action based on template
            if record['action_template'] == 'send_auto_reply':
                # Send auto-reply
                reply_template = action_config.get('template', 'default_reply')
                
                message_id = await self.gmail_service.send_email(
                    record['employee_email'],
                    [record['from_email']],
                    f"Re: {record['subject']}",
                    f"Thank you for your email. We have received your message and will respond within 24 hours.",
                    reply_template
                )
                
                actions_taken.append({
                    'action': 'sent_reply',
                    'message_id': message_id
                })
                
                # Create sidebar task for follow-up
                if action_config.get('create_task', True):
                    await conn.execute("""
                        SELECT generate_sidebar_task(
                            'respond', $1, $2, $3, 'normal', 24, 'email', $4, NULL
                        )
                    """, f"Follow up: {record['subject']}", 
                        f"Customer email requires response",
                        record['employee_email'],
                        record['message_id'])
                    
                    actions_taken.append({
                        'action': 'created_task',
                        'for': record['employee_email']
                    })
            
            elif record['action_template'] == 'categorize_and_route':
                # Add labels and route to appropriate person
                category = self._categorize_email(record['subject'], record['snippet'])
                
                await self.gmail_service.add_label(
                    record['employee_email'],
                    record['gmail_message_id'],
                    category
                )
                
                actions_taken.append({
                    'action': 'added_label',
                    'label': category
                })
                
                # Route to specialist
                specialist = await self._get_specialist(category, conn)
                if specialist:
                    await conn.execute("""
                        SELECT generate_sidebar_task(
                            'review', $1, $2, $3, 'high', 4, 'email', $4, NULL
                        )
                    """, f"Review: {record['subject']}", 
                        f"Routed from {record['employee_email']}",
                        specialist,
                        record['message_id'])
                    
                    actions_taken.append({
                        'action': 'routed_to',
                        'specialist': specialist
                    })
            
            # Update execution status
            await conn.execute("""
                UPDATE automation_executions 
                SET status = 'completed',
                    completed_at = CURRENT_TIMESTAMP,
                    actions_taken = $2
                WHERE id = $1
            """, record['execution_id'], json.dumps(actions_taken))
            
            # Update email status
            await conn.execute("""
                UPDATE emails 
                SET automation_status = 'completed',
                    automation_processed_at = CURRENT_TIMESTAMP
                WHERE id = $1
            """, record['id'])
            
        except Exception as e:
            logger.error(f"Error in email automation: {e}")
            
            await conn.execute("""
                UPDATE automation_executions 
                SET status = 'failed',
                    error_message = $2,
                    completed_at = CURRENT_TIMESTAMP
                WHERE id = $1
            """, record['execution_id'], str(e))
    
    async def process_drive_automation(self, record: Dict, conn):
        """Process drive-triggered automation"""
        try:
            # Update status to processing
            await conn.execute("""
                UPDATE automation_executions SET status = 'running' WHERE id = $1
            """, record['execution_id'])
            
            action_config = json.loads(record['action_config'])
            actions_taken = []
            
            # Execute action based on template
            if record['action_template'] == 'assign_review_task':
                # Create review task
                assignee_role = action_config.get('assignee_role', 'manager')
                sla_hours = action_config.get('sla_hours', 24)
                
                # Get appropriate reviewer
                reviewer = await self._get_reviewer(assignee_role, record['organization_id'], conn)
                
                if reviewer:
                    task_id = await conn.fetchval("""
                        SELECT generate_sidebar_task(
                            'review', $1, $2, $3, $4, $5, 'document', $6, $7
                        )
                    """, f"Review: {record['name']}",
                        f"Document ready for {assignee_role} review",
                        reviewer,
                        'high' if 'contract' in record['name'].lower() else 'normal',
                        sla_hours,
                        record['gid'],
                        json.dumps([
                            {
                                'label': 'Open Document',
                                'action': 'open_drive',
                                'params': {'gid': record['gid']}
                            },
                            {
                                'label': 'Approve',
                                'action': 'update_status',
                                'params': {'status': 'APPROVED', 'gid': record['gid']}
                            }
                        ]))
                    
                    actions_taken.append({
                        'action': 'created_review_task',
                        'task_id': str(task_id),
                        'assignee': reviewer
                    })
                    
                    # Update filename with assignee
                    new_name = record['name'].replace('[READY]', f'[REVIEW]_@{reviewer.split("@")[0]}')
                    await self.drive_service.update_file_name(record['gid'], new_name)
                    
                    actions_taken.append({
                        'action': 'updated_filename',
                        'new_name': new_name
                    })
            
            elif record['action_template'] == 'customer_onboarding_sequence':
                # Full onboarding automation
                org_id = record['organization_id']
                
                # 1. Create folder structure
                folders = await self.drive_service.create_folder_structure(
                    record['parent_gid'],
                    'standard_customer',
                    org_id
                )
                
                actions_taken.append({
                    'action': 'created_folders',
                    'count': len(folders)
                })
                
                # 2. Copy welcome documents
                welcome_docs = await conn.fetch("""
                    SELECT gid, template_name 
                    FROM document_templates 
                    WHERE 'welcome' = ANY(for_customer_types)
                """)
                
                for doc in welcome_docs:
                    # Get customer data for variables
                    customer = await conn.fetchrow("""
                        SELECT o.*, p.names->>'displayName' as contact_name
                        FROM organizations o
                        LEFT JOIN organization_contacts oc ON o.id = oc.organization_id
                        LEFT JOIN people p ON oc.person_resource_name = p.resource_name
                        WHERE o.id = $1 AND oc.is_primary = true
                    """, org_id)
                    
                    variables = {
                        'customer_name': customer['display_name'],
                        'contact_name': customer['contact_name'],
                        'date': datetime.now().strftime('%B %d, %Y')
                    }
                    
                    doc_gid = await self.drive_service.copy_from_template(
                        doc['gid'],
                        folders[0]['gid'],  # First folder
                        f"[DRAFT]_Welcome_{customer['display_name']}_{datetime.now().strftime('%Y%m%d')}",
                        variables
                    )
                    
                    actions_taken.append({
                        'action': 'created_document',
                        'template': doc['template_name'],
                        'gid': doc_gid
                    })
                
                # 3. Schedule kickoff meeting
                contacts = await conn.fetch("""
                    SELECT p.primary_email
                    FROM organization_contacts oc
                    JOIN people p ON oc.person_resource_name = p.resource_name
                    WHERE oc.organization_id = $1 AND oc.role = 'primary'
                """, org_id)
                
                if contacts:
                    # Get account manager
                    am_email = await conn.fetchval("""
                        SELECT employee_email 
                        FROM employees 
                        WHERE 'customer_success' = ANY(capabilities)
                        LIMIT 1
                    """)
                    
                    event_id = await self.calendar_service.create_event(
                        am_email,
                        f"Kickoff Meeting - {customer['display_name']}",
                        datetime.now() + timedelta(days=3, hours=10),
                        datetime.now() + timedelta(days=3, hours=11),
                        [contacts[0]['primary_email'], am_email],
                        "Welcome to our platform! Let's discuss your goals and next steps."
                    )
                    
                    actions_taken.append({
                        'action': 'scheduled_meeting',
                        'event_id': event_id
                    })
                
                # 4. Send welcome email
                if contacts:
                    await self.gmail_service.send_email(
                        am_email,
                        [c['primary_email'] for c in contacts],
                        f"Welcome to Our Platform - {customer['display_name']}",
                        "Welcome aboard! We're excited to work with you...",
                        'customer_welcome'
                    )
                    
                    actions_taken.append({
                        'action': 'sent_welcome_email',
                        'to': [c['primary_email'] for c in contacts]
                    })
                
                # 5. Create onboarding project
                project_id = await conn.fetchval("""
                    INSERT INTO projects (
                        project_code, project_name, project_type, status,
                        organization_id, start_date, end_date
                    ) VALUES ($1, $2, 'implementation', 'active', $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
                    RETURNING id
                """, f"{customer['organization_code']}_ONBOARDING",
                    f"{customer['display_name']} Onboarding",
                    org_id)
                
                actions_taken.append({
                    'action': 'created_project',
                    'project_id': str(project_id)
                })
            
            # Update execution status
            await conn.execute("""
                UPDATE automation_executions 
                SET status = 'completed',
                    completed_at = CURRENT_TIMESTAMP,
                    actions_taken = $2
                WHERE id = $1
            """, record['execution_id'], json.dumps(actions_taken))
            
        except Exception as e:
            logger.error(f"Error in drive automation: {e}")
            
            await conn.execute("""
                UPDATE automation_executions 
                SET status = 'failed',
                    error_message = $2,
                    completed_at = CURRENT_TIMESTAMP
                WHERE id = $1
            """, record['execution_id'], str(e))
    
    def _categorize_email(self, subject: str, content: str) -> str:
        """Categorize email based on content"""
        text = (subject + ' ' + content).lower()
        
        if any(word in text for word in ['contract', 'agreement', 'terms', 'legal']):
            return 'legal-review'
        elif any(word in text for word in ['bug', 'error', 'issue', 'problem', 'broken']):
            return 'technical-support'
        elif any(word in text for word in ['invoice', 'payment', 'billing', 'charge']):
            return 'billing'
        elif any(word in text for word in ['training', 'help', 'how to', 'tutorial']):
            return 'training-request'
        else:
            return 'general-inquiry'
    
    async def _get_specialist(self, category: str, conn) -> Optional[str]:
        """Get specialist for category"""
        capability_map = {
            'legal-review': 'contract_review',
            'technical-support': 'technical_support',
            'billing': 'billing_support',
            'training-request': 'training'
        }
        
        capability = capability_map.get(category)
        if not capability:
            return None
        
        # Get least loaded specialist
        result = await conn.fetchrow("""
            SELECT e.employee_email
            FROM employees e
            LEFT JOIN (
                SELECT employee_email, COUNT(*) as task_count
                FROM sidebar_tasks
                WHERE status = 'pending'
                GROUP BY employee_email
            ) t ON e.employee_email = t.employee_email
            WHERE $1 = ANY(e.capabilities)
              AND e.employment_status = 'active'
              AND e.out_of_office = false
            ORDER BY COALESCE(t.task_count, 0) ASC
            LIMIT 1
        """, capability)
        
        return result['employee_email'] if result else None
    
    async def _get_reviewer(self, role: str, org_id: str, conn) -> Optional[str]:
        """Get appropriate reviewer based on role"""
        if role == 'legal':
            capability = 'contract_review'
        elif role == 'technical':
            capability = 'technical_review'
        elif role == 'manager':
            # Get account manager for organization
            result = await conn.fetchrow("""
                SELECT p.primary_email
                FROM projects proj
                JOIN people p ON proj.project_manager_resource_name = p.resource_name
                WHERE proj.organization_id = $1
                  AND proj.status = 'active'
                ORDER BY proj.created_at DESC
                LIMIT 1
            """, org_id)
            
            return result['primary_email'] if result else None
        else:
            capability = 'document_review'
        
        return await self._get_specialist(f"{role}-review", conn)

# Celery Tasks
@celery_app.task
def sync_all_employee_emails():
    """Background task to sync all employee emails"""
    asyncio.run(_sync_all_employee_emails())

async def _sync_all_employee_emails():
    """Async implementation of email sync"""
    gmail_service = GmailService()
    
    async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
        employees = await conn.fetch("""
            SELECT employee_email 
            FROM employees 
            WHERE gmail_sync_enabled = true 
              AND employment_status = 'active'
        """)
        
        for employee in employees:
            try:
                await gmail_service.sync_employee_emails(employee['employee_email'])
                
                # Update last sync time
                await conn.execute("""
                    UPDATE employees 
                    SET last_email_sweep = CURRENT_TIMESTAMP 
                    WHERE employee_email = $1
                """, employee['employee_email'])
                
            except Exception as e:
                logger.error(f"Error syncing emails for {employee['employee_email']}: {e}")

@celery_app.task
def process_automation_queue():
    """Process pending automations"""
    asyncio.run(_process_automation_queue())

async def _process_automation_queue():
    """Async implementation of automation processing"""
    engine = AutomationEngine()
    await engine.check_triggers()

@celery_app.task
def refresh_customer_health_scores():
    """Refresh materialized view for customer health"""
    asyncio.run(_refresh_customer_health())

async def _refresh_customer_health():
    """Async implementation of health score refresh"""
    async with asyncpg.connect(CONFIG['POSTGRES_DSN']) as conn:
        await conn.execute("SELECT refresh_customer_health()")

# Webhook Handlers
async def handle_gmail_webhook(data: Dict):
    """Handle Gmail push notification"""
    email_address = data.get('emailAddress')
    history_id = data.get('historyId')
    
    if email_address and history_id:
        gmail_service = GmailService()
        await gmail_service.sync_employee_emails(email_address, history_id)

async def handle_drive_webhook(data: Dict):
    """Handle Drive change notification"""
    # Process drive changes
    pass

# Initialize services
def initialize_services():
    """Initialize all services on startup"""
    auth_service = AuthenticationService()
    asyncio.run(auth_service.initialize())
    
    # Set up Celery beat schedule
    from celery.schedules import crontab
    
    celery_app.conf.beat_schedule = {
        'sync-emails': {
            'task': 'sync_all_employee_emails',
            'schedule': crontab(minute='*/15'),  # Every 15 minutes
        },
        'process-automations': {
            'task': 'process_automation_queue',
            'schedule': crontab(minute='*/5'),   # Every 5 minutes
        },
        'refresh-health-scores': {
            'task': 'refresh_customer_health_scores',
            'schedule': crontab(minute=0, hour='*/4'),  # Every 4 hours
        },
    }

if __name__ == "__main__":
    initialize_services()
    logger.info("Google Workspace Integration Services initialized")