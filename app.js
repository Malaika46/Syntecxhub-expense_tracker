const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Constants
const SCREEN = {
    DASHBOARD: 'dashboard',
    ADD: 'add',
    EDIT: 'edit',
    REPORTS: 'reports',
    SETTINGS: 'settings'
};

const CATEGORIES = [
    { id: 'food', name: 'Food & Dining', icon: 'fa-utensils', color: '#ef4444' },
    { id: 'transport', name: 'Transportation', icon: 'fa-car', color: '#3b82f6' },
    { id: 'utilities', name: 'Utilities', icon: 'fa-bolt', color: '#f59e0b' },
    { id: 'entertainment', name: 'Entertainment', icon: 'fa-film', color: '#8b5cf6' },
    { id: 'shopping', name: 'Shopping', icon: 'fa-bag-shopping', color: '#ec4899' },
    { id: 'health', name: 'Healthcare', icon: 'fa-heartbeat', color: '#10b981' },
    { id: 'education', name: 'Education', icon: 'fa-graduation-cap', color: '#6366f1' },
    { id: 'other', name: 'Other', icon: 'fa-ellipsis-h', color: '#6b7280' }
];

// Storage key for localStorage
const STORAGE_KEY = 'expenses_pkr';

// Load expenses from localStorage
const loadExpensesFromStorage = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
    return [];
};

// Save expenses to localStorage
const saveExpensesToStorage = (expenses) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
        console.error('Error saving expenses:', error);
    }
};

// Format currency in PKR
const formatPKR = (amount) => {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Chart Components
const CategoryChart = ({ expenses }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !expenses.length) return;

        const categoryTotals = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        const data = {
            labels: Object.keys(categoryTotals).map(cat => 
                CATEGORIES.find(c => c.id === cat)?.name || cat
            ),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: Object.keys(categoryTotals).map(cat =>
                    CATEGORIES.find(c => c.id === cat)?.color || '#6b7280'
                ),
                borderWidth: 0
            }]
        };

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(chartRef.current, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: document.body.classList.contains('dark') ? '#f8fafc' : '#111827',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${formatPKR(value)}`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [expenses]);

    return <canvas ref={chartRef}></canvas>;
};

const TrendChart = ({ expenses }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || !expenses.length) return;

        // Group by date for last 7 days
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const dailyTotals = last7Days.map(date => {
            return expenses
                .filter(e => e.date === date)
                .reduce((sum, e) => sum + e.amount, 0);
        });

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(chartRef.current, {
            type: 'line',
            data: {
                labels: last7Days.map(date => {
                    const d = new Date(date);
                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Daily Expenses',
                    data: dailyTotals,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Amount: ${formatPKR(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: document.body.classList.contains('dark') ? '#334155' : '#e2e8f0'
                        },
                        ticks: {
                            color: document.body.classList.contains('dark') ? '#f8fafc' : '#111827',
                            callback: (value) => formatPKR(value)
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: document.body.classList.contains('dark') ? '#f8fafc' : '#111827',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [expenses]);

    return <canvas ref={chartRef}></canvas>;
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast ${type}`}>
            <i className={`fas ${type === 'success' ? 'fa-check-circle' : 
                             type === 'error' ? 'fa-exclamation-circle' :
                             type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
            <span>{message}</span>
            <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
    );
};

// Main App Component
function App() {
    const [currentScreen, setCurrentScreen] = useState(SCREEN.DASHBOARD);
    const [expenses, setExpenses] = useState([]);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [selectedExpenses, setSelectedExpenses] = useState([]);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState('json');

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'food',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const titleInputRef = useRef(null);
    const modalRef = useRef(null);
    const searchInputRef = useRef(null);

    // Load initial data from localStorage
    useEffect(() => {
        const loadData = () => {
            const savedExpenses = loadExpensesFromStorage();
            setExpenses(savedExpenses);
            setIsLoading(false);
        };
        
        // Simulate loading for smooth UX
        setTimeout(loadData, 500);
    }, []);

    // Save expenses to localStorage whenever they change
    useEffect(() => {
        if (!isLoading) {
            saveExpensesToStorage(expenses);
        }
    }, [expenses, isLoading]);

    // Save dark mode preference
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        document.body.className = darkMode ? 'dark' : '';
    }, [darkMode]);

    // Auto focus on title input when add/edit screen opens
    useEffect(() => {
        if ((currentScreen === SCREEN.ADD || currentScreen === SCREEN.EDIT) && titleInputRef.current) {
            setTimeout(() => titleInputRef.current.focus(), 100);
        }
    }, [currentScreen]);

    // Click outside handler for modals
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsExportModalOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl/Cmd + N for new expense
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                navigateTo(SCREEN.ADD);
            }
            // Ctrl/Cmd + F for search (only in reports)
            if ((e.ctrlKey || e.metaKey) && e.key === 'f' && currentScreen === SCREEN.REPORTS) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                setIsExportModalOpen(false);
                setMobileMenuOpen(false);
                setActiveDropdown(null);
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [currentScreen]);

    // Toast functions
    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Memoized calculations
    const totalExpenses = useMemo(() => 
        expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]
    );

    const todayString = useMemo(() => new Date().toISOString().split('T')[0], []);

    const todayExpenses = useMemo(() => 
        expenses
            .filter(expense => expense.date === todayString)
            .reduce((sum, expense) => sum + expense.amount, 0), [expenses, todayString]
    );

    const monthlyExpenses = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && 
                       expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, expense) => sum + expense.amount, 0);
    }, [expenses]);

    const averageExpense = useMemo(() => 
        expenses.length > 0 ? totalExpenses / expenses.length : 0, [expenses, totalExpenses]
    );

    const categoryTotals = useMemo(() => {
        return expenses.reduce((result, expense) => {
            result[expense.category] = (result[expense.category] || 0) + expense.amount;
            return result;
        }, {});
    }, [expenses]);

    const topCategories = useMemo(() => {
        return Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category, amount]) => ({
                category,
                amount,
                name: CATEGORIES.find(c => c.id === category)?.name || category,
                icon: CATEGORIES.find(c => c.id === category)?.icon || 'fa-tag',
                color: CATEGORIES.find(c => c.id === category)?.color || '#6b7280'
            }));
    }, [categoryTotals]);

    // Filtered and sorted expenses
    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(expense => {
                // Search filter
                const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                     expense.notes?.toLowerCase().includes(searchTerm.toLowerCase());
                
                // Category filter
                const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
                
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                switch(sortBy) {
                    case 'date-desc':
                        return new Date(b.date) - new Date(a.date);
                    case 'date-asc':
                        return new Date(a.date) - new Date(b.date);
                    case 'amount-desc':
                        return b.amount - a.amount;
                    case 'amount-asc':
                        return a.amount - b.amount;
                    case 'title-asc':
                        return a.title.localeCompare(b.title);
                    case 'title-desc':
                        return b.title.localeCompare(a.title);
                    default:
                        return 0;
                }
            });
    }, [expenses, searchTerm, filterCategory, sortBy]);

    const recentExpenses = useMemo(() => 
        filteredExpenses.slice(0, 5), [filteredExpenses]
    );

    // Validation
    const validateForm = (data) => {
        const errors = {};
        
        if (!data.title.trim()) {
            errors.title = 'Title is required';
        } else if (data.title.length < 3) {
            errors.title = 'Title must be at least 3 characters';
        }
        
        if (!data.amount) {
            errors.amount = 'Amount is required';
        } else if (isNaN(data.amount) || Number(data.amount) <= 0) {
            errors.amount = 'Amount must be a positive number';
        } else if (Number(data.amount) > 10000000) {
            errors.amount = 'Amount cannot exceed 10 million PKR';
        }
        
        if (!data.category) {
            errors.category = 'Category is required';
        }
        
        if (!data.date) {
            errors.date = 'Date is required';
        } else {
            const selectedDate = new Date(data.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate > today) {
                errors.date = 'Date cannot be in the future';
            }
        }
        
        return errors;
    };

    // Handlers
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddExpense = useCallback((event) => {
        event.preventDefault();
        
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            showToast('Please fix the errors in the form', 'error');
            return;
        }

        const newExpense = {
            id: crypto.randomUUID(),
            ...formData,
            amount: Number(formData.amount),
            createdAt: Date.now()
        };

        setExpenses(prev => [newExpense, ...prev]);
        setFormData({
            title: '',
            amount: '',
            category: 'food',
            date: new Date().toISOString().split('T')[0],
            notes: ''
        });
        setCurrentScreen(SCREEN.DASHBOARD);
        showToast('Expense added successfully!', 'success');
    }, [formData, showToast]);

    const handleEditExpense = useCallback((event) => {
        event.preventDefault();
        
        if (!selectedExpense) return;
        
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            showToast('Please fix the errors in the form', 'error');
            return;
        }

        const updatedExpense = {
            ...selectedExpense,
            ...formData,
            amount: Number(formData.amount),
            updatedAt: Date.now()
        };

        setExpenses(prev => prev.map(expense => 
            expense.id === selectedExpense.id ? updatedExpense : expense
        ));
        setSelectedExpense(null);
        setCurrentScreen(SCREEN.DASHBOARD);
        showToast('Expense updated successfully!', 'success');
    }, [selectedExpense, formData, showToast]);

    const handleDeleteExpense = useCallback((expenseId) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
            setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
            if (selectedExpense?.id === expenseId) {
                setSelectedExpense(null);
            }
            showToast('Expense deleted successfully!', 'success');
        }
    }, [selectedExpense, showToast]);

    const handleBulkDelete = useCallback(() => {
        if (selectedExpenses.length === 0) {
            showToast('No expenses selected', 'warning');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expenses?`)) {
            setExpenses(prev => prev.filter(expense => !selectedExpenses.includes(expense.id)));
            setSelectedExpenses([]);
            if (selectedExpense && selectedExpenses.includes(selectedExpense.id)) {
                setSelectedExpense(null);
            }
            showToast(`${selectedExpenses.length} expenses deleted successfully!`, 'success');
        }
    }, [selectedExpenses, selectedExpense, showToast]);

    const handleSelectExpense = useCallback((expenseId) => {
        setSelectedExpenses(prev => 
            prev.includes(expenseId) 
                ? prev.filter(id => id !== expenseId)
                : [...prev, expenseId]
        );
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedExpenses.length === filteredExpenses.length) {
            setSelectedExpenses([]);
        } else {
            setSelectedExpenses(filteredExpenses.map(e => e.id));
        }
    }, [selectedExpenses.length, filteredExpenses]);

    const openEditModal = useCallback((expense) => {
        setSelectedExpense(expense);
        setFormData({
            title: expense.title,
            amount: expense.amount.toString(),
            category: expense.category,
            date: expense.date,
            notes: expense.notes || ''
        });
        setCurrentScreen(SCREEN.EDIT);
    }, []);

    const exportData = useCallback(() => {
        let dataToExport = selectedExpenses.length > 0 
            ? expenses.filter(e => selectedExpenses.includes(e.id))
            : expenses;

        let blob;
        let filename;

        switch(exportFormat) {
            case 'csv':
                // Convert to CSV
                const headers = ['Title', 'Amount (PKR)', 'Category', 'Date', 'Notes'];
                const csvData = dataToExport.map(e => 
                    [e.title, e.amount, e.category, e.date, e.notes || ''].join(',')
                );
                const csv = [headers.join(','), ...csvData].join('\n');
                blob = new Blob([csv], { type: 'text/csv' });
                filename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
                break;
            
            case 'json':
            default:
                blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
                filename = `expenses_${new Date().toISOString().split('T')[0]}.json`;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        setIsExportModalOpen(false);
        showToast(`${dataToExport.length} expenses exported successfully!`, 'success');
    }, [expenses, selectedExpenses, exportFormat, showToast]);

    const importData = useCallback((event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    // Validate each expense has required fields
                    const validExpenses = importedData.filter(e => 
                        e.title && e.amount && e.category && e.date
                    ).map(e => ({
                        ...e,
                        id: e.id || crypto.randomUUID(),
                        amount: Number(e.amount),
                        createdAt: e.createdAt || Date.now()
                    }));

                    setExpenses(prev => [...validExpenses, ...prev]);
                    showToast(`${validExpenses.length} expenses imported successfully!`, 'success');
                } else {
                    showToast('Invalid file format', 'error');
                }
            } catch (error) {
                showToast('Error importing file', 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }, [showToast]);

    // Navigation
    const navigateTo = useCallback((screen, expense = null) => {
        setMobileMenuOpen(false);
        setActiveDropdown(null);
        
        if (expense) {
            setSelectedExpense(expense);
            setFormData({
                title: expense.title,
                amount: expense.amount.toString(),
                category: expense.category,
                date: expense.date,
                notes: expense.notes || ''
            });
        } else {
            setSelectedExpense(null);
            if (screen === SCREEN.ADD) {
                setFormData({
                    title: '',
                    amount: '',
                    category: 'food',
                    date: new Date().toISOString().split('T')[0],
                    notes: ''
                });
            }
        }
        
        setCurrentScreen(screen);
    }, []);

    // Render functions for each screen
    const renderDashboard = () => (
        <div className="screen">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Welcome back! Here's your financial overview in Pakistani Rupees.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-wallet"></i>
                    </div>
                    <div className="stat-content">
                        <h3>Total Expenses</h3>
                        <p>{formatPKR(totalExpenses)}</p>
                        <div className="stat-trend">
                            <i className="fas fa-chart-line"></i>
                            <span>All time total</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-calendar-day"></i>
                    </div>
                    <div className="stat-content">
                        <h3>Today's Expenses</h3>
                        <p>{formatPKR(todayExpenses)}</p>
                        <div className="stat-trend">
                            <i className="fas fa-clock"></i>
                            <span>{new Date().toLocaleDateString('en-PK')}</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-calendar-alt"></i>
                    </div>
                    <div className="stat-content">
                        <h3>Monthly Total</h3>
                        <p>{formatPKR(monthlyExpenses)}</p>
                        <div className="stat-trend">
                            <i className="fas fa-calendar"></i>
                            <span>{new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <i className="fas fa-chart-pie"></i>
                    </div>
                    <div className="stat-content">
                        <h3>Average Expense</h3>
                        <p>{formatPKR(averageExpense)}</p>
                        <div className="stat-trend">
                            <i className="fas fa-calculator"></i>
                            <span>Per transaction</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Spending by Category</h3>
                    <div className="chart-container">
                        {expenses.length > 0 ? (
                            <CategoryChart expenses={expenses} />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted">No data to display</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <h3>7-Day Trend</h3>
                    <div className="chart-container">
                        {expenses.length > 0 ? (
                            <TrendChart expenses={expenses} />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted">No data to display</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="recent-expenses">
                <div className="section-header">
                    <h2>Recent Expenses</h2>
                    <button className="view-all-btn" onClick={() => navigateTo(SCREEN.REPORTS)}>
                        View All <i className="fas fa-arrow-right"></i>
                    </button>
                </div>

                {expenses.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-receipt" style={{ fontSize: '3rem', color: 'var(--gray-400)', marginBottom: '1rem' }}></i>
                        <p>No expenses yet. Click "Add Expense" to get started.</p>
                        <button className="btn-primary" onClick={() => navigateTo(SCREEN.ADD)}>
                            <i className="fas fa-plus"></i> Add Your First Expense
                        </button>
                    </div>
                ) : (
                    <div className="expenses-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>
                                        <input 
                                            type="checkbox"
                                            checked={selectedExpenses.length === recentExpenses.length && recentExpenses.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Date</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Amount (PKR)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentExpenses.map(expense => (
                                    <tr key={expense.id} className="expense-row">
                                        <td>
                                            <input 
                                                type="checkbox"
                                                checked={selectedExpenses.includes(expense.id)}
                                                onChange={() => handleSelectExpense(expense.id)}
                                            />
                                        </td>
                                        <td>{new Date(expense.date).toLocaleDateString('en-PK')}</td>
                                        <td>{expense.title}</td>
                                        <td>
                                            <span className="category-badge" style={{
                                                backgroundColor: CATEGORIES.find(c => c.id === expense.category)?.color + '20',
                                                color: CATEGORIES.find(c => c.id === expense.category)?.color
                                            }}>
                                                <i className={`fas ${CATEGORIES.find(c => c.id === expense.category)?.icon}`}></i>
                                                {' '}{CATEGORIES.find(c => c.id === expense.category)?.name}
                                            </span>
                                        </td>
                                        <td>{formatPKR(expense.amount)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button 
                                                    className="btn-icon"
                                                    onClick={() => openEditModal(expense)}
                                                    title="Edit"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button 
                                                    className="btn-icon danger"
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    title="Delete"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {selectedExpenses.length > 0 && (
                    <div className="bulk-actions">
                        <span>{selectedExpenses.length} item(s) selected</span>
                        <button className="btn-danger" onClick={handleBulkDelete}>
                            <i className="fas fa-trash"></i> Delete Selected
                        </button>
                        <button className="btn-primary" onClick={() => setIsExportModalOpen(true)}>
                            <i className="fas fa-download"></i> Export Selected
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAddEditForm = () => (
        <div className="screen">
            <h1>{currentScreen === SCREEN.ADD ? 'Add New Expense' : 'Edit Expense'}</h1>
            
            <div className="form-container">
                <form className="form-card" onSubmit={currentScreen === SCREEN.ADD ? handleAddExpense : handleEditExpense}>
                    <div className="form-group">
                        <label htmlFor="title">
                            Title <span className="required">*</span>
                        </label>
                        <input
                            ref={titleInputRef}
                            type="text"
                            id="title"
                            name="title"
                            className="form-control"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., Groceries, Utility Bill, etc."
                        />
                        {validationErrors.title && (
                            <div className="error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                {validationErrors.title}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="amount">
                            Amount (PKR) <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            className="form-control"
                            value={formData.amount}
                            onChange={handleInputChange}
                            placeholder="e.g., 1500"
                            min="1"
                            step="1"
                        />
                        {validationErrors.amount && (
                            <div className="error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                {validationErrors.amount}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">
                            Category <span className="required">*</span>
                        </label>
                        <select
                            id="category"
                            name="category"
                            className="form-control"
                            value={formData.category}
                            onChange={handleInputChange}
                        >
                            {CATEGORIES.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {validationErrors.category && (
                            <div className="error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                {validationErrors.category}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">
                            Date <span className="required">*</span>
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            className="form-control"
                            value={formData.date}
                            onChange={handleInputChange}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        {validationErrors.date && (
                            <div className="error-message">
                                <i className="fas fa-exclamation-circle"></i>
                                {validationErrors.date}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Notes (Optional)</label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="form-control"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder="Add any additional notes..."
                            rows="3"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn-primary">
                            <i className="fas fa-save"></i>
                            {currentScreen === SCREEN.ADD ? 'Add Expense' : 'Update Expense'}
                        </button>
                        <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={() => navigateTo(SCREEN.DASHBOARD)}
                        >
                            <i className="fas fa-times"></i>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="screen">
            <div className="reports-header">
                <h1>Reports & Analytics</h1>
                <div className="report-controls">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="all">All Categories</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="amount-desc">Highest Amount</option>
                        <option value="amount-asc">Lowest Amount</option>
                        <option value="title-asc">Title A-Z</option>
                        <option value="title-desc">Title Z-A</option>
                    </select>
                </div>
            </div>
            
            <div className="reports-container">
                <div className="report-card">
                    <div className="report-header">
                        <h3>Top Spending Categories</h3>
                        <span className="report-period">This Month</span>
                    </div>
                    <div className="chart-container" style={{ height: '250px' }}>
                        {expenses.length > 0 ? (
                            <CategoryChart expenses={expenses} />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted">No data to display</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="report-card">
                    <div className="report-header">
                        <h3>Spending Trends</h3>
                        <span className="report-period">Last 7 Days</span>
                    </div>
                    <div className="chart-container" style={{ height: '250px' }}>
                        {expenses.length > 0 ? (
                            <TrendChart expenses={expenses} />
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted">No data to display</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="report-card full-width">
                    <div className="report-header">
                        <h3>All Expenses</h3>
                        <span className="report-period">{filteredExpenses.length} transaction(s)</span>
                    </div>
                    
                    {filteredExpenses.length === 0 ? (
                        <div className="empty-state">
                            <p>No expenses match your filters.</p>
                        </div>
                    ) : (
                        <>
                            <div className="expenses-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedExpenses.length === filteredExpenses.length}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>Date</th>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Amount (PKR)</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map(expense => (
                                            <tr key={expense.id} className="expense-row">
                                                <td>
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedExpenses.includes(expense.id)}
                                                        onChange={() => handleSelectExpense(expense.id)}
                                                    />
                                                </td>
                                                <td>{new Date(expense.date).toLocaleDateString('en-PK')}</td>
                                                <td>{expense.title}</td>
                                                <td>
                                                    <span className="category-badge" style={{
                                                        backgroundColor: CATEGORIES.find(c => c.id === expense.category)?.color + '20',
                                                        color: CATEGORIES.find(c => c.id === expense.category)?.color
                                                    }}>
                                                        <i className={`fas ${CATEGORIES.find(c => c.id === expense.category)?.icon}`}></i>
                                                        {' '}{CATEGORIES.find(c => c.id === expense.category)?.name}
                                                    </span>
                                                </td>
                                                <td>{formatPKR(expense.amount)}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button 
                                                            className="btn-icon"
                                                            onClick={() => openEditModal(expense)}
                                                            title="Edit"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button 
                                                            className="btn-icon danger"
                                                            onClick={() => handleDeleteExpense(expense.id)}
                                                            title="Delete"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {selectedExpenses.length > 0 && (
                                <div className="bulk-actions">
                                    <span>{selectedExpenses.length} item(s) selected</span>
                                    <button className="btn-danger" onClick={handleBulkDelete}>
                                        <i className="fas fa-trash"></i> Delete Selected
                                    </button>
                                    <button className="btn-primary" onClick={() => setIsExportModalOpen(true)}>
                                        <i className="fas fa-download"></i> Export Selected
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {expenses.length > 0 && (
                    <>
                        <div className="report-card">
                            <div className="report-header">
                                <h3>Category Breakdown</h3>
                                <span className="report-period">All Time</span>
                            </div>
                            <div className="category-list">
                                {topCategories.map(({ category, amount, name, icon, color }) => (
                                    <div key={category} className="category-item">
                                        <div className="category-info">
                                            <i className={`fas ${icon}`} style={{ color }}></i>
                                            <span>{name}</span>
                                        </div>
                                        <div className="category-stats">
                                            <strong>{formatPKR(amount)}</strong>
                                            <span className="category-percentage">
                                                ({((amount / totalExpenses) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="report-card">
                            <div className="report-header">
                                <h3>Summary Statistics</h3>
                                <span className="report-period">Overview</span>
                            </div>
                            <div className="stats-list">
                                <div className="stat-item">
                                    <span>Total Transactions</span>
                                    <strong>{expenses.length}</strong>
                                </div>
                                <div className="stat-item">
                                    <span>Average per Transaction</span>
                                    <strong>{formatPKR(averageExpense)}</strong>
                                </div>
                                <div className="stat-item">
                                    <span>Highest Expense</span>
                                    <strong>{formatPKR(Math.max(...expenses.map(e => e.amount)))}</strong>
                                </div>
                                <div className="stat-item">
                                    <span>Lowest Expense</span>
                                    <strong>{formatPKR(Math.min(...expenses.map(e => e.amount)))}</strong>
                                </div>
                                <div className="stat-item">
                                    <span>Most Active Category</span>
                                    <strong>{topCategories[0]?.name || 'N/A'}</strong>
                                </div>
                                <div className="stat-item">
                                    <span>Total Categories Used</span>
                                    <strong>{Object.keys(categoryTotals).length}</strong>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="screen">
            <h1>Settings</h1>
            
            <div className="settings-container">
                <div className="settings-section">
                    <h2>
                        <i className="fas fa-palette"></i>
                        Appearance
                    </h2>
                    <div className="settings-item">
                        <div className="settings-info">
                            <label>Dark Mode</label>
                            <p className="settings-description">Switch between light and dark theme</p>
                        </div>
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={darkMode}
                                onChange={() => setDarkMode(prev => !prev)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>
                        <i className="fas fa-database"></i>
                        Data Management
                    </h2>
                    <div className="settings-item">
                        <div className="settings-info">
                            <label>Export Data</label>
                            <p className="settings-description">Export your expenses to a file</p>
                        </div>
                        <button className="btn-primary" onClick={() => setIsExportModalOpen(true)}>
                            <i className="fas fa-download"></i> Export
                        </button>
                    </div>
                    <div className="settings-item">
                        <div className="settings-info">
                            <label>Import Data</label>
                            <p className="settings-description">Import expenses from a JSON file</p>
                        </div>
                        <div>
                            <input 
                                type="file" 
                                id="import-file" 
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={importData}
                            />
                            <button className="btn-secondary" onClick={() => document.getElementById('import-file').click()}>
                                <i className="fas fa-upload"></i> Import
                            </button>
                        </div>
                    </div>
                    <div className="settings-item">
                        <div className="settings-info">
                            <label>Clear All Data</label>
                            <p className="settings-description warning">This action cannot be undone</p>
                        </div>
                        <button 
                            className="btn-danger" 
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
                                    setExpenses([]);
                                    setSelectedExpenses([]);
                                    setSelectedExpense(null);
                                    showToast('All data cleared', 'warning');
                                }
                            }}
                        >
                            <i className="fas fa-trash"></i> Clear All
                        </button>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>
                        <i className="fas fa-tags"></i>
                        Categories
                    </h2>
                    {CATEGORIES.map(category => {
                        const categoryExpenses = expenses.filter(e => e.category === category.id);
                        const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
                        
                        return (
                            <div key={category.id} className="settings-item">
                                <div className="category-info">
                                    <i className={`fas ${category.icon}`} style={{ color: category.color }}></i>
                                    <div>
                                        <span>{category.name}</span>
                                        <p className="category-count">
                                            {categoryExpenses.length} item(s) · {formatPKR(categoryTotal)}
                                        </p>
                                    </div>
                                </div>
                                <span className="category-badge" style={{
                                    backgroundColor: category.color + '20',
                                    color: category.color
                                }}>
                                    {totalExpenses > 0 ? ((categoryTotal / totalExpenses) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="settings-section">
                    <h2>
                        <i className="fas fa-info-circle"></i>
                        About
                    </h2>
                    <div className="settings-item">
                        <div className="settings-info">
                            <label>Version</label>
                            <p className="settings-description">Current version of the application</p>
                        </div>
                        <span className="version-badge">2.0.0</span>
                    </div>
                    <div className="settings-item">
                        <div className="settings-info">
                            <label>Currency</label>
                            <p className="settings-description">All amounts are in Pakistani Rupees (PKR)</p>
                        </div>
                        <span>PKR</span>
                    </div>
                    <div className="settings-item">
                        <div className="settings-info">
                            <label>Total Expenses</label>
                            <p className="settings-description">Number of transactions tracked</p>
                        </div>
                        <span>{expenses.length}</span>
                    </div>
                    <div className="settings-item">
                        <div className="settings-info">
                            <label>Data Storage</label>
                            <p className="settings-description">Data is saved in your browser's local storage</p>
                        </div>
                        <span><i className="fas fa-check-circle" style={{ color: 'var(--secondary)' }}></i></span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Navbar Component
    const renderNavbar = () => (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <i className="fas fa-chart-pie"></i>
                    <span>ExpenseTracker PKR</span>
                </div>

                <button 
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <i className={`fas fa-${mobileMenuOpen ? 'times' : 'bars'}`}></i>
                </button>

                <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
                    <div className="navbar-item">
                        <button 
                            className={`navbar-link ${currentScreen === SCREEN.DASHBOARD ? 'active' : ''}`}
                            onClick={() => navigateTo(SCREEN.DASHBOARD)}
                        >
                            <i className="fas fa-home"></i>
                            <span>Dashboard</span>
                        </button>
                    </div>

                    <div className="navbar-item">
                        <button 
                            className="navbar-link"
                            onMouseEnter={() => setActiveDropdown('expenses')}
                            onClick={() => setActiveDropdown(activeDropdown === 'expenses' ? null : 'expenses')}
                        >
                            <i className="fas fa-money-bill"></i>
                            <span>Expenses</span>
                            <i className="fas fa-chevron-down"></i>
                        </button>
                        <div className={`dropdown-menu ${activeDropdown === 'expenses' ? 'active' : ''}`}>
                            <button className="dropdown-item" onClick={() => navigateTo(SCREEN.ADD)}>
                                <i className="fas fa-plus-circle"></i>
                                Add Expense
                            </button>
                            <button className="dropdown-item" onClick={() => navigateTo(SCREEN.REPORTS)}>
                                <i className="fas fa-chart-bar"></i>
                                View Reports
                            </button>
                            <button className="dropdown-item" onClick={() => {
                                setSearchTerm('');
                                setFilterCategory('all');
                                navigateTo(SCREEN.REPORTS);
                            }}>
                                <i className="fas fa-list"></i>
                                All Expenses
                            </button>
                        </div>
                    </div>

                    <div className="navbar-item">
                        <button 
                            className={`navbar-link ${currentScreen === SCREEN.REPORTS ? 'active' : ''}`}
                            onClick={() => navigateTo(SCREEN.REPORTS)}
                        >
                            <i className="fas fa-chart-pie"></i>
                            <span>Analytics</span>
                        </button>
                    </div>

                    <div className="navbar-item">
                        <button 
                            className={`navbar-link ${currentScreen === SCREEN.SETTINGS ? 'active' : ''}`}
                            onClick={() => navigateTo(SCREEN.SETTINGS)}
                        >
                            <i className="fas fa-cog"></i>
                            <span>Settings</span>
                        </button>
                    </div>
                </div>

                <div className="navbar-actions">
                    <button 
                        className="theme-toggle" 
                        onClick={() => setDarkMode(prev => !prev)}
                        aria-label="Toggle theme"
                    >
                        <i className={`fas fa-${darkMode ? 'sun' : 'moon'}`}></i>
                    </button>
                </div>
            </div>
        </nav>
    );

    // Export Modal
    const renderExportModal = () => {
        if (!isExportModalOpen) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content" ref={modalRef}>
                    <div className="modal-header">
                        <h2>Export Expenses</h2>
                        <button className="modal-close" onClick={() => setIsExportModalOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div className="modal-body">
                        <div className="export-options">
                            <h3>Format</h3>
                            <div className="radio-group">
                                <label>
                                    <input 
                                        type="radio" 
                                        value="json" 
                                        checked={exportFormat === 'json'}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                    />
                                    JSON
                                </label>
                                <label>
                                    <input 
                                        type="radio" 
                                        value="csv" 
                                        checked={exportFormat === 'csv'}
                                        onChange={(e) => setExportFormat(e.target.value)}
                                    />
                                    CSV
                                </label>
                            </div>
                        </div>

                        <div className="export-info">
                            <p>
                                <i className="fas fa-info-circle"></i>
                                {selectedExpenses.length > 0 
                                    ? `Exporting ${selectedExpenses.length} selected expense(s)`
                                    : 'Exporting all expenses'
                                }
                            </p>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-primary" onClick={exportData}>
                                <i className="fas fa-download"></i>
                                Export
                            </button>
                            <button className="btn-secondary" onClick={() => setIsExportModalOpen(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Empty state component
    if (isLoading) {
        return (
            <div className="app-shell">
                {renderNavbar()}
                <main className="main-content">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading your expenses...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-shell">
            {renderNavbar()}
            
            <main className="main-content">
                {currentScreen === SCREEN.DASHBOARD && renderDashboard()}
                {(currentScreen === SCREEN.ADD || currentScreen === SCREEN.EDIT) && renderAddEditForm()}
                {currentScreen === SCREEN.REPORTS && renderReports()}
                {currentScreen === SCREEN.SETTINGS && renderSettings()}
            </main>

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast 
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Export Modal */}
            {renderExportModal()}
        </div>
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);