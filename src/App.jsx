import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import axios from 'axios';

// API Configuration
const API_URL = 'https://dsa-tracker-backend-production-616d.up.railway.app';

// Animated Button Component
const AnimatedButton = ({ title, onClick, color, emoji, disabled = false }) => {
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0);

  const handlePressIn = () => setScale(0.95);
  const handlePressOut = () => {
    setScale(1);
    onClick();
  };

  useEffect(() => {
    setOpacity(1);
  }, []);

  return (
    <div style={{ opacity, transform: `scale(${scale})` }} className="mb-2 transition-all duration-300">
      <button
        className={`bg-${disabled ? 'gray-500' : color}-500 px-4 py-2 rounded-lg flex items-center justify-center border border-transparent hover:border-purple-400 ${disabled ? 'cursor-not-allowed' : ''} w-full sm:w-auto sm:min-w-[150px]`}
        onMouseDown={handlePressIn}
        onMouseUp={handlePressOut}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
        disabled={disabled}
      >
        <span className="text-gray-100 text-sm font-bold">{title} {emoji}</span>
      </button>
    </div>
  );
};

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      }
      setLoading(false);
    };

    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          await logout();
          alert('Session Expired: Please log in again.');
        }
        return Promise.reject(error);
      }
    );

    loadAuth();
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      alert(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email, password, username) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, { email, password, username });
      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Questions Context
const QuestionsContext = createContext();

const QuestionsProvider = ({ children }) => {
  const { token, loading: authLoading } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchQuestions = async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/questions`);
      setQuestions(response.data.data.sort((a, b) => b.averageFrequency - a.averageFrequency));
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to fetch questions');
    }
    setDataLoading(false);
  };

  useEffect(() => {
    if (!authLoading && token) fetchQuestions();
  }, [authLoading, token]);

  const updateQuestion = (id, updates) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  return (
    <QuestionsContext.Provider value={{ questions, dataLoading, fetchQuestions, updateQuestion }}>
      {children}
    </QuestionsContext.Provider>
  );
};

// Login Screen
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center p-4 bg-gray-800 min-h-screen w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-100">Login ✨</h1>
      <input
        className="border border-transparent p-3 mb-4 rounded-lg bg-gray-700/70 text-gray-100 font-semibold focus:border-purple-400 focus:bg-gray-800/50 outline-none w-full"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoCapitalize="none"
      />
      <input
        className="border border-transparent p-3 mb-4 rounded-lg bg-gray-700/70 text-gray-100 font-semibold focus:border-purple-400 focus:bg-gray-800/50 outline-none w-full"
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <AnimatedButton title="Login" onClick={() => login(email, password)} color="purple" emoji="🚀" />
      <button onClick={() => navigate('/register')} className="mt-4 text-purple-400 text-center text-lg font-semibold">
        No account? Register 🌟
      </button>
    </div>
  );
};

// Register Screen
const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center p-4 bg-gray-800 min-h-screen w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-100">Register 🌟</h1>
      <input
        className="border border-transparent p-3 mb-4 rounded-lg bg-gray-700/70 text-gray-100 font-semibold focus:border-purple-400 focus:bg-gray-800/50 outline-none w-full"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoCapitalize="none"
      />
      <input
        className="border border-transparent p-3 mb-4 rounded-lg bg-gray-700/70 text-gray-100 font-semibold focus:border-purple-400 focus:bg-gray-800/50 outline-none w-full"
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <input
        className="border border-transparent p-3 mb-4 rounded-lg bg-gray-700/70 text-gray-100 font-semibold focus:border-purple-400 focus:bg-gray-800/50 outline-none w-full"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <AnimatedButton title="Register" onClick={() => register(email, password, username)} color="purple" emoji="🎉" />
      <button onClick={() => navigate('/login')} className="mt-4 text-purple-400 text-center text-lg font-semibold">
        Have an account? Login ✨
      </button>
    </div>
  );
};

// Companies Screen
const CompaniesScreen = () => {
  const { questions, dataLoading, fetchQuestions } = useContext(QuestionsContext);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const companyMap = new Map();
    questions.forEach(q => {
      q.companies.forEach(c => {
        const name = c.name.charAt(0).toUpperCase() + c.name.slice(1).toLowerCase();
        if (!companyMap.has(name)) {
          companyMap.set(name, { totalQuestions: 0, solvedQuestions: 0 });
        }
        const companyData = companyMap.get(name);
        companyData.totalQuestions += 1;
        if (q.status === 'solved') companyData.solvedQuestions += 1;
      });
    });

    const uniqueCompanies = Array.from(companyMap.entries()).map(([name, data]) => ({
      name,
      totalQuestions: data.totalQuestions,
      solvedQuestions: data.solvedQuestions,
    }));

    setCompanies(uniqueCompanies);
    setFilteredCompanies(uniqueCompanies);
  }, [questions]);

  useEffect(() => {
    const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    setFilteredCompanies(filtered);
  }, [search, companies]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions();
    setRefreshing(false);
  };

  const renderCompanyStatus = (company) => {
    if (company.solvedQuestions === company.totalQuestions && company.totalQuestions > 0) {
      return (
        <div className="w-6 h-6 bg-blue-500 rounded-full flex justify-center items-center">
          <span className="text-gray-100 font-bold text-sm">✓</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-4 bg-gray-800 min-h-screen w-full">
      <h1 className="text-2xl font-bold mb-4 text-gray-100">Companies 🌈</h1>
      <input
        className="border border-transparent p-3 mb-4 rounded-lg bg-gray-700/70 text-gray-100 font-semibold focus:border-purple-400 focus:bg-gray-800/50 outline-none w-full"
        placeholder="Search companies..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {dataLoading || refreshing ? (
        <div className="flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div></div>
      ) : (
        <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-700 h-[calc(100vh-150px)]">
          {filteredCompanies.map(item => (
            <button
              key={item.name}
              className="p-4 bg-gray-700/70 rounded-lg shadow-md flex items-center w-full hover:bg-gray-600/70"
              onClick={() => navigate(`/company/${item.name}`)}
            >
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-100">{item.name}</h2>
                <p className="text-gray-400 text-sm">{item.totalQuestions} Questions</p>
              </div>
              {renderCompanyStatus(item)}
            </button>
          ))}
        </div>
      )}
      <button onClick={onRefresh} className="mt-4 text-purple-400 text-base">Refresh 🔄</button>
    </div>
  );
};

// Format Frequency
const formatFrequency = (freq) => {
  if (!freq) return '0.0%';
  return `${Math.round(freq * 10) / 10}%`;
};

// Company Detail Screen
const CompanyDetailScreen = () => {
  const { company } = useParams();
  const { questions, dataLoading, fetchQuestions } = useContext(QuestionsContext);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const lowerCompany = company.toLowerCase();
    const filtered = questions
      .filter(q => q.companies.some(c => c.name.toLowerCase() === lowerCompany))
      .sort((a, b) => b.averageFrequency - a.averageFrequency);
    setFilteredQuestions(filtered);

    const total = filtered.length;
    let solved = 0, practice = 0, unattempted = 0;
    filtered.forEach(q => {
      if (q.status === 'solved') solved++;
      else if (q.status === 'practice') practice++;
      else unattempted++;
    });
    setStats({ solved, practice, unattempted, total });
  }, [questions, company]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions();
    setRefreshing(false);
  };

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500 text-gray-100';
      case 'medium': return 'bg-yellow-500 text-gray-100';
      case 'hard': return 'bg-red-500 text-gray-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };

  const renderStatusIndicator = (status) => {
    if (status === 'solved') {
      return (
        <div className="w-6 h-6 bg-blue-500 rounded-full flex justify-center items-center">
          <span className="text-gray-100 font-bold text-sm">✓</span>
        </div>
      );
    } else if (status === 'practice') {
      return <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>;
    }
    return null;
  };

  return (
    <div className="flex-1 p-4 bg-gray-800 min-h-screen w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">{company} 🌟</h1>
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500 p-4 rounded-lg shadow-md">
            <h2 className="text-gray-100 text-lg font-bold">Solved</h2>
            <p className="text-gray-100 text-2xl">{stats.solved}</p>
          </div>
          <div className="bg-yellow-500 p-4 rounded-lg shadow-md">
            <h2 className="text-gray-100 text-lg font-bold">Practice</h2>
            <p className="text-gray-100 text-2xl">{stats.practice}</p>
          </div>
          <div className="bg-gray-500 p-4 rounded-lg shadow-md">
            <h2 className="text-gray-100 text-lg font-bold">Pending</h2>
            <p className="text-gray-100 text-2xl">{stats.unattempted}</p>
          </div>
          <div className="bg-purple-500 p-4 rounded-lg shadow-md">
            <h2 className="text-gray-100 text-lg font-bold">Total</h2>
            <p className="text-gray-100 text-2xl">{stats.total}</p>
          </div>
        </div>
      )}
      {dataLoading || refreshing ? (
        <div className="flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div></div>
      ) : (
        <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-700 h-[calc(100vh-150px)]">
          {filteredQuestions.map(item => (
            <button
              key={item.id}
              className="p-4 bg-gray-700/70 rounded-lg shadow-md flex items-center w-full hover:bg-gray-600/70"
              onClick={() => navigate(`/question/${item.id}`)}
            >
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-100">{item.name}</h2>
                <div className="flex items-center mt-2">
                  <span className={`px-2 py-1 rounded mr-2 text-sm ${getDifficultyStyle(item.difficulty)}`}>{item.difficulty}</span>
                  <span className="text-gray-400 text-sm">Frequency: {formatFrequency(item.averageFrequency)}</span>
                </div>
              </div>
              {renderStatusIndicator(item.status)}
            </button>
          ))}
        </div>
      )}
      <button onClick={onRefresh} className="mt-4 text-purple-400 text-base">Refresh 🔄</button>
    </div>
  );
};

// Format Time
const formatTime = (seconds) => {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Question Detail Screen
const QuestionDetailScreen = () => {
  const { questionId } = useParams();
  const { user } = useContext(AuthContext);
  const { questions, updateQuestion } = useContext(QuestionsContext);
  const [question, setQuestion] = useState(null);
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [topicsToRemove, setTopicsToRemove] = useState([]);
  const navigate = useNavigate();

  const API_URL = 'https://dsa-tracker-backend-production-616d.up.railway.app';

  useEffect(() => {
    const foundQuestion = questions.find(q => q.id === parseInt(questionId));
    if (foundQuestion) {
      setQuestion(foundQuestion);
    } else {
      alert('Question not found');
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [questions, questionId, timerInterval]);

  const handleStatusChange = async (newStatus) => {
    const oldStatus = question.status;
    updateQuestion(parseInt(questionId), { status: newStatus });
    setQuestion(prev => ({ ...prev, status: newStatus }));
    try {
      await axios.put(`${API_URL}/api/questions/${questionId}/status`, { status: newStatus });
    } catch (error) {
      updateQuestion(parseInt(questionId), { status: oldStatus });
      setQuestion(prev => ({ ...prev, status: oldStatus }));
      alert('Failed to update status');
    }
  };

  const incrementAttempt = async () => {
    const oldCount = question.attemptCount || 0;
    updateQuestion(parseInt(questionId), { attemptCount: oldCount + 1 });
    setQuestion(prev => ({ ...prev, attemptCount: oldCount + 1 }));
    try {
      await axios.post(`${API_URL}/api/questions/${questionId}/attempt`);
    } catch (error) {
      updateQuestion(parseInt(questionId), { attemptCount: oldCount });
      setQuestion(prev => ({ ...prev, attemptCount: oldCount }));
      alert('Failed to increment attempt');
    }
    startTimer();
  };

  const startTimer = () => {
    setIsTiming(true);
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = async () => {
    clearInterval(timerInterval);
    setIsTiming(false);
    const currentBest = question.bestTime || Infinity;
    if (elapsedSeconds < currentBest && elapsedSeconds > 0) {
      const newBest = elapsedSeconds;
      updateQuestion(parseInt(questionId), { bestTime: newBest });
      setQuestion(prev => ({ ...prev, bestTime: newBest }));
      try {
        await axios.put(`${API_URL}/api/questions/${questionId}/time`, { bestTime: newBest });
      } catch (error) {
        updateQuestion(parseInt(questionId), { bestTime: currentBest === Infinity ? null : currentBest });
        setQuestion(prev => ({ ...prev, bestTime: currentBest === Infinity ? null : currentBest }));
        alert('Failed to update best time');
      }
    }
    setElapsedSeconds(0);
  };

  const openLink = () => {
    if (question.link) {
      window.open(question.link, '_blank');
    } else {
      alert('No link available');
    }
  };

  const toggleTopicToRemove = (topic) => {
    setTopicsToRemove(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  const removeTopics = async () => {
    if (topicsToRemove.length === 0) {
      alert('No topics selected for removal');
      return;
    }
    const oldTopics = [...question.topics];
    const newTopics = oldTopics.filter(t => !topicsToRemove.includes(t));
    updateQuestion(parseInt(questionId), { topics: newTopics });
    setQuestion(prev => ({ ...prev, topics: newTopics }));
    try {
      await axios.delete(`${API_URL}/api/questions/${questionId}/topics`, { data: { topics: topicsToRemove } });
      setTopicsToRemove([]);
    } catch (error) {
      updateQuestion(parseInt(questionId), { topics: oldTopics });
      setQuestion(prev => ({ ...prev, topics: oldTopics }));
      alert(error.response?.data?.error || 'Failed to remove topics');
    }
  };

  if (!question) return <div className="flex justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="flex-1 p-4 bg-gray-800 min-h-screen w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">{question.name} 🌟</h1>
      <div className="mb-4 p-4 bg-gray-700/70 rounded-lg">
        <h2 className="font-bold mb-2 text-gray-100 text-base">Companies:</h2>
        <div className="flex flex-wrap mb-2 gap-2">
          {question.companies.map((company, index) => (
            <span key={index} className="bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold text-gray-100">{company.name}</span>
          ))}
        </div>
        <h2 className="font-bold mb-2 text-gray-100 text-base">Topics:</h2>
        <div className="flex flex-wrap mb-2 gap-2">
          {question.topics.map((topic, index) => (
            <button
              key={index}
              className={`px-3 py-1 rounded-full text-sm ${topicsToRemove.includes(topic) ? 'bg-red-600' : 'bg-purple-600'} ${user.is_admin ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={() => user.is_admin && toggleTopicToRemove(topic)}
            >
              <span className="font-semibold text-gray-100">{topic} {user.is_admin && topicsToRemove.includes(topic) ? '✕' : ''}</span>
            </button>
          ))}
        </div>
        {user.is_admin && (
          <div className="mt-2">
            <AnimatedButton title="Remove Topics" onClick={removeTopics} color="red" emoji="🗑️" disabled={topicsToRemove.length === 0} />
          </div>
        )}
        <p className="text-gray-400 mb-2 text-sm">Frequency: {formatFrequency(question.averageFrequency)}</p>
        <AnimatedButton title="View Question" onClick={openLink} color="purple" emoji="🔗" />
      </div>
      <div className="mb-4 p-4 bg-gray-700/70 rounded-lg">
        <h2 className="font-bold mb-3 text-gray-100 text-base">Status:</h2>
        <div className="flex flex-wrap gap-2">
          {['unattempted', 'practice', 'solved'].map(status => (
            <button
              key={status}
              className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-sm ${
                question.status === status
                  ? status === 'unattempted' ? 'bg-gray-600' : status === 'practice' ? 'bg-yellow-600' : 'bg-blue-600'
                  : 'bg-gray-600'
              }`}
              onClick={() => handleStatusChange(status)}
            >
              <span className="text-gray-100 font-semibold text-center">
                {status.charAt(0).toUpperCase() + status.slice(1)} {status === 'unattempted' ? '📝' : status === 'practice' ? '🏋️' : '✅'}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4 p-4 bg-gray-700/70 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-100">Attempts: {question.attemptCount || 0}</h2>
          <span className="bg-blue-600 px-3 py-1 rounded-lg text-gray-100 font-semibold text-sm">Best Time: {formatTime(question.bestTime)}</span>
        </div>
        {isTiming ? (
          <div className="p-4 bg-gray-600/50 rounded-lg text-center">
            <p className="text-lg font-semibold text-gray-100 mb-2">Timer: {formatTime(elapsedSeconds)}</p>
            <AnimatedButton title="Stop Timer" onClick={stopTimer} color="red" emoji="⏹️" />
          </div>
        ) : (
          <AnimatedButton title="Start Attempt" onClick={incrementAttempt} color="purple" emoji="🚀" />
        )}
      </div>
    </div>
  );
};
// Stats Screen
const StatsScreen = () => {
  const { questions, dataLoading, fetchQuestions } = useContext(QuestionsContext);
  const { logout, user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = 'https://dsa-tracker-backend-production-616d.up.railway.app';

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/stats`);
      setStats(response.data.data);
    } catch (error) {
      alert('Failed to fetch stats');
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    if (!dataLoading) fetchStats();
  }, [dataLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchQuestions(), fetchStats()]);
    setRefreshing(false);
  };

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500 text-gray-100';
      case 'medium': return 'bg-yellow-500 text-gray-100';
      case 'hard': return 'bg-red-500 text-gray-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };

  if (dataLoading || statsLoading || !stats) return <div className="flex justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="flex-1 p-4 bg-gray-800 min-h-screen w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Statistics 📊</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-500 p-4 rounded-lg shadow-md">
          <h2 className="text-gray-100 text-lg font-bold">Total</h2>
          <p className="text-gray-100 text-2xl">{stats.total}</p>
        </div>
        <div className="bg-blue-500 p-4 rounded-lg shadow-md">
          <h2 className="text-gray-100 text-lg font-bold">Solved</h2>
          <p className="text-gray-100 text-2xl">{stats.byStatus.solved}</p>
        </div>
        <div className="bg-yellow-500 p-4 rounded-lg shadow-md">
          <h2 className="text-gray-100 text-lg font-bold">Practice</h2>
          <p className="text-gray-100 text-2xl">{stats.byStatus.practice}</p>
        </div>
        <div className="bg-gray-500 p-4 rounded-lg shadow-md">
          <h2 className="text-gray-100 text-lg font-bold">Pending</h2>
          <p className="text-gray-100 text-2xl">{stats.byStatus.unattempted}</p>
        </div>
      </div>
      <h2 className="text-lg font-bold mb-3 text-gray-100">By Difficulty</h2>
      {stats.byDifficulty.map((d, index) => (
        <div key={index} className="p-3 mb-2 bg-gray-700/70 rounded-lg shadow-md flex items-center">
          <span className={`px-3 py-1 rounded mr-3 text-sm ${getDifficultyStyle(d.difficulty)}`}>{d.difficulty}</span>
          <span className="text-gray-400 text-sm">{d.solved}/{d.total} Solved</span>
        </div>
      ))}
      <div className="mt-6 p-4 bg-gray-700/70 rounded-lg shadow-md">
        <h2 className="text-lg font-bold mb-3 text-gray-100">Profile 😊</h2>
        <p className="text-gray-400 mb-2 text-sm">Email: {user.email}</p>
        <p className="text-gray-400 mb-4 text-sm">Username: {user.username}</p>
      </div>
      <button onClick={onRefresh} className="mt-4 text-purple-400 text-base">Refresh 🔄</button>
    </div>
  );
};

// Questions Screen
const QuestionsScreen = () => {
  const { questions, dataLoading, fetchQuestions } = useContext(QuestionsContext);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulties, setDifficulties] = useState([]);
  const [topics, setTopics] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const topicSet = new Set();
    questions.forEach(q => q.topics.forEach(t => topicSet.add(t)));
    setAvailableTopics(Array.from(topicSet).sort());
  }, [questions]);

  useEffect(() => {
    const filtered = questions
      .filter(question => {
        const searchLower = search.toLowerCase();
        const matchesSearch = search
          ? question.name.toLowerCase().includes(searchLower) ||
            question.topics.some(t => t.toLowerCase().includes(searchLower))
          : true;
        const matchesDifficulty = difficulties.length > 0
          ? difficulties.includes(question.difficulty)
          : true;
        const matchesTopic = topics.length > 0
          ? topics.some(t => question.topics.includes(t))
          : true;
        return matchesSearch && matchesDifficulty && matchesTopic;
      })
      .sort((a, b) => b.averageFrequency - a.averageFrequency);

    setFilteredQuestions(filtered);
  }, [search, difficulties, topics, questions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions();
    setRefreshing(false);
  };

  const toggleDifficulty = (difficulty) => {
    setDifficulties(prev => prev.includes(difficulty) ? prev.filter(d => d !== difficulty) : [...prev, difficulty]);
  };

  const toggleTopic = (topic) => {
    setTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500 text-gray-100';
      case 'medium': return 'bg-yellow-500 text-gray-100';
      case 'hard': return 'bg-red-500 text-gray-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };

  const renderStatusIndicator = (status) => {
    if (status === 'solved') {
      return (
        <div className="w-6 h-6 bg-blue-500 rounded-full flex justify-center items-center">
          <span className="text-gray-100 font-bold text-sm">✓</span>
        </div>
      );
    } else if (status === 'practice') {
      return <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>;
    }
    return null;
  };

  return (
    <div className="flex-1 p-4 bg-gray-800 min-h-screen w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">Questions ❓</h1>
      <input
        className="border border-transparent p-3 mb-4 rounded-lg bg-gray-700/70 text-gray-100 font-semibold focus:border-purple-400 focus:bg-gray-800/50 outline-none w-full"
        placeholder="Search by name or topic..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <h2 className="text-lg font-bold mb-2 text-gray-100">Filter by Difficulty</h2>
      <div className="flex flex-wrap mb-4 gap-2">
        {['EASY', 'MEDIUM', 'HARD'].map(diff => (
          <AnimatedButton
            key={diff}
            title={diff}
            onClick={() => toggleDifficulty(diff)}
            color={difficulties.includes(diff) ? diff === 'EASY' ? 'green' : diff === 'MEDIUM' ? 'yellow' : 'red' : 'gray-500'}
            emoji={diff === 'EASY' ? '😊' : diff === 'MEDIUM' ? '🤔' : '😓'}
          />
        ))}
      </div>
      <h2 className="text-lg font-bold mb-2 text-gray-100">Filter by Topic</h2>
      <div className="mb-4">
        {topics.length > 0 && (
          <div className="flex flex-wrap mb-2 gap-2">
            {topics.map(topic => (
              <button
                key={topic}
                className="bg-purple-600 px-3 py-1 rounded-full text-sm"
                onClick={() => toggleTopic(topic)}
              >
                <span className="font-semibold text-gray-100">{topic} ✕</span>
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {availableTopics.map(topic => (
            <button
              key={topic}
              className={`bg-${topics.includes(topic) ? 'purple-600' : 'gray-600'} px-3 py-1 rounded-full text-sm`}
              onClick={() => toggleTopic(topic)}
            >
              <span className="font-semibold text-gray-100">{topic}</span>
            </button>
          ))}
        </div>
      </div>
      {dataLoading || refreshing ? (
        <div className="flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div></div>
      ) : (
        <div className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-700 h-[calc(100vh-150px)]">
          {filteredQuestions.map(item => (
            <button
              key={item.id}
              className="p-4 bg-gray-700/70 rounded-lg flex items-center w-full hover:bg-gray-600/70"
              onClick={() => navigate(`/question/${item.id}`)}
            >
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-100">{item.name}</h2>
                <div className="flex items-center mt-2 gap-2">
                  <span className={`px-2 py-1 rounded text-sm ${getDifficultyStyle(item.difficulty)}`}>{item.difficulty}</span>
                  <span className="text-gray-400 text-sm">Frequency: {formatFrequency(item.averageFrequency)}</span>
                </div>
              </div>
              {renderStatusIndicator(item.status)}
            </button>
          ))}
        </div>
      )}
      <button onClick={onRefresh} className="mt-4 text-purple-400 text-base">Refresh 🔄</button>
    </div>
  );
};

// App Component
const App = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-800"><div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div></div>;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-800">
        {user && (
          <nav className="bg-gray-700/70 p-3 sm:p-4 flex justify-between items-center sticky top-0 z-10 max-w-7xl mx-auto">
            <div className="flex space-x-3 sm:space-x-4">
              <Link to="/stats" className="text-gray-100 hover:text-purple-400 font-semibold text-sm sm:text-base">Stats 📊</Link>
              <Link to="/companies" className="text-gray-100 hover:text-purple-400 font-semibold text-sm sm:text-base">Companies 🌈</Link>
              <Link to="/questions" className="text-gray-100 hover:text-purple-400 font-semibold text-sm sm:text-base">Questions ❓</Link>
            </div>
            <button onClick={() => useContext(AuthContext).logout()} className="text-red-500 font-semibold text-sm sm:text-base">Logout 👋</button>
          </nav>
        )}
        <div className="max-w-7xl mx-auto">
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<Navigate to="/stats" />} />
                <Route path="/stats" element={<StatsScreen />} />
                <Route path="/companies" element={<CompaniesScreen />} />
                <Route path="/questions" element={<QuestionsScreen />} />
                <Route path="/company/:company" element={<CompanyDetailScreen />} />
                <Route path="/question/:questionId" element={<QuestionDetailScreen />} />
                <Route path="/login" element={<Navigate to="/stats" />} />
                <Route path="/register" element={<Navigate to="/stats" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
};

// Export with Providers
export default () => (
  <AuthProvider>
    <QuestionsProvider>
      <App />
    </QuestionsProvider>
  </AuthProvider>
);