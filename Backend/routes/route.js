import { fastify, BASE_PATH } from './init.js';
import { google } from 'googleapis';
import { supabase } from '../db.js';

// Initialize OAuth2 client
const { OAuth2 } = google.auth;
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Root route
fastify.get('/', async (request, reply) => {
  return reply.send({ message: 'Welcome to ApplyTrak API' });
});

// Authenticate with Google
fastify.get(`${BASE_PATH}/auth/google`, async (request, reply) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  reply.redirect(url);
});

// Handle OAuth callback
fastify.get(`${BASE_PATH}/oauth2callback`, async (request, reply) => {
  const { code } = request.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    await supabase.from('tokens').insert({ 
      access_token: tokens.access_token, 
      refresh_token: tokens.refresh_token 
    });
    reply.send({ message: 'Authenticated successfully' });
  } catch (error) {
    reply.status(500).send({ error: 'Authentication failed' });
  }
});

// Check authentication status
fastify.get(`${BASE_PATH}/check-auth`, async (request, reply) => {
  const { data } = await supabase.from('tokens').select('id').limit(1);
  return { authenticated: !!data.length };
});

// Fetch tracked emails
fastify.get(`${BASE_PATH}/emails`, async (request, reply) => {
  const { data, error } = await supabase.from('emails').select('*');
  if (error) {
    reply.status(500).send({ error: 'Failed to fetch emails' });
    return;
  }
  return data;
});

// Background task to check for responses
async function checkForResponses() {
  const { data: tokens } = await supabase.from('tokens').select('*').single();
  if (!tokens) return;

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const { data: sentEmails } = await supabase.from('emails').select('unique_id, recipient, sent_at');

  for (const email of sentEmails) {
    const uniqueId = email.unique_id;
    const expectedDomain = email.recipient.split('@')[1];
    const sentDate = new Date(email.sent_at).toISOString().split('T')[0];

    try {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: `from:@${expectedDomain} ${uniqueId} after:${sentDate}`
      });

      if (res.data.messages && res.data.messages.length > 0) {
        await supabase
          .from('emails')
          .update({ status: 'Response Received', responded_at: new Date().toISOString() })
          .eq('unique_id', uniqueId);
        console.log(`Response detected for ${uniqueId}`);
      }
    } catch (error) {
      console.error(`Error checking ${uniqueId}:`, error);
    }
  }
}

// Run every 10 minutes
setInterval(checkForResponses, 10 * 60 * 1000);