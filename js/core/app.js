/**
 * App - Основной модуль приложения AR-Квиз
 * 
 * Инициализирует и связывает компоненты приложения, управляет
 * взаимодействием между менеджером состояний, AR системой и данными квиза.
 */

class App {
    constructor() {
        // Ссылки на основные модули
        this.stateManager = null;
        this.arSystem = null;
        this.quizData = null;
        
        // Режим AR
        this.arMode = 'location'; // 'location' или 'marker'
        
        // Флаг инициализации
        this.initialized = false;
    }
    
    /**
     * Инициализация приложения
     */
    init() {
        console.log('Initializing AR-Квиз Application...');
        
        // Получаем ссылки на глобальные экземпляры модулей
        this.stateManager = window.stateManager;
        this.arSystem = window.arSystem;
        this.quizData = window.quizData;
        
        // Проверяем доступность всех модулей
        if (!this.stateManager || !this.arSystem || !this.quizData) {
            console.error('Required modules are not available');
            this._showNotification('Ошибка инициализации!', 'error');
            return false;
        }
        
        // Инициализируем основные компоненты (AR-систему инициализируем позже)
        this.stateManager.init();
        this.quizData.init();
        
        // Настраиваем обработчики событий
        this._setupEventListeners();
        
        this.initialized = true;
        console.log('AR-Квиз Application initialized successfully');
        return true;
    }
    
    /**
     * Запуск приложения
     */
    start() {
        console.log('Starting AR-Квиз Application...');
        
        if (!this.initialized) {
            if (!this.init()) {
                return false;
            }
        }
        
        // Убираем ручное управление экранами отсюда.
        // StateManager сам покажет нужный экран (NAME_INPUT) после загрузки.
        // this._hideAllScreens();
        // document.getElementById('start-screen').classList.remove('hidden');
        
        console.log('AR-Квиз Application started successfully');
        return true;
    }
    
    /**
     * Настройка обработчиков событий
     */
    _setupEventListeners() {
        // Новые кнопки выбора режима
        document.getElementById('start-marker').addEventListener('click', () => this._onMarkerModeSelected());
        document.getElementById('start-location').addEventListener('click', () => this._onLocationModeSelected());
        
        // Кнопки для маркерного режима
        document.getElementById('start-marker-ar').addEventListener('click', () => this._showSubjectsScreen());
        document.getElementById('back-to-start').addEventListener('click', () => this._showStartScreen());
        
        // Кнопки навигации
        document.getElementById('back-to-subjects').addEventListener('click', () => this._showSubjectsScreen());
        document.getElementById('start-ar').addEventListener('click', () => this._startARExperience());
        document.getElementById('exit-game').addEventListener('click', () => this._exitGame());
        document.getElementById('restart-game').addEventListener('click', () => this._restartGame());
        document.getElementById('return-to-menu').addEventListener('click', () => this._returnToMenu());
        
        // Кнопка переключения режима отладки
        document.getElementById('debug-toggle').addEventListener('click', () => this._toggleDebugMode());
        
        // Кнопка переключения якоря (только для безмаркерного режима)
        document.getElementById('anchor-toggle').addEventListener('click', () => this._toggleAnchorMode());
        
        // Обработчики для карточек предметов
        const subjectCards = document.querySelectorAll('.subject-card');
        subjectCards.forEach(card => {
            card.addEventListener('click', () => this._onSubjectSelected(card.dataset.subject));
        });
        
        // Подписываемся на события состояний для обновления UI
        this.stateManager.on('stateChanged', (event) => this._handleStateChange(event));
        
        // Подписываемся на события AR-системы
        this.arSystem.on('objectSelected', (data) => this._handleObjectSelection(data));
        
        console.log('Event listeners set up');
    }
    
    /**
     * Обработчик выбора маркерного режима
     */
    _onMarkerModeSelected() {
        console.log('Marker mode selected');
        this.arMode = 'marker';
        this.stateManager.setState('arMode', 'marker');
        this._showMarkerInstructions();
    }
    
    /**
     * Обработчик выбора безмаркерного режима
     */
    _onLocationModeSelected() {
        console.log('Location mode selected');
        this.arMode = 'location';
        this.stateManager.setState('arMode', 'location');
        this._showSubjectsScreen();
    }
    
    /**
     * Показ инструкций для маркерного режима
     */
    _showMarkerInstructions() {
        this._hideAllScreens();
        document.getElementById('marker-instructions-screen').classList.remove('hidden');
    }
    
    /**
     * Показ стартового экрана
     */
    _showStartScreen() {
        this._hideAllScreens();
        document.getElementById('start-screen').classList.remove('hidden');
    }
    
    /**
     * Переключение режима отладки
     */
    _toggleDebugMode() {
        const isDebugEnabled = this.arSystem.toggleDebugMode();
        this._showNotification(isDebugEnabled ? 'Режим отладки включен' : 'Режим отладки выключен', 'info');
    }
    
    /**
     * Переключение режима якоря
     */
    _toggleAnchorMode() {
        // Якорь доступен только в безмаркерном режиме
        if (this.arMode === 'location') {
            const isAnchorEnabled = this.arSystem.toggleAnchorMode();
            this._showNotification(isAnchorEnabled ? 'Якорь установлен' : 'Режим якоря отключен', 'info');
        }
    }
    
    /**
     * Показ уведомления
     */
    _showNotification(message, type = 'info') {
        // Проверяем, существует ли уже контейнер для уведомлений
        let notificationContainer = document.getElementById('notification-container');
        
        // Если контейнера нет, создаем его
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Добавляем уведомление в контейнер
        notificationContainer.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
    
    /**
     * Показ экрана выбора предмета
     */
    _showSubjectsScreen() {
        this._hideAllScreens();
        document.getElementById('subject-screen').classList.remove('hidden');
    }
    
    /**
     * Обработчик выбора предмета
     */
    _onSubjectSelected(subject) {
        console.log(`Subject selected: ${subject}`);
        
        // Сохраняем выбранный предмет
        this.stateManager.setState('selectedSubject', subject);
        
        // Загружаем уровни для выбранного предмета
        const levels = this.quizData.getLevelsForSubject(subject);
        this._populateLevelsGrid(levels);
        
        // Показываем экран с уровнями
        this._hideAllScreens();
        document.getElementById('level-screen').classList.remove('hidden');
    }
    
    /**
     * Заполнение сетки уровней
     */
    _populateLevelsGrid(levels) {
        const levelGrid = document.querySelector('.level-grid');
        levelGrid.innerHTML = '';
        
        const subject = this.stateManager.getState('selectedSubject');
        
        levels.forEach((level, index) => {
            const levelCard = document.createElement('div');
            levelCard.className = 'level-card';
            
            // Проверка доступности уровня
            const isLocked = index > 0 && !this.quizData.isLevelAvailable(subject, level.id);
            
            if (isLocked) {
                // Визуальное отображение заблокированного уровня
                levelCard.classList.add('locked');
                levelCard.innerHTML = `<div class="lock-icon">🔒</div>Уровень ${level.id + 1}`;
            } else {
                levelCard.dataset.level = level.id;
                levelCard.textContent = `Уровень ${level.id + 1}`;
            
                // Добавляем обработчик клика только для доступных уровней
            levelCard.addEventListener('click', () => this._onLevelSelected(level.id));
            }
            
            levelGrid.appendChild(levelCard);
        });
    }
    
    /**
     * Обработчик выбора уровня
     */
    _onLevelSelected(levelId) {
        console.log(`Level selected: ${levelId}`);
        
        // Сохраняем выбранный уровень
        this.stateManager.setState('selectedLevel', levelId);
        this.stateManager.setState('currentQuestionIndex', 0);
        this.stateManager.setState('score', 0);
        
        // Показываем инструкции AR (только для безмаркерного режима)
        this._hideAllScreens();
        if (this.arMode === 'location') {
            document.getElementById('ar-instructions-screen').classList.remove('hidden');
        } else {
            // Для маркерного режима сразу запускаем AR
            this._startARExperience();
        }
    }
    
    /**
     * Запуск AR-опыта
     */
    _startARExperience() {
        console.log('Starting AR experience...');
        
        // Инициализируем AR-систему с выбранным режимом
        this.arSystem.init(this.arMode);
        
        // Инициализируем сессию квиза для выбранного предмета и уровня
        const subject = this.stateManager.getState('selectedSubject');
        const levelId = this.stateManager.getState('selectedLevel');
        if (subject === undefined || subject === null || levelId === undefined || levelId === null) {
            console.error('Критическая ошибка: Не выбран предмет или уровень перед стартом AR!');
            this._returnToMenu(); // Возвращаемся в меню при ошибке
            return;
        }
        this.quizData.startQuiz(subject, levelId);
        this.stateManager.setState('currentQuestionIndex', 0); // Убедимся, что начинаем с 0
        this.stateManager.setState('score', 0); // Убедимся, что счет сброшен
        
        // Скрываем все экраны
        this._hideAllScreens();
        
        // Показываем игровой UI
        document.getElementById('game-ui').classList.remove('hidden');
        
        // Показываем или скрываем кнопку якоря в зависимости от режима
        const anchorButton = document.getElementById('anchor-toggle');
        if (anchorButton) {
            anchorButton.style.display = this.arMode === 'location' ? 'block' : 'none';
        }
        
        // Запускаем первый вопрос
        this._startNextQuestion();
    }
    
    /**
     * Запуск следующего вопроса
     */
    _startNextQuestion() {
        const selectedSubject = this.stateManager.getState('selectedSubject');
        const selectedLevel = this.stateManager.getState('selectedLevel');
        const currentQuestionIndex = this.stateManager.getState('currentQuestionIndex');
        
        // Получаем текущий вопрос из QuizData, используя индекс из StateManager
        const question = this.quizData.getQuestion(selectedSubject, selectedLevel, currentQuestionIndex);
        
        if (!question) {
            console.error(`Ошибка: Не найден вопрос для ${selectedSubject}, уровень ${selectedLevel}, индекс ${currentQuestionIndex}`);
            // Возможно, стоит показать экран результатов или ошибку
            this._showResultsScreen(); 
            return;
        }
        
        // Отображаем вопрос
        document.getElementById('question-text').textContent = question.text;
        
        // Обновляем UI счета и прогресса (на всякий случай, если были пропущены обновления)
        this._updateGameUI();
        
        // Создаем AR-объекты для вопроса
        this._createARObjectsForQuestion(question);
    }
    
    /**
     * Создание AR-объектов для вопроса
     */
    _createARObjectsForQuestion(question) {
        console.log('Creating AR objects for question:', question);
        
        // Используем метод createQuizObjects AR-системы с данными вопроса
        this.arSystem.createQuizObjects(question);
    }
    
    /**
     * Обработка выбора объекта
     */
    _handleObjectSelection(data) {
        console.log('Object selected:', data);
        
        // Проверяем правильность ответа
        this._handleAnswer(data.isCorrect);
    }
    
    /**
     * Обработка ответа пользователя
     */
    _handleAnswer(isCorrect) {
        // Получаем нужные данные состояния по ключам
        const subject = this.stateManager.getState('selectedSubject');
        const levelId = this.stateManager.getState('selectedLevel');
        let currentScore = this.stateManager.getState('score') || 0;
        let currentIndex = this.stateManager.getState('currentQuestionIndex') || 0;
        
        console.log(`[Debug] Inside _handleAnswer. Subject: ${subject}, Level: ${levelId}, Score: ${currentScore}, Index: ${currentIndex}`);
            
        // Проверяем, что состояние получено корректно
        if (subject === undefined || subject === null || levelId === undefined || levelId === null) {
            console.error('Критическая ошибка: Не удалось получить selectedSubject или selectedLevel из stateManager!', 
                          `Subject: ${subject}`, `Level: ${levelId}`);
            console.log('[Debug] Full App Data:', this.stateManager.getAppData()); 
            return; // Прерываем выполнение
        }
        
        // Звуковой эффект
        // const sound = isCorrect ? 'correct' : 'wrong'; // TODO: Add sound logic
        
        // Визуальный эффект
        this._showAnswerEffect(isCorrect);
        
        // Обновление счета в StateManager и DOM
        if (isCorrect) {
            // Возвращаем 1 балл за правильный ответ
            currentScore++; 
            this.stateManager.setState('score', currentScore);
            document.getElementById('current-score').textContent = currentScore;
            document.getElementById('score-container').classList.add('score-updated');
        setTimeout(() => {
                document.getElementById('score-container').classList.remove('score-updated');
            }, 500);
        }
            
        // Переходим к следующему вопросу или результатам
        const newIndex = currentIndex + 1;
        this.stateManager.setState('currentQuestionIndex', newIndex);
        
        const totalQuestions = this.quizData.currentSession.questions.length;
        console.log(`[Debug] Checking end of quiz. New Index: ${newIndex}, Total Questions: ${totalQuestions}`);
            
        if (newIndex >= totalQuestions) {
            // Если это был последний вопрос
            // Задержка перед показом результатов, чтобы пользователь увидел эффект
            setTimeout(() => {
                this._showResultsScreen(); 
            }, 1500); 
        } else {
            // Переходим к следующему вопросу
            setTimeout(() => {
                this._startNextQuestion();
            }, 1000); // Задержка для эффекта
            }
    }
    
    /**
     * Показывает визуальный эффект для правильного/неправильного ответа
     */
    _showAnswerEffect(isCorrect) {
        // Создаем временный эффект на экране
        const effect = document.createElement('div');
        effect.className = `answer-effect ${isCorrect ? 'correct-answer' : 'wrong-answer'}`;
        document.body.appendChild(effect);
        
        // Удаляем эффект через 1.5 секунды
        setTimeout(() => {
            effect.classList.add('fade-out');
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 500);
        }, 1500);
    }
    
    /**
     * Показ экрана результатов
     */
    _showResultsScreen() {
        console.log('Showing results screen');
        
        // Останавливаем AR
        this.arSystem.stop();
        
        // Получаем финальные данные из StateManager и QuizData
        const score = this.stateManager.getState('score') || 0;
        const subject = this.stateManager.getState('selectedSubject');
        const levelId = this.stateManager.getState('selectedLevel');
        const totalQuestions = this.quizData.currentSession && this.quizData.currentSession.questions ? this.quizData.currentSession.questions.length : 10;
        
        // Обновляем текст с результатами
        document.getElementById('final-score').textContent = score;
        document.getElementById('max-score').textContent = totalQuestions;
        
        // Сохраняем прогресс здесь, по завершении уровня
        if (subject !== undefined && subject !== null && levelId !== undefined && levelId !== null) {
            const playerName = this.stateManager.getState('playerName') || 'Игрок';
            console.log(`[Debug] Calling addResultToLeaderboard with Name: ${playerName}, Score: ${score}`);
            this.stateManager.addResultToLeaderboard(playerName, score);
        } else {
            console.warn('Не удалось сохранить прогресс: предмет или уровень не определены.');
        }
        
        // Показываем экран результатов
        this._hideAllScreens();
        document.getElementById('results-screen').classList.remove('hidden');
    }
    
    /**
     * Перезапуск игры
     */
    _restartGame() {
        // Сбрасываем счет и индекс вопроса
        this.stateManager.setState('score', 0);
        this.stateManager.setState('currentQuestionIndex', 0);
        
        // Запускаем AR опыт заново
        this._startARExperience();
    }
    
    /**
     * Выход из игры
     */
    _exitGame() {
        // Останавливаем AR
        this.arSystem.stop();
        
        // Возвращаемся на экран выбора предмета
        this._hideAllScreens();
        document.getElementById('subject-screen').classList.remove('hidden');
    }
    
    /**
     * Возврат в главное меню
     */
    _returnToMenu() {
        // Сбрасываем состояние
        this.stateManager.resetState();
        
        // Останавливаем AR
        this.arSystem.stop();
        
        // Показываем стартовый экран
        this._hideAllScreens();
        document.getElementById('start-screen').classList.remove('hidden');
    }
    
    /**
     * Скрытие всех экранов
     */
    _hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Также скрываем игровой интерфейс
        document.getElementById('game-ui').classList.add('hidden');
    }
    
    /**
     * Обработчик изменения состояния FSM
     * @param {Object} event - Данные события изменения состояния
     */
    _handleStateChange(event) {
        console.log(`State changed to: ${event.state}`, event);
        // Update specific UI for certain states
        if (event.state === this.stateManager.states.RESULTS) {
            this._updateResultsUI();
        } else if (event.state === this.stateManager.states.LEADERBOARD) {
            this._updateLeaderboardUI();
        }
    }

    /**
     * Обновление UI экрана результатов
     */
    _updateResultsUI() {
        const score = this.stateManager.getState('score') || 0;
        const totalQuestions = this.quizData.currentSession && this.quizData.currentSession.questions 
                               ? this.quizData.currentSession.questions.length 
                               : 10;
        // Макс. балл теперь равен кол-ву вопросов
        const maxScore = totalQuestions; 

        document.getElementById('final-score').textContent = score;
        document.getElementById('max-score').textContent = maxScore;
    }

    /**
     * Обновление UI экрана таблицы лидеров
     */
    _updateLeaderboardUI() {
        const leaderboard = this.stateManager.getState('leaderboard') || [];
        console.log('[Debug] _updateLeaderboardUI received leaderboard:', leaderboard);
        const currentPlayerName = this.stateManager.getState('playerName');
        const currentPlayerScore = this.stateManager.getState('score'); // Получаем последний счет
        const container = document.getElementById('leaderboard-table-container');
        container.innerHTML = ''; // Очищаем контейнер

        const table = document.createElement('table');
        table.className = 'leaderboard-table';

        // Заголовок таблицы
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const th1 = document.createElement('th');
        th1.textContent = '#';
        headerRow.appendChild(th1);
        const th2 = document.createElement('th');
        th2.textContent = 'Имя';
        headerRow.appendChild(th2);
        const th3 = document.createElement('th');
        th3.textContent = 'Баллы';
        headerRow.appendChild(th3);

        // Тело таблицы
        const tbody = table.createTBody();
        leaderboard.forEach((entry, index) => {
            const row = tbody.insertRow();
            const cell1 = row.insertCell();
            cell1.textContent = index + 1;
            const cell2 = row.insertCell();
            cell2.textContent = entry.name;
            const cell3 = row.insertCell();
            cell3.textContent = entry.score;

            // Выделяем текущего игрока в таблице (с последним результатом)
            // Сравниваем и имя, и счет, чтобы выделить правильную строку, если имена совпадают
            if (entry.name === currentPlayerName && entry.score === currentPlayerScore) {
                row.classList.add('current-player');
            }
        });

        container.appendChild(table);
    }
    
    _updateGameUI() {
        const questionText = document.getElementById('question-text');
        const currentScoreEl = document.getElementById('current-score');
        const totalQuestionsEl = document.getElementById('total-questions');
        
        // Получаем актуальные данные из StateManager и QuizData
        const score = this.stateManager.getState('score') || 0;
        // const currentQuestionIndex = this.stateManager.getState('currentQuestionIndex') || 0;
        const totalQuestions = this.quizData.currentSession && this.quizData.currentSession.questions ? this.quizData.currentSession.questions.length : 10; // Запасной вариант 10
        
        // Обновляем DOM
        currentScoreEl.textContent = score;
        totalQuestionsEl.textContent = totalQuestions;
        
        // Текст вопроса обновляется в _startNextQuestion
        // const subject = this.stateManager.getState('selectedSubject');
        // const level = this.stateManager.getState('selectedLevel');
        // const questionData = this.quizData.getQuestion(subject, level, currentQuestionIndex);
        // if (questionData && questionText) {
        //     questionText.textContent = questionData.text;
        // }
    }
}

// Создаем и инициализируем приложение при загрузке документа
document.addEventListener('DOMContentLoaded', () => {
    // Создаем экземпляр приложения
    window.app = new App();
    
    // Инициализируем приложение с задержкой,
    // чтобы дать время загрузиться остальным скриптам и ресурсам
    console.log('Waiting for scripts to load...');
    setTimeout(() => {
        // Проверяем, загружены ли все необходимые компоненты
        if (!window.stateManager || !window.arSystem || !window.quizData) {
            console.error('Required modules are not loaded yet. Retrying...');
            // Пробуем инициализировать снова через 1 секунду
            setTimeout(() => {
                console.log('Retrying application initialization...');
                window.app.start();
            }, 1000);
            return;
        }
        
        console.log('All modules loaded, starting application...');
        window.app.start();
    }, 1000); // Увеличиваем задержку до 1000мс
}); 