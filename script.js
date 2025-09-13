class DartsGame {
    constructor() {
        this.players = this.loadPlayers();
        this.init();
    }

    init() {
        this.addPlayerBtn = document.getElementById('addPlayer');
        this.playerNameInput = document.getElementById('playerName');
        this.gameModeSelect = document.getElementById('gameMode');
        this.playersContainer = document.getElementById('playersContainer');

        this.addPlayerBtn.addEventListener('click', () => this.addNewPlayer());
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addNewPlayer();
            }
        });

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
                // Érvényesítjük a pontszám tartományát
                if (scoreNum < 0 || scoreNum > 180) {
                    alert('Érvénytelen pontszám! A pontszámnak 0 és 180 között kell lennie.');
                    return;
                }

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

        const totalThrows = player.throws.length;
        const averageScore = totalThrows > 0 ? (player.throws.reduce((a, b) => a + b, 0) / totalThrows).toFixed(2) : 0;

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
                <input type="number" placeholder="Pontszám" id="score-${player.id}" onkeypress="if(event.key === 'Enter') game.addThrow(${player.id}, this.value)">
                <button onclick="game.addThrow(${player.id}, document.getElementById('score-${player.id}').value)">Pont hozzáadása</button>
            </div>
            <div class="throws-list">
                <button class="show-throws-popup" onclick="game.showThrowsPopup(${player.id})">Dobások megjelenítése</button>
                <span class="throw-stats">
                    <span style="display: flex; align-items: center; gap: 5px;"><img src="icons/average.png" alt="Average" style="width: 32px; height: 32px;"> <span style="font-size: 1.5rem; color: #ffffff;">${averageScore}</span></span>
                    <span style="display: flex; align-items: center; gap: 5px;"><img src="icons/throw.png" alt="Throw" style="width: 32px; height: 32px;"> <span style="font-size: 1.5rem; color: #ffffff;">${totalThrows}</span></span>
                </span>
            </div>
        `;
        return playerCard;
    }

    showThrowsPopup(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;

        // Létrehozunk egy popup overlay-t
        let overlay = document.createElement('div');
        overlay.className = 'throws-popup-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        // Popup tartalom
        let popup = document.createElement('div');
    popup.className = 'throws-popup';
    popup.style.background = '#19183B';
    popup.style.color = '#E7F2EF';
    popup.style.padding = '24px';
    popup.style.borderRadius = '8px';
    popup.style.minWidth = '280px';
    popup.style.maxWidth = '60vw';
    popup.style.maxHeight = '80vh';
    popup.style.overflowY = 'auto';

        if (window.innerWidth <= 767) {
            popup.style.width = '100vw'; /* Full width for phones */
            popup.style.maxWidth = 'none'; /* Remove max-width restrictions */
            popup.style.margin = '0'; /* Remove margins */
            popup.style.left = '0'; /* Align to the left edge */
        } else {
            popup.style.width = '60vw'; /* Default width for larger screens */
            popup.style.maxWidth = ''; /* Reset max-width */
            popup.style.margin = ''; /* Reset margins */
            popup.style.left = ''; /* Reset alignment */
        }

        popup.innerHTML = `
            <div style="position: relative;">
                <button style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 24px; font-weight: bold; color: #A1C2BD; cursor: pointer; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center;" onclick="document.body.removeChild(this.closest('.throws-popup-overlay'))">&times;</button>
                <h2 style="margin: 0 40px 16px 0; color:#A1C2BD;">${player.name} dobásai</h2>
                <div class="throws-list-popup">
                    ${player.throws.length === 0 ? '<em>Nincs dobás.</em>' : `
                        <table class="throws-table" style="width:100%;border-collapse:collapse;background:#19183B;">
                            <thead>
                                <tr>
                                    <th style="padding:8px 16px; border-bottom:2px solid #A1C2BD; text-align:center; color:#A1C2BD;">#</th>
                                    <th style="padding:8px 16px; border-bottom:2px solid #A1C2BD; text-align:center; color:#A1C2BD;">Dobás</th>
                                    <th style="padding:8px 16px; border-bottom:2px solid #A1C2BD; text-align:center; color:#A1C2BD;"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${player.throws.map((score, index) => `
                                    <tr style="border-bottom:1px solid #708993;">
                                        <td style="padding:8px 16px; text-align:center; color:#E7F2EF;">${index + 1}</td>
                                        <td style="padding:8px 16px; text-align:center; font-weight:bold; color:#A1C2BD;">${score}</td>
                                        <td style="padding:8px 16px; text-align:center;">
                                            <img src="icons/pencil.png" alt="Edit" style="cursor:pointer; width:28px; height:28px; margin-right:8px;" onclick="game.editThrowPrompt(${player.id}, ${index}, this)">
                                            <img src="icons/trash.png" alt="Delete" style="cursor:pointer; width:28px; height:28px;" onclick="game.deleteThrowPopup(${player.id}, ${index}, this)">
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;

        if (window.innerWidth <= 767) {
            const maxRows = 5; // Maximum rows before scrolling
            const tableBody = popup.querySelector('.throws-table tbody');
            if (tableBody) {
                const rows = tableBody.querySelectorAll('tr');
                if (rows.length > maxRows) {
                    tableBody.style.maxHeight = `${maxRows * 4}em`; // Adjust height based on row size
                    tableBody.style.overflowY = 'auto'; // Enable vertical scrolling
                }
            }

            const editButtons = popup.querySelectorAll('.throws-table td img[alt="Edit"]');
            const deleteButtons = popup.querySelectorAll('.throws-table td img[alt="Delete"]');

            [...editButtons, ...deleteButtons].forEach(button => {
                button.style.display = 'block'; // Make buttons block-level
                button.style.margin = '0 auto'; // Center buttons horizontally
            });

            editButtons.forEach(button => {
                button.style.marginBottom = '5px'; // Add spacing below edit buttons
            });
        } else {
            const tableBody = popup.querySelector('.throws-table tbody');
            if (tableBody) {
                const rows = tableBody.querySelectorAll('tr');
                const maxRows = 6; // Maximum rows to determine height
                const tableHeight = maxRows * 2.5; // Calculate height based on row size

                tableBody.style.maxHeight = `${tableHeight}em`; // Set maximum height
                tableBody.style.overflowY = 'auto'; // Enable scrolling

                // Ensure consistent height even if rows are fewer than maxRows
                tableBody.style.height = `${tableHeight}em`; // Set fixed height
            }
        }

        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

    editThrowPrompt(playerId, throwIndex, btn) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            const currentScore = player.throws[throwIndex];
            const newScore = window.prompt('Új pontszám:', currentScore);
            if (newScore !== null) {
                const scoreNum = parseInt(newScore);
                if (!isNaN(scoreNum)) {
                    // Frissítjük a dobást és újraszámoljuk a score-t
                    player.throws[throwIndex] = scoreNum;
                    player.currentScore = player.startingScore - player.throws.reduce((a, b) => a + b, 0);
                    this.savePlayers();
                    // Frissítjük a popupot
                    document.body.removeChild(btn.closest('.throws-popup-overlay'));
                    this.showThrowsPopup(playerId);
                    this.renderAllPlayers();
                } else {
                    alert('Érvénytelen pontszám!');
                }
            }
        }
    }

    // Ezt a metódust már nem használjuk, helyette editThrowPrompt van

    deleteThrowPopup(playerId, throwIndex, btn) {
        if (confirm('Biztosan törölni szeretnéd ezt a dobást?')) {
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                const deletedScore = player.throws.splice(throwIndex, 1)[0];
                player.currentScore = player.startingScore - player.throws.reduce((a, b) => a + b, 0);
                this.savePlayers();
                // Frissítjük a popupot
                document.body.removeChild(btn.closest('.throws-popup-overlay'));
                this.showThrowsPopup(playerId);
                this.renderAllPlayers();
            }
        }
    }

    renderAllPlayers() {
        this.playersContainer.innerHTML = '';
        this.players.forEach(player => {
            this.playersContainer.appendChild(this.renderPlayer(player));
        });
    }
    // Dobások lenyitása/összecsukása
    toggleThrows(button) {
        const hiddenDiv = button.nextElementSibling;
        if (hiddenDiv.style.display === 'none') {
            hiddenDiv.style.display = 'block';
            button.textContent = 'Kevesebb dobás ▲';
        } else {
            hiddenDiv.style.display = 'none';
            button.textContent = `További dobások (${hiddenDiv.children.length}) ▼`;
        }
    }
}

const game = new DartsGame();