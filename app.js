const { useState, useEffect, useRef, useMemo, useCallback } = React;

const SCREEN = {
  DASHBOARD: "dashboard",
  ADD: "add",
  LIST: "list",
  DETAIL: "detail",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
};

const mockFetchExpenses = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: crypto.randomUUID(),
          title: "Groceries",
          amount: 42.5,
          category: "Food",
          date: new Date().toISOString().split("T")[0],
          createdAt: Date.now() - 120000,
        },
        {
          id: crypto.randomUUID(),
          title: "Internet Bill",
          amount: 30,
          category: "Utilities",
          date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
          createdAt: Date.now() - 3600000,
        },
      ]);
    }, 500);
  });

function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREEN.DASHBOARD);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  });

  const titleInputRef = useRef(null);

  // Load initial data from a mock API on app startup.
  useEffect(() => {
    let mounted = true;

    const loadExpenses = async () => {
      const apiExpenses = await mockFetchExpenses();
      if (mounted) {
        setExpenses(apiExpenses);
        setIsLoading(false);
      }
    };

    loadExpenses();
    return () => {
      mounted = false;
    };
  }, []);

  // Keep body class in sync with theme.
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  // Auto focus title field when Add screen opens.
  useEffect(() => {
    if (currentScreen === SCREEN.ADD && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [currentScreen]);

  // Expensive-ish totals are memoized.
  const totalExpenses = useMemo(
    () =>
      expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const todayString = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todayExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date === todayString)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses, todayString]
  );

  const categoryTotals = useMemo(() => {
    return expenses.reduce((result, expense) => {
      result[expense.category] = (result[expense.category] || 0) + Number(expense.amount);
      return result;
    }, {});
  }, [expenses]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExpense = useCallback(
    (event) => {
      event.preventDefault();
      if (!formData.title.trim() || !formData.amount) {
        return;
      }

      const newExpense = {
        id: crypto.randomUUID(),
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        createdAt: Date.now(),
      };

      setExpenses((prev) => [newExpense, ...prev]);
      setFormData({
        title: "",
        amount: "",
        category: "Food",
        date: new Date().toISOString().split("T")[0],
      });
      setCurrentScreen(SCREEN.LIST);
    },
    [formData]
  );

  const handleDeleteExpense = useCallback((expenseId) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
    setSelectedExpense((prev) => (prev?.id === expenseId ? null : prev));
  }, []);

  const openDetail = (expense) => {
    setSelectedExpense(expense);
    setCurrentScreen(SCREEN.DETAIL);
  };

  const goTo = (screen) => setCurrentScreen(screen);

  const renderDashboard = () => (
    <section className="screen fade-in">
      <h1>Expense Tracker</h1>
      <div className="card-grid">
        <article className="card stat">
          <h2>Total Expenses</h2>
          <p>${totalExpenses.toFixed(2)}</p>
        </article>
        <article className="card stat success">
          <h2>Today's Expenses</h2>
          <p>${todayExpenses.toFixed(2)}</p>
        </article>
      </div>
      <div className="action-grid">
        <button onClick={() => goTo(SCREEN.ADD)}>Add Expense</button>
        <button onClick={() => goTo(SCREEN.LIST)}>Expense List</button>
        <button onClick={() => goTo(SCREEN.ANALYTICS)}>Analytics</button>
        <button onClick={() => goTo(SCREEN.SETTINGS)}>Settings</button>
      </div>
    </section>
  );

  const renderAddExpense = () => (
    <section className="screen slide-in">
      <h1>Add Expense</h1>
      <form className="card form-card" onSubmit={handleAddExpense}>
        <label>
          Title
          <input
            ref={titleInputRef}
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g. Taxi fare"
            required
          />
        </label>
        <label>
          Amount
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            required
          />
        </label>
        <label>
          Category
          <select name="category" value={formData.category} onChange={handleInputChange}>
            <option>Food</option>
            <option>Transport</option>
            <option>Utilities</option>
            <option>Entertainment</option>
            <option>Health</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Date
          <input name="date" type="date" value={formData.date} onChange={handleInputChange} required />
        </label>
        <div className="row">
          <button type="submit" className="success-btn">Save Expense</button>
          <button type="button" className="ghost" onClick={() => goTo(SCREEN.DASHBOARD)}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );

  const renderExpenseList = () => (
    <section className="screen fade-in">
      <div className="row heading-row">
        <h1>Expense List</h1>
        <button className="ghost" onClick={() => goTo(SCREEN.DASHBOARD)}>
          Back
        </button>
      </div>
      {expenses.length === 0 ? (
        <article className="card empty">No expenses yet. Add one to get started.</article>
      ) : (
        <div className="list">
          {expenses.map((expense) => (
            <article key={expense.id} className="card item-card pop-in">
              <div className="item-main" role="button" tabIndex={0} onClick={() => openDetail(expense)}>
                <h3>{expense.title}</h3>
                <p>{expense.category}</p>
                <small>{expense.date}</small>
              </div>
              <div className="item-side">
                <strong>${Number(expense.amount).toFixed(2)}</strong>
                <button className="danger-btn" onClick={() => handleDeleteExpense(expense.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderExpenseDetail = () => (
    <section className="screen fade-in">
      <h1>Expense Detail</h1>
      {!selectedExpense ? (
        <article className="card empty">Select an expense from the list first.</article>
      ) : (
        <article className="card detail-card">
          <p>
            <span>Title:</span> {selectedExpense.title}
          </p>
          <p>
            <span>Amount:</span> ${Number(selectedExpense.amount).toFixed(2)}
          </p>
          <p>
            <span>Category:</span> {selectedExpense.category}
          </p>
          <p>
            <span>Date:</span> {selectedExpense.date}
          </p>
        </article>
      )}
      <button onClick={() => goTo(SCREEN.LIST)} className="ghost">
        Back to List
      </button>
    </section>
  );

  const renderAnalytics = () => (
    <section className="screen fade-in">
      <div className="row heading-row">
        <h1>Analytics</h1>
        <button className="ghost" onClick={() => goTo(SCREEN.DASHBOARD)}>
          Back
        </button>
      </div>
      <div className="card analytics-card">
        {Object.keys(categoryTotals).length === 0 ? (
          <p>No expenses yet.</p>
        ) : (
          Object.entries(categoryTotals).map(([category, amount]) => (
            <div key={category} className="analytics-row">
              <span>{category}</span>
              <strong>${amount.toFixed(2)}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="screen fade-in">
      <div className="row heading-row">
        <h1>Settings</h1>
        <button className="ghost" onClick={() => goTo(SCREEN.DASHBOARD)}>
          Back
        </button>
      </div>
      <article className="card settings-card">
        <p>Theme</p>
        <button onClick={() => setDarkMode((prev) => !prev)}>
          Switch to {darkMode ? "Light" : "Dark"} Mode
        </button>
      </article>
    </section>
  );

  return (
    <main className="app-shell">
      {isLoading ? (
        <section className="screen fade-in">
          <article className="card empty">Loading expenses...</article>
        </section>
      ) : (
        <>
          {currentScreen === SCREEN.DASHBOARD && renderDashboard()}
          {currentScreen === SCREEN.ADD && renderAddExpense()}
          {currentScreen === SCREEN.LIST && renderExpenseList()}
          {currentScreen === SCREEN.DETAIL && renderExpenseDetail()}
          {currentScreen === SCREEN.ANALYTICS && renderAnalytics()}
          {currentScreen === SCREEN.SETTINGS && renderSettings()}
        </>
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
