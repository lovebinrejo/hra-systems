import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Message { role: 'bot' | 'user'; text: string; }

function getBotReply(input: string, userName: string, isAdmin: boolean): string {
  const q = input.toLowerCase().trim();

  if (/hello|hi|hey/.test(q)) return `Hi ${userName}! 👋 I'm your HRA assistant. Ask me about leaves, attendance, payslips, or HR policies.`;
  if (/leave balance|remaining leave|how many leave/.test(q)) return `You can check your leave balance on the **Apply Leave** page. It shows Paid, Sick, Casual, and Unpaid days remaining for this year.`;
  if (/apply.*leave|how.*apply|submit.*leave/.test(q)) return `To apply for leave:\n1. Go to **Apply Leave** from the sidebar\n2. Select the leave type\n3. Choose start & end dates\n4. Enter the reason and submit.`;
  if (/leave status|pending leave|leave approved/.test(q)) return `Check your leave status under **My Leaves** in the sidebar. You'll see Pending, Approved, and Rejected requests.`;
  if (/attendance|check.?in|check.?out/.test(q)) return `You can check-in and check-out from the **Attendance** page. Make sure location access is enabled for accurate tracking.`;
  if (/payslip|salary|pay slip/.test(q)) return `Your payslips are available under **My Payslips** in the sidebar. You can download them as PDF.`;
  if (/holiday|public holiday/.test(q)) return `Company holidays are listed in the **Calendar** section. You can also find upcoming holidays on your dashboard.`;
  if (/password|change password|reset password/.test(q)) return `To change your password, click your profile icon in the top-right corner and select **Change Password**.`;
  if (/profile|update.*info|personal details/.test(q)) return `You can update your personal details by going to **My Profile** from the sidebar or the top-right user menu.`;
  if (/announcement|news/.test(q)) return `Company announcements and news are available in the **News & Events** section of the sidebar.`;
  if (/event|company event/.test(q)) return `Check the **News & Events** section for upcoming company events and activities.`;
  if (/contact hr|hr email|hr contact/.test(q)) return `Please contact the HR Admin directly through the system or reach out via your company email for urgent matters.`;
  if (isAdmin && /employee|staff/.test(q)) return `As an Admin, you can manage employees under **Employees** in the sidebar — add, edit, activate or deactivate staff records.`;
  if (isAdmin && /approve|reject.*leave/.test(q)) return `Go to **Leave Requests** in the Admin panel to approve or reject pending leave requests.`;
  if (/thank|thanks/.test(q)) return `You're welcome! 😊 Let me know if you need anything else.`;
  if (/bye|goodbye/.test(q)) return `Goodbye ${userName}! Have a great day! 👋`;

  return `I'm not sure about that. Try asking about:\n• Leave balance or application\n• Attendance check-in/out\n• Payslips\n• Holidays & events\n• Password or profile update`;
}

const HRChatbot: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: `Hi ${user?.first_name || 'there'}! 👋 I'm your HRA AI Assistant. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: 'user', text };
    const botMsg: Message = { role: 'bot', text: getBotReply(text, user?.first_name || 'there', isAdmin) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const quickQuestions = ['Leave balance?', 'How to apply leave?', 'My payslips', 'Upcoming holidays'];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #046bd2, #0ea5e9)' }}
        aria-label="HR Assistant"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: '440px' }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #046bd2, #0ea5e9)' }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">HRA Assistant</p>
              <p className="text-[10px] text-blue-100">AI-powered · Always available</p>
            </div>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Online
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5 ${m.role === 'bot' ? 'bg-primary-600' : 'bg-gray-400'}`}>
                  {m.role === 'bot' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className={`max-w-[200px] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  m.role === 'bot'
                    ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                    : 'text-white rounded-tr-sm'
                }`}
                  style={m.role === 'user' ? { background: 'linear-gradient(135deg, #046bd2, #0ea5e9)' } : {}}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 bg-gray-50">
              {quickQuestions.map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex gap-2 items-center">
            <input
              className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #046bd2, #0ea5e9)' }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HRChatbot;
