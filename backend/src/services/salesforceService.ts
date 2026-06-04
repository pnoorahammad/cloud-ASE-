import jsforce from 'jsforce';
import { logger } from '../utils/logger';

export interface ValidationRuleInfo {
  id: string;
  name: string;
  fullName: string; // ObjectName.RuleName
  objectName: string;
  description: string;
  errorMessage: string;
  errorDisplayField: string;
  active: boolean;
  lastModifiedDate: string;
  lastModifiedByName: string;
  errorConditionFormula?: string;
}

const getOAuth2 = () => {
  return new jsforce.OAuth2({
    clientId: process.env.SF_CLIENT_ID || 'mock_client_id',
    clientSecret: process.env.SF_CLIENT_SECRET || 'mock_client_secret',
    redirectUri: process.env.SF_REDIRECT_URI || 'http://localhost:5000/auth/callback',
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
  });
};

// Mock data for simulation mode
const MOCK_RULES: ValidationRuleInfo[] = [
  {
    id: 'vr1',
    name: 'Account_Name_Cannot_Be_Blank',
    fullName: 'Account.Account_Name_Cannot_Be_Blank',
    objectName: 'Account',
    description: 'Ensure that the Account Name is never blank when creating or updating records.',
    errorMessage: 'Account Name is mandatory.',
    errorDisplayField: 'Name',
    active: true,
    lastModifiedDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastModifiedByName: 'Admin User',
    errorConditionFormula: 'ISBLANK(Name)'
  },
  {
    id: 'vr2',
    name: 'Phone_Number_Must_Be_10_Digits',
    fullName: 'Account.Phone_Number_Must_Be_10_Digits',
    objectName: 'Account',
    description: 'Validate that the phone number field contains exactly 10 digits if populated.',
    errorMessage: 'Phone number must be exactly 10 digits.',
    errorDisplayField: 'Phone',
    active: true,
    lastModifiedDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastModifiedByName: 'Admin User',
    errorConditionFormula: 'AND(NOT(ISBLANK(Phone)), NOT(REGEX(Phone, "^[0-9]{10}$")))'
  },
  {
    id: 'vr3',
    name: 'Website_Must_Begin_With_Https',
    fullName: 'Account.Website_Must_Begin_With_Https',
    objectName: 'Account',
    description: 'Encourage secure connections by requiring account websites to start with https://.',
    errorMessage: 'Website must start with https://',
    errorDisplayField: 'Website',
    active: false,
    lastModifiedDate: new Date(Date.now() - 3600000 * 48).toISOString(),
    lastModifiedByName: 'System Integrator',
    errorConditionFormula: 'AND(NOT(ISBLANK(Website)), NOT(BEGINS(Website, "https://")))'
  },
  {
    id: 'vr4',
    name: 'Annual_Revenue_Must_Be_Greater_Than_0',
    fullName: 'Account.Annual_Revenue_Must_Be_Greater_Than_0',
    objectName: 'Account',
    description: 'Validates that Annual Revenue is a positive amount.',
    errorMessage: 'Annual Revenue must be greater than zero.',
    errorDisplayField: 'AnnualRevenue',
    active: true,
    lastModifiedDate: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastModifiedByName: 'Sales Operations',
    errorConditionFormula: 'AnnualRevenue <= 0'
  },
  {
    id: 'vr5',
    name: 'Billing_Country_Is_Mandatory',
    fullName: 'Account.Billing_Country_Is_Mandatory',
    objectName: 'Account',
    description: 'Enforce data quality standards by requiring the Billing Country for all accounts.',
    errorMessage: 'Billing Country is mandatory.',
    errorDisplayField: 'BillingCountry',
    active: false,
    lastModifiedDate: new Date(Date.now() - 3600000 * 100).toISOString(),
    lastModifiedByName: 'Admin User',
    errorConditionFormula: 'ISBLANK(BillingCountry)'
  },
  {
    id: 'vr6',
    name: 'Contact_Email_Mandatory',
    fullName: 'Contact.Contact_Email_Mandatory',
    objectName: 'Contact',
    description: 'Require email address for Contact record creation to ensure communication channels.',
    errorMessage: 'Contact email is required for communication.',
    errorDisplayField: 'Email',
    active: true,
    lastModifiedDate: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastModifiedByName: 'Admin User',
    errorConditionFormula: 'ISBLANK(Email)'
  },
  {
    id: 'vr7',
    name: 'Opportunity_Close_Date_In_Future',
    fullName: 'Opportunity.Opportunity_Close_Date_In_Future',
    objectName: 'Opportunity',
    description: 'Close dates for new opportunities must be in the future.',
    errorMessage: 'Close date must be today or in the future.',
    errorDisplayField: 'CloseDate',
    active: true,
    lastModifiedDate: new Date(Date.now() - 3600000 * 200).toISOString(),
    lastModifiedByName: 'Sales Operations',
    errorConditionFormula: 'AND(IsClosed = false, CloseDate < TODAY())'
  }
];

let simulatedRules = [...MOCK_RULES];

export const isSimulationMode = (): boolean => {
  return process.env.SF_SIMULATION_MODE === 'true';
};

export const getAuthUrl = (state: string): string => {
  if (isSimulationMode()) {
    const port = process.env.PORT || '5000';
    const backendBase = process.env.BACKEND_URL || `http://localhost:${port}`;
    return `${backendBase}/auth/callback?code=mock_auth_code&state=${state}`;
  }
  const oauth2 = getOAuth2();
  return oauth2.getAuthorizationUrl({
    scope: 'api refresh_token full openid',
    state
  });
};

export const exchangeCodeForTokens = async (code: string) => {
  if (isSimulationMode() || code === 'mock_auth_code') {
    logger.info('Salesforce Service: Simulating token exchange');
    return {
      accessToken: 'mock_access_token_abc123',
      refreshToken: 'mock_refresh_token_xyz789',
      instanceUrl: 'https://playful-runner-dev-ed.develop.my.salesforce.com',
      userId: '00580000003xp4iAAA',
      organizationId: '00D80000000abcdEAD',
      username: 'admin@rulemanager.dev'
    };
  }

  const oauth2 = getOAuth2();
  const conn = new jsforce.Connection({ oauth2 });
  const userInfo = await conn.authorize(code);

  return {
    accessToken: conn.accessToken,
    refreshToken: conn.refreshToken,
    instanceUrl: conn.instanceUrl,
    userId: userInfo.id,
    organizationId: userInfo.organizationId,
    username: (conn as any).username || 'salesforce-user@org.com'
  };
};

export const getOrgInfo = async (accessToken: string, instanceUrl: string) => {
  if (isSimulationMode() || accessToken.startsWith('mock_')) {
    return {
      username: 'admin@rulemanager.dev',
      orgId: '00D80000000abcdEAD',
      instanceUrl: instanceUrl,
      orgName: 'Salesforce Developer Sandbox Org',
      isSandbox: true
    };
  }

  const conn = new jsforce.Connection({ accessToken, instanceUrl });
  const identity = await conn.identity();
  
  const orgQuery = await conn.query<{ Name: string; IsSandbox: boolean }>(
    'SELECT Name, IsSandbox FROM Organization LIMIT 1'
  );
  const orgDetail = orgQuery.records[0];

  return {
    username: identity.username,
    orgId: identity.organization_id,
    instanceUrl: instanceUrl,
    orgName: orgDetail ? orgDetail.Name : 'Salesforce Org',
    isSandbox: orgDetail ? orgDetail.IsSandbox : true
  };
};

export const getUserInfo = async (accessToken: string, instanceUrl: string) => {
  if (isSimulationMode() || accessToken.startsWith('mock_')) {
    return {
      username: 'admin@rulemanager.dev',
      fullName: 'Salesforce Admin',
      email: 'admin@rulemanager.dev',
      userId: '00580000003xp4iAAA',
      organizationId: '00D80000000abcdEAD'
    };
  }

  const conn = new jsforce.Connection({ accessToken, instanceUrl });
  const identity = await conn.identity();

  return {
    username: identity.username,
    fullName: identity.display_name,
    email: identity.email,
    userId: identity.user_id,
    organizationId: identity.organization_id
  };
};

export const fetchValidationRules = async (accessToken: string, instanceUrl: string): Promise<ValidationRuleInfo[]> => {
  if (isSimulationMode() || accessToken.startsWith('mock_')) {
    logger.info('Salesforce Service: Fetching simulated validation rules');
    return simulatedRules;
  }

  const conn = new jsforce.Connection({ accessToken, instanceUrl });

  // Use Tooling API to query validation rules with QualifiedApiName
  const queryStr = `
    SELECT Id, ValidationName, EntityDefinition.QualifiedApiName, Description, ErrorDisplayField, ErrorMessage, Active, LastModifiedDate, LastModifiedBy.Name 
    FROM ValidationRule 
    ORDER BY EntityDefinition.QualifiedApiName, ValidationName
  `;
  
  try {
    const result = await conn.tooling.query<{
      Id: string;
      ValidationName: string;
      EntityDefinition?: { QualifiedApiName: string } | null;
      EntityDefinitionId?: string | null;
      Description: string | null;
      ErrorDisplayField: string | null;
      ErrorMessage: string;
      Active: boolean;
      LastModifiedDate: string;
      LastModifiedBy?: { Name: string } | null;
    }>(queryStr);

    return result.records.map(record => {
      const objName = record.EntityDefinition ? record.EntityDefinition.QualifiedApiName : (record.EntityDefinitionId || 'Unknown');
      return {
        id: record.Id,
        name: record.ValidationName,
        fullName: `${objName}.${record.ValidationName}`,
        objectName: objName,
        description: record.Description || '',
        errorMessage: record.ErrorMessage,
        errorDisplayField: record.ErrorDisplayField || 'Top of Page',
        active: record.Active,
        lastModifiedDate: record.LastModifiedDate,
        lastModifiedByName: record.LastModifiedBy ? record.LastModifiedBy.Name : 'System'
      };
    });
  } catch (err) {
    logger.error('Error fetching validation rules from Tooling API', err);
    throw err;
  }
};

export const fetchValidationRuleMetadata = async (
  accessToken: string,
  instanceUrl: string,
  ruleId: string
): Promise<ValidationRuleInfo> => {
  if (isSimulationMode() || accessToken.startsWith('mock_')) {
    const found = simulatedRules.find(r => r.id === ruleId);
    if (!found) throw new Error(`Validation rule with ID ${ruleId} not found`);
    return found;
  }

  const conn = new jsforce.Connection({ accessToken, instanceUrl });
  
  try {
    const ruleDetail = await conn.tooling.sobject('ValidationRule').retrieve(ruleId) as any;
    const objName = ruleDetail.EntityDefinition ? ruleDetail.EntityDefinition.QualifiedApiName : (ruleDetail.EntityDefinitionId || 'Unknown');
    
    return {
      id: ruleDetail.Id,
      name: ruleDetail.ValidationName,
      fullName: `${objName}.${ruleDetail.ValidationName}`,
      objectName: objName,
      description: ruleDetail.Description || '',
      errorMessage: ruleDetail.ErrorMessage,
      errorDisplayField: ruleDetail.ErrorDisplayField || 'Top of Page',
      active: ruleDetail.Active,
      lastModifiedDate: ruleDetail.LastModifiedDate,
      lastModifiedByName: ruleDetail.LastModifiedBy ? ruleDetail.LastModifiedBy.Name : 'System',
      errorConditionFormula: ruleDetail.Metadata ? ruleDetail.Metadata.errorConditionFormula : ''
    };
  } catch (err) {
    logger.error(`Error retrieving metadata for validation rule ${ruleId}`, err);
    throw err;
  }
};

export interface DeploymentChange {
  id: string;
  fullName: string;
  active: boolean;
}

export interface DeploymentLogEntry {
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'error';
}

export interface DeploymentResult {
  success: boolean;
  logs: string;
  deployedRules: string[];
}

export const deployValidationRules = async (
  accessToken: string,
  instanceUrl: string,
  changes: DeploymentChange[],
  progressCallback: (progress: number, logEntry: DeploymentLogEntry) => void
): Promise<DeploymentResult> => {
  const deployedRules: string[] = [];
  const logEntries: string[] = [];

  const addLog = (message: string, status: 'info' | 'success' | 'error' = 'info') => {
    const entry: DeploymentLogEntry = {
      timestamp: new Date().toISOString(),
      message,
      status
    };
    logEntries.push(`[${entry.status.toUpperCase()}] ${entry.message}`);
    progressCallback(0, entry);
  };

  addLog('Initializing Salesforce Metadata API deployment process...');

  if (isSimulationMode() || accessToken.startsWith('mock_')) {
    const totalSteps = changes.length;
    addLog(`Found ${totalSteps} staged metadata change(s) to apply.`);
    
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      addLog(`Preparing metadata package for ${change.fullName}...`);
      await new Promise(resolve => setTimeout(resolve, 500));

      addLog(`Connecting to Metadata API container and locking component...`);
      await new Promise(resolve => setTimeout(resolve, 400));

      const targetRule = simulatedRules.find(r => r.fullName === change.fullName || r.id === change.id);
      if (targetRule) {
        targetRule.active = change.active;
        targetRule.lastModifiedDate = new Date().toISOString();
        targetRule.lastModifiedByName = 'Salesforce Admin (Deployer)';
      }

      addLog(`Successfully updated active status of ${change.fullName} to ${change.active}.`, 'success');
      deployedRules.push(change.fullName);
      
      const stepPercent = Math.round(((i + 1) / totalSteps) * 100);
      progressCallback(stepPercent, {
        timestamp: new Date().toISOString(),
        message: `Deployment batch progress: ${stepPercent}%`,
        status: 'info'
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    addLog('All metadata deployments completed successfully.', 'success');
    return {
      success: true,
      logs: logEntries.join('\n'),
      deployedRules
    };
  }

  const conn = new jsforce.Connection({ accessToken, instanceUrl });
  const totalSteps = changes.length;

  try {
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      addLog(`Reading existing Metadata API schema for: ${change.fullName}`);
      
      const metadata = await conn.metadata.read('ValidationRule', [change.fullName]);
      
      if (!metadata || (Array.isArray(metadata) && metadata.length === 0)) {
        addLog(`Error: Metadata for rule ${change.fullName} could not be resolved or found.`, 'error');
        continue;
      }
      
      const singleMetadata: any = Array.isArray(metadata) ? metadata[0] : metadata;
      singleMetadata.active = change.active;
      
      addLog(`Staging Metadata changes for ${change.fullName} (active = ${change.active})...`);
      
      const updateResult = await conn.metadata.update('ValidationRule', singleMetadata);
      const results = Array.isArray(updateResult) ? updateResult : [updateResult];
      
      const ruleResult = results[0];
      if (ruleResult && ruleResult.success) {
        addLog(`Successfully deployed metadata update for ${change.fullName}!`, 'success');
        deployedRules.push(change.fullName);
      } else {
        const errorMsg = ruleResult?.errors 
          ? (Array.isArray(ruleResult.errors) ? ruleResult.errors.map(e => e.message).join(', ') : (ruleResult.errors as any).message) 
          : 'Unknown Metadata API deployment error';
        addLog(`Failed to deploy ${change.fullName}: ${errorMsg}`, 'error');
      }

      const percentDone = Math.round(((i + 1) / totalSteps) * 100);
      progressCallback(percentDone, {
        timestamp: new Date().toISOString(),
        message: `Metadata deploy progress: ${percentDone}%`,
        status: 'info'
      });
    }

    const overallSuccess = deployedRules.length > 0;
    addLog(`Deployment cycle finished. Succeeded: ${deployedRules.length}/${totalSteps}.`, overallSuccess ? 'success' : 'error');

    return {
      success: overallSuccess,
      logs: logEntries.join('\n'),
      deployedRules
    };

  } catch (error: any) {
    const errorMsg = error.message || String(error);
    addLog(`Fatal exception in Metadata API Deploy: ${errorMsg}`, 'error');
    return {
      success: false,
      logs: logEntries.join('\n'),
      deployedRules
    };
  }
};
