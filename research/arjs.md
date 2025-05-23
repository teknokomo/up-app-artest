# Исследование AR.js 3.4.7 для немаркерной AR

## 1. Режим AR.js для «немаркерной» AR

AR.js спроектирован как маркерная система: он **требует заранее известного ориентира** (паттерна или изображения) для закрепления виртуальных объектов. Прямого распознавания произвольных поверхностей (как в ARKit/ARCore) AR.js не поддерживает. Для «немаркерной» сцены остаются два основных подхода: во-первых, **GPS-ориентированная (location-based) AR**, когда объекты фиксируются в мировых координатах с помощью компонентов A-Frame `gps-camera` и `gps-entity-place`. AR.js предоставляет A-Frame-компоненты для location-based AR (в новых версиях есть даже отдельный проект **LocAR** с более чистым API). Во-вторых, AR.js умеет делать **Image Tracking (NFT)** – использовать произвольное плоское изображение как маркер. Это не совсем «полностью безмаркерная» AR, но позволяет заменить стандартный квадратик Hiro любой картинкой. Таким образом, для фиксированных объектов без физического маркера чаще всего используют location-based режим. Следует учесть, что он опирается на GPS и компас устройства: например, в Firefox он **не работает**, поскольку браузер не даёт абсолютной ориентации. Режим NFT требует подготовки и загрузки данных изображения-таргета, но затем распознаёт картинку на окружающих поверхностях. Искать «невидимые» маркеры или полагаться на автоматическое сканирование пола AR.js не умеет – нужно либо GPS, либо известное изображение.

## 2. Многосценный AR-интерфейс и логика на чистом JS

AR.js и A-Frame можно подключить как обычные скрипты без сборки: достаточно включить тегом `<script>` библиотеки A-Frame и AR.js (например, через CDN/raw\.githack). Вся логика игры (переходы между экранами, уровни, начисление баллов) пишется на чистом JavaScript и HTML. Можно сделать, например, разметку с несколькими секциями (экранами): один экран–меню, другой – AR-сцена, третий – результаты. Переключение между ними – простым показом/скрытием блоков или удалением/добавлением сущностей A-Frame. А-Frame допускает динамическое создание/удаление объектов: при необходимости можно удалять все дети сцены и добавлять новые, как показано в примерах на StackOverflow. Технически AR.js не ограничивает количество «сцен»: в одном HTML-документе вы можете работать с разными состояниями A-Frame, просто манипулируя DOM. Главное – поддерживать актуальные компоненты (`arjs-webcam-texture`, `gps-camera` и т.п.), очищая или задавая их правильно при смене контента. Таким образом MVP можно собрать на чистом HTML/CSS/JS, без сборщиков и серверной части – достаточно браузера с камерой.

## 3. Ограничения и производительность на мобильных

AR.js/A-Frame основаны на WebGL, поэтому их производительность на смартфоне близка к обычному 3D через `three.js`. При легких сценах (несколько простых примитивов) AR.js хорошо оптимизирован – заявляется до **60 FPS** даже на двухлетних телефонах. Однако сложные 3D-сцены могут быстро тормозить. Основные рекомендации для мобильного:

* **Минимизировать геометрию.** Используйте простые примитивы (кубы, цилиндры, сферы с малым числом сегментов). По умолчанию `<a-sphere>` генерирует 36×18 сегментов (\~1300 треугольников), можно уменьшить `segmentsWidth/Height`. Избегайте тяжелых моделей (glTF с тысячами полигонов).
* **Оптимизировать текстуры.** Все используемые текстуры должны быть степенями двойки (например, 256×256, 512×512); A-Frame в противном случае расширяет их до ближайшего 2^n, что резко увеличивает память. Mozilla рекомендует держать **суммарный объём ассетов < 70 МБ** — больше этого браузер может долго грузить или даже падать. Избегайте очень больших изображений и неиспользуемых ресурсов.
* **Контроль вершин.** По опыту экспериментаторов, около **1 000 000 вершин** в сцене становятся критичным пределом для большинства смартфонов. При достижении этой отметки браузер начинает «тормозить» или аварийно закрывается. Используйте инструмент статистики (`stats`), чтобы отслеживать количество вершин в сцене.
* **Браузер и разрешения.** Наилучшие результаты даёт современный Chrome на Android. AR.js поддерживает и iOS (Safari 11+), но во многих случаях лучше использовать Chrome. Заметим, что режим location-based (GPS) **не работает в Firefox** из‑за отсутствия данных компаса в WebXR. Убедитесь, что сайт обслуживается по HTTPS (для доступа к камере и геолокации). В целом соблюдение рекомендаций по оптимизации A-Frame (см. [Mozilla Hacks](https://hacks.mozilla.org/2017/07/optimizing-performance-of-a-frame-scenes-for-mobile-devices/)) гарантирует, что AR-сцена будет отзывчивой.

## 4. UI-оверлей и HUD (элементы интерфейса поверх сцены)

Пользовательский интерфейс (кнопки, формы, таблицы) принято реализовывать отдельным слоем поверх AR-сцены. Проще всего создать **HTML/CSS-оверлей**: например, `<div>` с `position: fixed; top:0; left:0; width:100%` и прочими стилями (прозрачность, z-index и т.д.), содержащий нужные элементы. AR.js-документация прямо говорит, что «можно добавлять DOM-элементы в `body`» для интерфейса. Такие элементы не являются частью 3D-сцены и остаются на месте при движении камеры – именно это и нужно для меню и HUD.

Альтернативный подход – использовать A-Frame HUD: добавить сущности как дочерние к камере. Например:

```html
<a-entity camera>
  <a-plane position="0 0 -1" height="0.2" width="0.5" color="#FFF" opacity="0.5"></a-plane>
</a-entity>
```

Этот код создаёт плоскость прямо перед взглядом пользователя (позиция `z=-1` относительно камеры) и она не смещается при вращении устройства. На такую плоскость можно наложить текст или кнопки (A-Frame позволяет обрабатывать клики по 3D-объектам). Документация рекомендует фиксировать HUD-элементы как детей камеры: «чтобы HUD оставался в поле зрения, добавьте его в `<a-entity camera>`». Подобный HUD удобен, если вам нужно, чтобы интерфейс визуально влился в 3D, но для простого квиза достаточно классического HTML-оверлея.

Таким образом, интерфейс квиза можно реализовать двумя способами: либо как обычный HTML/CSS-слой поверх `<a-scene>`, либо как фиксированные сущности A-Frame, прикреплённые к камере. Оба подхода позволяют сделать кнопки и экран статичными и отделёнными от перемещений AR-сцены.

**Вывод:** AR.js 3.4.7 позволяет сделать MVP AR-викторины без сборщиков и серверной части, используя A-Frame и чистый JavaScript. Рекомендуется применять location-based AR (GPS) или NFT в качестве «безмаркерного» режима, управлять интерфейсом через DOM-оверлей/HUD и тщательно оптимизировать контент для мобильных, чтобы обеспечить плавную работу.

**Источники:** официальная документация и примеры AR.js, статьи по производительности WebAR и обсуждения на StackOverflow.
