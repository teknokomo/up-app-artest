/**
 * State Manager - Finite State Machine (FSM) для управления состояниями приложения
 * 
 * Реализует паттерн FSM для управления различными состояниями приложения AR-Квиз,
 * обрабатывает переходы между состояниями и связанные события.
 */

class StateManager {
    constructor() {
        // Определение состояний
        this.states = {
            LOADING: 'loading',
            NAME_INPUT: 'name_input',
            START: 'start',
            SUBJECT_SELECTION: 'subject_selection',
            LEVEL_SELECTION: 'level_selection',
            AR_INSTRUCTIONS: 'ar_instructions',
            GAME: 'game',
            RESULTS: 'results',
            LEADERBOARD: 'leaderboard'
        };
        
        // Текущее состояние
        this.currentState = this.states.LOADING;
        
        // Данные приложения
        this.appData = {
            playerName: 'Игрок',
            selectedSubject: null,
            selectedLevel: null,
            score: 0,
            maxQuestions: 10,
            currentQuestionIndex: 0,
            leaderboard: this._loadLeaderboard(),
            arMode: 'location' // 'location' или 'marker'
        };
        
        // Обработчики событий для каждого состояния
        this.eventHandlers = {};
        
        // Подписчики на изменения состояния
        this.subscribers = [];
        
        // Флаг инициализации
        this.initialized = false;
    }
    
    /**
     * Инициализация менеджера состояний
     */
    init() {
        console.log('Initializing State Manager...');
        
        if (this.initialized) {
            console.warn('State Manager already initialized');
            return;
        }
        
        // Скрыть все экраны, кроме загрузочного
        document.querySelectorAll('.screen').forEach(screen => {
            if (screen.id !== 'loading-screen') {
                screen.classList.add('hidden');
            }
        });
        document.getElementById('loading-screen').classList.remove('hidden');
        
        // Инициализация обработчиков событий
        this._setupEventListeners();
        
        // Переход к экрану ввода имени после загрузки
        setTimeout(() => {
            this.transitionTo(this.states.NAME_INPUT);
        }, 2000);
        
        this.initialized = true;
        console.log('State Manager initialized successfully');
    }
    
    /**
     * Установка значения состояния
     * @param {string} key - Ключ состояния
     * @param {*} value - Значение состояния
     */
    setState(key, value) {
        if (this.appData.hasOwnProperty(key)) {
            this.appData[key] = value;
            
            // Уведомляем подписчиков об изменении
            this._notifySubscribers('stateChanged', this.currentState, { key, value });
            
            // Если изменение касается прогресса, сохраняем данные
            if (key === 'leaderboard') {
                this._saveLeaderboard();
            }
            
            return true;
        }
        
        console.warn(`Unknown state key: ${key}`);
        return false;
    }
    
    /**
     * Получение значения состояния
     * @param {string} key - Ключ состояния
     * @returns {*} - Значение состояния
     */
    getState(key) {
        if (this.appData.hasOwnProperty(key)) {
            return this.appData[key];
        }
        
        console.warn(`Unknown state key: ${key}`);
        return null;
    }
    
    /**
     * Установка выбранного режима AR
     * @param {string} mode - Режим AR ('location' или 'marker')
     */
    setARMode(mode) {
        if (mode !== 'location' && mode !== 'marker') {
            console.warn(`Invalid AR mode: ${mode}`);
            return false;
        }
        
        this.setState('arMode', mode);
        return true;
    }
    
    /**
     * Получение выбранного режима AR
     * @returns {string} - Режим AR ('location' или 'marker')
     */
    getARMode() {
        return this.getState('arMode');
    }
    
    /**
     * Переход к новому состоянию
     * @param {string} newState - Новое состояние
     * @param {Object} data - Дополнительные данные для перехода
     */
    transitionTo(newState, data = {}) {
        console.log(`Transitioning from ${this.currentState} to ${newState}`);
        
        // Сохраняем предыдущее состояние
        const prevState = this.currentState;
        
        // Вызываем exit-обработчик для текущего состояния
        this._executeHandler('exit', prevState, { nextState: newState, ...data });
        
        // Обновляем текущее состояние
        this.currentState = newState;
        
        // Вызываем enter-обработчик для нового состояния
        this._executeHandler('enter', newState, { prevState, ...data });
        
        // Обновляем UI на основе нового состояния
        this._updateUI(newState, prevState);
        
        // Уведомляем подписчиков об изменении состояния, используя тип 'stateChanged'
        this._notifySubscribers('stateChanged', newState, { prevState, ...data });
    }
    
    /**
     * Отправка события в текущее состояние
     * @param {string} eventName - Название события
     * @param {Object} data - Данные события
     */
    dispatch(eventName, data = {}) {
        console.log(`Dispatching event ${eventName} in state ${this.currentState}`);
        this._executeHandler(eventName, this.currentState, data);
    }
    
    /**
     * Регистрация обработчика события для состояния
     * @param {string} state - Состояние
     * @param {string} eventName - Название события
     * @param {Function} handler - Функция-обработчик
     */
    registerHandler(state, eventName, handler) {
        if (!this.eventHandlers[state]) {
            this.eventHandlers[state] = {};
        }
        
        this.eventHandlers[state][eventName] = handler;
    }
    
    /**
     * Подписка на изменения состояний или событий
     * @param {string} eventType - Тип события (stateChanged, eventName, etc)
     * @param {Function} callback - Функция обратного вызова
     */
    on(eventType, callback) {
        if (typeof callback !== 'function') {
            console.error('Callback must be a function');
            return () => {};
        }
        
        this.subscribers.push({ eventType, callback });
        
        // Возвращаем функцию отписки
        return () => {
            this.subscribers = this.subscribers.filter(
                sub => !(sub.eventType === eventType && sub.callback === callback)
            );
        };
    }
    
    /**
     * Обновление данных приложения
     * @param {Object} data - Обновляемые данные
     */
    updateAppData(data) {
        this.appData = { ...this.appData, ...data };
        
        // Если обновляются данные, связанные с прогрессом - сохраняем
        if (data.leaderboard) {
            this._saveLeaderboard();
        }
    }
    
    /**
     * Возвращает текущие данные приложения
     * @returns {Object} - Данные приложения
     */
    getAppData() {
        return { ...this.appData };
    }
    
    /**
     * Сброс игровой сессии
     */
    resetGameSession() {
        this.updateAppData({
            score: 0,
            currentQuestionIndex: 0
        });
    }
    
    /**
     * Загрузка таблицы лидеров из localStorage
     * @private
     */
    _loadLeaderboard() {
        const defaultLeaderboard = [
            { name: 'Герой AR', score: 18 },
            { name: 'Виртуоз Квиза', score: 16 },
            { name: 'Профи Геологии', score: 14 },
            { name: 'Знаток Ботаники', score: 12 },
            { name: 'Мастер Анатомии', score: 10 }
        ];
        let loadedData = defaultLeaderboard;
        try {
            const savedLeaderboard = localStorage.getItem('arQuizLeaderboard');
            console.log('[Debug] Loaded leaderboard from localStorage:', savedLeaderboard);
            const parsed = savedLeaderboard ? JSON.parse(savedLeaderboard) : defaultLeaderboard;
            loadedData = Array.isArray(parsed) ? parsed : defaultLeaderboard;
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            loadedData = defaultLeaderboard;
        }
        console.log('[Debug] _loadLeaderboard returning:', loadedData);
        return loadedData;
    }
    
    /**
     * Сохранение таблицы лидеров в localStorage
     * @private
     */
    _saveLeaderboard() {
        try {
            localStorage.setItem('arQuizLeaderboard', JSON.stringify(this.appData.leaderboard));
        } catch (error) {
            console.error('Error saving leaderboard:', error);
        }
    }
    
    /**
     * Добавление результата в таблицу лидеров и сортировка
     * @param {string} name - Имя игрока
     * @param {number} score - Результат игрока
     */
    addResultToLeaderboard(name, score) {
        console.log(`[Debug] addResultToLeaderboard called with Name: ${name}, Score: ${score}`);
        const leaderboard = [...(this.appData.leaderboard || [])];
        console.log('[Debug] Leaderboard before adding:', JSON.parse(JSON.stringify(leaderboard)));
        
        // Добавляем новый результат
        leaderboard.push({ name, score });
        // Сортируем по убыванию очков
        leaderboard.sort((a, b) => b.score - a.score);
        // Оставляем только топ-10 (или другое число)
        const topN = 10;
        this.appData.leaderboard = leaderboard.slice(0, topN);
        
        console.log('[Debug] Leaderboard after adding & sorting:', JSON.parse(JSON.stringify(this.appData.leaderboard)));
        // Сохраняем обновленную таблицу
        this.setState('leaderboard', this.appData.leaderboard);
    }
    
    /**
     * Выполнение обработчика события для состояния
     * @param {string} eventName - Название события
     * @param {string} state - Состояние
     * @param {Object} data - Данные события
     * @private
     */
    _executeHandler(eventName, state, data) {
        if (this.eventHandlers[state] && this.eventHandlers[state][eventName]) {
            this.eventHandlers[state][eventName](data);
        }
    }
    
    /**
     * Обновление UI на основе текущего состояния
     * @param {string} newState - Новое состояние
     * @param {string} prevState - Предыдущее состояние
     * @private
     */
    _updateUI(newState, prevState) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Скрываем игровой UI
        document.getElementById('game-ui').classList.add('hidden');
        
        // Показываем соответствующий экран для текущего состояния
        switch (newState) {
            case this.states.LOADING:
                document.getElementById('loading-screen').classList.remove('hidden');
                break;
            case this.states.NAME_INPUT:
                document.getElementById('name-input-screen').classList.remove('hidden');
                break;
            case this.states.START:
                document.getElementById('start-screen').classList.remove('hidden');
                break;
            case this.states.SUBJECT_SELECTION:
                document.getElementById('subject-screen').classList.remove('hidden');
                break;
            case this.states.LEVEL_SELECTION:
                this._populateLevels();
                document.getElementById('level-screen').classList.remove('hidden');
                break;
            case this.states.AR_INSTRUCTIONS:
                document.getElementById('ar-instructions-screen').classList.remove('hidden');
                break;
            case this.states.GAME:
                document.getElementById('game-ui').classList.remove('hidden');
                // Обновляем текст вопроса и счёт
                this._updateGameUI();
                break;
            case this.states.RESULTS:
                document.getElementById('results-screen').classList.remove('hidden');
                break;
            case this.states.LEADERBOARD:
                document.getElementById('leaderboard-screen').classList.remove('hidden');
                break;
        }
    }
    
    /**
     * Настройка обработчиков событий UI
     * @private
     */
    _setupEventListeners() {
        // Кнопка "Продолжить" после ввода имени
        const submitNameBtn = document.getElementById('submitName');
        if (submitNameBtn) {
            submitNameBtn.addEventListener('click', () => {
                const playerNameInput = document.getElementById('playerName');
                const playerName = playerNameInput.value.trim();
                if (playerName) {
                    this.setState('playerName', playerName);
                    this.transitionTo(this.states.START); 
                } else {
                    // Можно добавить уведомление, что имя не введено
                    playerNameInput.focus(); 
                    playerNameInput.style.borderColor = 'red';
                    setTimeout(() => { playerNameInput.style.borderColor = '#ccc'; }, 1500);
                }
            });
        }
        
        // Кнопки выбора режима (новый интерфейс)
        const startMarkerBtn = document.getElementById('start-marker');
        const startLocationBtn = document.getElementById('start-location');
        
        if (startMarkerBtn) {
            startMarkerBtn.addEventListener('click', () => {
                this.setState('arMode', 'marker');
                this.transitionTo(this.states.SUBJECT_SELECTION);
            });
        }
        
        if (startLocationBtn) {
            startLocationBtn.addEventListener('click', () => {
                this.setState('arMode', 'location');
                this.transitionTo(this.states.SUBJECT_SELECTION);
            });
        }
        
        // Выбор предмета
        document.querySelectorAll('.subject-card').forEach(card => {
            card.addEventListener('click', (event) => {
                const subject = event.currentTarget.getAttribute('data-subject');
                this.updateAppData({ selectedSubject: subject });
                this.transitionTo(this.states.LEVEL_SELECTION);
            });
        });
        
        // Кнопка "Назад к предметам"
        const backToSubjectsBtn = document.getElementById('back-to-subjects');
        if (backToSubjectsBtn) {
            backToSubjectsBtn.addEventListener('click', () => {
                this.transitionTo(this.states.SUBJECT_SELECTION);
            });
        }
        
        // Кнопка "Начать AR"
        const startArBtn = document.getElementById('start-ar');
        if (startArBtn) {
            startArBtn.addEventListener('click', () => {
                this.transitionTo(this.states.GAME);
            });
        }
        
        // Кнопка "Выйти из игры"
        const exitGameBtn = document.getElementById('exit-game');
        if (exitGameBtn) {
            exitGameBtn.addEventListener('click', () => {
                this.transitionTo(this.states.LEVEL_SELECTION);
            });
        }
        
        // Кнопка "Играть снова"
        const restartGameBtn = document.getElementById('restart-game');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                this.resetGameSession();
                this.transitionTo(this.states.AR_INSTRUCTIONS);
            });
        }
        
        // Кнопка "Главное меню"
        const returnToMenuBtn = document.getElementById('return-to-menu');
        if (returnToMenuBtn) {
            returnToMenuBtn.addEventListener('click', () => {
                this.transitionTo(this.states.START);
            });
        }
        
        // Кнопка "Таблица лидеров"
        const showLeaderboardBtn = document.getElementById('show-leaderboard');
        if (showLeaderboardBtn) {
            showLeaderboardBtn.addEventListener('click', () => {
                this.transitionTo(this.states.LEADERBOARD);
            });
        }
        
        // Кнопка "Назад к результатам" из таблицы лидеров
        const backToResultsBtn = document.getElementById('back-to-results');
        if (backToResultsBtn) {
            backToResultsBtn.addEventListener('click', () => {
                this.transitionTo(this.states.RESULTS);
            });
        }
        
        // Кнопка "Главное меню" из таблицы лидеров
        const leaderboardReturnToMenuBtn = document.getElementById('leaderboard-return-to-menu');
        if (leaderboardReturnToMenuBtn) {
            leaderboardReturnToMenuBtn.addEventListener('click', () => {
                this.transitionTo(this.states.START);
            });
        }
    }
    
    /**
     * Заполнение сетки уровней на основе выбранного предмета
     * @private
     */
    _populateLevels() {
        const levelGrid = document.querySelector('.level-grid');
        const subject = this.appData.selectedSubject;
        
        if (!subject) return;
        
        // Очистка сетки
        levelGrid.innerHTML = '';
        
        // Заполнение уровнями
        const userLevels = this.appData.leaderboard.subjects[subject].levels;
        
        for (let i = 0; i < 10; i++) {
            const levelItem = document.createElement('div');
            levelItem.className = 'level-item';
            levelItem.textContent = i + 1;
            
            // Проверяем доступность уровня
            const isLocked = i > 0 && userLevels[i - 1] === 0;
            
            if (userLevels[i] > 0) {
                levelItem.classList.add('completed');
            } else if (isLocked) {
                levelItem.classList.add('locked');
            }
            
            if (!isLocked) {
                levelItem.addEventListener('click', () => {
                    this.updateAppData({ selectedLevel: i });
                    this.transitionTo(this.states.AR_INSTRUCTIONS);
                });
            }
            
            levelGrid.appendChild(levelItem);
        }
    }
    
    /**
     * Обновление игрового UI
     * @private
     */
    _updateGameUI() {
        const questionText = document.getElementById('question-text');
        const currentScore = document.getElementById('current-score');
        const totalQuestions = document.getElementById('total-questions');
        
        // Получение текущего вопроса из QuizData
        const quizData = window.quizData;
        if (quizData) {
            const currentQuestion = quizData.getCurrentQuestion();
            if (currentQuestion) {
                questionText.textContent = currentQuestion.text;
            }
        }
        
        currentScore.textContent = this.appData.score;
        totalQuestions.textContent = this.appData.maxQuestions;
    }
    
    /**
     * Уведомление подписчиков о событии или изменении состояния
     * @param {string} eventType - Тип события
     * @param {string} state - Текущее состояние
     * @param {Object} data - Данные события
     * @private
     */
    _notifySubscribers(eventType, state, data = {}) {
        this.subscribers.forEach(subscriber => {
            if (subscriber.eventType === eventType) {
                subscriber.callback({ 
                    type: eventType, // Теперь это будет 'stateChanged'
                    state,          // Передаем текущее новое состояние
                    data, 
                    appData: this.appData 
                });
            }
        });
    }
}

// Создаем глобальный экземпляр менеджера состояний
window.stateManager = new StateManager(); 