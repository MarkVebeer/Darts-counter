class DartsGame {
    constructor() {
        this.players = this.loadPlayers();
        this.initTheme();
        this.init();
    }

    init() {
        this.addPlayerBtn = document.getElementById('addPlayer');
        this.playerNameInput = document.getElementById('playerName');
        this.customGameMode = document.getElementById('customGameMode');
        this.playersContainer = document.getElementById('playersContainer');
        this.themeToggleBtn = document.getElementById('themeToggle');
        this.selectedGameMode = 501; // Default value

        this.addPlayerBtn.addEventListener('click', () => this.addNewPlayer());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewPlayer();
            }
        });
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        
        // Custom dropdown functionality
        this.initCustomDropdown();

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

    initCustomDropdown() {
        if (!this.customGameMode) {
            console.error('Custom game mode dropdown not found');
            return;
        }
        
        const selectSelected = this.customGameMode.querySelector('.select-selected');
        const selectItems = this.customGameMode.querySelector('.select-items');
        const options = selectItems.querySelectorAll('div[data-value]');
        
        if (!selectSelected || !selectItems || !options.length) {
            console.error('Custom dropdown elements not found');
            return;
        }
        
        // Toggle dropdown
        selectSelected.addEventListener('click', () => {
            selectItems.classList.toggle('select-hide');
            selectSelected.classList.toggle('select-arrow-active');
        });
        
        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                const value = parseInt(e.target.getAttribute('data-value'));
                const text = e.target.textContent;
                
                selectSelected.textContent = text;
                this.selectedGameMode = value;
                
                // Close dropdown
                selectItems.classList.add('select-hide');
                selectSelected.classList.remove('select-arrow-active');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.customGameMode.contains(e.target)) {
                selectItems.classList.add('select-hide');
                selectSelected.classList.remove('select-arrow-active');
            }
        });
    }

    addNewPlayer() {
        console.log('Adding new player...');
        const playerName = this.playerNameInput.value.trim();
        const gameMode = this.selectedGameMode;
        
        console.log('Player name:', playerName);
        console.log('Game mode:', gameMode);
        
        if (playerName) {
            // Check if player name already exists
            if (this.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
                this.showNotification('Ez a játékos név már létezik!', 'error');
                return;
            }
            
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
            this.showNotification(`${playerName} játékos hozzáadva! 🎯`, 'success');
        } else {
            this.showNotification('Kérlek add meg a játékos nevét!', 'error');
        }
    }

    deletePlayer(playerId) {
        if (confirm('Biztosan törölni szeretnéd ezt a játékost?')) {
            const player = this.players.find(p => p.id === playerId);
            this.players = this.players.filter(p => p.id !== playerId);
            this.renderAllPlayers();
            this.savePlayers();
            this.showNotification(`${player.name} játékos törölve!`, 'info');
        }
    }

    addThrow(playerId, score) {
        const player = this.players.find(p => p.id === playerId);
        const scoreInput = document.getElementById(`score-${playerId}`);
        
        if (player && score && score.trim() !== '') {
            const scoreNum = parseInt(score);
            if (!isNaN(scoreNum) && scoreNum >= 1 && scoreNum <= 180) {
                // Ellenőrizzük, hogy a dobás érvényes-e
                if (this.isValidThrow(scoreNum, player.isDoubleDown)) {
                    player.throws.push(scoreNum);
                    player.currentScore -= scoreNum;
                    
                    // Ha a pontszám 0 alá menne, visszaállítjuk az előző állapotra
                    if (player.currentScore < 0) {
                        player.currentScore += scoreNum;
                        player.throws.pop();
                        this.showNotification('Túl sok pont! A dobás érvénytelen.', 'error');
                        return;
                    }
                    
                    // Check for win condition
                    if (player.currentScore === 0) {
                        this.showNotification(`🎉 ${player.name} győzött! 🎉`, 'success');
                    }
                    
                    // Clear input field first
                    if (scoreInput) {
                        scoreInput.value = '';
                    }
                    
                    // Store the focused input ID before re-rendering
                    const focusedInputId = `score-${player.id}`;
                    
                    this.renderAllPlayers();
                    this.savePlayers();
                    
                    // Restore focus after re-rendering
                    setTimeout(() => {
                        const newInput = document.getElementById(focusedInputId);
                        if (newInput) {
                            newInput.focus();
                        }
                    }, 50);
                } else {
                    this.showNotification('Érvénytelen dobás! A pontszámnak páros számnak kell lennie a Double Down módban.', 'error');
                }
            } else {
                this.showNotification('Kérlek adj meg egy érvényes pontszámot 1-180 között!', 'error');
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
                this.showNotification(`${deletedScore} pontos dobás törölve!`, 'info');
            }
        }
    }

    renderPlayer(player) {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.setAttribute('data-player-id', player.id);
        playerCard.innerHTML = `
            <div class="player-header">
                <span class="player-name">${player.name}</span>
                <span class="game-mode">${player.gameMode} Pont ${player.isDoubleDown ? '(Double Down)' : ''}</span>
                <button class="delete-player" onclick="game.deletePlayer(${player.id})">Játékos törlése</button>
            </div>
            <div class="score-display">
                <div class="current-score">${player.currentScore}</div>
                <div class="starting-score">Hátralévő pontok</div>
            </div>
            <div class="score-input">
                <input type="number" placeholder="Pontszám (1-180)" min="1" max="180" id="score-${player.id}">
                <button onclick="game.addThrow(${player.id}, document.getElementById('score-${player.id}').value)">Pont hozzáadása</button>
            </div>
            <div class="throws-list">
                <h4>Dobások történet</h4>
                ${player.throws.map((score, index) => `
                    <div class="throw-item">
                        <span>${index + 1}. dobás: ${score} pont</span>
                        <button class="delete-throw" onclick="game.deleteThrow(${player.id}, ${index})">Törlés</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add Enter key event listener to the score input
        setTimeout(() => {
            const scoreInput = document.getElementById(`score-${player.id}`);
            if (scoreInput) {
                scoreInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.addThrow(player.id, scoreInput.value);
                        scoreInput.value = '';
                    }
                });
            }
        }, 0);
        
        return playerCard;
    }

    renderAllPlayers() {
        this.playersContainer.innerHTML = '';
        this.players.forEach(player => {
            this.playersContainer.appendChild(this.renderPlayer(player));
        });
    }

    // Notification system
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('notification-show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
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