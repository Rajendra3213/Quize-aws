'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import toast, { Toaster } from 'react-hot-toast'

const API_BASE = 'http://localhost:8000'
const QUIZ_TIME = 70 * 60 * 1000 // 70 minutes in milliseconds

interface QuestionState {
  answered: boolean
  marked: boolean
  selectedAnswer: string
}

export default function Home() {
  const [mode, setMode] = useState<'home' | 'admin' | 'join' | 'quiz' | 'admin-dashboard' | 'add-question' | 'view-results' | 'create-channel' | 'manage-channels' | 'view-questions' | 'manage-users'>('home')
  const [username, setUsername] = useState('')
  const [channelCode, setChannelCode] = useState('')
  const [currentChannel, setCurrentChannel] = useState('')
  const [channelName, setChannelName] = useState('')
  const [createdChannelCode, setCreatedChannelCode] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([])
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizStartTime, setQuizStartTime] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [channels, setChannels] = useState<any[]>([])
  const [allQuestions, setAllQuestions] = useState<any[]>([])
  const [adminPassword, setAdminPassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{type: string, id: number, name: string} | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A'
  })
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [newUser, setNewUser] = useState({username: '', password: ''})
  const [passwordUpdate, setPasswordUpdate] = useState({current_password: '', new_password: ''})
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // Auto-load channels when entering create-channel mode
  useEffect(() => {
    if (mode === 'create-channel') {
      loadChannelsForCreate()
    }
  }, [mode])
  
  // Clear success message when leaving create-channel mode
  useEffect(() => {
    if (mode !== 'create-channel') {
      setCreatedChannelCode('')
    }
  }, [mode])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const submitAllAnswers = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    if (selectedAnswer) {
      const newStates = [...questionStates]
      newStates[currentQuestion] = { answered: true, marked: newStates[currentQuestion]?.marked || false, selectedAnswer }
      setQuestionStates(newStates)
    }
    
    for (let i = 0; i < questions.length; i++) {
      const state = questionStates[i] || (i === currentQuestion && selectedAnswer ? { selectedAnswer } : null)
      if (state?.selectedAnswer) {
        try {
          await axios.post(`${API_BASE}/submit-answer/?username=${username}&channel_code=${channelCode}`, {
            question_id: questions[i].id,
            selected_answer: state.selectedAnswer
          })
        } catch (error) {
          console.error('Error submitting answer:', error)
        }
      }
    }
    // Mark quiz as submitted
    try {
      await axios.post(`${API_BASE}/submit-quiz/?username=${username}&channel_code=${channelCode}`)
    } catch (error) {
      console.error('Error marking quiz as submitted:', error)
    }
    
    // Reset all states
    setQuizStarted(false)
    setQuizStartTime(null)
    setIsSubmitting(false)
    setQuestions([])
    setQuestionStates([])
    setCurrentQuestion(0)
    setSelectedAnswer('')
    setTimeLeft(QUIZ_TIME)
    
    setMode('home')
    toast.success('Quiz submitted successfully! You cannot retake this quiz.')
  }, [questionStates, selectedAnswer, currentQuestion, questions, username, channelCode, isSubmitting])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (quizStarted && !isSubmitting) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const remaining = Math.max(0, prev - 1000)
          if (remaining <= 0) {
            clearInterval(timer)
            submitAllAnswers()
          }
          return remaining
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [quizStarted, isSubmitting, submitAllAnswers])

  const joinChannel = async () => {
    try {
      const response = await axios.post(`${API_BASE}/join-channel/`, { code: channelCode, username })
      setCurrentChannel(response.data.channel)
      loadQuestions()
      setMode('quiz')
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('You have already completed this quiz and cannot retake it.')
      } else if (error.response?.status === 404) {
        toast.error('Invalid channel code. Please check and try again.')
      } else {
        toast.error('Failed to join channel. Please try again.')
      }
    }
  }

  const createChannel = async () => {
    try {
      const response = await axios.post(`${API_BASE}/channels/?admin_username=${username}`, { name: channelName })
      setCreatedChannelCode(response.data.code)
      toast.success(`Channel created! Code: ${response.data.code}`)
      setChannelName('')
      loadChannelsForCreate()
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Channel name already exists. Please choose a different name.')
      } else if (error.response?.status === 400) {
        toast.error('Invalid channel name. Please use only letters, numbers, and spaces.')
      } else {
        toast.error('Failed to create channel. Please try again.')
      }
    }
  }

  const loadChannelsForCreate = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/channels`)
      setChannels(response.data)
    } catch (error) {
      console.error('Error loading channels')
    }
  }

  const startQuiz = () => {
    const expiryTime = Date.now() + QUIZ_TIME
    setTimeLeft(QUIZ_TIME)
    setQuizStartTime(new Date().toISOString())
    setQuizStarted(true)
  }

  const loadQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/questions/random/70`)
      setQuestions(response.data)
      setQuestionStates(response.data.map(() => ({ answered: false, marked: false, selectedAnswer: '' })))
    } catch (error) {
      console.error('Error loading questions:', error)
    }
  }

  const navigateToQuestion = (index: number) => {
    setCurrentQuestion(index)
    setSelectedAnswer(questionStates[index]?.selectedAnswer || '')
  }

  const markQuestion = () => {
    const newStates = [...questionStates]
    newStates[currentQuestion] = { ...newStates[currentQuestion], marked: !newStates[currentQuestion].marked }
    setQuestionStates(newStates)
  }

  const saveAndNext = () => {
    if (selectedAnswer) {
      const newStates = [...questionStates]
      newStates[currentQuestion] = { answered: true, marked: newStates[currentQuestion].marked, selectedAnswer }
      setQuestionStates(newStates)
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(questionStates[currentQuestion + 1]?.selectedAnswer || '')
    }
  }

  const saveAndPrevious = () => {
    if (selectedAnswer) {
      const newStates = [...questionStates]
      newStates[currentQuestion] = { answered: true, marked: newStates[currentQuestion].marked, selectedAnswer }
      setQuestionStates(newStates)
    }
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(questionStates[currentQuestion - 1]?.selectedAnswer || '')
    }
  }

  const submitQuiz = () => {
    setShowSubmitDialog(true)
  }

  const handleConfirmSubmit = async () => {
    if (confirmText === 'SUBMIT') {
      setShowSubmitDialog(false)
      await submitAllAnswers()
    }
  }

  const handleCancelSubmit = () => {
    setShowSubmitDialog(false)
    setConfirmText('')
  }

  const getQuestionStats = () => {
    const answered = questionStates.filter(q => q.answered).length
    const marked = questionStates.filter(q => q.marked).length
    const unanswered = questions.length - answered
    return { answered, marked, unanswered }
  }

  const adminLogin = async () => {
    try {
      await axios.post(`${API_BASE}/admin/login`, { username, password: adminPassword })
      setMode('admin-dashboard')
      toast.success('Welcome to admin dashboard!')
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Invalid username or password. Please try again.')
      } else {
        toast.error('Login failed. Please check your connection and try again.')
      }
    }
  }

  const addQuestion = async () => {
    try {
      await axios.post(`${API_BASE}/admin/questions`, newQuestion)
      toast.success('Question added successfully!')
      setNewQuestion({ text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'A' })
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('This question already exists. Please create a unique question.')
      } else if (error.response?.status === 400) {
        toast.error('Invalid question format. Please check all fields.')
      } else {
        toast.error('Failed to add question. Please try again.')
      }
    }
  }

  const loadResults = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/results`)
      setResults(response.data)
      setMode('view-results')
    } catch (error: any) {
      toast.error('Failed to load results. Please try again.')
    }
  }

  const clearResults = async () => {
    setDeleteConfirm({type: 'results', id: 0, name: 'all quiz results'})
  }

  const loadChannels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/channels`)
      setChannels(response.data)
      setMode('manage-channels')
    } catch (error: any) {
      toast.error('Failed to load channels. Please try again.')
    }
  }

  const deleteChannel = async (channelId: number, channelName: string) => {
    setDeleteConfirm({type: 'channel', id: channelId, name: channelName})
  }

  const editQuestion = (question: any) => {
    setEditingQuestion({...question})
    setShowEditDialog(true)
  }

  const updateQuestion = async () => {
    try {
      await axios.put(`${API_BASE}/admin/questions/${editingQuestion.id}`, editingQuestion)
      toast.success('Question updated successfully!')
      setShowEditDialog(false)
      setEditingQuestion(null)
      await loadAllQuestions()
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('This question text already exists. Please use unique text.')
      } else if (error.response?.status === 404) {
        toast.error('Question not found. It may have been deleted.')
      } else {
        toast.error('Failed to update question. Please try again.')
      }
    }
  }

  const deleteQuestion = async (questionId: number, questionText: string) => {
    setDeleteConfirm({type: 'question', id: questionId, name: questionText.substring(0, 50) + '...'})
  }

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/users`)
      setUsers(response.data)
      setMode('manage-users')
    } catch (error: any) {
      toast.error('Failed to load users. Please try again.')
    }
  }

  const createUser = async () => {
    try {
      await axios.post(`${API_BASE}/admin/users`, newUser)
      toast.success('Admin user created successfully!')
      setNewUser({username: '', password: ''})
      await loadUsers()
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Username already exists. Please choose a different username.')
      } else {
        toast.error('Failed to create user. Please try again.')
      }
    }
  }

  const updatePassword = async () => {
    try {
      await axios.put(`${API_BASE}/admin/users/${username}/password`, passwordUpdate)
      toast.success('Password updated successfully!')
      setPasswordUpdate({current_password: '', new_password: ''})
      setShowPasswordDialog(false)
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Current password is incorrect.')
      } else {
        toast.error('Failed to update password. Please try again.')
      }
    }
  }

  const deleteUser = async (userId: number, userName: string) => {
    setDeleteConfirm({type: 'user', id: userId, name: userName})
  }

  const confirmDelete = async () => {
    if (deleteConfirmText === 'DELETE' && deleteConfirm) {
      try {
        if (deleteConfirm.type === 'channel') {
          await axios.delete(`${API_BASE}/admin/channels/${deleteConfirm.id}`)
          toast.success('Channel deleted successfully!')
          await loadChannels()
        } else if (deleteConfirm.type === 'results') {
          await axios.delete(`${API_BASE}/admin/results`)
          toast.success('All results cleared successfully!')
          setResults([])
          setMode('admin-dashboard')
        } else if (deleteConfirm.type === 'question') {
          await axios.delete(`${API_BASE}/admin/questions/${deleteConfirm.id}`)
          toast.success('Question deleted successfully!')
          await loadAllQuestions()
        } else if (deleteConfirm.type === 'user') {
          await axios.delete(`${API_BASE}/admin/users/${deleteConfirm.id}?current_username=${username}`)
          toast.success('User deleted successfully!')
          await loadUsers()
        }
        setDeleteConfirm(null)
        setDeleteConfirmText('')
      } catch (error) {
        toast.error('Failed to delete. Please try again.')
      }
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm(null)
    setDeleteConfirmText('')
  }

  const loadAllQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/questions/`)
      setAllQuestions(response.data)
      setMode('view-questions')
    } catch (error: any) {
      toast.error('Failed to load questions. Please try again.')
    }
  }

  const generatePDF = async (username: string) => {
    try {
      const response = await axios.get(`${API_BASE}/admin/results/${encodeURIComponent(username)}`)
      const data = response.data
      
      const pdf = new jsPDF()
      pdf.setFontSize(16)
      pdf.text('AWS Quiz Results', 20, 20)
      
      pdf.setFontSize(12)
      pdf.text(`Name: ${data.username}`, 20, 35)
      pdf.text(`Channel: ${data.channel}`, 20, 45)
      pdf.text(`Score: ${data.score}/${data.total_questions} (${((data.score/data.total_questions)*100).toFixed(1)}%)`, 20, 55)
      
      let yPos = 75
      data.answers.forEach((answer: any, index: number) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }
        
        pdf.setFontSize(10)
        pdf.text(`Q${index + 1}: ${answer.question_text}`, 20, yPos)
        yPos += 10
        
        pdf.text(`A) ${answer.option_a}`, 25, yPos)
        yPos += 7
        pdf.text(`B) ${answer.option_b}`, 25, yPos)
        yPos += 7
        pdf.text(`C) ${answer.option_c}`, 25, yPos)
        yPos += 7
        pdf.text(`D) ${answer.option_d}`, 25, yPos)
        yPos += 10
        
        const status = answer.is_correct ? '✓ Correct' : '✗ Wrong'
        const color = answer.is_correct ? [0, 128, 0] as const : [255, 0, 0] as const
        pdf.setTextColor(color[0], color[1], color[2])
        pdf.text(`Your Answer: ${answer.selected_answer} - ${status}`, 25, yPos)
        pdf.text(`Correct Answer: ${answer.correct_answer}`, 25, yPos + 7)
        pdf.setTextColor(0, 0, 0)
        yPos += 20
      })
      
      pdf.save(`${data.username}_quiz_results.pdf`)
    } catch (error) {
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  if (mode === 'home') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
          <div className="header">
            <div className="logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
              <h1>AWS Quiz Platform</h1>
            </div>
          </div>
        <div className="home-hero">
          <h1>Master AWS Cloud Computing</h1>
          <p>Test your Amazon Web Services knowledge with our comprehensive 70-question assessment. Perfect for certification preparation and skill validation.</p>
          <div className="action-buttons">
            <button className="btn btn-success" onClick={() => setMode('join')}>Start Assessment Now</button>
            <button className="btn btn-secondary" onClick={() => setMode('admin')}>Administrator Login</button>
          </div>
          <div style={{marginTop: '30px', fontSize: '14px', color: '#718096'}}>
            <p>✓ 70 comprehensive questions • ✓ 70 minutes duration • ✓ Instant results</p>
          </div>
        </div>
        {deleteConfirm && (
          <div className="dialog-overlay">
            <div className="dialog">
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <div style={{fontSize: '48px', marginBottom: '15px'}}>⚠️</div>
                <h3 style={{color: '#e53e3e', margin: '0 0 10px 0'}}>Confirm Deletion</h3>
                <p style={{color: '#718096', margin: '0'}}>This action cannot be undone</p>
              </div>
              
              <div style={{background: 'rgba(245, 101, 101, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                <p style={{margin: '0', color: '#2d3748'}}>
                  You are about to permanently delete <strong style={{color: '#e53e3e'}}>{deleteConfirm.name}</strong>
                  {deleteConfirm.type === 'channel' && '. This will remove all related participant data, answers, and results.'}
                  {deleteConfirm.type === 'results' && '. This will remove all participant scores, answers, and assessment history.'}
                  {deleteConfirm.type === 'question' && '. This action cannot be undone.'}
                  {deleteConfirm.type === 'user' && '. This will remove the admin user permanently.'}
                </p>
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <p style={{margin: '0 0 10px 0', fontWeight: '600'}}>Type "DELETE" to confirm:</p>
                <input
                  className="dialog-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  autoFocus
                  style={{textTransform: 'uppercase'}}
                />
              </div>
              
              <div className="dialog-buttons">
                <button className="btn btn-secondary" onClick={cancelDelete} style={{flex: '1'}}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={confirmDelete}
                  disabled={deleteConfirmText !== 'DELETE'}
                  style={{flex: '1'}}
                >
                  {deleteConfirmText !== 'DELETE' ? 'Type DELETE to confirm' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  if (mode === 'admin') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
          <div className="header">
            <div className="logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
              <h1>AWS Quiz Platform</h1>
            </div>
          </div>
        <div className="card" style={{maxWidth: '500px', margin: '0 auto'}}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Admin" style={{width: '80px', height: '80px', marginBottom: '20px'}} />
            <h2>Administrator Access</h2>
            <p style={{color: '#718096', marginBottom: '30px'}}>Please enter your credentials to access the admin dashboard</p>
          </div>
          <input
            className="input"
            placeholder="Administrator Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && username && adminPassword && adminLogin()}
          />
          <input
            className="input"
            type="password"
            placeholder="Administrator Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && username && adminPassword && adminLogin()}
          />
          <button 
            className="btn" 
            onClick={adminLogin}
            disabled={!username || !adminPassword}
            style={{width: '100%', marginBottom: '15px'}}
          >
            {!username || !adminPassword ? 'Please enter credentials' : 'Sign In'}
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('home')} style={{width: '100%'}}>Cancel</button>
        </div>
        </div>
      </>
    )
  }

  if (mode === 'admin-dashboard') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
        <div className="header">
          <div className="logo">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
            <h1>AWS Quiz Platform</h1>
          </div>
        </div>
        <div className="card" style={{maxWidth: '800px', margin: '0 auto'}}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <h2>Admin Dashboard</h2>
            <p style={{color: '#718096'}}>Welcome, {username}</p>
          </div>
          
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px'}}>
            <button className="btn" onClick={() => setMode('create-channel')} style={{padding: '20px', textAlign: 'left', background: 'white', color: '#2d3748', border: '2px solid #e2e8f0'}}>
              <h3 style={{margin: '0 0 5px 0', fontSize: '16px'}}>Create Channel</h3>
              <p style={{margin: '0', fontSize: '14px', color: '#718096'}}>New assessment channel</p>
            </button>
            
            <button className="btn" onClick={() => setMode('add-question')} style={{padding: '20px', textAlign: 'left', background: 'white', color: '#2d3748', border: '2px solid #e2e8f0'}}>
              <h3 style={{margin: '0 0 5px 0', fontSize: '16px'}}>Add Question</h3>
              <p style={{margin: '0', fontSize: '14px', color: '#718096'}}>New quiz question</p>
            </button>
            
            <button className="btn" onClick={loadAllQuestions} style={{padding: '20px', textAlign: 'left', background: 'white', color: '#2d3748', border: '2px solid #e2e8f0'}}>
              <h3 style={{margin: '0 0 5px 0', fontSize: '16px'}}>View Questions</h3>
              <p style={{margin: '0', fontSize: '14px', color: '#718096'}}>Browse database</p>
            </button>
            
            <button className="btn" onClick={loadChannels} style={{padding: '20px', textAlign: 'left', background: 'white', color: '#2d3748', border: '2px solid #e2e8f0'}}>
              <h3 style={{margin: '0 0 5px 0', fontSize: '16px'}}>Manage Channels</h3>
              <p style={{margin: '0', fontSize: '14px', color: '#718096'}}>View and delete</p>
            </button>
            
            <button className="btn" onClick={loadResults} style={{padding: '20px', textAlign: 'left', background: 'white', color: '#2d3748', border: '2px solid #e2e8f0'}}>
              <h3 style={{margin: '0 0 5px 0', fontSize: '16px'}}>View Results</h3>
              <p style={{margin: '0', fontSize: '14px', color: '#718096'}}>Performance data</p>
            </button>
            
            <button className="btn" onClick={loadUsers} style={{padding: '20px', textAlign: 'left', background: 'white', color: '#2d3748', border: '2px solid #e2e8f0'}}>
              <h3 style={{margin: '0 0 5px 0', fontSize: '16px'}}>Manage Users</h3>
              <p style={{margin: '0', fontSize: '14px', color: '#718096'}}>Admin accounts</p>
            </button>
            
            <button className="btn btn-danger" onClick={clearResults} style={{padding: '20px', textAlign: 'left'}}>
              <h3 style={{margin: '0 0 5px 0', fontSize: '16px'}}>Clear Data</h3>
              <p style={{margin: '0', fontSize: '14px', opacity: '0.8'}}>Remove all results</p>
            </button>
          </div>
          
          <div style={{textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '15px', justifyContent: 'center'}}>
            <button className="btn" onClick={() => setShowPasswordDialog(true)}>Change Password</button>
            <button className="btn btn-secondary" onClick={() => setMode('home')}>Sign Out</button>
          </div>
        </div>
        {deleteConfirm && (
          <div className="dialog-overlay">
            <div className="dialog">
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <div style={{fontSize: '48px', marginBottom: '15px'}}>⚠️</div>
                <h3 style={{color: '#e53e3e', margin: '0 0 10px 0'}}>Confirm Deletion</h3>
                <p style={{color: '#718096', margin: '0'}}>This action cannot be undone</p>
              </div>
              
              <div style={{background: 'rgba(245, 101, 101, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                <p style={{margin: '0', color: '#2d3748'}}>
                  You are about to permanently delete <strong style={{color: '#e53e3e'}}>{deleteConfirm.name}</strong>
                  {deleteConfirm.type === 'channel' && '. This will remove all related participant data, answers, and results.'}
                  {deleteConfirm.type === 'results' && '. This will remove all participant scores, answers, and assessment history.'}
                </p>
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <p style={{margin: '0 0 10px 0', fontWeight: '600'}}>Type "DELETE" to confirm:</p>
                <input
                  className="dialog-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  autoFocus
                  style={{textTransform: 'uppercase'}}
                />
              </div>
              
              <div className="dialog-buttons">
                <button className="btn btn-secondary" onClick={cancelDelete} style={{flex: '1'}}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={confirmDelete}
                  disabled={deleteConfirmText !== 'DELETE'}
                  style={{flex: '1'}}
                >
                  {deleteConfirmText !== 'DELETE' ? 'Type DELETE to confirm' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  if (mode === 'add-question') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
        <div className="header">
          <div className="logo">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
            <h1>AWS Quiz Platform</h1>
          </div>
        </div>
        <div className="card" style={{maxWidth: '600px', margin: '0 auto'}}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <img src="https://cdn-icons-png.flaticon.com/512/1828/1828925.png" alt="Add Question" style={{width: '80px', height: '80px', marginBottom: '20px'}} />
            <h2>Add New Question</h2>
            <p style={{color: '#718096', marginBottom: '30px'}}>Create a new AWS assessment question with multiple choice answers</p>
          </div>
          <input
            className="input"
            placeholder="Question text"
            value={newQuestion.text}
            onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
          />
          <input
            className="input"
            placeholder="Option A"
            value={newQuestion.option_a}
            onChange={(e) => setNewQuestion({...newQuestion, option_a: e.target.value})}
          />
          <input
            className="input"
            placeholder="Option B"
            value={newQuestion.option_b}
            onChange={(e) => setNewQuestion({...newQuestion, option_b: e.target.value})}
          />
          <input
            className="input"
            placeholder="Option C"
            value={newQuestion.option_c}
            onChange={(e) => setNewQuestion({...newQuestion, option_c: e.target.value})}
          />
          <input
            className="input"
            placeholder="Option D"
            value={newQuestion.option_d}
            onChange={(e) => setNewQuestion({...newQuestion, option_d: e.target.value})}
          />
          <select
            className="input"
            value={newQuestion.correct_answer}
            onChange={(e) => setNewQuestion({...newQuestion, correct_answer: e.target.value})}
          >
            <option value="A">A - Correct Answer</option>
            <option value="B">B - Correct Answer</option>
            <option value="C">C - Correct Answer</option>
            <option value="D">D - Correct Answer</option>
          </select>
          <button 
            className="btn" 
            onClick={addQuestion}
            disabled={!newQuestion.text.trim() || !newQuestion.option_a.trim() || !newQuestion.option_b.trim() || !newQuestion.option_c.trim() || !newQuestion.option_d.trim()}
            style={{width: '100%', marginBottom: '15px'}}
          >
            {(!newQuestion.text.trim() || !newQuestion.option_a.trim() || !newQuestion.option_b.trim() || !newQuestion.option_c.trim() || !newQuestion.option_d.trim()) ? 'Please fill all fields' : 'Save Question'}
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('admin-dashboard')} style={{width: '100%'}}>Back to Dashboard</button>
        </div>
        </div>
      </>
    )
  }

  if (mode === 'view-results') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
          <div className="header">
            <div className="logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
              <h1>AWS Quiz Platform</h1>
            </div>
          </div>
        <div className="card">
          <div className="results-header">
            <h2>Assessment Results & Analytics</h2>
            <div className="results-actions">
              <button className="btn btn-danger" onClick={clearResults}>⚠️ Clear All Data</button>
              <button className="btn btn-secondary" onClick={() => setMode('admin-dashboard')}>Back to Dashboard</button>
            </div>
          </div>
          
          {results.length === 0 ? (
            <div className="no-results">
              <img src="https://cdn-icons-png.flaticon.com/512/4555/4555971.png" alt="No Results" style={{width: '120px', height: '120px', marginBottom: '20px', opacity: '0.6'}} />
              <p>No assessment results available</p>
              <p style={{fontSize: '14px', color: '#a0aec0', marginTop: '10px'}}>Results will appear here once participants complete assessments</p>
            </div>
          ) : (
            <div className="results-grid">
              {results.map((result, index) => (
                <div key={index} className="result-card">
                  <div className="result-header">
                    <h3>{result.username}</h3>
                    <span className="channel-badge">{result.channel}</span>
                  </div>
                  <div className="result-stats">
                    <div className="stat">
                      <span className="stat-value">{result.score}</span>
                      <span className="stat-label">Correct</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{result.total_questions}</span>
                      <span className="stat-label">Total</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{((result.score / result.total_questions) * 100).toFixed(1)}%</span>
                      <span className="stat-label">Score</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${(result.score / result.total_questions) * 100}%`}}></div>
                  </div>
                  <button className="btn btn-primary" onClick={() => generatePDF(result.username)}>Download Report</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {deleteConfirm && (
          <div className="dialog-overlay">
            <div className="dialog">
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <div style={{fontSize: '48px', marginBottom: '15px'}}>⚠️</div>
                <h3 style={{color: '#e53e3e', margin: '0 0 10px 0'}}>Confirm Deletion</h3>
                <p style={{color: '#718096', margin: '0'}}>This action cannot be undone</p>
              </div>
              
              <div style={{background: 'rgba(245, 101, 101, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                <p style={{margin: '0', color: '#2d3748'}}>
                  You are about to permanently delete <strong style={{color: '#e53e3e'}}>{deleteConfirm.name}</strong>
                  {deleteConfirm.type === 'channel' && '. This will remove all related participant data, answers, and results.'}
                  {deleteConfirm.type === 'results' && '. This will remove all participant scores, answers, and assessment history.'}
                </p>
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <p style={{margin: '0 0 10px 0', fontWeight: '600'}}>Type "DELETE" to confirm:</p>
                <input
                  className="dialog-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  autoFocus
                  style={{textTransform: 'uppercase'}}
                />
              </div>
              
              <div className="dialog-buttons">
                <button className="btn btn-secondary" onClick={cancelDelete} style={{flex: '1'}}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={confirmDelete}
                  disabled={deleteConfirmText !== 'DELETE'}
                  style={{flex: '1'}}
                >
                  {deleteConfirmText !== 'DELETE' ? 'Type DELETE to confirm' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  if (mode === 'manage-channels') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
          <div className="header">
            <div className="logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
              <h1>AWS Quiz Platform</h1>
            </div>
          </div>
        <div className="card">
          <div className="results-header">
            <h2>Channel Management</h2>
            <button className="btn btn-secondary" onClick={() => setMode('admin-dashboard')}>Back to Dashboard</button>
          </div>
          
          {channels.length === 0 ? (
            <div className="no-results">
              <img src="https://cdn-icons-png.flaticon.com/512/3524/3524659.png" alt="No Channels" style={{width: '120px', height: '120px', marginBottom: '20px', opacity: '0.6'}} />
              <p>No assessment channels created yet</p>
              <p style={{fontSize: '14px', color: '#a0aec0', marginTop: '10px'}}>Create your first channel to start organizing assessments</p>
            </div>
          ) : (
            <div className="results-grid">
              {channels.map((channel) => (
                <div key={channel.id} className="result-card">
                  <div className="result-header">
                    <h3>{channel.name}</h3>
                    <span className="channel-badge">{channel.code}</span>
                  </div>
                  <div className="result-stats">
                    <div className="stat">
                      <span className="stat-label">Created: {new Date(channel.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn btn-danger" onClick={() => deleteChannel(channel.id, channel.name)}>Remove Channel</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {deleteConfirm && (
          <div className="dialog-overlay">
            <div className="dialog">
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <div style={{fontSize: '48px', marginBottom: '15px'}}>⚠️</div>
                <h3 style={{color: '#e53e3e', margin: '0 0 10px 0'}}>Confirm Deletion</h3>
                <p style={{color: '#718096', margin: '0'}}>This action cannot be undone</p>
              </div>
              
              <div style={{background: 'rgba(245, 101, 101, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                <p style={{margin: '0', color: '#2d3748'}}>
                  You are about to permanently delete <strong style={{color: '#e53e3e'}}>{deleteConfirm.name}</strong>
                  {deleteConfirm.type === 'channel' && '. This will remove all related participant data, answers, and results.'}
                  {deleteConfirm.type === 'results' && '. This will remove all participant scores, answers, and assessment history.'}
                </p>
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <p style={{margin: '0 0 10px 0', fontWeight: '600'}}>Type "DELETE" to confirm:</p>
                <input
                  className="dialog-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  autoFocus
                  style={{textTransform: 'uppercase'}}
                />
              </div>
              
              <div className="dialog-buttons">
                <button className="btn btn-secondary" onClick={cancelDelete} style={{flex: '1'}}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={confirmDelete}
                  disabled={deleteConfirmText !== 'DELETE'}
                  style={{flex: '1'}}
                >
                  {deleteConfirmText !== 'DELETE' ? 'Type DELETE to confirm' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  if (mode === 'create-channel') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
          <div className="header">
            <div className="logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
              <h1>AWS Quiz Platform</h1>
            </div>
          </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '1000px', margin: '0 auto'}}>
          <div className="card">
            <div style={{textAlign: 'center', marginBottom: '30px'}}>
              <img src="https://cdn-icons-png.flaticon.com/512/3524/3524659.png" alt="Create Channel" style={{width: '80px', height: '80px', marginBottom: '20px'}} />
              <h2>Create New Channel</h2>
              <p style={{color: '#718096', marginBottom: '30px'}}>Generate a new channel with unique access code</p>
            </div>
            <input
              className="input"
              placeholder="Assessment Channel Name"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
            <button 
              className="btn" 
              onClick={createChannel}
              disabled={!channelName.trim()}
              style={{width: '100%', marginBottom: '15px'}}
            >
              {!channelName.trim() ? 'Enter channel name to create' : 'Create Assessment Channel'}
            </button>
            <button className="btn btn-secondary" onClick={() => {
              setCreatedChannelCode('')
              setMode('admin-dashboard')
            }} style={{width: '100%'}}>Back to Dashboard</button>
            {createdChannelCode && (
              <div style={{marginTop: '30px', padding: '20px', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', borderRadius: '12px', textAlign: 'center', color: 'white'}}>
                <h3 style={{margin: '0 0 10px 0'}}>Channel Created Successfully!</h3>
                <p style={{fontSize: '18px', fontWeight: '600', margin: '0 0 10px 0'}}>Access Code: {createdChannelCode}</p>
                <p style={{margin: '0', opacity: '0.9'}}>Share this code with participants to join the assessment</p>
              </div>
            )}
          </div>
          
          <div className="card">
            <div style={{textAlign: 'center', marginBottom: '30px'}}>
              <img src="https://cdn-icons-png.flaticon.com/512/2920/2920277.png" alt="Available Channels" style={{width: '80px', height: '80px', marginBottom: '20px'}} />
              <h2>Available Channels</h2>
              <p style={{color: '#718096', marginBottom: '30px'}}>View all existing assessment channels</p>
            </div>
            
            <button className="btn" onClick={loadChannelsForCreate} style={{width: '100%', marginBottom: '20px'}}>Refresh Channels</button>
            
            {channels.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 20px', color: '#718096'}}>
                <p>No channels available</p>
                <p style={{fontSize: '14px', marginTop: '10px'}}>Create your first channel to get started</p>
              </div>
            ) : (
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {channels.map((channel) => (
                  <div key={channel.id} style={{padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                      <h4 style={{margin: '0', fontSize: '16px', color: '#2d3748'}}>{channel.name}</h4>
                      <span style={{background: '#667eea', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600'}}>{channel.code}</span>
                    </div>
                    <p style={{margin: '0', fontSize: '12px', color: '#718096'}}>Created: {new Date(channel.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </>
    )
  }

  if (mode === 'join') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
          <div className="header">
            <div className="logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
              <h1>AWS Quiz Platform</h1>
            </div>
          </div>
        <div className="card" style={{maxWidth: '500px', margin: '0 auto'}}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135789.png" alt="User" style={{width: '80px', height: '80px', marginBottom: '20px'}} />
            <h2>Join Assessment</h2>
            <p style={{color: '#718096', marginBottom: '30px'}}>Enter your details and channel code to begin the AWS assessment</p>
          </div>
          <input
            className="input"
            placeholder="Your Full Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && channelCode && username && joinChannel()}
          />
          <input
            className="input"
            placeholder="Assessment Channel Code"
            value={channelCode}
            onChange={(e) => setChannelCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && channelCode && username && joinChannel()}
          />
          <button 
            className="btn btn-success" 
            onClick={joinChannel}
            disabled={!username || !channelCode}
            style={{width: '100%', marginBottom: '15px'}}
          >
            {!username || !channelCode ? 'Please fill all fields' : 'Join Assessment'}
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('home')} style={{width: '100%'}}>Back to Home</button>
        </div>
        </div>
      </>
    )
  }

  if (mode === 'quiz') {
    const question = questions[currentQuestion]
    if (!question) return <div>Loading...</div>

    if (!quizStarted) {
      return (
        <>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          <div className="container">
            <div className="header">
              <div className="logo">
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
                <h1>AWS Quiz Platform</h1>
              </div>
            </div>
          <div className="card" style={{maxWidth: '600px', margin: '0 auto'}}>
            <div style={{textAlign: 'center', marginBottom: '30px'}}>
              <img src="https://cdn-icons-png.flaticon.com/512/3135/3135789.png" alt="Ready" style={{width: '100px', height: '100px', marginBottom: '20px'}} />
              <h2>Ready to Begin Assessment?</h2>
              <div style={{background: 'rgba(102, 126, 234, 0.1)', padding: '20px', borderRadius: '12px', margin: '20px 0'}}>
                <h3 style={{color: '#667eea', margin: '0 0 10px 0'}}>Channel: {currentChannel}</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px'}}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '24px', fontWeight: '700', color: '#2d3748'}}>70</div>
                    <div style={{fontSize: '14px', color: '#718096'}}>Questions</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '24px', fontWeight: '700', color: '#2d3748'}}>70</div>
                    <div style={{fontSize: '14px', color: '#718096'}}>Minutes</div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '24px', fontWeight: '700', color: '#2d3748'}}>4</div>
                    <div style={{fontSize: '14px', color: '#718096'}}>Options Each</div>
                  </div>
                </div>
              </div>
              <p style={{color: '#718096', marginBottom: '30px'}}>You can navigate between questions, mark them for review, and submit when ready. Your progress will be saved automatically.</p>
            </div>
            <button className="btn btn-success" onClick={startQuiz} style={{width: '100%', fontSize: '18px', padding: '16px', marginBottom: '15px'}}>Begin Assessment Now</button>
            <button className="btn btn-secondary" onClick={() => setMode('home')} style={{width: '100%'}}>Exit to Home</button>
          </div>
          </div>
        </>
      )
    }

    const stats = getQuestionStats()

    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
        <div className="quiz-header">
          <div>
            <h2>Channel: {currentChannel}</h2>
            <p>Question {currentQuestion + 1} of {questions.length}</p>
          </div>
          <div className={`timer ${timeLeft < 300000 ? 'warning' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{width: `${((currentQuestion + 1) / questions.length) * 100}%`}}></div>
        </div>

        <div className="quiz-stats">
          <div className="stat-item">
            <div className="stat-number" style={{color: '#28a745'}}>{stats.answered}</div>
            <div className="stat-label">Answered</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" style={{color: '#ffc107'}}>{stats.marked}</div>
            <div className="stat-label">Marked</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" style={{color: '#6c757d'}}>{stats.unanswered}</div>
            <div className="stat-label">Unanswered</div>
          </div>
        </div>

        <div className="question-nav">
          {questions.map((_, index) => {
            let className = 'nav-btn '
            if (index === currentQuestion) className += 'current '
            else if (questionStates[index]?.answered) className += 'answered '
            else if (questionStates[index]?.marked) className += 'marked '
            else className += 'unanswered '
            
            return (
              <button
                key={index}
                className={className}
                onClick={() => navigateToQuestion(index)}
              >
                {index + 1}
              </button>
            )
          })}
        </div>

        <div className="question-container">
          <div className="question-text">{question.text}</div>
          <div className="options">
            {['A', 'B', 'C', 'D'].map((option) => (
              <div
                key={option}
                className={`option ${selectedAnswer === option ? 'selected' : ''}`}
                onClick={() => setSelectedAnswer(option)}
              >
                <div className="option-label">{option}</div>
                <div>{question[`option_${option.toLowerCase()}`]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="quiz-controls">
          <div>
            <button className="btn btn-secondary" onClick={saveAndPrevious} disabled={currentQuestion === 0}>
              ← Previous
            </button>
            <button className="btn btn-warning" onClick={markQuestion}>
              {questionStates[currentQuestion]?.marked ? '★ Marked' : '☆ Mark'}
            </button>
          </div>
          <div>
            {currentQuestion < questions.length - 1 ? (
              <button className="btn" onClick={saveAndNext} style={{fontSize: '16px', padding: '14px 24px'}}>
                Next Question →
              </button>
            ) : (
              <button className="btn btn-success" onClick={submitQuiz} style={{fontSize: '16px', padding: '14px 24px'}}>
                Submit Assessment
              </button>
            )}
          </div>
        </div>

        {showSubmitDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h3>⚠️ Submit Quiz</h3>
              <p>Are you sure you want to submit your quiz? This action cannot be undone.</p>
              
              <div className="dialog-stats">
                <div>📊 <strong>Quiz Summary:</strong></div>
                <div>✅ Answered: {getQuestionStats().answered}/{questions.length}</div>
                <div>❓ Unanswered: {getQuestionStats().unanswered}</div>
                <div>🏷️ Marked for review: {getQuestionStats().marked}</div>
              </div>
              
              {getQuestionStats().unanswered > 0 && (
                <div className="dialog-warning">
                  ⚠️ You have {getQuestionStats().unanswered} unanswered questions. They will be marked as incorrect.
                </div>
              )}
              
              <p><strong>Type "SUBMIT" to confirm:</strong></p>
              <input
                className="dialog-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type SUBMIT here"
                autoFocus
              />
              
              <div className="dialog-buttons">
                <button className="btn btn-secondary" onClick={handleCancelSubmit}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleConfirmSubmit}
                  disabled={confirmText !== 'SUBMIT'}
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  if (mode === 'view-questions') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
          <div className="header">
            <div className="logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
              <h1>AWS Quiz Platform</h1>
            </div>
          </div>
        <div className="card">
          <div className="results-header">
            <h2>Question Database</h2>
            <div className="results-actions">
              <button className="btn" onClick={() => setMode('add-question')}>Add New Question</button>
              <button className="btn btn-secondary" onClick={() => setMode('admin-dashboard')}>Back to Dashboard</button>
            </div>
          </div>
          
          {allQuestions.length === 0 ? (
            <div className="no-results">
              <img src="https://cdn-icons-png.flaticon.com/512/4555/4555971.png" alt="No Questions" style={{width: '120px', height: '120px', marginBottom: '20px', opacity: '0.6'}} />
              <p>No questions available in the database</p>
              <p style={{fontSize: '14px', color: '#a0aec0', marginTop: '10px'}}>Add your first question to start building the assessment</p>
            </div>
          ) : (
            <div>
              <div style={{marginBottom: '20px', padding: '15px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '12px', textAlign: 'center'}}>
                <h3 style={{margin: '0 0 5px 0', color: '#667eea'}}>Total Questions: {allQuestions.length}</h3>
                <p style={{margin: '0', color: '#718096', fontSize: '14px'}}>Questions are randomly selected for each assessment</p>
              </div>
              <div className="results-grid">
                {allQuestions.map((question, index) => (
                  <div key={question.id} className="result-card">
                    <div className="result-header">
                      <h3>Question {index + 1}</h3>
                      <span className="channel-badge">ID: {question.id}</span>
                    </div>
                    <div style={{marginBottom: '15px'}}>
                      <p style={{fontWeight: '600', color: '#2d3748', marginBottom: '15px', lineHeight: '1.5'}}>{question.text}</p>
                      <div style={{display: 'grid', gap: '8px'}}>
                        <div style={{padding: '8px 12px', background: question.correct_answer === 'A' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(160, 174, 192, 0.1)', borderRadius: '6px', fontSize: '14px'}}>
                          <strong>A)</strong> {question.option_a} {question.correct_answer === 'A' && <span style={{color: '#48bb78', fontWeight: '700'}}>✓</span>}
                        </div>
                        <div style={{padding: '8px 12px', background: question.correct_answer === 'B' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(160, 174, 192, 0.1)', borderRadius: '6px', fontSize: '14px'}}>
                          <strong>B)</strong> {question.option_b} {question.correct_answer === 'B' && <span style={{color: '#48bb78', fontWeight: '700'}}>✓</span>}
                        </div>
                        <div style={{padding: '8px 12px', background: question.correct_answer === 'C' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(160, 174, 192, 0.1)', borderRadius: '6px', fontSize: '14px'}}>
                          <strong>C)</strong> {question.option_c} {question.correct_answer === 'C' && <span style={{color: '#48bb78', fontWeight: '700'}}>✓</span>}
                        </div>
                        <div style={{padding: '8px 12px', background: question.correct_answer === 'D' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(160, 174, 192, 0.1)', borderRadius: '6px', fontSize: '14px'}}>
                          <strong>D)</strong> {question.option_d} {question.correct_answer === 'D' && <span style={{color: '#48bb78', fontWeight: '700'}}>✓</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                      <button className="btn" onClick={() => editQuestion(question)} style={{flex: '1', fontSize: '14px', padding: '8px'}}>
                        Edit Question
                      </button>
                      <button className="btn btn-danger" onClick={() => deleteQuestion(question.id, question.text)} style={{flex: '1', fontSize: '14px', padding: '8px'}}>
                        Delete
                      </button>
                    </div>
                    <div style={{textAlign: 'center', padding: '10px', background: 'rgba(72, 187, 120, 0.1)', borderRadius: '8px', marginTop: '10px'}}>
                      <span style={{color: '#38a169', fontWeight: '600', fontSize: '14px'}}>Correct Answer: {question.correct_answer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {showEditDialog && editingQuestion && (
          <div className="dialog-overlay">
            <div className="dialog" style={{maxWidth: '600px'}}>
              <h3>Edit Question</h3>
              <input
                className="dialog-input"
                placeholder="Question text"
                value={editingQuestion.text}
                onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
              />
              <input
                className="dialog-input"
                placeholder="Option A"
                value={editingQuestion.option_a}
                onChange={(e) => setEditingQuestion({...editingQuestion, option_a: e.target.value})}
              />
              <input
                className="dialog-input"
                placeholder="Option B"
                value={editingQuestion.option_b}
                onChange={(e) => setEditingQuestion({...editingQuestion, option_b: e.target.value})}
              />
              <input
                className="dialog-input"
                placeholder="Option C"
                value={editingQuestion.option_c}
                onChange={(e) => setEditingQuestion({...editingQuestion, option_c: e.target.value})}
              />
              <input
                className="dialog-input"
                placeholder="Option D"
                value={editingQuestion.option_d}
                onChange={(e) => setEditingQuestion({...editingQuestion, option_d: e.target.value})}
              />
              <select
                className="dialog-input"
                value={editingQuestion.correct_answer}
                onChange={(e) => setEditingQuestion({...editingQuestion, correct_answer: e.target.value})}
              >
                <option value="A">A - Correct Answer</option>
                <option value="B">B - Correct Answer</option>
                <option value="C">C - Correct Answer</option>
                <option value="D">D - Correct Answer</option>
              </select>
              <div className="dialog-buttons">
                <button className="btn btn-secondary" onClick={() => {setShowEditDialog(false); setEditingQuestion(null)}}>
                  Cancel
                </button>
                <button 
                  className="btn" 
                  onClick={updateQuestion}
                  disabled={!editingQuestion.text.trim() || !editingQuestion.option_a.trim() || !editingQuestion.option_b.trim() || !editingQuestion.option_c.trim() || !editingQuestion.option_d.trim()}
                >
                  Update Question
                </button>
              </div>
            </div>
          </div>
        )}
        {showPasswordDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h3>Change Password</h3>
              <input
                className="dialog-input"
                type="password"
                placeholder="Current Password"
                value={passwordUpdate.current_password}
                onChange={(e) => setPasswordUpdate({...passwordUpdate, current_password: e.target.value})}
              />
              <input
                className="dialog-input"
                type="password"
                placeholder="New Password"
                value={passwordUpdate.new_password}
                onChange={(e) => setPasswordUpdate({...passwordUpdate, new_password: e.target.value})}
              />
              <div className="dialog-buttons">
                <button className="btn btn-secondary" onClick={() => {setShowPasswordDialog(false); setPasswordUpdate({current_password: '', new_password: ''})}}>
                  Cancel
                </button>
                <button 
                  className="btn" 
                  onClick={updatePassword}
                  disabled={!passwordUpdate.current_password || !passwordUpdate.new_password}
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  if (mode === 'manage-users') {
    return (
      <>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        <div className="container">
          <div className="header">
            <div className="logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Logo" />
              <h1>AWS Quiz Platform</h1>
            </div>
          </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '1000px', margin: '0 auto'}}>
          <div className="card">
            <div style={{textAlign: 'center', marginBottom: '30px'}}>
              <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Create User" style={{width: '80px', height: '80px', marginBottom: '20px'}} />
              <h2>Create Admin User</h2>
              <p style={{color: '#718096', marginBottom: '30px'}}>Add new administrator account</p>
            </div>
            <input
              className="input"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            />
            <button 
              className="btn" 
              onClick={createUser}
              disabled={!newUser.username.trim() || !newUser.password.trim()}
              style={{width: '100%', marginBottom: '15px'}}
            >
              {!newUser.username.trim() || !newUser.password.trim() ? 'Please fill all fields' : 'Create Admin User'}
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('admin-dashboard')} style={{width: '100%'}}>Back to Dashboard</button>
          </div>
          
          <div className="card">
            <div style={{textAlign: 'center', marginBottom: '30px'}}>
              <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" alt="Admin Users" style={{width: '80px', height: '80px', marginBottom: '20px'}} />
              <h2>Admin Users</h2>
              <p style={{color: '#718096', marginBottom: '30px'}}>Manage administrator accounts</p>
            </div>
            
            {users.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 20px', color: '#718096'}}>
                <p>No admin users found</p>
                <p style={{fontSize: '14px', marginTop: '10px'}}>Create your first admin user to get started</p>
              </div>
            ) : (
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {users.map((user) => (
                  <div key={user.id} style={{padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                      <h4 style={{margin: '0', fontSize: '16px', color: '#2d3748'}}>{user.username}</h4>
                      {user.username !== username && (
                        <button className="btn btn-danger" onClick={() => deleteUser(user.id, user.username)} style={{fontSize: '12px', padding: '4px 8px'}}>
                          Delete
                        </button>
                      )}
                    </div>
                    <p style={{margin: '0', fontSize: '12px', color: '#718096'}}>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                    {user.username === username && (
                      <p style={{margin: '5px 0 0 0', fontSize: '12px', color: '#48bb78', fontWeight: '600'}}>Current User</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {deleteConfirm && (
          <div className="dialog-overlay">
            <div className="dialog">
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <div style={{fontSize: '48px', marginBottom: '15px'}}>⚠️</div>
                <h3 style={{color: '#e53e3e', margin: '0 0 10px 0'}}>Confirm Deletion</h3>
                <p style={{color: '#718096', margin: '0'}}>This action cannot be undone</p>
              </div>
              
              <div style={{background: 'rgba(245, 101, 101, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
                <p style={{margin: '0', color: '#2d3748'}}>
                  You are about to permanently delete <strong style={{color: '#e53e3e'}}>{deleteConfirm.name}</strong>
                  {deleteConfirm.type === 'user' && '. This will remove the admin user permanently.'}
                </p>
              </div>
              
              <div style={{marginBottom: '20px'}}>
                <p style={{margin: '0 0 10px 0', fontWeight: '600'}}>Type "DELETE" to confirm:</p>
                <input
                  className="dialog-input"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  autoFocus
                  style={{textTransform: 'uppercase'}}
                />
              </div>
              
              <div className="dialog-buttons">
                <button className="btn btn-secondary" onClick={cancelDelete} style={{flex: '1'}}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={confirmDelete}
                  disabled={deleteConfirmText !== 'DELETE'}
                  style={{flex: '1'}}
                >
                  {deleteConfirmText !== 'DELETE' ? 'Type DELETE to confirm' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </>
    )
  }

  // This should never be reached as all modes are handled above
  return null
}