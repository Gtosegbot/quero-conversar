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
import ProfessionalChat from "@/react-app/pages/ProfessionalChat";
import ModerationDashboard from "@/react-app/pages/ModerationDashboard";
import Policies from "@/react-app/pages/Policies";
import Gallery from "@/react-app/pages/Gallery";
import Upload from "@/react-app/pages/Upload";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/register-professional" element={<ProfessionalRegistrationForm />} />
        <Route path="/become-professional" element={<ProfessionalRegistrationForm />} />
        <Route path="/register-partner" element={<PartnerRegistrationForm />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/admin" element={<AdminDashboard />} />
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
      </Routes>
    </Router>
  );
}
