import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { InboxPage } from './pages/InboxPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { ReportPage } from './pages/ReportPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { SettingsPage } from './pages/SettingsPage';
import { ConnectGmailModal } from './components/inbox/ConnectGmailModal';
import { getBackendConfig, updateBackendConfig } from './services/api';
import { BackendConfig, EmailRecord, ThreatReport } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>('em-001');
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(getBackendConfig());

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewReport = (emailId: string) => {
    setSelectedEmailId(emailId);
    setCurrentTab('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisComplete = (newEmail: EmailRecord, newReport: ThreatReport) => {
    setSelectedEmailId(newEmail.id);
    setCurrentTab('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateConfig = (updates: Partial<BackendConfig>) => {
    const updated = updateBackendConfig(updates);
    setBackendConfig(updated);
    return updated;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex antialiased">
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        backendConfig={backendConfig}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onConnectGmailClick={() => setIsGmailModalOpen(true)}
          onSelectTab={handleSelectTab}
          onSearch={(query) => {
            handleSelectTab('inbox');
          }}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigateToInbox={() => handleSelectTab('inbox')}
              onNavigateToAnalyze={() => handleSelectTab('analyze')}
              onViewReport={handleViewReport}
            />
          )}

          {currentTab === 'inbox' && (
            <InboxPage
              onViewReport={handleViewReport}
              onNavigateToAnalyze={() => handleSelectTab('analyze')}
            />
          )}

          {currentTab === 'analyze' && (
            <AnalyzePage onAnalysisComplete={handleAnalysisComplete} />
          )}

          {currentTab === 'reports' && (
            <ReportPage
              currentEmailId={selectedEmailId}
              onSelectEmailId={(id) => setSelectedEmailId(id)}
              onNavigateToInbox={() => handleSelectTab('inbox')}
            />
          )}

          {currentTab === 'evidence' && <KnowledgeBasePage />}

          {currentTab === 'analytics' && <AnalyticsPage />}

          {currentTab === 'evaluation' && <EvaluationPage />}

          {currentTab === 'settings' && (
            <SettingsPage
              backendConfig={backendConfig}
              onUpdateConfig={handleUpdateConfig}
              onOpenGmailModal={() => setIsGmailModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Global Gmail OAuth Modal */}
      <ConnectGmailModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
      />
    </div>
  );
}
