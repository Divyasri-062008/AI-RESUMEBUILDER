import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { Home, FileText, Settings, HelpCircle, LogOut, PlusCircle, Trash2, Edit, Download, CheckCircle, XCircle, ChevronUp, ChevronDown, Sparkles, Clipboard, UserPlus, LogIn } from 'lucide-react';

// Global variables provided by the Canvas environment
// For local development, replace these with your actual Firebase project configuration
const appId = "resumebuilder-a3674"; // Example: "your-firebase-project-id" - USE YOUR ACTUAL PROJECT ID
const firebaseConfig = {
  apiKey: "AIzaSyCOpKxoFHZktR700AlJ1MoeLlSBHau402g",
  authDomain: "resumebuilder-a3674.firebaseapp.com",
  projectId: "resumebuilder-a3674",
  storageBucket: "resumebuilder-a3674.firebasestorage.app",
  messagingSenderId: "533737374782",
  appId: "1:533737374782:web:ec518f26241da700ce3d6f",
  measurementId: "G-D7ZT0ZS29Q"
};

const initialAuthToken = null; // Keep this as null for anonymous sign-in in local development, or use a custom token if provided

// Initialize Firebase (will be done once in useEffect)
let app;
let db;
let auth;

// Main App Component
const App = () => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'editor', 'score-checker', 'help', 'contact'
    const [resumes, setResumes] = useState([]);
    const [currentResume, setCurrentResume] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    // Firebase Initialization and Authentication
    useEffect(() => {
        const initFirebase = async () => {
            try {
                if (!app) { // Ensure Firebase is initialized only once
                    app = initializeApp(firebaseConfig);
                    db = getFirestore(app);
                    auth = getAuth(app);
                }

                // Listen for auth state changes
                // This listener will automatically update the 'user' state when a user logs in/out
                // or when the initial auth state is determined.
                const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                    setUser(currentUser);
                    setUserId(currentUser?.uid); // Set UID if authenticated, otherwise null
                    setIsAuthReady(true);
                    setLoading(false);
                });

                return () => unsubscribe(); // Cleanup listener
            } catch (error) {
                console.error("Error initializing Firebase or signing in:", error);
                setMessage(`Error: ${error.message}`);
                setMessageType('error');
                setLoading(false);
            }
        };

        initFirebase();
    }, []); // Run only once on component mount

    // Fetch resumes when auth is ready and user ID is available
    useEffect(() => {
        if (!isAuthReady || !userId || !db) {
            setResumes([]); // Clear resumes if no user is logged in
            return;
        }

        const resumesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/resumes`);
        const q = query(resumesCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedResumes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setResumes(fetchedResumes);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching resumes:", error);
            setMessage(`Error fetching resumes: ${error.message}`);
            setMessageType('error');
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener
    }, [isAuthReady, userId, db]);

    // Show temporary message
    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 3000);
    };

    // Handle user login
    const handleLogin = async (email, password) => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage('Logged in successfully!', 'success');
            setCurrentPage('dashboard'); // Redirect to dashboard on successful login
        } catch (error) {
            console.error("Login error:", error);
            showMessage(`Login failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Handle user signup
    const handleSignup = async (email, password) => {
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage('Account created and logged in successfully!', 'success');
            setCurrentPage('dashboard'); // Redirect to dashboard on successful signup
        } catch (error) {
            console.error("Signup error:", error);
            showMessage(`Signup failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserId(null);
            setCurrentPage('dashboard');
            showMessage('Logged out successfully!', 'success');
        } catch (error) {
            console.error("Error logging out:", error);
            showMessage(`Error logging out: ${error.message}`, 'error');
        }
    };

    // Default empty resume structure
    const defaultResumeContent = {
        contactInfo: {
            name: '',
            email: '',
            phone: '',
            linkedin: ''
        },
        summary: '',
        sections: [
            {
                id: 'education',
                title: 'EDUCATION',
                items: [{ degree: '', university: '', location: '', dates: '' }]
            },
            {
                id: 'experience',
                title: 'EXPERIENCE',
                items: [{ title: '', company: '', location: '', dates: '', description: [''] }]
            },
            {
                id: 'projects',
                title: 'PROJECTS',
                items: [{ title: '', description: [''], link: '' }]
            },
            {
                id: 'skills',
                title: 'SKILLS',
                items: [{ category: 'Programming Languages', list: [''] }]
            },
            {
                id: 'achievements',
                title: 'ACHIEVEMENTS',
                items: [{ description: '' }]
            },
            {
                id: 'extracurriculars',
                title: 'EXTRACURRICULARS',
                items: [{ description: '' }]
            }
        ]
    };

    // Create a new resume
    const createNewResume = async () => {
        if (!userId || !db) {
            showMessage('User not authenticated. Please log in or sign up to create a resume.', 'error');
            return;
        }
        setLoading(true);
        try {
            const newResumeRef = doc(collection(db, `artifacts/${appId}/users/${userId}/resumes`));
            const newResumeData = {
                content: JSON.stringify(defaultResumeContent), // Store as JSON string
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                template: 'classic',
                name: `New Resume ${resumes.length + 1}`
            };
            await setDoc(newResumeRef, newResumeData);
            setCurrentResume({ id: newResumeRef.id, ...newResumeData, content: defaultResumeContent }); // Set content as parsed object
            setCurrentPage('editor');
            showMessage('New resume created!', 'success');
        } catch (error) {
            console.error("Error creating new resume:", error);
            showMessage(`Error creating resume: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Edit an existing resume
    const editResume = (resume) => {
        setCurrentResume({ ...resume, content: JSON.parse(resume.content) }); // Parse content back to object
        setCurrentPage('editor');
    };

    // Delete a resume
    const deleteResume = async (resumeId) => {
        if (!userId || !db) {
            showMessage('User not authenticated. Please log in to delete a resume.', 'error');
            return;
        }
        // Using window.confirm for simplicity, replace with custom modal if needed
        if (window.confirm('Are you sure you want to delete this resume?')) {
            setLoading(true);
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/resumes`, resumeId));
                showMessage('Resume deleted successfully!', 'success');
                if (currentResume && currentResume.id === resumeId) {
                    setCurrentResume(null);
                    setCurrentPage('dashboard');
                }
            } catch (error) {
                console.error("Error deleting resume:", error);
                showMessage(`Error deleting resume: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    // Save resume from editor
    const saveResume = async (resumeData) => {
        if (!userId || !db || !currentResume) {
            showMessage('Cannot save: User not authenticated or no resume selected.', 'error');
            return;
        }
        setLoading(true);
        try {
            const resumeRef = doc(db, `artifacts/${appId}/users/${userId}/resumes`, currentResume.id);
            await updateDoc(resumeRef, {
                content: JSON.stringify(resumeData), // Store as JSON string
                updatedAt: new Date().toISOString()
            });
            setCurrentResume(prev => ({ ...prev, content: resumeData, updatedAt: new Date().toISOString() }));
            showMessage('Resume saved successfully!', 'success');
        } catch (error) {
            console.error("Error saving resume:", error);
            showMessage(`Error saving resume: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Component for displaying messages
    const MessageDisplay = ({ message, type }) => {
        if (!message) return null;
        const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
        return (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-3 rounded-lg border shadow-lg ${bgColor}`}>
                {message}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">Loading application...</div>
            </div>
        );
    }

    // Render AuthScreen if user is not authenticated
    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
                <MessageDisplay message={message} type={messageType} />
                <AuthScreen
                    onLogin={handleLogin}
                    onSignup={handleSignup}
                    showMessage={showMessage}
                    loading={loading}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-inter">
            <MessageDisplay message={message} type={messageType} />

            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg md:min-h-screen">
                <div className="text-2xl font-bold mb-8 text-center">Resume AI</div>
                <nav className="flex-grow">
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => setCurrentPage('dashboard')}
                                className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${currentPage === 'dashboard' ? 'bg-gray-700 text-blue-300' : 'hover:bg-gray-700'}`}
                            >
                                <Home className="mr-3" size={20} /> Dashboard
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => createNewResume()}
                                className="flex items-center w-full p-3 rounded-lg transition-colors duration-200 hover:bg-gray-700"
                            >
                                <PlusCircle className="mr-3" size={20} /> Create New Resume
                            </button>
                        </li>
                        {currentResume && (
                            <li>
                                <button
                                    onClick={() => setCurrentPage('editor')}
                                    className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${currentPage === 'editor' ? 'bg-gray-700 text-blue-300' : 'hover:bg-gray-700'}`}
                                >
                                    <FileText className="mr-3" size={20} /> Resume Editor
                                </button>
                            </li>
                        )}
                        <li>
                            <button
                                onClick={() => setCurrentPage('score-checker')}
                                className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${currentPage === 'score-checker' ? 'bg-gray-700 text-blue-300' : 'hover:bg-gray-700'}`}
                            >
                                <CheckCircle className="mr-3" size={20} /> Resume Score
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setCurrentPage('help')}
                                className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${currentPage === 'help' ? 'bg-gray-700 text-blue-300' : 'hover:bg-gray-700'}`}
                            >
                                <HelpCircle className="mr-3" size={20} /> Help & FAQs
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setCurrentPage('contact')}
                                className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${currentPage === 'contact' ? 'bg-gray-700 text-blue-300' : 'hover:bg-gray-700'}`}
                            >
                                <Clipboard className="mr-3" size={20} /> Contact
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="mt-8">
                    <div className="text-sm text-gray-400 mb-2">User ID: {userId}</div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full p-3 rounded-lg transition-colors duration-200 bg-red-600 hover:bg-red-700"
                    >
                        <LogOut className="mr-3" size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow p-6 md:p-8 bg-gray-50 overflow-auto">
                {currentPage === 'dashboard' && (
                    <Dashboard
                        resumes={resumes}
                        editResume={editResume}
                        deleteResume={deleteResume}
                        createNewResume={createNewResume}
                        showMessage={showMessage}
                        setCurrentResume={setCurrentResume}
                        setCurrentPage={setCurrentPage}
                    />
                )}
                {currentPage === 'editor' && currentResume && (
                    <ResumeEditor
                        resume={currentResume}
                        saveResume={saveResume}
                        showMessage={showMessage}
                    />
                )}
                {currentPage === 'score-checker' && (
                    <ResumeScoreChecker
                        resumes={resumes}
                        currentResume={currentResume}
                        showMessage={showMessage}
                    />
                )}
                {currentPage === 'help' && <HelpAndFAQs />}
                {currentPage === 'contact' && <ContactForm showMessage={showMessage} />}
            </main>
        </div>
    );
};

// AuthScreen Component for Login/Signup
const AuthScreen = ({ onLogin, onSignup, showMessage, loading }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            showMessage('Please enter both email and password.', 'error');
            return;
        }

        if (isLogin) {
            await onLogin(email, password);
        } else {
            await onSignup(email, password);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
                {isLogin ? 'Welcome Back!' : 'Join Resume AI'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-1">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        className="form-input"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-1">Password</label>
                    <input
                        type="password"
                        id="password"
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold flex items-center justify-center"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isLogin ? 'Logging In...' : 'Signing Up...'}
                        </>
                    ) : (
                        <>
                            {isLogin ? <LogIn className="mr-2" size={20} /> : <UserPlus className="mr-2" size={20} />}
                            {isLogin ? 'Login' : 'Sign Up'}
                        </>
                    )}
                </button>
            </form>
            <p className="text-center text-gray-600 text-sm mt-6">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-600 hover:underline font-semibold"
                >
                    {isLogin ? 'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
    );
};


// Dashboard Component
const Dashboard = ({ resumes, editResume, deleteResume, createNewResume, showMessage, setCurrentResume, setCurrentPage }) => {
    const handleDownload = (resumeContent, resumeName) => {
        // Simple client-side PDF generation simulation
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>${resumeName}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }
                    .section-title { font-size: 1.2em; font-weight: bold; margin-top: 20px; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
                    .contact-info { text-align: center; margin-bottom: 20px; }
                    .contact-info h1 { font-size: 2em; margin-bottom: 5px; }
                    .contact-info p { margin: 0; font-size: 0.9em; }
                    .item-title { font-weight: bold; margin-top: 10px; }
                    .item-details { display: flex; justify-content: space-between; font-size: 0.9em; }
                    ul { list-style-type: disc; margin-left: 20px; padding-left: 0; }
                    li { margin-bottom: 5px; }
                </style>
            </head>
            <body>
                ${generateResumeHtml(resumeContent)}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        showMessage('Resume download initiated (simulated PDF print).', 'success');
    };

    const generateResumeHtml = (content) => {
        if (!content) return '<p>No resume content to display.</p>';

        const resume = typeof content === 'string' ? JSON.parse(content) : content;

        let html = `
            <div class="contact-info">
                <h1>${resume.contactInfo.name}</h1>
                <p>${resume.contactInfo.email} | ${resume.contactInfo.phone} | ${resume.contactInfo.linkedin}</p>
            </div>
            <p>${resume.summary}</p>
        `;

        resume.sections.forEach(section => {
            html += `<h2 class="section-title">${section.title}</h2>`;
            section.items.forEach(item => {
                if (section.id === 'education') {
                    html += `
                        <div class="item-details">
                            <span class="item-title">${item.degree}, ${item.university}</span>
                            <span>${item.dates}</span>
                        </div>
                        <p>${item.location}</p>
                    `;
                } else if (section.id === 'experience' || section.id === 'projects') {
                    html += `
                        <div class="item-details">
                            <span class="item-title">${item.title} ${item.company ? ` - ${item.company}` : ''}</span>
                            <span>${item.dates || ''}</span>
                        </div>
                        ${item.location ? `<p>${item.location}</p>` : ''}
                        ${item.link ? `<p><a href="${item.link}" target="_blank">${item.link}</a></p>` : ''}
                        <ul>
                            ${item.description.map(desc => `<li>${desc}</li>`).join('')}
                        </ul>
                    `;
                } else if (section.id === 'skills') {
                    html += `
                        <p><span class="item-title">${item.category}:</span> ${item.list.join(', ')}</p>
                    `;
                } else if (section.id === 'achievements' || section.id === 'extracurriculars') {
                    html += `
                        <ul>
                            <li>${item.description}</li>
                        </ul>
                    `;
                }
            });
        });
        return html;
    };


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Resumes</h1>
            <button
                onClick={createNewResume}
                className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
                <PlusCircle className="mr-2" size={20} /> Create New Resume
            </button>

            {resumes.length === 0 ? (
                <p className="text-gray-600">You haven't created any resumes yet. Click "Create New Resume" to get started!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resumes.map((resume) => (
                        <div key={resume.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">{resume.name || 'Untitled Resume'}</h2>
                            <p className="text-sm text-gray-500 mb-4">Last updated: {new Date(resume.updatedAt).toLocaleDateString()}</p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => editResume(resume)}
                                    className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-200 text-sm"
                                >
                                    <Edit className="mr-2" size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDownload(resume.content, resume.name)}
                                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 text-sm"
                                >
                                    <Download className="mr-2" size={16} /> Download
                                </button>
                                <button
                                    onClick={() => deleteResume(resume.id)}
                                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-sm"
                                >
                                    <Trash2 className="mr-2" size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
             <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Need to check your resume score?</h3>
                <p className="text-blue-700 mb-4">Select a resume from the list above, or create a new one, then navigate to the "Resume Score" section to optimize it for a specific job description!</p>
                <button
                    onClick={() => {
                        if (resumes.length > 0) {
                            setCurrentResume({ ...resumes[0], content: JSON.parse(resumes[0].content) }); // Set first resume as current for scoring
                        } else {
                            showMessage('Please create a resume first before checking score.', 'error');
                        }
                        setCurrentPage('score-checker');
                    }}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                >
                    Go to Resume Score Checker
                </button>
            </div>
        </div>
    );
};

// Resume Editor Component
const ResumeEditor = ({ resume, saveResume, showMessage }) => {
    const [resumeData, setResumeData] = useState(JSON.parse(JSON.stringify(resume.content))); // Deep copy
    const [resumeName, setResumeName] = useState(resume.name || 'Untitled Resume');
    const [loadingAI, setLoadingAI] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState({}); // {sectionId: string}

    useEffect(() => {
        setResumeData(JSON.parse(JSON.stringify(resume.content)));
        setResumeName(resume.name || 'Untitled Resume');
    }, [resume]);

    const handleChangeContactInfo = (e) => {
        const { name, value } = e.target;
        setResumeData(prev => ({
            ...prev,
            contactInfo: { ...prev.contactInfo, [name]: value }
        }));
    };

    const handleChangeSummary = (e) => {
        setResumeData(prev => ({ ...prev, summary: e.target.value }));
    };

    const handleSectionItemChange = (sectionIndex, itemIndex, field, value) => {
        const newSections = [...resumeData.sections];
        if (field === 'description' || field === 'list') { // Handle bullet points/skills list
            const newArray = [...newSections[sectionIndex].items[itemIndex][field]];
            newArray[newArray.length - 1] = value; // Update the last item if it's the current one being typed
            newSections[sectionIndex].items[itemIndex][field] = newArray;
        } else {
            newSections[sectionIndex].items[itemIndex][field] = value;
        }
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    const addSectionItem = (sectionIndex, fieldName) => {
        const newSections = [...resumeData.sections];
        const newItems = [...newSections[sectionIndex].items];
        let newItem = {};
        if (newSections[sectionIndex].id === 'education') newItem = { degree: '', university: '', location: '', dates: '' };
        else if (newSections[sectionIndex].id === 'experience') newItem = { title: '', company: '', location: '', dates: '', description: [''] };
        else if (newSections[sectionIndex].id === 'projects') newItem = { title: '', description: [''], link: '' };
        else if (newSections[sectionIndex].id === 'skills') newItem = { category: '', list: [''] };
        else if (newSections[sectionIndex].id === 'achievements' || newSections[sectionIndex].id === 'extracurriculars') newItem = { description: '' };

        newItems.push(newItem);
        newSections[sectionIndex].items = newItems;
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    const removeSectionItem = (sectionIndex, itemIndex) => {
        const newSections = [...resumeData.sections];
        newSections[sectionIndex].items.splice(itemIndex, 1);
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    const addBulletPoint = (sectionIndex, itemIndex) => {
        const newSections = [...resumeData.sections];
        newSections[sectionIndex].items[itemIndex].description.push('');
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    const removeBulletPoint = (sectionIndex, itemIndex, bulletIndex) => {
        const newSections = [...resumeData.sections];
        newSections[sectionIndex].items[itemIndex].description.splice(bulletIndex, 1);
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    const handleBulletPointChange = (sectionIndex, itemIndex, bulletIndex, value) => {
        const newSections = [...resumeData.sections];
        newSections[sectionIndex].items[itemIndex].description[bulletIndex] = value;
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    const addSkillItem = (sectionIndex, itemIndex) => {
        const newSections = [...resumeData.sections];
        newSections[sectionIndex].items[itemIndex].list.push('');
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    const removeSkillItem = (sectionIndex, itemIndex, skillIndex) => {
        const newSections = [...resumeData.sections];
        newSections[sectionIndex].items[itemIndex].list.splice(skillIndex, 1);
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    const handleSkillItemChange = (sectionIndex, itemIndex, skillIndex, value) => {
        const newSections = [...resumeData.sections];
        newSections[sectionIndex].items[itemIndex].list[skillIndex] = value;
        setResumeData(prev => ({ ...prev, sections: newSections }));
    };

    // Drag and drop for sections
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleSort = () => {
        let _resumeData = { ...resumeData };
        let _sections = [..._resumeData.sections];

        // remove and save the dragged item
        const draggedItemContent = _sections.splice(dragItem.current, 1)[0];
        // switch the position
        _sections.splice(dragOverItem.current, 0, draggedItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        setResumeData(prev => ({ ...prev, sections: _sections }));
    };

    // AI Suggestions
    const getAISuggestions = async (sectionId, currentContent, type = 'summary') => {
        setLoadingAI(true);
        setAiSuggestions(prev => ({ ...prev, [sectionId]: 'Generating suggestions...' }));
        try {
            let prompt = '';
            let responseSchema = {};

            if (type === 'summary') {
                prompt = `Generate a concise, impactful, and ATS-friendly professional summary for a student's resume, based on the following existing summary (if any): "${currentContent}". Focus on key skills, career aspirations, and relevant experiences. Keep it under 50 words.`;
                responseSchema = { type: "STRING" };
            } else if (type === 'bulletPoints') {
                prompt = `Generate 3-5 strong, quantifiable, and action-oriented bullet points for a resume section. The section is about "${sectionId}" and the existing points are: "${currentContent.join(', ')}". Focus on achievements, impact, and relevant skills.`;
                responseSchema = {
                    type: "ARRAY",
                    items: { type: "STRING" }
                };
            } else if (type === 'skills') {
                prompt = `Suggest 5-7 relevant hard and soft skills for a student's resume, based on the following existing skills: "${currentContent.map(s => s.list.join(', ')).join(', ')}". Consider common skills for entry-level roles and internships. Provide them as a comma-separated list.`;
                responseSchema = {
                    type: "ARRAY",
                    items: { type: "STRING" }
                };
            }

            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            };

            const apiKey = ""; // Canvas will provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                const parsedResult = JSON.parse(text);

                if (type === 'summary') {
                    setResumeData(prev => ({ ...prev, summary: parsedResult }));
                    setAiSuggestions(prev => ({ ...prev, [sectionId]: 'Summary updated!' }));
                } else if (type === 'bulletPoints') {
                    const sectionIdx = resumeData.sections.findIndex(s => s.id === sectionId);
                    if (sectionIdx !== -1 && resumeData.sections[sectionIdx].items.length > 0) {
                        const newSections = [...resumeData.sections];
                        newSections[sectionIdx].items[0].description = parsedResult; // Apply to first item for simplicity
                        setResumeData(prev => ({ ...prev, sections: newSections }));
                        setAiSuggestions(prev => ({ ...prev, [sectionId]: 'Bullet points updated!' }));
                    }
                } else if (type === 'skills') {
                    const sectionIdx = resumeData.sections.findIndex(s => s.id === sectionId);
                    if (sectionIdx !== -1) {
                        const newSections = [...resumeData.sections];
                        newSections[sectionIdx].items = [{ category: 'Suggested Skills', list: parsedResult }];
                        setResumeData(prev => ({ ...prev, sections: newSections }));
                        setAiSuggestions(prev => ({ ...prev, [sectionId]: 'Skills updated!' }));
                    }
                }
                showMessage('AI suggestions applied!', 'success');
            } else {
                setAiSuggestions(prev => ({ ...prev, [sectionId]: 'No suggestions found.' }));
                showMessage('Failed to get AI suggestions.', 'error');
            }
        } catch (error) {
            console.error("Error fetching AI suggestions:", error);
            setAiSuggestions(prev => ({ ...prev, [sectionId]: `Error: ${error.message}` }));
            showMessage(`Error getting AI suggestions: ${error.message}`, 'error');
        } finally {
            setLoadingAI(false);
            setTimeout(() => setAiSuggestions(prev => ({ ...prev, [sectionId]: '' })), 3000); // Clear message
        }
    };

    // Live Preview Component
    const LivePreview = ({ resumeContent }) => {
        if (!resumeContent) return <p className="text-gray-500">Start editing your resume to see a live preview here!</p>;

        const resume = JSON.parse(JSON.stringify(resumeContent)); // Deep copy to avoid direct mutation

        return (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-gray-800 text-sm leading-relaxed">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold mb-1">{resume.contactInfo.name || 'Your Name'}</h1>
                    <p className="text-gray-600">
                        {resume.contactInfo.email} | {resume.contactInfo.phone} | {resume.contactInfo.linkedin}
                    </p>
                </div>

                {resume.summary && (
                    <div className="mb-6">
                        <p className="text-justify">{resume.summary}</p>
                    </div>
                )}

                {resume.sections.map((section, sectionIdx) => (
                    <div key={section.id} className="mb-6">
                        <h2 className="text-lg font-bold uppercase border-b-2 border-gray-300 pb-1 mb-3">{section.title}</h2>
                        {section.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="mb-4 last:mb-0">
                                {section.id === 'education' && (
                                    <>
                                        <div className="flex justify-between items-baseline">
                                            <p className="font-semibold">{item.degree} {item.university ? `at ${item.university}` : ''}</p>
                                            <p className="text-gray-600">{item.dates}</p>
                                        </div>
                                        <p className="text-gray-600">{item.location}</p>
                                    </>
                                )}
                                {section.id === 'experience' && (
                                    <>
                                        <div className="flex justify-between items-baseline">
                                            <p className="font-semibold">{item.title} {item.company ? `at ${item.company}` : ''}</p>
                                            <p className="text-gray-600">{item.dates}</p>
                                        </div>
                                        <p className="text-gray-600 mb-1">{item.location}</p>
                                        <ul className="list-disc ml-5 space-y-1">
                                            {item.description.filter(Boolean).map((bullet, bulletIdx) => (
                                                <li key={bulletIdx}>{bullet}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                                {section.id === 'projects' && (
                                    <>
                                        <p className="font-semibold">{item.title}</p>
                                        {item.link && <p className="text-blue-600 hover:underline"><a href={item.link} target="_blank" rel="noopener noreferrer">{item.link}</a></p>}
                                        <ul className="list-disc ml-5 space-y-1">
                                            {item.description.filter(Boolean).map((bullet, bulletIdx) => (
                                                <li key={bulletIdx}>{bullet}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                                {section.id === 'skills' && (
                                    <p><span className="font-semibold">{item.category}:</span> {item.list.filter(Boolean).join(', ')}</p>
                                )}
                                {(section.id === 'achievements' || section.id === 'extracurriculars') && (
                                    <ul className="list-disc ml-5 space-y-1">
                                        {item.description && <li>{item.description}</li>}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Resume: <input
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                onBlur={() => saveResume({ ...resumeData, name: resumeName })} // Save name on blur
                className="inline-block px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            /></h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Resume Editor Form */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Content Editor</h2>

                    {/* Contact Info */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-1">Name</label>
                                <input type="text" name="name" value={resumeData.contactInfo.name} onChange={handleChangeContactInfo} className="form-input" />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
                                <input type="email" name="email" value={resumeData.contactInfo.email} onChange={handleChangeContactInfo} className="form-input" />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-1">Phone</label>
                                <input type="tel" name="phone" value={resumeData.contactInfo.phone} onChange={handleChangeContactInfo} className="form-input" />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-1">LinkedIn URL</label>
                                <input type="url" name="linkedin" value={item.linkedin} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'linkedin', e.target.value)} className="form-input" />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <h3 className="text-xl font-semibold mb-3">Summary/Objective</h3>
                        <textarea
                            value={resumeData.summary}
                            onChange={handleChangeSummary}
                            className="form-textarea h-24"
                            placeholder="A concise, impactful summary of your skills and goals."
                        ></textarea>
                        <button
                            onClick={() => getAISuggestions('summary', resumeData.summary, 'summary')}
                            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center text-sm"
                            disabled={loadingAI}
                        >
                            <Sparkles className="mr-2" size={16} /> {loadingAI && aiSuggestions['summary'] ? aiSuggestions['summary'] : 'AI Suggest Summary'}
                        </button>
                    </div>

                    {/* Dynamic Sections */}
                    {resumeData.sections.map((section, sectionIndex) => (
                        <div
                            key={section.id}
                            className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50"
                            draggable
                            onDragStart={(e) => dragItem.current = sectionIndex}
                            onDragEnter={(e) => dragOverItem.current = sectionIndex}
                            onDragEnd={handleSort}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xl font-semibold capitalize">{section.title}</h3>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            if (sectionIndex > 0) {
                                                const newSections = [...resumeData.sections];
                                                const [movedItem] = newSections.splice(sectionIndex, 1);
                                                newSections.splice(sectionIndex - 1, 0, movedItem);
                                                setResumeData(prev => ({ ...prev, sections: newSections }));
                                            }
                                        }}
                                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                                        title="Move Up"
                                    >
                                        <ChevronUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (sectionIndex < resumeData.sections.length - 1) {
                                                const newSections = [...resumeData.sections];
                                                const [movedItem] = newSections.splice(sectionIndex, 1);
                                                newSections.splice(sectionIndex + 1, 0, movedItem);
                                                setResumeData(prev => ({ ...prev, sections: newSections }));
                                            }
                                        }}
                                        className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                                        title="Move Down"
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            </div>

                            {section.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="mb-4 p-3 border border-gray-100 rounded-md bg-white relative">
                                    {section.id !== 'skills' && ( // Skills section doesn't need "Remove Item" button at this level
                                        <button
                                            onClick={() => removeSectionItem(sectionIndex, itemIndex)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                            title="Remove Item"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    )}

                                    {section.id === 'education' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 text-xs font-bold mb-1">Degree</label>
                                                <input type="text" value={item.degree} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'degree', e.target.value)} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-xs font-bold mb-1">University</label>
                                                <input type="text" value={item.university} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'university', e.target.value)} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-xs font-bold mb-1">Location</label>
                                                <input type="text" value={item.location} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'location', e.target.value)} className="form-input" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-xs font-bold mb-1">Dates (e.g., 2018 - 2022)</label>
                                                <input type="text" value={item.dates} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'dates', e.target.value)} className="form-input" />
                                            </div>
                                        </div>
                                    )}

                                    {(section.id === 'experience' || section.id === 'projects') && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-bold mb-1">Title</label>
                                                    <input type="text" value={item.title} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'title', e.target.value)} className="form-input" />
                                                </div>
                                                {section.id === 'experience' && (
                                                    <div>
                                                        <label className="block text-gray-700 text-xs font-bold mb-1">Company</label>
                                                        <input type="text" value={item.company} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'company', e.target.value)} className="form-input" />
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-bold mb-1">Location</label>
                                                    <input type="text" value={item.location} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'location', e.target.value)} className="form-input" />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-xs font-bold mb-1">Dates (e.g., May 2021 - Aug 2022)</label>
                                                    <input type="text" value={item.dates} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'dates', e.target.value)} className="form-input" />
                                                </div>
                                                {section.id === 'projects' && (
                                                    <div className="col-span-2">
                                                        <label className="block text-gray-700 text-xs font-bold mb-1">Project Link</label>
                                                        <input type="url" value={item.link} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'link', e.target.value)} className="form-input" />
                                                    </div>
                                                )}
                                            </div>
                                            <label className="block text-gray-700 text-xs font-bold mb-1">Description (Bullet Points)</label>
                                            {item.description.map((bullet, bulletIndex) => (
                                                <div key={bulletIndex} className="flex items-center mb-2">
                                                    <input
                                                        type="text"
                                                        value={bullet}
                                                        onChange={(e) => handleBulletPointChange(sectionIndex, itemIndex, bulletIndex, e.target.value)}
                                                        className="form-input flex-grow mr-2"
                                                    />
                                                    <button
                                                        onClick={() => removeBulletPoint(sectionIndex, itemIndex, bulletIndex)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Remove Bullet"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addBulletPoint(sectionIndex, itemIndex)}
                                                className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 text-sm"
                                            >
                                                Add Bullet Point
                                            </button>
                                            <button
                                                onClick={() => getAISuggestions(section.id, item.description, 'bulletPoints')}
                                                className="mt-2 ml-2 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center text-sm"
                                                disabled={loadingAI}
                                            >
                                                <Sparkles className="mr-2" size={16} /> {loadingAI && aiSuggestions[section.id] ? aiSuggestions[section.id] : 'AI Suggest Bullet Points'}
                                            </button>
                                        </>
                                    )}

                                    {section.id === 'skills' && (
                                        <>
                                            <div className="mb-3">
                                                <label className="block text-gray-700 text-xs font-bold mb-1">Skill Category (e.g., Programming Languages)</label>
                                                <input type="text" value={item.category} onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'category', e.target.value)} className="form-input" />
                                            </div>
                                            <label className="block text-gray-700 text-xs font-bold mb-1">Skills (Comma separated)</label>
                                            {item.list.map((skill, skillIndex) => (
                                                <div key={skillIndex} className="flex items-center mb-2">
                                                    <input
                                                        type="text"
                                                        value={skill}
                                                        onChange={(e) => handleSkillItemChange(sectionIndex, itemIndex, skillIndex, e.target.value)}
                                                        className="form-input flex-grow mr-2"
                                                    />
                                                    <button
                                                        onClick={() => removeSkillItem(sectionIndex, itemIndex, skillIndex)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Remove Skill"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addSkillItem(sectionIndex, itemIndex)}
                                                className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 text-sm"
                                            >
                                                Add Skill
                                            </button>
                                            <button
                                                onClick={() => getAISuggestions(section.id, resumeData.sections[sectionIndex].items, 'skills')}
                                                className="mt-2 ml-2 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center text-sm"
                                                disabled={loadingAI}
                                            >
                                                <Sparkles className="mr-2" size={16} /> {loadingAI && aiSuggestions[section.id] ? aiSuggestions[section.id] : 'AI Suggest Skills'}
                                            </button>
                                        </>
                                    )}

                                    {(section.id === 'achievements' || section.id === 'extracurriculars') && (
                                        <div>
                                            <label className="block text-gray-700 text-xs font-bold mb-1">Description</label>
                                            <textarea
                                                value={item.description}
                                                onChange={(e) => handleSectionItemChange(sectionIndex, itemIndex, 'description', e.target.value)}
                                                className="form-textarea h-16"
                                                placeholder="Describe your achievement or extracurricular activity."
                                            ></textarea>
                                            <button
                                                onClick={() => getAISuggestions(section.id, [item.description], 'bulletPoints')} // Use bulletPoints type for generic text
                                                className="mt-2 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center text-sm"
                                                disabled={loadingAI}
                                            >
                                                <Sparkles className="mr-2" size={16} /> {loadingAI && aiSuggestions[section.id] ? aiSuggestions[section.id] : 'AI Suggest Text'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => addSectionItem(sectionIndex)}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm"
                            >
                                Add New {section.title.slice(0, -1)}
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={() => saveResume({ ...resumeData, name: resumeName })}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 text-lg font-semibold mt-6"
                    >
                        Save Resume
                    </button>
                </div>

                {/* Live Preview */}
                <div className="lg:sticky lg:top-8 self-start">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Live Preview (ATS Friendly)</h2>
                    <LivePreview resumeContent={resumeData} />
                </div>
            </div>
        </div>
    );
};

// Resume Score Checker Component
const ResumeScoreChecker = ({ resumes, currentResume, showMessage }) => {
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [scoreResult, setScoreResult] = useState(null); // { score: number, feedback: string, missingSkills: [], missingKeywords: [], sectionFeedback: [] }
    const [loadingScore, setLoadingScore] = useState(false);

    useEffect(() => {
        if (currentResume) {
            setSelectedResumeId(currentResume.id);
        } else if (resumes.length > 0) {
            setSelectedResumeId(resumes[0].id);
        }
    }, [currentResume, resumes]);

    const handleCheckScore = async () => {
        if (!selectedResumeId || !jobDescription.trim()) {
            showMessage('Please select a resume and paste a job description.', 'error');
            return;
        }

        setLoadingScore(true);
        setScoreResult(null);

        try {
            const selectedResume = resumes.find(r => r.id === selectedResumeId);
            if (!selectedResume) {
                showMessage('Selected resume not found.', 'error');
                setLoadingScore(false);
                return;
            }

            const resumeContent = JSON.parse(selectedResume.content);
            const resumeText = formatResumeForAI(resumeContent);

            const prompt = `Analyze the following resume and job description to provide an ATS compatibility score (0-100), identify missing hard/soft skills, missing keywords, and offer section-level feedback (formatting, structure, content improvement).

Resume:
${resumeText}

Job Description:
${jobDescription}

Provide the output in JSON format, adhering to the following schema:
{
  "score": number,
  "overallFeedback": string,
  "missingSkills": string[],
  "missingKeywords": string[],
  "sectionFeedback": [
    {
      "sectionName": string,
      "feedback": string
    }
  ]
}`;

            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            score: { type: "NUMBER" },
                            overallFeedback: { type: "STRING" },
                            missingSkills: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            missingKeywords: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            },
                            sectionFeedback: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        sectionName: { type: "STRING" },
                                        feedback: { type: "STRING" }
                                    }
                                }
                            }
                        },
                        required: ["score", "overallFeedback", "missingSkills", "missingKeywords", "sectionFeedback"]
                    }
                }
            };

            const apiKey = ""; // Canvas will provide this
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                const parsedResult = JSON.parse(text);
                setScoreResult(parsedResult);
                showMessage('Resume score generated!', 'success');
            } else {
                showMessage('Failed to get resume score. Please try again.', 'error');
            }
        } catch (error) {
            console.error("Error checking resume score:", error);
            showMessage(`Error checking score: ${error.message}`, 'error');
        } finally {
            setLoadingScore(false);
        }
    };

    // Helper to format resume content into plain text for AI
    const formatResumeForAI = (resume) => {
        let text = `Name: ${resume.contactInfo.name}\n`;
        text += `Email: ${resume.contactInfo.email}\n`;
        text += `Phone: ${resume.contactInfo.phone}\n`;
        text += `LinkedIn: ${resume.contactInfo.linkedin}\n\n`;
        text += `Summary: ${resume.summary}\n\n`;

        resume.sections.forEach(section => {
            text += `${section.title.toUpperCase()}:\n`;
            section.items.forEach(item => {
                if (section.id === 'education') {
                    text += `- ${item.degree}, ${item.university}, ${item.location}, ${item.dates}\n`;
                } else if (section.id === 'experience' || section.id === 'projects') {
                    text += `- ${item.title}`;
                    if (item.company) text += ` at ${item.company}`;
                    if (item.location) text += `, ${item.location}`;
                    if (item.dates) text += `, ${item.dates}`;
                    if (item.link) text += `, Link: ${item.link}`;
                    text += `\n`;
                    item.description.forEach(desc => text += `  - ${desc}\n`);
                } else if (section.id === 'skills') {
                    text += `- ${item.category}: ${item.list.join(', ')}\n`;
                } else if (section.id === 'achievements' || section.id === 'extracurriculars') {
                    text += `- ${item.description}\n`;
                }
            });
            text += '\n';
        });
        return text;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Resume Score Checker</h1>
            <p className="text-gray-600 mb-6">
                Get an instant score and detailed feedback on how well your resume matches a target job description.
            </p>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
                <div className="mb-4">
                    <label htmlFor="resume-select" className="block text-gray-700 text-sm font-bold mb-2">
                        Select Your Resume:
                    </label>
                    <select
                        id="resume-select"
                        className="form-select w-full"
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                    >
                        <option value="">-- Select a Resume --</option>
                        {resumes.map(resume => (
                            <option key={resume.id} value={resume.id}>{resume.name || `Resume ${resume.id.substring(0, 6)}`}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="job-description" className="block text-gray-700 text-sm font-bold mb-2">
                        Paste Job Description:
                    </label>
                    <textarea
                        id="job-description"
                        className="form-textarea h-48"
                        placeholder="Paste the full job description here (skills, responsibilities, requirements, etc.)"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    ></textarea>
                </div>

                <button
                    onClick={handleCheckScore}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold flex items-center justify-center"
                    disabled={loadingScore || !selectedResumeId || !jobDescription.trim()}
                >
                    {loadingScore ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2" size={20} /> Get Resume Score
                        </>
                    )}
                </button>
            </div>

            {scoreResult && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Resume Score Report</h2>
                    <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-xl font-semibold text-blue-800">Match Score:</p>
                        <p className="text-4xl font-extrabold text-blue-600">{scoreResult.score}%</p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">Overall Feedback:</h3>
                        <p className="text-gray-700">{scoreResult.overallFeedback}</p>
                    </div>

                    {scoreResult.missingSkills && scoreResult.missingSkills.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Missing Key Skills:</h3>
                            <ul className="list-disc list-inside text-red-700">
                                {scoreResult.missingSkills.map((skill, index) => (
                                    <li key={index}>{skill}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {scoreResult.missingKeywords && scoreResult.missingKeywords.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Missing Keywords:</h3>
                            <ul className="list-disc list-inside text-red-700">
                                {scoreResult.missingKeywords.map((keyword, index) => (
                                    <li key={index}>{keyword}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {scoreResult.sectionFeedback && scoreResult.sectionFeedback.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">Section-Level Feedback:</h3>
                            <div className="space-y-4">
                                {scoreResult.sectionFeedback.map((feedback, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                        <p className="font-semibold text-gray-800 mb-1">{feedback.sectionName}:</p>
                                        <p className="text-gray-700">{feedback.feedback}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Help and FAQs Component
const HelpAndFAQs = () => {
    const faqs = [
        {
            q: "What is an ATS-friendly resume?",
            a: "ATS (Applicant Tracking System) friendly resumes are formatted and structured in a way that makes them easy for automated software to read and parse. This typically means simple layouts, standard headings, and plain text without complex graphics or tables."
        },
        {
            q: "How does the AI suggestions work?",
            a: "Our AI uses advanced language models to analyze your resume content and suggest improvements for summaries, bullet points, and skills, helping you craft more impactful and relevant descriptions."
        },
        {
            q: "How accurate is the Resume Score Checker?",
            a: "The Resume Score Checker uses AI to compare your resume against a job description, identifying keyword and skill matches. While highly effective, it's a tool to guide your optimization, not a guarantee of success. Always review suggestions critically."
        },
        {
            q: "Can I download my resume in different formats?",
            a: "Currently, the application supports a simulated PDF download. We aim to add more export options in future updates."
        },
        {
            q: "Is my data private and secure?",
            a: "Yes, your resume data is stored securely in your private Firestore collection, accessible only by you. We prioritize data privacy and offer options to anonymize data if needed."
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Help & FAQs</h1>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{faq.q}</h3>
                            <p className="text-gray-700">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Contact Form Component
const ContactForm = ({ showMessage }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real application, this would send data to a backend API
        console.log('Contact form submitted:', formData);
        showMessage('Your message has been sent! (This is a simulation)', 'success');
        setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Contact Us</h1>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="text-gray-700 mb-6">
                    Have questions or need assistance? Fill out the form below and we'll get back to you as soon as possible.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-1">Name</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-1">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-1">Subject</label>
                        <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} className="form-input" required />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-1">Message</label>
                        <textarea id="message" name="message" value={formData.message} onChange={handleChange} className="form-textarea h-32" required></textarea>
                    </div>
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold"
                    >
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    );
};

export default App;

