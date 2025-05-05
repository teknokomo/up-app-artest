/**
 * Quiz Data - Модуль, содержащий данные для квиза и логику работы с вопросами
 * 
 * Содержит вопросы и ответы для разных предметов и уровней,
 * а также методы для работы с ними.
 */

class QuizData {
    constructor() {
        // Структура данных для квиза
        this.quizData = {
            geology: this._generateLevels('geology'),
            botany: this._generateLevels('botany'),
            anatomy: this._generateLevels('anatomy')
        };
        
        // Текущая игровая сессия
        this.currentSession = {
            subject: null,
            level: null,
            questions: [],
            currentQuestionIndex: 0,
            answeredQuestions: [],
            correctAnswers: 0
        };
        
        this.initialized = false;
    }
    
    /**
     * Инициализация модуля данных квиза
     */
    init() {
        if (this.initialized) {
            console.warn('Quiz Data already initialized');
            return;
        }
        
        console.log('Initializing Quiz Data...');
        
        // Генерируем данные, если нужно
        
        this.initialized = true;
        console.log('Quiz Data initialized with subjects:', Object.keys(this.quizData));
    }
    
    /**
     * Получение списка уровней для предмета
     * @param {string} subject - Название предмета
     * @returns {Array} - Массив уровней
     */
    getLevelsForSubject(subject) {
        if (!this.quizData[subject]) {
            console.error(`Invalid subject: ${subject}`);
            return [];
        }
        
        return this.quizData[subject].map((level, index) => ({
            id: index,
            name: `Уровень ${index + 1}`,
            questionsCount: level.length
        }));
    }
    
    /**
     * Получение вопроса в формате для AR-системы
     * @param {string} subject - Название предмета
     * @param {number} levelId - ID уровня
     * @param {number} questionIndex - Индекс вопроса
     * @returns {Object|null} - Данные вопроса или null, если вопрос не найден
     */
    getQuestion(subject, levelId, questionIndex) {
        if (!this.quizData[subject] || !this.quizData[subject][levelId]) {
            console.error(`Invalid subject or level: ${subject}, ${levelId}`);
            return null;
        }
        
        const questions = this.quizData[subject][levelId];
        
        if (questionIndex >= questions.length) {
            console.log('No more questions, quiz completed');
            return null;
        }
        
        const question = questions[questionIndex];
        
        // Формируем данные для AR-системы
        return {
            text: question.text,
            choices: question.answers.map(answer => answer.text),
            correctAnswer: question.answers.findIndex(answer => answer.isCorrect),
            explanation: question.explanation
        };
    }
    
    /**
     * Инициализация игровой сессии квиза
     * @param {string} subject - Предмет (geology, botany, anatomy)
     * @param {number} level - Уровень сложности (0-9)
     */
    startQuiz(subject, level) {
        if (!this.quizData[subject] || !this.quizData[subject][level]) {
            console.error(`Invalid subject or level: ${subject}, ${level}`);
            return false;
        }
        
        // Инициализация сессии
        this.currentSession = {
            subject,
            level,
            questions: [...this.quizData[subject][level]], // Копируем вопросы для текущего уровня
            currentQuestionIndex: 0,
            answeredQuestions: [],
            correctAnswers: 0
        };
        
        // Перемешиваем вопросы для разнообразия
        this._shuffleArray(this.currentSession.questions);
        
        console.log(`Quiz started: ${subject}, level ${level + 1}, ${this.currentSession.questions.length} questions`);
        
        return true;
    }
    
    /**
     * Получение текущего вопроса
     * @returns {Object|null} - Текущий вопрос или null, если квиз не инициализирован
     */
    getCurrentQuestion() {
        if (!this.currentSession.questions.length) return null;
        
        return this.currentSession.questions[this.currentSession.currentQuestionIndex];
    }
    
    /**
     * Проверка ответа пользователя
     * @param {number} answerId - ID выбранного ответа
     * @returns {Object} - Результат проверки ответа
     */
    checkAnswer(answerId) {
        const currentQuestion = this.getCurrentQuestion();
        
        if (!currentQuestion) return { error: 'No active question' };
        
        // Находим выбранный ответ
        const selectedAnswer = currentQuestion.answers.find(a => a.id === answerId);
        
        if (!selectedAnswer) return { error: 'Invalid answer ID' };
        
        // Проверяем правильность ответа
        const isCorrect = selectedAnswer.isCorrect;
        
        // Сохраняем информацию об ответе
        this.currentSession.answeredQuestions.push({
            question: currentQuestion,
            answerId,
            isCorrect
        });
        
        // Обновляем счетчик правильных ответов
        if (isCorrect) {
            this.currentSession.correctAnswers++;
        }
        
        return {
            isCorrect,
            correctAnswer: currentQuestion.answers.find(a => a.isCorrect),
            explanation: currentQuestion.explanation,
            progress: {
                total: this.currentSession.questions.length,
                answered: this.currentSession.answeredQuestions.length,
                correct: this.currentSession.correctAnswers
            }
        };
    }
    
    /**
     * Переход к следующему вопросу
     * @returns {boolean} - true, если переход успешен, false, если квиз завершен
     */
    nextQuestion() {
        if (!this.currentSession.questions.length) return false;
        
        // Проверяем, есть ли еще вопросы
        if (this.currentSession.currentQuestionIndex < this.currentSession.questions.length - 1) {
            this.currentSession.currentQuestionIndex++;
            return true;
        }
        
        // Квиз завершен
        return false;
    }
    
    /**
     * Получение результатов текущего квиза
     * @returns {Object} - Результаты квиза
     */
    getResults() {
        return {
            subject: this.currentSession.subject,
            level: this.currentSession.level,
            totalQuestions: this.currentSession.questions.length,
            answeredQuestions: this.currentSession.answeredQuestions.length,
            correctAnswers: this.currentSession.correctAnswers,
            score: this.currentSession.correctAnswers,
            maxScore: this.currentSession.questions.length,
            percentage: Math.round((this.currentSession.correctAnswers / this.currentSession.questions.length) * 100),
            answeredQuestions: this.currentSession.answeredQuestions
        };
    }
    
    /**
     * Получение данных для AR объектов текущего вопроса
     * @returns {Array} - Массив данных для создания AR объектов
     */
    getCurrentQuestionARObjects() {
        const currentQuestion = this.getCurrentQuestion();
        
        if (!currentQuestion) return [];
        
        // Преобразуем ответы в формат для AR объектов
        return currentQuestion.answers.map(answer => ({
            id: answer.id,
            text: answer.text,
            isCorrect: answer.isCorrect,
            color: answer.color
        }));
    }
    
    /**
     * Сброс текущей сессии квиза
     */
    resetQuiz() {
        this.currentSession = {
            subject: null,
            level: null,
            questions: [],
            currentQuestionIndex: 0,
            answeredQuestions: [],
            correctAnswers: 0
        };
    }
    
    /**
     * Генерация уровней для предмета
     * @param {string} subject - Предмет (geology, botany, anatomy)
     * @returns {Array} - Массив уровней с вопросами
     * @private
     */
    _generateLevels(subject) {
        const levels = [];
        
        // Создаем 10 уровней для каждого предмета
        for (let i = 0; i < 10; i++) {
            // Каждый уровень имеет 10 вопросов
            levels.push(this._generateQuestions(subject, i));
        }
        
        return levels;
    }
    
    /**
     * Генерация вопросов для конкретного предмета и уровня
     * @param {string} subject - Предмет
     * @param {number} level - Уровень сложности
     * @returns {Array} - Массив вопросов
     * @private
     */
    _generateQuestions(subject, level) {
        const questions = [];
        
        // Базовые цвета для объектов
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3', '#FF8333', '#8333FF'];
        
        // Генерируем 10 вопросов для каждого уровня
        for (let i = 0; i < 10; i++) {
            // Определяем правильный ответ (случайный индекс от 0 до 3)
            const correctAnswerIndex = Math.floor(Math.random() * 4);
            
            // Создаем ответы
            const answers = [];
            for (let j = 0; j < 4; j++) {
                // Перемешиваем цвета для разнообразия
                this._shuffleArray(colors);
                
                answers.push({
                    id: `q${i}_a${j}`,
                    text: this._getAnswerText(subject, level, i, j),
                    isCorrect: j === correctAnswerIndex,
                    color: colors[j % colors.length]
                });
            }
            
            // Добавляем вопрос
            questions.push({
                id: `q${i}`,
                text: this._getQuestionText(subject, level, i),
                explanation: this._getExplanationText(subject, level, i),
                answers: answers,
                difficulty: level + 1
            });
        }
        
        return questions;
    }
    
    /**
     * Получение текста вопроса
     * @param {string} subject - Предмет
     * @param {number} level - Уровень сложности
     * @param {number} questionIndex - Индекс вопроса
     * @returns {string} - Текст вопроса
     * @private
     */
    _getQuestionText(subject, level, questionIndex) {
        // Предопределенные вопросы для демонстрации
        const questionsMap = {
            geology: [
                'Какой минерал является самым твердым?',
                'Какая порода формируется из магмы?',
                'Какой тип горных пород формируется из осадочных материалов?',
                'Что вызывает землетрясения?',
                'Какой процесс формирует пещеры в известняке?',
                'Где находится крупнейший вулкан Солнечной системы?',
                'Какой минерал имеет химическую формулу NaCl?',
                'Из чего состоит большая часть земной коры?',
                'Какой тип горных пород может содержать окаменелости?',
                'Что такое геотермальная энергия?'
            ],
            botany: [
                'Какой процесс превращает солнечный свет в энергию растений?',
                'Какая часть растения отвечает за поглощение воды?',
                'Какой газ растения выделяют в процессе фотосинтеза?',
                'Как называется мужская часть цветка?',
                'Какой тип растений не имеет корней, стеблей и листьев?',
                'Какое растение может выжить в пустыне?',
                'Как называется наука о грибах?',
                'Какой гормон отвечает за рост растений?',
                'Какое растение считается самым большим цветком в мире?',
                'Как растения противостоят вредителям?'
            ],
            anatomy: [
                'Сколько костей в человеческом теле?',
                'Какой орган отвечает за производство инсулина?',
                'Какая самая большая артерия в теле человека?',
                'Какой орган фильтрует кровь от токсинов?',
                'Сколько камер в сердце человека?',
                'Какой орган производит желчь?',
                'Какой элемент крови переносит кислород?',
                'Из каких клеток состоит нервная система?',
                'Где находится гипофиз?',
                'Какая самая длинная кость в теле человека?'
            ]
        };
        
        // Возвращаем вопрос или генерируем базовый, если нет предопределенного
        if (questionsMap[subject] && questionsMap[subject][questionIndex]) {
            return questionsMap[subject][questionIndex];
        } else {
            return `Вопрос ${questionIndex + 1} по предмету ${subject}, уровень ${level + 1}`;
        }
    }
    
    /**
     * Получение текста ответа
     * @param {string} subject - Предмет
     * @param {number} level - Уровень сложности
     * @param {number} questionIndex - Индекс вопроса
     * @param {number} answerIndex - Индекс ответа
     * @returns {string} - Текст ответа
     * @private
     */
    _getAnswerText(subject, level, questionIndex, answerIndex) {
        // Предопределенные ответы для демонстрации
        const answersMap = {
            geology: {
                0: ['Алмаз', 'Кварц', 'Топаз', 'Рубин'],
                1: ['Магматическая', 'Осадочная', 'Метаморфическая', 'Вулканическая'],
                2: ['Осадочная', 'Магматическая', 'Метаморфическая', 'Кристаллическая'],
                3: ['Движение тектонических плит', 'Извержения вулканов', 'Эрозия почвы', 'Метеоритные удары'],
                4: ['Выветривание и растворение', 'Вулканическая активность', 'Тектонические сдвиги', 'Метеоритные удары'],
                5: ['На Марсе', 'На Земле', 'На Венере', 'На Юпитере'],
                6: ['Галит', 'Кварц', 'Пирит', 'Графит'],
                7: ['Силикаты', 'Карбонаты', 'Металлы', 'Органические соединения'],
                8: ['Осадочная', 'Магматическая', 'Метаморфическая', 'Вулканическая'],
                9: ['Тепловая энергия из недр Земли', 'Энергия солнца', 'Энергия ветра', 'Энергия воды']
            },
            botany: {
                0: ['Фотосинтез', 'Дыхание', 'Транспирация', 'Брожение'],
                1: ['Корень', 'Лист', 'Стебель', 'Цветок'],
                2: ['Кислород', 'Углекислый газ', 'Азот', 'Водород'],
                3: ['Тычинка', 'Пестик', 'Лепесток', 'Чашелистик'],
                4: ['Водоросли', 'Хвойные', 'Цветковые', 'Мхи'],
                5: ['Кактус', 'Пальма', 'Берёза', 'Лилия'],
                6: ['Микология', 'Фитология', 'Ботаника', 'Дендрология'],
                7: ['Ауксин', 'Цитокинин', 'Этилен', 'Абсцизовая кислота'],
                8: ['Раффлезия', 'Подсолнух', 'Роза', 'Лотос'],
                9: ['Вырабатывают токсины', 'Имеют колючки', 'Выделяют запахи', 'Все перечисленное']
            },
            anatomy: {
                0: ['206', '180', '250', '300'],
                1: ['Поджелудочная железа', 'Печень', 'Почки', 'Селезёнка'],
                2: ['Аорта', 'Сонная артерия', 'Легочная артерия', 'Бедренная артерия'],
                3: ['Печень', 'Почки', 'Селезёнка', 'Легкие'],
                4: ['4', '2', '3', '5'],
                5: ['Печень', 'Поджелудочная железа', 'Желчный пузырь', 'Селезёнка'],
                6: ['Эритроциты', 'Лейкоциты', 'Тромбоциты', 'Плазма'],
                7: ['Нейроны', 'Эритроциты', 'Миоциты', 'Лейкоциты'],
                8: ['В мозге', 'В шее', 'В груди', 'В животе'],
                9: ['Бедренная кость', 'Плечевая кость', 'Большеберцовая кость', 'Лучевая кость']
            }
        };
        
        // Возвращаем ответ или генерируем базовый, если нет предопределенного
        if (answersMap[subject] && 
            answersMap[subject][questionIndex] && 
            answersMap[subject][questionIndex][answerIndex]) {
            return answersMap[subject][questionIndex][answerIndex];
        } else {
            return `Ответ ${answerIndex + 1}`;
        }
    }
    
    /**
     * Получение объяснения для вопроса
     * @param {string} subject - Предмет
     * @param {number} level - Уровень сложности
     * @param {number} questionIndex - Индекс вопроса
     * @returns {string} - Текст объяснения
     * @private
     */
    _getExplanationText(subject, level, questionIndex) {
        // Предопределенные объяснения для демонстрации
        const explanationsMap = {
            geology: {
                0: 'Алмаз имеет твердость 10 по шкале Мооса, что делает его самым твердым минералом.',
                1: 'Магматические породы формируются при затвердевании магмы или лавы.',
                2: 'Осадочные породы формируются из накопления осадочных материалов, таких как песок, глина, и органические вещества.',
                3: 'Землетрясения вызваны движением тектонических плит, которые составляют земную кору.',
                4: 'Пещеры в известняке формируются процессом карстового выветривания и растворения.',
                5: 'Крупнейший вулкан Солнечной системы, Олимп, находится на Марсе.',
                6: 'Галит - это минералогическое название каменной соли, химическая формула NaCl.',
                7: 'Большая часть земной коры состоит из силикатных минералов и пород.',
                8: 'Осадочные породы могут содержать окаменелости, так как они формируются из отложений, где могут сохраниться останки организмов.',
                9: 'Геотермальная энергия - это тепловая энергия, генерируемая и хранящаяся в недрах Земли.'
            },
            botany: {
                0: 'Фотосинтез - это процесс, при котором растения используют солнечный свет для создания глюкозы из воды и углекислого газа.',
                1: 'Корень - основной орган, отвечающий за поглощение воды и минеральных веществ из почвы.',
                2: 'В процессе фотосинтеза растения поглощают углекислый газ и выделяют кислород.',
                3: 'Тычинка - мужская часть цветка, состоящая из пыльника и тычиночной нити, производит пыльцу.',
                4: 'Водоросли не имеют настоящих корней, стеблей и листьев, в отличие от высших растений.',
                5: 'Кактусы имеют специальные адаптации для выживания в пустыне, включая способность хранить воду и редуцированные листья для минимизации потери влаги.',
                6: 'Микология - наука, изучающая грибы.',
                7: 'Ауксин - растительный гормон, отвечающий за рост растений и тропизмы.',
                8: 'Раффлезия Арнольди считается самым большим цветком в мире, достигая в диаметре до 1 метра.',
                9: 'Растения используют различные механизмы защиты от вредителей, включая токсины, шипы, колючки и специфические запахи.'
            },
            anatomy: {
                0: 'Скелет взрослого человека состоит из 206 костей.',
                1: 'Поджелудочная железа производит инсулин, который регулирует уровень сахара в крови.',
                2: 'Аорта - самая крупная артерия в теле человека, выходящая из левого желудочка сердца.',
                3: 'Печень фильтрует кровь и удаляет токсины, также выполняя много других функций.',
                4: 'Сердце человека имеет 4 камеры: два предсердия и два желудочка.',
                5: 'Печень производит желчь, которая хранится в желчном пузыре и участвует в пищеварении.',
                6: 'Эритроциты (красные кровяные тельца) содержат гемоглобин, который переносит кислород к тканям.',
                7: 'Нейроны - основные клетки нервной системы, передающие электрические и химические сигналы.',
                8: 'Гипофиз находится в основании мозга и является главной эндокринной железой.',
                9: 'Бедренная кость - самая длинная кость в теле человека.'
            }
        };
        
        // Возвращаем объяснение или генерируем базовое, если нет предопределенного
        if (explanationsMap[subject] && explanationsMap[subject][questionIndex]) {
            return explanationsMap[subject][questionIndex];
        } else {
            return `Объяснение для вопроса ${questionIndex + 1}`;
        }
    }
    
    /**
     * Перемешивание массива (алгоритм Фишера–Йейтса)
     * @param {Array} array - Массив для перемешивания
     * @private
     */
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Проверка, завершен ли указанный уровень
     * @param {string} subject - Название предмета
     * @param {number} levelId - ID уровня
     * @returns {boolean} - Статус завершения уровня
     */
    isLevelCompleted(subject, levelId) {
        // Получаем данные о прогрессе из localStorage
        const progress = localStorage.getItem('arQuizProgress');
        if (!progress) return false;
        
        try {
            const progressData = JSON.parse(progress);
            return progressData.completed && 
                   progressData.completed[subject] && 
                   progressData.completed[subject].includes(levelId);
        } catch (e) {
            console.error('Ошибка при чтении прогресса:', e);
            return false;
        }
    }

    /**
     * Проверка, доступен ли уровень для прохождения
     * @param {string} subject - Название предмета
     * @param {number} levelId - ID уровня
     * @returns {boolean} - Статус доступности уровня
     */
    isLevelAvailable(subject, levelId) {
        // Первый уровень всегда доступен
        if (levelId === 0) return true;
        
        // Для других уровней - предыдущий должен быть пройден
        return this.isLevelCompleted(subject, levelId - 1);
    }

    /**
     * Сохранение прогресса прохождения уровня
     * @param {string} subject - Название предмета
     * @param {number} levelId - ID уровня
     * @param {number} score - Набранные баллы
     */
    saveProgress(subject, levelId, score) {
        // Получаем текущий прогресс или создаем новый объект
        let progress;
        try {
            progress = JSON.parse(localStorage.getItem('arQuizProgress') || '{"completed":{},"scores":{}}');
        } catch (e) {
            console.error('Ошибка при чтении прогресса:', e);
            progress = {"completed":{},"scores":{}};
        }
        
        // Инициализируем массивы/объекты, если они еще не существуют
        if (!progress.completed[subject]) progress.completed[subject] = [];
        if (!progress.scores[subject]) progress.scores[subject] = {};
        
        // Добавляем уровень в список пройденных, если его там нет
        if (!progress.completed[subject].includes(levelId)) {
            progress.completed[subject].push(levelId);
        }
        
        // Сохраняем или обновляем счет
        progress.scores[subject][levelId] = score;
        
        // Записываем последний играемый уровень
        progress.lastPlayed = { subject, level: levelId };
        
        // Сохраняем обновленный прогресс
        try {
            localStorage.setItem('arQuizProgress', JSON.stringify(progress));
        } catch (e) {
            console.error('Ошибка при сохранении прогресса:', e);
        }
    }
}

// Создаем глобальный экземпляр данных квиза
window.quizData = new QuizData(); 