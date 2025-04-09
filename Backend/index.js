const fastify = require('fastify')({ logger: true });
const { supabase } = require('./db');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
require('dotenv').config();

const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Redirect to Google OAuth
fastify.get('/auth/google', async (request, reply) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  reply.redirect(url);
});

// Handle OAuth callback
fastify.get('/oauth2callback', async (request, reply) => {
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
fastify.get('/check-auth', async (request, reply) => {
  const { data } = await supabase.from('tokens').select('id').limit(1);
  return { authenticated: !!data.length };
});

// Check for responses
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

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();