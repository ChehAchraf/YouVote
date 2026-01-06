import { useState } from 'react'
import { UserButton, SignedIn } from '@clerk/clerk-react'
import VotePage from './components/VotePage'
import StatsPage from './components/StatsPage'

function App() {
    const [activeTab, setActiveTab] = useState('vote')

    return (
        <div className="app-container">
            <header>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Character Voting</h1>
                    <SignedIn>
                        <div style={{ marginLeft: '1rem' }}>
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    </SignedIn>
                </div>
                <nav className="nav">
                    <button
                        className={`nav-button ${activeTab === 'vote' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vote')}
                    >
                        Vote
                    </button>
                    <button
                        className={`nav-button ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Statistics
                    </button>
                </nav>
            </header>

            <main>
                {activeTab === 'vote' ? <VotePage /> : <StatsPage />}
            </main>
        </div>
    )
}

export default App
