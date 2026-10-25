import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { db, EmailRecord, GmailConnectionRecord } from './db.js';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export class GmailServiceError extends Error {
  constructor(message: string, public statusCode = 400, public code?: string) {
    super(message);
    this.name = 'GmailServiceError';
  }
}

function oauthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || 'http://localhost:3000/api/gmail/callback';
  if (!clientId || !clientSecret) {
    throw new GmailServiceError('Gmail OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.', 503, 'gmail_not_configured');
  }
  return { clientId, clientSecret, redirectUri };
}

function config() {
  const { clientId, clientSecret, redirectUri } = oauthConfig();
  const encryptionSecret = process.env.GMAIL_TOKEN_ENCRYPTION_KEY?.trim();
  if (!encryptionSecret || encryptionSecret.length < 32) {
    throw new GmailServiceError('Gmail token encryption is not configured. Set GMAIL_TOKEN_ENCRYPTION_KEY to at least 32 characters.', 503, 'gmail_encryption_not_configured');
  }
  return { clientId, clientSecret, redirectUri, encryptionSecret };
}

function encryptionKey(): Buffer {
  return createHash('sha256').update(config().encryptionSecret, 'utf8').digest();
}

function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptToken(value: string): string {
  try {
    const [ivPart, tagPart, bodyPart] = value.split('.');
    if (!ivPart || !tagPart || !bodyPart) throw new Error('Invalid token envelope');
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(bodyPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new GmailServiceError('Stored Gmail credentials could not be decrypted. Reconnect the Gmail account.', 401, 'gmail_reconnect_required');
  }
}

export function createAuthorizationUrl(userId: string): string {
  const { clientId, redirectUri } = config();
  const state = randomBytes(32).toString('base64url');
  db.saveGmailOAuthState(state, { userId, createdAt: Date.now(), intent: 'gmail' });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  }).toString();
  return url.toString();
}

export function createGoogleSignInUrl(): string {
  const { clientId, redirectUri } = oauthConfig();
  const state = randomBytes(32).toString('base64url');
  db.saveGmailOAuthState(state, { userId: '', createdAt: Date.now(), intent: 'signin' });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  }).toString();
  return url.toString();
}

async function googleJson(url: string, init?: RequestInit): Promise<any> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
  } catch {
    throw new GmailServiceError('Could not reach Google. Please try again.', 502, 'google_unavailable');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorCode = data?.error;
    if (response.status === 401 || errorCode === 'invalid_grant') {
      throw new GmailServiceError('Gmail authorization expired or was revoked. Reconnect the Gmail account.', 401, 'gmail_reconnect_required');
    }
    throw new GmailServiceError('Google rejected the Gmail request. Please reconnect and try again.', response.status === 429 ? 429 : 502, 'google_request_failed');
  }
  return data;
}

export async function completeAuthorization(code: string, state: string) {
  const stateRecord = db.consumeGmailOAuthState(state);
  if (!stateRecord || stateRecord.intent === 'signin' || Date.now() - stateRecord.createdAt > OAUTH_STATE_TTL_MS) {
    throw new GmailServiceError('The Gmail authorization session expired. Start the connection again.', 400, 'gmail_oauth_state_invalid');
  }
  const { clientId, clientSecret, redirectUri } = config();
  const tokens = await googleJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokens.access_token) {
    throw new GmailServiceError('Google did not return an access token. Try connecting Gmail again.', 502, 'google_token_missing');
  }
  const profile = await googleJson('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profile.email || profile.verified_email === false) {
    throw new GmailServiceError('Google did not provide a verified Gmail account address.', 502, 'google_profile_missing');
  }

  const existing = db.getGmailConnection(stateRecord.userId);
  const refreshToken = tokens.refresh_token || (existing?.emailAddress.toLowerCase() === String(profile.email).toLowerCase()
    ? decryptToken(existing.refreshTokenEncrypted)
    : '');
  if (!refreshToken) {
    throw new GmailServiceError('Google did not provide a refresh token. Remove EmailGuard from your Google account permissions and connect again.', 400, 'google_refresh_token_missing');
  }

  db.saveGmailConnection({
    userId: stateRecord.userId,
    emailAddress: String(profile.email).toLowerCase(),
    accessTokenEncrypted: encryptToken(tokens.access_token),
    refreshTokenEncrypted: encryptToken(refreshToken),
    tokenExpiry: Date.now() + Math.max(60, Number(tokens.expires_in) || 3600) * 1000,
    updatedAt: new Date().toISOString(),
  });
  return { userId: stateRecord.userId, emailAddress: String(profile.email).toLowerCase() };
}

export async function completeGoogleSignIn(code: string, state: string) {
  const stateRecord = db.consumeGmailOAuthState(state);
  if (!stateRecord || stateRecord.intent !== 'signin' || Date.now() - stateRecord.createdAt > OAUTH_STATE_TTL_MS) {
    throw new GmailServiceError('The sign-in session expired. Start Google sign-in again.', 400, 'google_signin_state_invalid');
  }
  const { clientId, clientSecret, redirectUri } = oauthConfig();
  const tokens = await googleJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokens.access_token) {
    throw new GmailServiceError('Google did not return a sign-in token. Try again.', 502, 'google_signin_token_missing');
  }
  const profile = await googleJson('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const email = String(profile.email || '').trim().toLowerCase();
  if (!email || profile.verified_email === false) {
    throw new GmailServiceError('Google did not provide a verified account email.', 502, 'google_profile_missing');
  }

  const now = new Date().toISOString();
  let user = db.getUserByEmail(email);
  if (!user) {
    const stableGoogleId = String(profile.id || email);
    user = {
      uid: `google_${stableGoogleId}`,
      googleSubject: stableGoogleId,
      name: String(profile.name || email.split('@')[0]),
      email,
      photoURL: typeof profile.picture === 'string' ? profile.picture : undefined,
      createdAt: now,
      lastLogin: now,
    };
    db.saveUser(user);
    db.seedUserStarterEmails(user);
  } else {
    user.googleSubject = String(profile.id || user.googleSubject || email);
    user.name = String(profile.name || user.name || email.split('@')[0]);
    user.email = email;
    if (typeof profile.picture === 'string') user.photoURL = profile.picture;
    user.lastLogin = now;
    db.saveUser(user);
  }
  return user;
}

export function getConnectionStatus(userId: string) {
  const connection = db.getGmailConnection(userId);
  return connection
    ? { connected: true, emailAddress: connection.emailAddress }
    : { connected: false, emailAddress: null };
}

async function getValidAccessToken(connection: GmailConnectionRecord, forceRefresh = false): Promise<string> {
  if (!forceRefresh && connection.tokenExpiry > Date.now() + 60_000) return decryptToken(connection.accessTokenEncrypted);

  const { clientId, clientSecret } = config();
  const refreshToken = decryptToken(connection.refreshTokenEncrypted);
  const tokens = await googleJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!tokens.access_token) {
    throw new GmailServiceError('Google did not refresh the Gmail authorization. Reconnect the account.', 401, 'gmail_reconnect_required');
  }
  db.saveGmailConnection({
    ...connection,
    accessTokenEncrypted: encryptToken(tokens.access_token),
    tokenExpiry: Date.now() + Math.max(60, Number(tokens.expires_in) || 3600) * 1000,
    refreshTokenEncrypted: tokens.refresh_token ? encryptToken(tokens.refresh_token) : connection.refreshTokenEncrypted,
    updatedAt: new Date().toISOString(),
  });
  return tokens.access_token;
}

function decodePart(data?: string): string {
  if (!data) return '';
  return Buffer.from(data, 'base64url').toString('utf8');
}

function collectBody(part: any): { plain: string; html: string } {
  const mimeType = String(part?.mimeType || '').toLowerCase();
  const content = decodePart(part?.body?.data);
  let plain = mimeType === 'text/plain' ? content : '';
  let html = mimeType === 'text/html' ? content : '';
  for (const child of part?.parts || []) {
    const result = collectBody(child);
    plain ||= result.plain;
    html ||= result.html;
  }
  return { plain, html };
}

function headerValue(headers: any[], name: string): string {
  return String(headers.find((header) => String(header.name).toLowerCase() === name.toLowerCase())?.value || '');
}

function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<([^<>]+)>\s*$/);
  const email = (match?.[2] || from).trim().replace(/^"|"$/g, '').toLowerCase();
  const name = (match?.[1] || email.split('@')[0] || 'Unknown').trim().replace(/^"|"$/g, '');
  return { name, email };
}

function bodyText(plain: string, html: string): string {
  if (plain) return plain;
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, ' ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(div|p|li)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export async function syncInboxMessages(userId: string, maxResults = 25): Promise<{ total: number; items: EmailRecord[] }> {
  const connection = db.getGmailConnection(userId);
  if (!connection) throw new GmailServiceError('Connect a Gmail account before syncing Inbox.', 400, 'gmail_not_connected');
  const limit = Math.min(Math.max(Math.floor(maxResults), 1), 50);
  let accessToken = await getValidAccessToken(connection);

  const listMessages = async () => googleJson(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  let listing: any;
  try {
    listing = await listMessages();
  } catch (error) {
    if (!(error instanceof GmailServiceError) || error.statusCode !== 401) throw error;
    const freshConnection = db.getGmailConnection(userId);
    if (!freshConnection) throw error;
    accessToken = await getValidAccessToken(freshConnection, true);
    listing = await listMessages();
  }

  const messageRefs = (listing.messages || []).slice(0, limit);
  const items = await Promise.all(messageRefs.map(async (reference: any): Promise<EmailRecord | null> => {
    const message = await googleJson(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(reference.id)}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const headers = message.payload?.headers || [];
    const sender = parseSender(headerValue(headers, 'From'));
    const bodies = collectBody(message.payload);
    const body = bodyText(bodies.plain, bodies.html) || message.snippet || '';
    const dateHeader = headerValue(headers, 'Date');
    const parsedDate = dateHeader ? new Date(dateHeader) : new Date(Number(message.internalDate) || Date.now());
    const receivedAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    const existing = db.getEmailsByUser(userId).find((email) =>
      email.source === 'gmail' && email.messageId === message.id &&
      email.gmailAccountEmail?.toLowerCase() === connection.emailAddress.toLowerCase()
    );
    const email: EmailRecord = {
      id: existing?.id || randomBytes(16).toString('hex'),
      userId,
      senderName: sender.name,
      senderEmail: sender.email || 'unknown@invalid.local',
      senderDomain: sender.email.split('@')[1],
      recipientEmail: headerValue(headers, 'To') || connection.emailAddress,
      subject: headerValue(headers, 'Subject') || '(no subject)',
      body,
      receivedAt,
      source: 'gmail',
      messageId: String(message.id),
      gmailAccountEmail: connection.emailAddress,
      hasUrls: /https?:\/\//i.test(body),
      hasAttachments: Boolean(message.payload?.parts?.some((part: any) => part.filename)),
      attachmentInfo: [],
      urls: Array.from(body.matchAll(/https?:\/\/[^\s<>"')\]]+/gi), (match) => (match as RegExpExecArray)[0]),
      createdAt: existing?.createdAt || new Date().toISOString(),
      isStarred: existing?.isStarred || false,
      isRead: existing?.isRead || false,
      folder: existing?.folder || 'inbox',
    };
    db.saveEmail(email);
    return email;
  }));

  return { total: items.filter(Boolean).length, items: items.filter((item): item is EmailRecord => Boolean(item)) };
}
