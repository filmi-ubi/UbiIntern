## Frontend Team Guide - UbiIntern Hack Day
**What You Have Right Now**
- Current Status: Basic React app running at http://localhost:3000 with placeholder content.
- Eric's Real Files: All the .tsx files in your frontend folder are Eric's actual components (login pages, customer forms, etc.) - these are NOT being used yet.

**Your Mission**
- Convert Eric's TypeScript components to JavaScript and get them working in your React app.
Step 1: Pick One Component to Start
- Easiest to start with: landing_and_auth-pages_html_enabled.tsx (the login page)
Step 2: Convert TypeScript to JavaScript

**Using AI to Help You**
AI Prompt to Use:
Convert this TypeScript React component to JavaScript. Remove all TypeScript syntax, keep all the functionality, and make it work with basic React:

[paste the .tsx file content here]
**What AI will do:**

Remove interface definitions
Remove type annotations like : string
Remove <> generic syntax
Keep all the React functionality

**Manual Conversion (if AI doesn't work)**
Find and Replace these patterns:

File extension: landing_and_auth-pages_html_enabled.tsx → LoginPage.js
Remove interface definitions:

typescript// DELETE lines that look like this:
interface LoginProps {
  userType: string;
}

Remove type annotations:

typescript// CHANGE this:
const [email, setEmail]: [string, Function] = useState('');

// TO this:
const [email, setEmail] = useState('');

Remove generic types:

typescript// CHANGE this:
useState<string>('')

// TO this:
useState('')
Step 3: Add Converted Component to Your App

Save converted file as: src/LoginPage.js
Update your src/App.js:

javascriptimport React from 'react';
import LoginPage from './LoginPage';

function App() {
  return (
    <div>
      <h1>UbiIntern Automation Platform</h1>
      <LoginPage />
    </div>
  );
}

export default App;

Test it: Refresh http://localhost:3000

Step 4: If It Breaks (It Will!)
Common errors and fixes:
Error: 'SomeComponent' is not defined
Fix: Add import at top: import { SomeComponent } from 'lucide-react';
Error: Cannot resolve module 'xyz'
Fix: Install it: npm install xyz
Error: Weird TypeScript syntax
Fix: Ask AI to fix that specific line
Step 5: Connect to Backend (Later)
Once login page displays, you'll connect it to the backend API (when backend team is ready).
AI Tools That Help
Claude/ChatGPT Prompts:

"Fix this React error: [paste error message]"
"Convert this TypeScript to JavaScript: [paste code]"
"Why isn't this React component working: [paste component]"

GitHub Copilot: Will auto-suggest fixes as you type
**Your Timeline**
Next 30 minutes: Get ONE of Eric's components displaying
Next hour: Get login form working (even if not connected to backend)
Next 2 hours: Connect to backend when it's ready
**Quick Wins**
If conversion is too hard:

Just make the buttons work better in your current App.js
Add form inputs that look like Eric's design
Make it look professional with better CSS
Focus on the demo - make it look impressive for Eric

**Success = Show Eric This**
"We took your React components and got them running. Here's your login system working..." (even if backend isn't connected yet)
Remember: Looking impressive matters more than perfect code for the demo!
If You Get Stuck

**Try AI first: Paste error into ChatGPT/Claude**
Ask backend team: They might know React too
Keep it simple: Basic forms that look good beat broken complex components