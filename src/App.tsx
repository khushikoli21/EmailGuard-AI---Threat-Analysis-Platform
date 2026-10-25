import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { TopBar } from './components/gmail/TopBar';
import { Sidebar } from './components/gmail/Sidebar';
import { EmailList } from './components/gmail/EmailList';
import { EmailViewer } from './components/gmail/EmailViewer';
import { ComposeModal } from './components/gmail/ComposeModal';
import { ReportsView } from './components/gmail/ReportsView';
import { AnalyticsView } from './components/gmail/AnalyticsView';
import { EvidenceView } from './components/gmail/EvidenceView';
import { EvaluationView } from './components/gmail/EvaluationView';
import { SettingsView } from './components/gmail/SettingsView';
import { ThreatTriageView } from './components/gmail/ThreatTriageView';
import { SecurityAnalystsView } from './components/gmail/SecurityAnalystsView';
import { EmailRecord, fetchEmails, updateEmail, deleteEmail, fetchGmailStatus, startGmailOAuth, syncGmailInbox, connectGmailDirect } from './services/api';
import { signInWithGooglePopup, getCachedAccessToken } from './services/firebaseAuth';
import { Shield, Loader2, AlertCircle, X } from 'lucide-react';

function MainGmailApplication() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('inbox');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState<boolean>(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [analystTargetEmailId, setAnalystTargetEmailId] = useState<string | undefined>(undefined);
  const [connectedGmailEmail, setConnectedGmailEmail] = useState<string | null>(null);
  const [gmailBusy, setGmailBusy] = useState<boolean>(false);
  const [gmailNotice, setGmailNotice] = useState<string | null>(null);

  // Load emails whenever folder tab, search, or filter changes
  const loadEmails = async () => {
    const mailFolders = ['inbox', 'starred', 'sent', 'drafts', 'archived', 'trash', 'spam'];
    if (!mailFolders.includes(currentTab)) return;

    try {
      setIsLoadingEmails(true);
      const data = await fetchEmails(currentTab, searchQuery, activeFilter);
      setEmails(data.items || []);
    } catch (err) {
      console.error('[GMAIL] Error loading emails:', err);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, [currentTab, searchQuery, activeFilter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackStatus = params.get('gmail');
    const callbackReason = params.get('reason');
    if (callbackStatus) {
      params.delete('gmail');
      params.delete('reason');
      const query = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    }

    const initializeGmail = async () => {
      try {
        const status = await fetchGmailStatus();
        setConnectedGmailEmail(status.connected ? status.emailAddress : null);
        if (callbackStatus === 'connected' && status.connected) {
          setGmailBusy(true);
          await syncGmailInbox();
          await loadEmails();
          setGmailNotice(`Gmail connected as ${status.emailAddress}. Recent inbox messages are ready.`);
        } else if (callbackStatus === 'error') {
          const message = callbackReason === 'authorization_denied'
            ? 'Gmail authorization was cancelled. You can connect again any time.'
            : callbackReason === 'gmail_not_configured'
              ? 'Gmail OAuth is not configured. Add the Google OAuth credentials to the server environment.'
              : callbackReason === 'gmail_encryption_not_configured'
                ? 'Gmail token encryption is not configured on the server.'
                : callbackReason === 'google_refresh_token_missing'
                  ? 'Google did not return a refresh token. Remove EmailGuard from your Google account permissions, then connect again.'
                  : 'Gmail authorization did not complete. Please try connecting again.';
          setGmailNotice(message);
        }
      } catch (error: any) {
        if (callbackStatus === 'connected') {
          setGmailNotice(error?.message || 'Gmail connected, but Inbox sync failed. Use Sync Gmail to retry.');
        }
      }
    };
    void initializeGmail().finally(() => setGmailBusy(false));
  }, []);

  const handleConnectGmail = async () => {
    setGmailBusy(true);
    setGmailNotice(null);
    try {
      if (connectedGmailEmail) {
        await syncGmailInbox();
        await loadEmails();
        setGmailNotice(`Inbox synced from ${connectedGmailEmail}.`);
        return;
      }

      // Check for in-memory Google OAuth token first
      let token = getCachedAccessToken();
      let emailToConnect = user?.email;

      if (!token) {
        // Trigger Google Workspace OAuth popup
        const authResult = await signInWithGooglePopup();
        if (authResult?.accessToken) {
          token = authResult.accessToken;
          emailToConnect = authResult.user.email || user?.email;
        } else {
          // User closed popup or cancelled prompt
          setGmailNotice('Google connection window was closed. Click Connect Gmail to try again.');
          return;
        }
      }

      if (token) {
        const result = await connectGmailDirect(token, emailToConnect || undefined);
        setConnectedGmailEmail(result.emailAddress);
        try {
          await syncGmailInbox();
          await loadEmails();
          setGmailNotice(`Gmail successfully linked as ${result.emailAddress}. Recent messages synced.`);
        } catch {
          setGmailNotice(`Gmail linked as ${result.emailAddress}. Ready for inbox synchronization.`);
        }
        return;
      }

      // Fallback to server OAuth flow if token wasn't obtained from popup
      const { authUrl } = await startGmailOAuth();
      window.location.assign(authUrl);
    } catch (error: any) {
      const isCancelled =
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('popup-closed-by-user');
      const isBlocked =
        error?.code === 'auth/popup-blocked' || error?.message?.includes('popup-blocked');

      if (isCancelled) {
        setGmailNotice('Google connection window was closed. Click Connect Gmail to try again.');
      } else if (isBlocked) {
        setGmailNotice('Google connection popup was blocked by your browser. Please allow popups and try again.');
      } else {
        console.error('[GMAIL] Connection error:', error);
        setGmailNotice(error?.message || 'Gmail could not be connected. Please try again.');
      }
      if (error?.message?.toLowerCase().includes('reconnect')) setConnectedGmailEmail(null);
    } finally {
      setGmailBusy(false);
    }
  };

  const handleToggleStar = async (emailId: string, isStarred: boolean) => {
    try {
      await updateEmail(emailId, { isStarred });
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, isStarred } : e))
      );
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail({ ...selectedEmail, isStarred });
      }
    } catch (err) {
      console.error('[GMAIL] Star update error:', err);
    }
  };

  const handleDeleteSelected = async (emailIds: string[]) => {
    try {
      for (const id of emailIds) {
        await deleteEmail(id);
      }
      loadEmails();
    } catch (err) {
      console.error('[GMAIL] Delete error:', err);
    }
  };

  const handleMarkReadSelected = async (emailIds: string[], isRead: boolean) => {
    try {
      for (const id of emailIds) {
        await updateEmail(id, { isRead });
      }
      loadEmails();
    } catch (err) {
      console.error('[GMAIL] Mark read error:', err);
    }
  };

  const handleSelectEmail = async (email: EmailRecord) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await updateEmail(email.id, { isRead: true });
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e))
        );
      } catch (err) {
        console.warn('[GMAIL] Mark as read error:', err);
      }
    }
  };

  const handleNavigateFromReport = (emailId: string) => {
    const found = emails.find((e) => e.id === emailId);
    if (found) {
      setSelectedEmail(found);
    } else {
      setCurrentTab('inbox');
    }
  };

  const unreadCount = emails.filter((e) => !e.isRead).length;

  return (
    <div className="h-dvh min-h-[480px] bg-slate-50 flex flex-col font-sans text-slate-800 antialiased overflow-hidden">
      {/* Top Gmail Navigation Bar */}
      <TopBar
        onToggleSidebar={() => {
          if (window.innerWidth < 768) {
            setIsSidebarOpenMobile(!isSidebarOpenMobile);
          } else {
            setIsSidebarCollapsed(!isSidebarCollapsed);
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onConnectGmail={handleConnectGmail}
        connectedGmailEmail={connectedGmailEmail}
        gmailBusy={gmailBusy}
        onNavigateTab={(tab) => {
          setSelectedEmail(null);
          setCurrentTab(tab);
        }}
      />
      {gmailNotice && (
        <div role="status" className="shrink-0 px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{gmailNotice}</span>
          <button type="button" onClick={() => setGmailNotice(null)} className="p-1 rounded hover:bg-blue-100" aria-label="Dismiss Gmail message">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Gmail Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setSelectedEmail(null);
            setCurrentTab(tab);
          }}
          onOpenCompose={() => setIsComposeOpen(true)}
          unreadCount={unreadCount}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Center Main Stage */}
        <main className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden bg-white">
          {selectedEmail ? (
            <EmailViewer
              email={selectedEmail}
              onBack={() => {
                setSelectedEmail(null);
                loadEmails();
              }}
              onDelete={async (id) => {
                await deleteEmail(id);
                setSelectedEmail(null);
                loadEmails();
              }}
              onToggleStar={handleToggleStar}
              onEmailUpdated={(updated) => {
                setSelectedEmail(updated);
                loadEmails();
              }}
            />
          ) : currentTab === 'threat_triage' ? (
            <ThreatTriageView
              onOpenAnalystView={(emailId) => {
                setSelectedEmail(null);
                setAnalystTargetEmailId(emailId);
                setCurrentTab('analysts');
              }}
              onOpenReport={() => {
                setSelectedEmail(null);
                setCurrentTab('reports');
              }}
            />
          ) : currentTab === 'analysts' ? (
            <SecurityAnalystsView
              initialEmailId={analystTargetEmailId}
              onNavigateToReport={() => {
                setSelectedEmail(null);
                setCurrentTab('reports');
              }}
            />
          ) : currentTab === 'reports' ? (
            <ReportsView
              onSelectReportEmailId={(emailId) => {
                setSelectedEmail(null);
                setAnalystTargetEmailId(emailId);
                setCurrentTab('analysts');
              }}
            />
          ) : currentTab === 'evaluation' ? (
            <EvaluationView />
          ) : currentTab === 'settings' ? (
            <SettingsView />
          ) : (
            <EmailList
              emails={emails}
              title={
                currentTab === 'inbox'
                  ? 'Inbox'
                  : currentTab.charAt(0).toUpperCase() + currentTab.slice(1)
              }
              isLoading={isLoadingEmails}
              onRefresh={loadEmails}
              onSelectEmail={handleSelectEmail}
              onToggleStar={(id, isStarred) => handleToggleStar(id, isStarred)}
              onDeleteSelected={handleDeleteSelected}
              onMarkReadSelected={handleMarkReadSelected}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          )}
        </main>
      </div>

      {/* Floating Compose & Analyze Dialog */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => {
          setSelectedEmail(null);
          setCurrentTab('threat_triage');
        }}
      />
    </div>
  );
}

function AuthenticatedRoot() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Authenticating session with secure database...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainGmailApplication />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedRoot />
    </AuthProvider>
  );
}
