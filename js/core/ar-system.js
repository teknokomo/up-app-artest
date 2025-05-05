/**
 * AR System - Система управления дополненной реальностью
 * 
 * Реализует маркерлесс AR и маркерный AR с использованием AR.js и A-Frame.
 * Поддерживает два режима работы: маркерный и безмаркерный (с виртуальной координатной системой).
 */

class ARSystem {
    constructor() {
        // Базовые настройки
        this.isInitialized = false;
        this.isRunning = false;
        
        // Режим AR: 'marker' или 'location'
        this.arMode = 'location';
        
        // Контейнеры объектов
        this.objectsContainer = null;
        this.scene = null;
        this.camera = null;
        this.marker = null;
        
        // Параметры виртуальной координатной системы (для location-режима)
        this.virtualCoordinateSystem = {
            origin: { x: 0, y: 0, z: 0 },
            scale: 1.0,
            rotation: 0,
            initialized: false
        };
        
        // Текущие объекты на сцене
        this.arObjects = [];
        
        // Параметры расположения объектов
        this.placementRadius = 1.5;    // Радиус размещения объектов для location-режима
        this.markerPlacementRadius = 0.3; // Радиус размещения для marker-режима
        this.objectScale = 0.3;        // Размер объектов для location-режима
        this.markerObjectScale = 0.1;  // Размер объектов для marker-режима
        
        // Режим отладки
        this.debugMode = false;
        
        // Виртуальный якорь для фиксации объектов
        this.useAnchor = false;
        this.anchor = null;
        this.anchorOffset = { x: 0, y: 0, z: -2 }; // Расположение объектов перед пользователем
        
        // Стабилизация позиции
        this.stabilization = {
            enabled: true,
            samples: [],
            maxSamples: 10,
            smoothingFactor: 0.7
        };
        
        // Обработчики событий
        this.eventListeners = {};
    }
    
    /**
     * Инициализирует AR-систему в выбранном режиме
     * @param {string} mode - Режим AR: 'marker' или 'location'
     */
    init(mode = 'location') {
        console.log(`Initializing AR System in ${mode} mode...`);
        
        this.arMode = mode;
        
        if (this.isInitialized) {
            console.warn('AR System already initialized, cleaning up...');
            this._cleanup();
        }
        
        // Получаем ссылку на A-Frame сцену
        this.scene = document.querySelector('a-scene');
        
        if (!this.scene) {
            console.error('Failed to get A-Frame scene element');
            return;
        }
        
        // Инициализируем в зависимости от режима
        if (this.arMode === 'marker') {
            this._initMarkerMode();
        } else {
            this._initLocationMode();
        }
        
        this.isInitialized = true;
        console.log(`AR System initialized successfully in ${this.arMode} mode`);
    }
    
    /**
     * Инициализирует маркерный режим AR
     * @private
     */
    _initMarkerMode() {
        // Настраиваем сцену для маркерного режима
        this._configureArJsForMarkerMode();
        
        // Удаляем существующий контейнер объектов, если есть
        const existingContainer = document.querySelector('#ar-objects-container');
        if (existingContainer) {
            existingContainer.parentNode.removeChild(existingContainer);
        }
        
        // Создаем маркер Hiro с улучшенной стабилизацией
        this.marker = document.createElement('a-marker');
        this.marker.setAttribute('preset', 'hiro');
        this.marker.setAttribute('emitevents', 'true');
        this.marker.setAttribute('smooth', 'true');
        this.marker.setAttribute('smoothCount', '15');  // Увеличено для лучшей стабильности
        this.marker.setAttribute('smoothTolerance', '0.01');
        this.marker.setAttribute('smoothThreshold', '5');
        this.marker.id = 'ar-marker';
        this.scene.appendChild(this.marker);
        
        // Создаем контейнер для объектов в маркере
        this.objectsContainer = document.createElement('a-entity');
        this.objectsContainer.id = 'ar-objects-container';
        this.marker.appendChild(this.objectsContainer);
        
        // Добавляем камеру, если её нет
        let camera = this.scene.querySelector('a-entity[camera]');
        if (!camera) {
            camera = document.createElement('a-entity');
            camera.setAttribute('camera', '');
            this.scene.appendChild(camera);
        }
        
        // Установка оптимальных параметров камеры и raycaster для улучшения взаимодействия
        camera.setAttribute('camera', 'fov: 40; near: 0.1; far: 10000;');
        camera.setAttribute('cursor', 'rayOrigin: mouse; fuse: false;');
        camera.setAttribute('raycaster', 'objects: .clickable; far: 10000;');
        
        this.camera = camera;
        
        // Добавляем обработчик событий маркера
        this.marker.addEventListener('markerFound', () => {
            console.log('Маркер обнаружен');
        });
        
        this.marker.addEventListener('markerLost', () => {
            console.log('Маркер потерян');
        });
        
        console.log('Marker mode initialized');
    }
    
    /**
     * Инициализирует безмаркерный режим AR
     * @private
     */
    _initLocationMode() {
        // Настраиваем сцену для безмаркерного режима
        this._configureArJsForLocationMode();
        
        // Получаем камеру
        this.camera = document.querySelector('[camera]');
        
        // Проверяем существование контейнера объектов или создаем новый
        this.objectsContainer = document.querySelector('#ar-objects-container');
        if (!this.objectsContainer) {
            this.objectsContainer = document.createElement('a-entity');
            this.objectsContainer.id = 'ar-objects-container';
            this.scene.appendChild(this.objectsContainer);
        }
        
        // Создаем якорь
        this.createAnchor();
        
        console.log('Location mode initialized');
    }
    
    /**
     * Настраивает AR.js для маркерного режима
     * @private
     */
    _configureArJsForMarkerMode() {
        // Удаляем текущие атрибуты arjs
        this.scene.removeAttribute('arjs');
        
        // Устанавливаем атрибуты для маркерного режима с улучшенной стабилизацией
        this.scene.setAttribute('arjs', 'trackingMethod: best; debugUIEnabled: false; detectionMode: mono; patternRatio: 0.75; cameraParametersUrl: https://raw.githack.com/AR-js-org/AR.js/master/data/data/camera_para.dat;');
        
        // Добавляем настройки рендерера для исправления проблем с шейдерами
        this.scene.setAttribute('renderer', 'precision: mediump; logarithmicDepthBuffer: true; antialias: true; alpha: true;');
    }
    
    /**
     * Настраивает AR.js для безмаркерного режима
     * @private
     */
    _configureArJsForLocationMode() {
        // Удаляем текущие атрибуты arjs
        this.scene.removeAttribute('arjs');
        
        // Устанавливаем атрибуты для безмаркерного режима
        this.scene.setAttribute('arjs', 'sourceType: webcam; videoTexture: true; debugUIEnabled: false; detectionMode: mono_and_matrix; maxDetectionRate: 60;');
    }
    
    /**
     * Очищает все объекты и состояние системы
     * @private
     */
    _cleanup() {
        // Очищаем объекты AR
        this.clearObjects();
        
        // Удаляем маркер, если существует
        if (this.marker) {
            this.scene.removeChild(this.marker);
            this.marker = null;
        }
        
        // Сбрасываем состояние
        this.isInitialized = false;
        this.isRunning = false;
        this.useAnchor = false;
        
        console.log('AR System cleaned up');
    }
    
    /**
     * Создает виртуальный якорь для фиксации объектов
     */
    createAnchor() {
        // Удаляем предыдущий якорь, если он существует
        if (this.anchor) {
            this.anchor.parentNode.removeChild(this.anchor);
        }
        
        // Создаем новый якорь как элемент A-Frame
        this.anchor = document.createElement('a-entity');
        this.anchor.setAttribute('id', 'virtual-anchor');
        
        // Добавляем якорь в сцену
        this.objectsContainer.appendChild(this.anchor);
        
        // Создаем визуальный индикатор для отладки
        const debugSphere = document.createElement('a-sphere');
        debugSphere.setAttribute('radius', '0.1');
        debugSphere.setAttribute('color', 'red');
        debugSphere.setAttribute('opacity', '0.5');
        debugSphere.setAttribute('visible', this.debugMode);
        this.anchor.appendChild(debugSphere);
        
        console.log('Virtual anchor created');
    }
    
    /**
     * Устанавливает якорь перед пользователем
     */
    setAnchor() {
        if (!this.isInitialized || !this.anchor || !this.camera) {
            console.error('Cannot set anchor - system not fully initialized');
            return;
        }
        
        // Получаем текущую позицию и направление камеры
        let cameraPosition = this.camera.getAttribute('position');
        let cameraRotation = this.camera.getAttribute('rotation');
        
        // Расчет позиции якоря перед пользователем
        // Направление взгляда - по оси Z
        let radians = cameraRotation.y * (Math.PI / 180);
        let x = cameraPosition.x + this.anchorOffset.z * Math.sin(radians);
        let z = cameraPosition.z - this.anchorOffset.z * Math.cos(radians);
        
        // Устанавливаем позицию якоря
        this.anchor.setAttribute('position', {
            x: x,
            y: cameraPosition.y + this.anchorOffset.y,
            z: z
        });
        
        // Якорь следует за поворотом камеры
        this.anchor.setAttribute('rotation', {
            x: 0,
            y: cameraRotation.y,
            z: 0
        });
        
        // Активируем режим якоря
        this.useAnchor = true;
        
        console.log('Anchor set at position', x, cameraPosition.y + this.anchorOffset.y, z);
        
        // Перемещаем существующие объекты к якорю
        this.updateObjectsPosition();
    }
    
    /**
     * Переключает режим отладки
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        // Обновляем видимость индикатора якоря
        if (this.anchor) {
            const debugSphere = this.anchor.querySelector('a-sphere');
            if (debugSphere) {
                debugSphere.setAttribute('visible', this.debugMode);
            }
        }
        
        // Обновляем отладочные элементы для объектов
        this.arObjects.forEach(obj => {
            if (obj.debugElements) {
                obj.debugElements.forEach(el => {
                    el.setAttribute('visible', this.debugMode);
                });
            }
        });
        
        console.log('Debug mode ' + (this.debugMode ? 'enabled' : 'disabled'));
        return this.debugMode;
    }
    
    /**
     * Переключает режим якоря
     */
    toggleAnchorMode() {
        if (!this.useAnchor) {
            this.setAnchor();
        } else {
            this.useAnchor = false;
            console.log('Anchor mode disabled');
        }
        
        return this.useAnchor;
    }
    
    /**
     * Запускает AR-систему
     */
    start() {
        console.log('Starting AR System...');
        
        if (!this.isInitialized) {
            console.error('Cannot start AR System - not initialized');
            return false;
        }
        
        if (this.isRunning) {
            console.warn('AR System already running');
            return true;
        }
        
        this.isRunning = true;
        console.log('AR System started successfully');
        return true;
    }
    
    /**
     * Останавливает AR-систему
     */
    stop() {
        console.log('Stopping AR System...');
        
        if (!this.isRunning) {
            console.warn('AR System already stopped');
            return;
        }
        
        this.isRunning = false;
        console.log('AR System stopped successfully');
    }
    
    /**
     * Создает сферу с заданными параметрами
     */
    createSphere(color, position, isCorrect = false) {
        if (!this.isInitialized) {
            console.error('Cannot create sphere - AR System not initialized');
            return null;
        }
        
        // Создаем сферу
        const sphere = document.createElement('a-sphere');
        sphere.setAttribute('color', color);
        sphere.setAttribute('radius', this.objectScale);
        
        // Добавляем данные для игровой логики
        sphere.setAttribute('data-is-correct', isCorrect);
        sphere.setAttribute('class', 'clickable');
        
        // Управление положением в зависимости от режима якоря
        this.positionObject(sphere, position);
        
        // Создаем отладочные элементы (оси координат)
        const debugElements = [];
        if (this.debugMode) {
            // Ось X (красная)
            const xAxis = document.createElement('a-entity');
            xAxis.setAttribute('line', `start: 0 0 0; end: 0.5 0 0; color: red`);
            xAxis.setAttribute('visible', this.debugMode);
            sphere.appendChild(xAxis);
            debugElements.push(xAxis);
            
            // Ось Y (зеленая)
            const yAxis = document.createElement('a-entity');
            yAxis.setAttribute('line', `start: 0 0 0; end: 0 0.5 0; color: green`);
            yAxis.setAttribute('visible', this.debugMode);
            sphere.appendChild(yAxis);
            debugElements.push(yAxis);
            
            // Ось Z (синяя)
            const zAxis = document.createElement('a-entity');
            zAxis.setAttribute('line', `start: 0 0 0; end: 0 0 0.5; color: blue`);
            zAxis.setAttribute('visible', this.debugMode);
            sphere.appendChild(zAxis);
            debugElements.push(zAxis);
        }
        
        // Сохраняем отладочные элементы для обновления видимости
        sphere.debugElements = debugElements;
        
        // Добавляем в список объектов
        this.arObjects.push(sphere);
        
        return sphere;
    }
    
    /**
     * Позиционирует объект в зависимости от режима якоря
     */
    positionObject(object, position) {
        if (this.useAnchor && this.anchor) {
            // Добавляем к якорю с относительной позицией
            this.anchor.appendChild(object);
            object.setAttribute('position', position);
        } else {
            // Добавляем напрямую в контейнер с абсолютной позицией
            this.objectsContainer.appendChild(object);
            object.setAttribute('position', position);
        }
    }
    
    /**
     * Обновляет позиции всех объектов при изменении режима якоря
     */
    updateObjectsPosition() {
        this.arObjects.forEach(obj => {
            // Запоминаем текущую позицию
            const currentPos = obj.getAttribute('position');
            
            // Удаляем объект из текущего родителя
            if (obj.parentNode) {
                obj.parentNode.removeChild(obj);
            }
            
            // Перемещаем в соответствии с режимом якоря
            this.positionObject(obj, currentPos);
        });
    }
    
    /**
     * Очищает все 3D объекты со сцены
     */
    clearObjects() {
        console.log('Clearing all AR objects');
        
        // Удаляем все объекты, обращаясь к сохраненному элементу контейнера
        this.arObjects.forEach(arObjectData => {
            const containerElement = arObjectData.element;
            if (containerElement && containerElement.parentNode) {
                containerElement.parentNode.removeChild(containerElement);
            }
        });
        
        // Очищаем список
        this.arObjects = [];
    }
    
    /**
     * Создает объекты для квиза
     * @param {Object} quizData - Данные текущего вопроса
     */
    createQuizObjects(quizData) {
        // Очищаем предыдущие объекты
        this.clearObjects();
        
        if (this.arMode === 'marker') {
            this._createMarkerQuizObjects(quizData);
        } else {
            this._createLocationQuizObjects(quizData);
        }
    }
    
    /**
     * Создает объекты для маркерного режима
     * @param {Object} quizData - Данные текущего вопроса
     * @private
     */
    _createMarkerQuizObjects(quizData) {
        console.log('[Debug] Creating Marker Quiz Objects with data:', JSON.parse(JSON.stringify(quizData))); // Лог входящих данных
        
        let choices = [...quizData.choices]; // Копируем массив
        const correctAnswerIndexOriginal = quizData.correctAnswer;
        const correctAnswerValue = choices[correctAnswerIndexOriginal];

        // Перемешиваем варианты ответов для разнообразия, сохраняя правильный ответ
        let shuffledChoicesData = choices.map((choice, index) => ({ 
            value: choice, 
            isCorrect: index === correctAnswerIndexOriginal 
        }));
        this._shuffleArray(shuffledChoicesData); // Используем существующий метод перемешивания
        
        // Используем линейное расположение вместо кругового
        const positions = this._generateLinePositions(shuffledChoicesData.length);
        
        shuffledChoicesData.forEach((choiceData, index) => {
            const isCorrect = choiceData.isCorrect;
            const position = positions[index]; // Позиция определяется новым индексом после перемешивания
            
            // Создаем контейнер для объекта и текста
            const container = document.createElement('a-entity');
            container.setAttribute('position', `${position.x} 0.4 ${position.z}`);
            
            // Размещаем контейнер внутри маркера, а не в общем контейнере
            this.marker.appendChild(container);
            
            // Создаем объект
            const el = document.createElement('a-entity');
            
            // Определяем геометрию и цвет
            if (isCorrect) { // Используем isCorrect из choiceData
                el.setAttribute('geometry', 'primitive: sphere; radius: 0.3; segmentsHeight: 18; segmentsWidth: 36');
            } else {
                el.setAttribute('geometry', 'primitive: box; width: 0.6; height: 0.6; depth: 0.6;');
            }
            
            const color = this._getColor(index); // Цвет зависит от нового индекса
            
            // Улучшенные настройки материала для корректного отображения
            el.setAttribute('material', `color: ${color}; opacity: 0.9; metalness: 0.2; roughness: 0.8; shader: flat;`);
            
            // Добавляем класс clickable для raycaster
            el.setAttribute('class', 'clickable');
            
            // Добавляем анимацию при наведении
            el.setAttribute('animation__hover', 'property: scale; to: 1.2 1.2 1.2; startEvents: mouseenter; dur: 300; easing: easeOutQuad');
            el.setAttribute('animation__unhover', 'property: scale; to: 1 1 1; startEvents: mouseleave; dur: 300; easing: easeOutQuad');
            
            // Добавляем текст с вариантом ответа
            const text = document.createElement('a-text');
            text.setAttribute('value', choiceData.value); // Используем value из choiceData
            text.setAttribute('align', 'center');
            text.setAttribute('position', '0 -0.7 0');
            text.setAttribute('scale', '0.8 0.8 0.8');
            text.setAttribute('color', 'white');
            text.setAttribute('width', '2');
            
            // Добавляем интерактивность
            el.setAttribute('class', 'clickable');
            
            // Добавляем эффект свечения при клике
            el.addEventListener('click', () => {
                // Убираем анимацию пульсации при клике, т.к. emissive не работает с flat шейдером и вызывает ошибки
                // el.setAttribute('animation__click', 'property: material.emissive; from: ' + color + '; to: #ffffff; dur: 500; easing: easeInOutQuad; dir: alternate; loop: 3');
                
                // Вызываем обработчик выбора ответа
                setTimeout(() => {
                    // Передаем isCorrect из choiceData
                    this._onObjectClick({ isCorrect: choiceData.isCorrect, index }); 
                }, 300); // Небольшая задержка для визуального отклика (если понадобится)
            });
            
            // Добавляем объект и текст в контейнер
            container.appendChild(el);
            container.appendChild(text);
            
            // Сохраняем для дальнейшего использования
            this.arObjects.push({
                element: container,
                object: el,
                text: text,
                isCorrect: choiceData.isCorrect, // Сохраняем isCorrect из choiceData
                index: index
            });
        });
        
        console.log(`Created ${shuffledChoicesData.length} quiz objects in marker mode`);
    }
    
    /**
     * Создает объекты для безмаркерного режима
     * @param {Object} quizData - Данные текущего вопроса
     * @private
     */
    _createLocationQuizObjects(quizData) {
        const choices = quizData.choices;
        const correctAnswer = quizData.correctAnswer;
        
        // Генерируем позиции объектов вокруг пользователя
        const positions = this.generatePositions(choices.length);
        
        choices.forEach((choice, index) => {
            const isCorrect = index === correctAnswer;
            const position = positions[index];
            
            // Создаем объект для безмаркерного режима
            const object = this.createSphere(this._getColor(index), position, isCorrect);
            
            // Сохраняем данные объекта
            this.arObjects.push({
                element: object,
                position: position,
                isCorrect: isCorrect,
                index: index
            });
        });
        
        console.log(`Created ${choices.length} quiz objects in location mode`);
    }
    
    /**
     * Генерирует позиции объектов на линии (в ряд)
     * @param {number} count - Количество объектов
     * @returns {Array} Массив позиций {x, z}
     * @private
     */
    _generateLinePositions(count) {
        const positions = [];
        const spacing = 0.8; // Расстояние между объектами
        
        // Вычисляем общую длину ряда
        const totalWidth = (count - 1) * spacing;
        
        // Располагаем объекты равномерно в ряд
        for (let i = 0; i < count; i++) {
            positions.push({
                x: (i * spacing) - (totalWidth / 2), // Центрируем ряд
                z: 0 // Все объекты на одной линии по оси Z
            });
        }
        
        return positions;
    }
    
    /**
     * Возвращает случайную форму для неправильных ответов
     * @returns {string} Название примитива
     * @private
     */
    _getRandomShape() {
        const shapes = ['box', 'cone', 'dodecahedron', 'octahedron', 'tetrahedron', 'torus'];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }
    
    /**
     * Возвращает цвет для объекта по индексу
     * @param {number} index - Индекс объекта
     * @returns {string} Цвет в HEX формате
     * @private
     */
    _getColor(index) {
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3'];
        return colors[index % colors.length];
    }
    
    /**
     * Обработчик клика на объекте
     * @param {Object} data - Данные объекта
     * @private
     */
    _onObjectClick(data) {
        this._emit('objectSelected', data);
    }
    
    /**
     * Регистрация обработчика события
     * @param {string} eventName - Название события
     * @param {Function} callback - Функция обратного вызова
     */
    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        
        this.eventListeners[eventName].push(callback);
        
        return () => {
            this.eventListeners[eventName] = this.eventListeners[eventName].filter(
                cb => cb !== callback
            );
        };
    }
    
    /**
     * Инициализация виртуальной координатной системы
     * @private
     */
    _initVirtualCoordinateSystem() {
        // Получаем текущую позицию камеры как начало координат
        if (this.camera) {
            // Получаем начальную позицию и ориентацию камеры
            const cameraPosition = this.camera.getAttribute('position');
            const cameraRotation = this.camera.getAttribute('rotation');
            
            // Устанавливаем начало виртуальной системы координат
            this.virtualCoordinateSystem.origin = {
                x: cameraPosition.x,
                y: cameraPosition.y,
                z: cameraPosition.z
            };
            
            // Сохраняем ориентацию камеры
            this.virtualCoordinateSystem.rotation = cameraRotation.y;
            
            // Очищаем данные стабилизации
            this.stabilization.samples = [];
            
            this.virtualCoordinateSystem.initialized = true;
            console.log('Virtual coordinate system initialized:', this.virtualCoordinateSystem);
        }
    }
    
    /**
     * Обработчик загрузки сцены
     * @private
     */
    _onSceneLoaded() {
        console.log('AR scene loaded');
        this._emit('scene-loaded');
    }
    
    /**
     * Обработчик входа в VR режим
     * @private
     */
    _onEnterVR() {
        console.log('Entered VR mode');
        this._emit('enter-vr');
    }
    
    /**
     * Обработчик выхода из VR режима
     * @private
     */
    _onExitVR() {
        console.log('Exited VR mode');
        this._emit('exit-vr');
    }
    
    /**
     * Имитирует событие
     * @param {string} eventName - Название события
     * @param {Object} data - Данные события
     * @private
     */
    _emit(eventName, data = {}) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => {
                callback(data);
            });
        }
    }
    
    /**
     * Создает маркер для отладки
     * @param {Object} position - Позиция маркера { x, y, z }
     * @param {string} color - Цвет маркера
     * @private
     */
    _createDebugMarker(position, color = 'red') {
        const marker = document.createElement('a-entity');
        marker.setAttribute('geometry', 'primitive: sphere; radius: 0.1');
        marker.setAttribute('material', `color: ${color}; shader: flat;`);
        marker.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
        marker.classList.add('debug-element');
        
        this.objectsContainer.appendChild(marker);
        return marker;
    }
    
    /**
     * Перемешивает массив (алгоритм Фишера-Йетса)
     * @param {Array} array - Массив для перемешивания
     * @private
     */
    _shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Создаем глобальный экземпляр AR системы
window.arSystem = new ARSystem(); 