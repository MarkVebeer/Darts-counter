class DartsGame {
    constructor() {
        this.players = this.loadPlayers();
        this.initTheme();
        this.init();
    }

    init() {
        this.addPlayerBtn = document.getElementById('addPlayer');
        this.playerNameInput = document.getElementById('playerName');
        this.gameModeSelect = document.getElementById('gameMode');
        this.playersContainer = document.getElementById('playersContainer');
        this.themeToggleBtn = document.getElementById('themeToggle');

        this.addPlayerBtn.addEventListener('click', () => this.addNewPlayer());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewPlayer();
            }
        });
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Kezdeti játékosok betöltése
        this.renderAllPlayers();
    }

    loadPlayers() {
        const savedPlayers = localStorage.getItem('dartsPlayers');
        return savedPlayers ? JSON.parse(savedPlayers) : [];
    }

    savePlayers() {
        localStorage.setItem('dartsPlayers', JSON.stringify(this.players));
    }

    addNewPlayer() {
        const playerName = this.playerNameInput.value.trim();
        const gameMode = parseInt(this.gameModeSelect.value);
        if (playerName) {
            const player = {
                id: Date.now(),
                name: playerName,
                gameMode: gameMode,
                startingScore: gameMode,
                currentScore: gameMode,
                throws: [],
                isDoubleDown: gameMode === 301
            };
            this.players.push(player);
            this.playersContainer.appendChild(this.renderPlayer(player));
            this.playerNameInput.value = '';
            this.savePlayers();
        }
    }

    deletePlayer(playerId) {
        if (confirm('Biztosan törölni szeretnéd ezt a játékost?')) {
            this.players = this.players.filter(p => p.id !== playerId);
            this.renderAllPlayers();
            this.savePlayers();
        }
    }

    addThrow(playerId, score) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            const scoreNum = parseInt(score);
            if (!isNaN(scoreNum)) {
                // Ellenőrizzük, hogy a dobás érvényes-e
                if (this.isValidThrow(scoreNum, player.isDoubleDown)) {
                    player.throws.push(scoreNum);
                    player.currentScore -= scoreNum;
                    
                    // Ha a pontszám 0 alá menne, visszaállítjuk az előző állapotra
                    if (player.currentScore < 0) {
                        player.currentScore += scoreNum;
                        player.throws.pop();
                        alert('Túl sok pont! A dobás érvénytelen.');
                    }
                    
                    this.renderAllPlayers();
                    this.savePlayers();
                } else {
                    alert('Érvénytelen dobás! A pontszámnak oszthatónak kell lennie 2-vel a Double Down módban.');
                }
            }
        }
    }

    isValidThrow(score, isDoubleDown) {
        if (isDoubleDown) {
            return score % 2 === 0;
        }
        return true;
    }

    deleteThrow(playerId, throwIndex) {
        if (confirm('Biztosan törölni szeretnéd ezt a dobást?')) {
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                const deletedScore = player.throws.splice(throwIndex, 1)[0];
                player.currentScore += deletedScore;
                this.renderAllPlayers();
                this.savePlayers();
            }
        }
    }

    renderPlayer(player) {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-header">
                <span class="player-name">${player.name}</span>
                <span class="game-mode">${player.gameMode} Pont ${player.isDoubleDown ? '(Double Down)' : ''}</span>
                <button class="delete-player" onclick="game.deletePlayer(${player.id})">Játékos törlése</button>
            </div>
            <div class="score-display">
                <div class="current-score">Hátralévő pont: ${player.currentScore}</div>
            </div>
            <div class="score-input">
                <input type="number" placeholder="Pontszám" id="score-${player.id}">
                <button onclick="game.addThrow(${player.id}, document.getElementById('score-${player.id}').value)">Pont hozzáadása</button>
            </div>
            <div class="throws-list">
                ${player.throws.map((score, index) => `
                    <div class="throw-item">
                        <span>${index + 1}. dobás: ${score}</span>
                        <button class="delete-throw" onclick="game.deleteThrow(${player.id}, ${index})">Törlés</button>
                    </div>
                `).join('')}
            </div>
        `;
        return playerCard;
    }

    renderAllPlayers() {
        this.playersContainer.innerHTML = '';
        this.players.forEach(player => {
            this.playersContainer.appendChild(this.renderPlayer(player));
        });
    }

    // Theme management methods
    initTheme() {
        const savedTheme = localStorage.getItem('dartsTheme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dartsTheme', theme);
        
        // Update the theme toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
}

const game = new DartsGame(); 