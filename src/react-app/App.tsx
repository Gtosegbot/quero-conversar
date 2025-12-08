import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "@/react-app/pages/Landing";
import Layout from "@/react-app/components/Layout";
import Anamnesis from "@/react-app/pages/Anamnesis";
import Dashboard from "@/react-app/pages/Dashboard";
import Chat from "@/react-app/pages/Chat";
import Plans from "@/react-app/pages/Plans";
import Community from "@/react-app/pages/Community";
import Professionals from "@/react-app/pages/Professionals";
import Profile from "@/react-app/pages/Profile";
import Legal from "@/react-app/pages/Legal";
import AuthForm from "@/react-app/components/AuthForm";
import CommunityChatRoom from "@/react-app/components/CommunityChatRoom";
import ProfessionalRegistrationForm from "@/react-app/components/ProfessionalRegistrationForm";
import PartnerRegistrationForm from "@/react-app/components/PartnerRegistrationForm";
import Payment from "@/react-app/pages/Payment";
import AdminDashboard from "@/react-app/pages/AdminDashboard";
import AdminUsers from "@/react-app/pages/AdminUsers";
import AdminVideos from "@/react-app/pages/AdminVideos";
import ProfessionalChat from "@/react-app/pages/ProfessionalChat";
import ModerationDashboard from "@/react-app/pages/ModerationDashboard";
import Policies from "@/react-app/pages/Policies";
import Gallery from "@/react-app/pages/Gallery";
import Upload from "@/react-app/pages/Upload";
import EnterpriseSetup from "@/react-app/pages/EnterpriseSetup";
import EnterpriseEmployees from "@/react-app/pages/EnterpriseEmployees";
import InviteAccept from "@/react-app/pages/InviteAccept";

import React, { Component, ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado</h2>
            <p className="text-gray-600 mb-4">Ocorreu um erro ao carregar esta página.</p>
            <pre className="text-xs text-left bg-gray-100 p-4 rounded overflow-auto mb-4 text-red-500">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Voltar para o Início
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/register-professional" element={<ProfessionalRegistrationForm />} />
          <Route path="/become-professional" element={<ProfessionalRegistrationForm />} />
          <Route path="/register-partner" element={<PartnerRegistrationForm />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/videos" element={<AdminVideos />} />
          <Route path="/moderation" element={<ModerationDashboard />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/policies/:type" element={<Policies />} />
          <Route path="/anamnesis" element={<Anamnesis />} />
          <Route path="/terms" element={<Legal />} />
          <Route path="/privacy" element={<Legal />} />
          <Route path="/lgpd" element={<Legal />} />
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/chat" element={<Layout />}>
            <Route index element={<Chat />} />
          </Route>
          <Route path="/plans" element={<Layout />}>
            <Route index element={<Plans />} />
          </Route>
          <Route path="/community" element={<Layout />}>
            <Route index element={<Community />} />
            <Route path=":roomId" element={<CommunityChatRoom />} />
          </Route>

          <Route path="/professionals" element={<Layout />}>
            <Route index element={<Professionals />} />
          </Route>
          <Route path="/professional-chat/:professionalId" element={<Layout />}>
            <Route index element={<ProfessionalChat />} />
          </Route>
          <Route path="/profile" element={<Layout />}>
            <Route index element={<Profile />} />
          </Route>
          <Route path="/docs" element={<Layout />}>
            <Route index element={<Legal />} />
          </Route>
          <Route path="/gallery" element={<Layout />}>
            <Route index element={<Gallery />} />
          </Route>
          <Route path="/upload" element={<Layout />}>
            <Route index element={<Upload />} />
          </Route>

          {/* Enterprise Routes */}
          <Route path="/enterprise/setup" element={<EnterpriseSetup />} />
          <Route path="/enterprise/employees" element={<Layout />}>
            <Route index element={<EnterpriseEmployees />} />
          </Route>
          <Route path="/invite/accept" element={<InviteAccept />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
