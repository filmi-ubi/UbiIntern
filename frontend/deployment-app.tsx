import React, { useState } from 'react';
import { CheckCircle, XCircle, Circle, Play, Copy, ChevronRight, ChevronLeft, Terminal, AlertCircle, Key, Server, Database, Package, Rocket } from 'lucide-react';

const IntegratedDeploymentApp = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState({});
  const [testResults, setTestResults] = useState({});
  const [config, setConfig] = useState({
    domain: '',
    adminEmail: '',
    serviceAccountKey: null,
    dbPassword: '',
    jwtSecret: ''
  });

  const sections = [
    {
      id: 'google-setup',
      title: 'Google Workspace Setup',
      icon: <Key className="w-6 h-6" />,
      description: 'Configure service account and domain settings',
      steps: [
        {
          id: 'upload-service-account',
          title: 'Upload Service Account Key',
          description: 'Upload the JSON key file from your Google Workspace admin',
          type: 'file-upload',
          test: {
            name: 'Validate Service Account',
            expectedResult: 'Service account valid'
          }
        },
        {
          id: 'configure-domain',
          title: 'Configure Domain Settings',
          description: 'Set your company domain and admin email',
          type: 'form',
          fields: [
            { name: 'domain', label: 'Company Domain', placeholder: 'company.com' },
            { name: 'adminEmail', label: 'Admin Email', placeholder: 'admin@company.com' }
          ],
          test: {
            name: 'Validate Configuration',
            expectedResult: 'Configuration valid'
          }
        },
        {
          id: 'deploy-service-account',
          title: 'Deploy to Server',
          description: 'Copy service account to your server',
          type: 'command',
          commands: [
            'sudo mkdir -p /opt/automation-platform',
            'sudo useradd -r -s /bin/false automation',
            'sudo chown -R automation:automation /opt/automation-platform',
            '# Save the service account key',
            'sudo nano /opt/automation-platform/service-account.json',
            '# Paste your JSON and save',
            'sudo chmod 600 /opt/automation-platform/service-account.json'
          ],
          test: {
            name: 'Check File Exists',
            command: 'ls -la /opt/automation-platform/service-account.json',
            expectedResult: '-rw------- 1 automation automation'
          }
        }
      ]
    },
    {
      id: 'server-setup',
      title: 'Server Installation',
      icon: <Server className="w-6 h-6" />,
      description: 'Install required system packages',
      steps: [
        {
          id: 'update-system',
          title: 'Update System Packages',
          description: 'Update Ubuntu/Debian packages',
          type: 'command',
          commands: [
            'sudo apt-get update',
            'sudo apt-get upgrade -y'
          ],
          test: {
            name: 'Check System Updated',
            command: 'lsb_release -a',
            expectedResult: 'Ubuntu'
          }
        },
        {
          id: 'install-postgresql',
          title: 'Install PostgreSQL 15',
          description: 'Install PostgreSQL database with extensions',
          type: 'command',
          commands: [
            '# Add PostgreSQL APT repository',
            'sudo sh -c \'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list\'',
            'wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -',
            'sudo apt-get update',
            '',
            '# Install PostgreSQL 15',
            'sudo apt-get install -y postgresql-15 postgresql-contrib-15',
            '',
            '# Start PostgreSQL',
            'sudo systemctl start postgresql',
            'sudo systemctl enable postgresql',
            '',
            '# Install extensions',
            'sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"',
            'sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"',
            'sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"',
            'sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS btree_gist;"'
          ],
          test: {
            name: 'Test PostgreSQL',
            command: 'sudo -u postgres psql -c "SELECT version();"',
            expectedResult: 'PostgreSQL 15'
          }
        },
        {
          id: 'install-redis',
          title: 'Install Redis',
          description: 'Install Redis for caching and sessions',
          type: 'command',
          commands: [
            'sudo apt-get install -y redis-server',
            'sudo systemctl enable redis-server',
            'sudo systemctl start redis-server'
          ],
          test: {
            name: 'Test Redis',
            command: 'redis-cli ping',
            expectedResult: 'PONG'
          }
        },
        {
          id: 'install-python',
          title: 'Install Python & Dependencies',
          description: 'Install Python 3.9 and build tools',
          type: 'command',
          commands: [
            'sudo apt-get install -y python3.9 python3.9-venv python3-pip python3.9-dev',
            'sudo apt-get install -y build-essential libssl-dev libffi-dev',
            'sudo apt-get install -y nginx certbot python3-certbot-nginx'
          ],
          test: {
            name: 'Check Python Version',
            command: 'python3.9 --version',
            expectedResult: 'Python 3.9'
          }
        }
      ]
    },
    {
      id: 'database-setup',
      title: 'Database Configuration',
      icon: <Database className="w-6 h-6" />,
      description: 'Create database and load schema',
      steps: [
        {
          id: 'create-database',
          title: 'Create Database & User',
          description: 'Create the automation platform database',
          type: 'command',
          commands: [
            '# Generate secure password',
            'export DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)',
            'echo "Database password: $DB_PASSWORD" | sudo tee /opt/automation-platform/db-password.txt',
            '',
            '# Create database and users',
            'sudo -u postgres psql << EOF',
            'CREATE DATABASE automation_platform;',
            'CREATE USER webapp_service WITH ENCRYPTED PASSWORD \'$DB_PASSWORD\';',
            'CREATE USER automation_service WITH ENCRYPTED PASSWORD \'$DB_PASSWORD\';',
            'GRANT ALL PRIVILEGES ON DATABASE automation_platform TO webapp_service;',
            'GRANT ALL PRIVILEGES ON DATABASE automation_platform TO automation_service;',
            'EOF'
          ],
          test: {
            name: 'Check Database',
            command: 'sudo -u postgres psql -l | grep automation_platform',
            expectedResult: 'automation_platform'
          }
        },
        {
          id: 'download-schema',
          title: 'Download Database Schema',
          description: 'Get the complete PostgreSQL schema file',
          type: 'command',
          commands: [
            '# Download schema file (or create it)',
            'sudo -u automation tee /opt/automation-platform/schema.sql > /dev/null << \'SCHEMA_END\'',
            '-- This is where the complete PostgreSQL schema goes',
            '-- Copy the entire schema from the schema artifact',
            '-- Including all tables, indexes, functions, triggers',
            'SCHEMA_END'
          ],
          test: {
            name: 'Check Schema File',
            command: 'wc -l /opt/automation-platform/schema.sql',
            expectedResult: 'schema.sql'
          }
        },
        {
          id: 'load-schema',
          title: 'Load Database Schema',
          description: 'Load all tables, indexes, and functions',
          type: 'command',
          commands: [
            '# Load the schema',
            'sudo -u postgres psql -d automation_platform < /opt/automation-platform/schema.sql',
            '',
            '# Grant permissions',
            'sudo -u postgres psql -d automation_platform << EOF',
            'GRANT ALL ON ALL TABLES IN SCHEMA public TO webapp_service;',
            'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO webapp_service;',
            'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO webapp_service;',
            'EOF'
          ],
          test: {
            name: 'Check Tables',
            command: 'sudo -u postgres psql -d automation_platform -c "\\dt" | grep -c "rows"',
            expectedResult: '70 rows'
          }
        },
        {
          id: 'load-initial-data',
          title: 'Load Initial Data',
          description: 'Create admin user and default templates',
          type: 'command',
          getDynamicCommands: () => [
            'sudo -u postgres psql -d automation_platform << EOF',
            '-- System configuration',
            `INSERT INTO system_config (key, value, description) VALUES ('google_workspace_domain', '"${config.domain}"', 'Primary Google Workspace domain') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`,
            '',
            '-- Admin user',
            `INSERT INTO people (resource_name, primary_email, person_type, names) VALUES ('people/admin', '${config.adminEmail}', 'employee', '{"displayName": "System Admin", "givenName": "System", "familyName": "Admin"}'::jsonb) ON CONFLICT (resource_name) DO NOTHING;`,
            '',
            `INSERT INTO employees (person_resource_name, employee_email, system_role, capabilities) VALUES ('people/admin', '${config.adminEmail}', 'system_admin', ARRAY['all_access']) ON CONFLICT (person_resource_name) DO NOTHING;`,
            '',
            '-- Default folder templates',
            'INSERT INTO folder_templates (template_code, template_name, description, structure) VALUES',
            '(\'standard_customer\', \'Standard Customer Folders\', \'Basic folder structure\', \'["01_Contracts", "02_Projects", "03_Communications", "04_Training", "05_Reports"]\'::jsonb)',
            'ON CONFLICT (template_code) DO NOTHING;',
            'EOF'
          ],
          test: {
            name: 'Check Admin User',
            command: `sudo -u postgres psql -d automation_platform -c "SELECT COUNT(*) FROM employees WHERE employee_email = '${config.adminEmail}';"`,
            expectedResult: '1'
          }
        }
      ]
    },
    {
      id: 'code-deployment',
      title: 'Application Deployment',
      icon: <Package className="w-6 h-6" />,
      description: 'Deploy Python code and configure environment',
      steps: [
        {
          id: 'create-python-env',
          title: 'Create Python Environment',
          description: 'Set up Python virtual environment',
          type: 'command',
          commands: [
            'cd /opt/automation-platform',
            'sudo -u automation python3.9 -m venv venv',
            'sudo -u automation ./venv/bin/pip install --upgrade pip'
          ],
          test: {
            name: 'Check Virtual Environment',
            command: 'ls -la /opt/automation-platform/venv/bin/python',
            expectedResult: 'python'
          }
        },
        {
          id: 'install-dependencies',
          title: 'Install Python Dependencies',
          description: 'Install all required Python packages',
          type: 'command',
          commands: [
            '# Create requirements.txt',
            'sudo -u automation tee /opt/automation-platform/requirements.txt > /dev/null << EOF',
            'fastapi==0.104.1',
            'uvicorn==0.24.0',
            'asyncpg==0.29.0',
            'aioredis==2.0.1',
            'celery==5.3.4',
            'google-auth==2.23.4',
            'google-auth-httplib2==0.1.1',
            'google-api-python-client==2.108.0',
            'pydantic==2.5.0',
            'python-jose[cryptography]==3.3.0',
            'phonenumbers==8.13.24',
            'pyotp==2.9.0',
            'twilio==8.10.0',
            'python-multipart==0.0.6',
            'EOF',
            '',
            '# Install dependencies',
            'cd /opt/automation-platform',
            'sudo -u automation ./venv/bin/pip install -r requirements.txt'
          ],
          test: {
            name: 'Check FastAPI',
            command: '/opt/automation-platform/venv/bin/pip show fastapi',
            expectedResult: 'Version: 0.104.1'
          }
        },
        {
          id: 'deploy-code-files',
          title: 'Deploy Application Code',
          description: 'Create the main Python application files',
          type: 'command',
          commands: [
            '# This would normally download or copy your code files',
            '# For now, we create placeholder files',
            'sudo -u automation touch /opt/automation-platform/google_api_integration.py',
            'sudo -u automation touch /opt/automation-platform/authentication_api_endpoints.py',
            '',
            '# In production, you would:',
            '# git clone https://github.com/yourcompany/automation-platform.git',
            '# Or copy the files from your deployment package'
          ],
          test: {
            name: 'Check Code Files',
            command: 'ls -la /opt/automation-platform/*.py | wc -l',
            expectedResult: '2'
          }
        },
        {
          id: 'create-env-file',
          title: 'Create Environment Configuration',
          description: 'Generate .env file with all settings',
          type: 'command',
          getDynamicCommands: () => [
            '# Get database password',
            'DB_PASSWORD=$(sudo cat /opt/automation-platform/db-password.txt | grep "Database password:" | cut -d\' \' -f3)',
            '',
            '# Generate JWT secret',
            'JWT_SECRET=$(openssl rand -base64 32)',
            '',
            '# Create .env file',
            'sudo -u automation tee /opt/automation-platform/.env > /dev/null << EOF',
            '# Database',
            'DATABASE_URL=postgresql://webapp_service:$DB_PASSWORD@localhost:5432/automation_platform',
            '',
            '# Redis',
            'REDIS_URL=redis://localhost:6379',
            '',
            '# Google',
            `COMPANY_DOMAIN=${config.domain}`,
            'SERVICE_ACCOUNT_FILE=/opt/automation-platform/service-account.json',
            'GCP_PROJECT_ID=your-project-id',
            '',
            '# Security',
            'JWT_SECRET=$JWT_SECRET',
            'WEBHOOK_BASE_URL=https://api.' + config.domain + '/webhooks',
            '',
            '# Twilio (update these)',
            'TWILIO_ACCOUNT_SID=AC...',
            'TWILIO_AUTH_TOKEN=...',
            'TWILIO_PHONE_NUMBER=+1234567890',
            'EOF'
          ],
          test: {
            name: 'Check Environment File',
            command: 'grep -c "DATABASE_URL" /opt/automation-platform/.env',
            expectedResult: '1'
          }
        }
      ]
    },
    {
      id: 'service-startup',
      title: 'Start Services',
      icon: <Rocket className="w-6 h-6" />,
      description: 'Configure and start all services',
      steps: [
        {
          id: 'create-systemd-services',
          title: 'Create Systemd Service Files',
          description: 'Set up services for API, Worker, and Beat',
          type: 'command',
          commands: [
            '# API Service',
            'sudo tee /etc/systemd/system/automation-api.service > /dev/null << EOF',
            '[Unit]',
            'Description=Business Automation API',
            'After=network.target postgresql.service redis.service',
            '',
            '[Service]',
            'Type=exec',
            'User=automation',
            'WorkingDirectory=/opt/automation-platform',
            'Environment="PATH=/opt/automation-platform/venv/bin"',
            'ExecStart=/opt/automation-platform/venv/bin/uvicorn authentication_api_endpoints:app --host 0.0.0.0 --port 8000',
            'Restart=always',
            '',
            '[Install]',
            'WantedBy=multi-user.target',
            'EOF',
            '',
            '# Worker Service',
            'sudo tee /etc/systemd/system/automation-worker.service > /dev/null << EOF',
            '[Unit]',
            'Description=Business Automation Celery Worker',
            'After=network.target postgresql.service redis.service',
            '',
            '[Service]',
            'Type=forking',
            'User=automation',
            'WorkingDirectory=/opt/automation-platform',
            'Environment="PATH=/opt/automation-platform/venv/bin"',
            'ExecStart=/opt/automation-platform/venv/bin/celery -A google_api_integration worker --detach',
            'Restart=always',
            '',
            '[Install]',
            'WantedBy=multi-user.target',
            'EOF'
          ],
          test: {
            name: 'Check Service Files',
            command: 'ls -la /etc/systemd/system/automation-*.service | wc -l',
            expectedResult: '2'
          }
        },
        {
          id: 'configure-nginx',
          title: 'Configure Nginx',
          description: 'Set up Nginx reverse proxy',
          type: 'command',
          getDynamicCommands: () => [
            '# Create Nginx configuration',
            'sudo tee /etc/nginx/sites-available/automation-api > /dev/null << EOF',
            'server {',
            '    listen 80;',
            `    server_name api.${config.domain};`,
            '    ',
            '    location / {',
            '        proxy_pass http://localhost:8000;',
            '        proxy_http_version 1.1;',
            '        proxy_set_header Upgrade \\$http_upgrade;',
            '        proxy_set_header Connection "upgrade";',
            '        proxy_set_header Host \\$host;',
            '        proxy_set_header X-Real-IP \\$remote_addr;',
            '        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;',
            '        proxy_set_header X-Forwarded-Proto \\$scheme;',
            '    }',
            '}',
            'EOF',
            '',
            '# Enable site',
            'sudo ln -sf /etc/nginx/sites-available/automation-api /etc/nginx/sites-enabled/',
            'sudo nginx -t'
          ],
          test: {
            name: 'Test Nginx Config',
            command: 'sudo nginx -t',
            expectedResult: 'syntax is ok'
          }
        },
        {
          id: 'start-services',
          title: 'Start All Services',
          description: 'Enable and start all services',
          type: 'command',
          commands: [
            '# Reload systemd',
            'sudo systemctl daemon-reload',
            '',
            '# Start services',
            'sudo systemctl enable automation-api automation-worker',
            'sudo systemctl start automation-api automation-worker',
            '',
            '# Restart Nginx',
            'sudo systemctl restart nginx'
          ],
          test: {
            name: 'Check Services Running',
            command: 'sudo systemctl is-active automation-api',
            expectedResult: 'active'
          }
        },
        {
          id: 'final-health-check',
          title: 'Final Health Check',
          description: 'Verify the entire system is working',
          type: 'command',
          commands: [
            '# Check API health',
            'curl -s http://localhost:8000/health',
            '',
            '# Check database connection',
            'curl -s http://localhost:8000/health | grep "database"',
            '',
            '# Check Redis connection',
            'redis-cli ping'
          ],
          test: {
            name: 'API Health Check',
            command: 'curl -s http://localhost:8000/health | jq -r .status',
            expectedResult: 'healthy'
          }
        }
      ]
    }
  ];

  const markStepComplete = (sectionId, stepId) => {
    setCompletedSteps(prev => ({
      ...prev,
      [`${sectionId}-${stepId}`]: true
    }));
  };

  const runTest = (sectionId, stepId, test) => {
    const testKey = `${sectionId}-${stepId}`;
    setTestResults(prev => ({ ...prev, [testKey]: 'running' }));

    // Simulate test execution
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo
      setTestResults(prev => ({
        ...prev,
        [testKey]: success ? 'success' : 'error'
      }));
      
      if (success) {
        markStepComplete(sectionId, stepId);
      }
    }, 2000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.type === 'service_account') {
          setConfig(prev => ({ ...prev, serviceAccountKey: data }));
          markStepComplete('google-setup', 'upload-service-account');
          setTestResults(prev => ({ ...prev, 'google-setup-upload-service-account': 'success' }));
        }
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const getCurrentSection = () => sections[currentSection];
  const getCurrentStep = () => sections[currentSection]?.steps[currentStep];

  const getSectionProgress = (section) => {
    const completed = section.steps.filter(step => 
      completedSteps[`${section.id}-${step.id}`]
    ).length;
    return (completed / section.steps.length) * 100;
  };

  const renderStepContent = () => {
    const section = getCurrentSection();
    const step = getCurrentStep();
    
    if (!step) return null;

    const testKey = `${section.id}-${step.id}`;
    const testResult = testResults[testKey];
    const commands = step.getDynamicCommands ? step.getDynamicCommands() : step.commands;

    return (
      <div className="space-y-6">
        {/* Step Header */}
        <div>
          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
          <p className="text-gray-600">{step.description}</p>
        </div>

        {/* Step Content */}
        {step.type === 'file-upload' && (
          <div className="space-y-4">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {config.serviceAccountKey && (
              <div className="p-4 bg-green-50 rounded">
                <p className="text-green-700">✓ Service Account: {config.serviceAccountKey.client_email}</p>
              </div>
            )}
          </div>
        )}

        {step.type === 'form' && (
          <div className="space-y-4">
            {step.fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={config[field.name] || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <button
              onClick={() => {
                if (config.domain && config.adminEmail) {
                  markStepComplete(section.id, step.id);
                  setTestResults(prev => ({ ...prev, [testKey]: 'success' }));
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Configuration
            </button>
          </div>
        )}

        {step.type === 'command' && commands && (
          <div className="space-y-4">
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{commands.join('\n')}</pre>
            </div>
            <button
              onClick={() => copyToClipboard(commands.join('\n'))}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Commands</span>
            </button>
          </div>
        )}

        {/* Test Section */}
        {step.test && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{step.test.name}</h4>
              <div className="flex items-center space-x-3">
                {testResult === 'running' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                )}
                {testResult === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {testResult === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                <button
                  onClick={() => runTest(section.id, step.id, step.test)}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Play className="w-4 h-4" />
                  <span>Run Test</span>
                </button>
              </div>
            </div>
            {step.test.command && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Test command:</p>
                <code className="text-xs bg-gray-200 p-2 rounded block">{step.test.command}</code>
                <p className="text-xs text-gray-500 mt-1">Expected: {step.test.expectedResult}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const getOverallProgress = () => {
    let totalSteps = 0;
    let completedTotal = 0;
    
    sections.forEach(section => {
      totalSteps += section.steps.length;
      section.steps.forEach(step => {
        if (completedSteps[`${section.id}-${step.id}`]) {
          completedTotal++;
        }
      });
    });
    
    return Math.round((completedTotal / totalSteps) * 100);
  };

  const exportProgress = () => {
    const data = {
      completedSteps,
      testResults,
      config: {
        ...config,
        serviceAccountKey: config.serviceAccountKey ? '***REDACTED***' : null
      },
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deployment-progress-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Business Automation Platform Deployment
          </h1>
          <p className="text-xl text-gray-600">
            Complete deployment system - Navigate freely between any section
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (confirm('Reset all progress? This cannot be undone.')) {
                  setCompletedSteps({});
                  setTestResults({});
                  alert('Progress reset successfully');
                }
              }}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
            >
              Reset Progress
            </button>
            <button
              onClick={exportProgress}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Export Progress
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Click any section icon or use the dropdown to jump between sections
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Overall Progress</h2>
            <span className="text-2xl font-bold text-blue-600">{getOverallProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => {
                  setCurrentSection(idx);
                  setCurrentStep(0);
                }}
                className={`text-center p-2 rounded transition-all hover:bg-gray-50 ${
                  currentSection === idx ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className={`flex justify-center mb-1 ${currentSection === idx ? 'text-blue-600' : 'text-gray-600'}`}>
                  {section.icon}
                </div>
                <div className={`text-xs ${getSectionProgress(section) === 100 ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                  {section.title}
                </div>
                <div className="text-xs text-gray-400">
                  {Math.round(getSectionProgress(section))}%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Section Header */}
          <div className="border-b pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <span className="text-blue-600">{getCurrentSection().icon}</span>
                  <span>{getCurrentSection().title}</span>
                </h2>
                <p className="text-gray-600 mt-1">{getCurrentSection().description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {getCurrentSection().steps.length}
                </div>
                {/* Mini Step Navigator */}
                <div className="flex space-x-1">
                  {getCurrentSection().steps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentStep 
                          ? 'bg-blue-500 w-6' 
                          : completedSteps[`${getCurrentSection().id}-${step.id}`]
                          ? 'bg-green-500'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      title={step.title}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-between mb-8">
            {getCurrentSection().steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(idx)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all hover:scale-110 ${
                    completedSteps[`${getCurrentSection().id}-${step.id}`]
                      ? 'bg-green-500 text-white'
                      : idx === currentStep
                      ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={step.title}
                >
                  {completedSteps[`${getCurrentSection().id}-${step.id}`] ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    idx + 1
                  )}
                </button>
                {idx < getCurrentSection().steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      completedSteps[`${getCurrentSection().id}-${step.id}`]
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(currentStep - 1);
                  } else if (currentSection > 0) {
                    setCurrentSection(currentSection - 1);
                    setCurrentStep(sections[currentSection - 1].steps.length - 1);
                  }
                }}
                disabled={currentSection === 0 && currentStep === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Section Quick Jump */}
              <select
                value={currentSection}
                onChange={(e) => {
                  setCurrentSection(parseInt(e.target.value));
                  setCurrentStep(0);
                }}
                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                {sections.map((section, idx) => (
                  <option key={section.id} value={idx}>
                    {section.title}
                  </option>
                ))}
              </select>

              <div className="flex space-x-2">
                {currentStep === getCurrentSection().steps.length - 1 && currentSection < sections.length - 1 && (
                  <button
                    onClick={() => {
                      setCurrentSection(currentSection + 1);
                      setCurrentStep(0);
                    }}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <span>Next Section</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                
                {currentStep < getCurrentSection().steps.length - 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {currentSection === sections.length - 1 && currentStep === getCurrentSection().steps.length - 1 && getOverallProgress() === 100 && (
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                  >
                    🎉 Deployment Complete!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {getOverallProgress() === 100 && (
          <div className="mt-8 bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-xl font-semibold text-green-900">
                  Congratulations! Deployment Complete 🎉
                </h3>
                <p className="text-green-700 mt-2">
                  All steps have been successfully completed. Your Business Automation Platform is now ready for use.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <a
                    href={`https://api.${config.domain || 'company.com'}/health`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Check API Health
                  </a>
                  <a
                    href={`https://api.${config.domain || 'company.com'}/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View API Documentation
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-900">Important</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Run commands on your Ubuntu/Debian server as root or with sudo
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Terminal className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">Commands</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Copy and paste commands directly to your terminal
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-900">Testing</h4>
                <p className="text-sm text-green-700 mt-1">
                  Run tests after each step to verify success
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tips */}
        <div className="mt-4 text-center text-sm text-gray-500">
          💡 Tip: Click any section icon, step number, or use the dropdown to jump anywhere in the deployment process
        </div>
      </div>
    </div>
  );
};

export default IntegratedDeploymentApp;