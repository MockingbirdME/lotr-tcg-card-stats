import { IamAuthenticator } from 'ibm-cloud-sdk-core';

// Load the API key from the environment.
const apikey = process.env.IAM_API_KEY;
/* istanbul ignore if */
if (!apikey) {
  throw new Error('IAM_API_KEY environment variable MUST be set.');
}

// Create and export an authenticator.
export const authenticator = new IamAuthenticator({ apikey });