/**
 * app.js — главный файл приложения: связывает интерфейс, таймер и хранилище.
 * Обёрнут в IIFE — единственная точка входа после загрузки страницы.
 */
(function () {
  "use strict";

  /* Ссылки на модули из других файлов */
  var Data = window.EventTimerData;
  var Storage = window.EventTimerStorage;
  var Logic = window.EventTimerLogic;

  /* Названия событий для отображения */
  var EVENT_NAMES = {
    birthday: "День рождения",
    vacation: "Каникулы",
    newyear: "Новый год",
    custom: "Своё событие"
  };

  /* --- Элементы интерфейса --- */
  var eventButtons = document.querySelectorAll(".event-btn");
  var eventForm = document.getElementById("event-form");
  var birthdayFields = document.getElementById("birthday-fields");
  var customFields = document.getElementById("custom-fields");
  var birthdayDateInput = document.getElementById("birthday-date");
  var customNameInput = document.getElementById("custom-name");
  var customDateInput = document.getElementById("custom-date");
  var saveEventBtn = document.getElementById("save-event-btn");

  var eventNameEl = document.getElementById("event-name");
  var eventDateEl = document.getElementById("event-date");
  var eventPassedEl = document.getElementById("event-passed");
  var countdownEl = document.getElementById("countdown");
  var daysEl = document.getElementById("days");
  var hoursEl = document.getElementById("hours");
  var minutesEl = document.getElementById("minutes");
  var secondsEl = document.getElementById("seconds");

  var factEl = document.getElementById("fact-of-day");
  var quoteEl = document.getElementById("quote-of-day");
  var dayImageArt = document.getElementById("day-image-art");
  var dayImageCaption = document.getElementById("day-image-caption");

  var confirmModal = document.getElementById("confirm-modal");
  var modalText = document.getElementById("modal-text");
  var modalCancel = document.getElementById("modal-cancel");
  var modalConfirm = document.getElementById("modal-confirm");

  /* --- Состояние приложения --- */
  var currentEvent = null;       /* Текущее сохранённое событие */
  var selectedType = null;       /* Выбранный тип в интерфейсе */
  var timerInterval = null;      /* ID интервала обновления таймера */
  var pendingAction = null;      /* Действие, ожидающее подтверждения */

  /**
   * Инициализация приложения при загрузке страницы.
   */
  function init() {
    bindEvents();
    loadDailyContent(null);

    /* Пробуем загрузить сохранённое событие */
    var saved = Storage.loadEvent();
    if (saved) {
      currentEvent = saved;
      applyEventToUI(saved);
      startCountdown();
    } else {
      showPlaceholder();
    }
  }

  /**
   * Привязка обработчиков событий к элементам страницы.
   */
  function bindEvents() {
    /* Кнопки выбора типа события */
    for (var i = 0; i < eventButtons.length; i++) {
      eventButtons[i].addEventListener("click", onEventButtonClick);
    }

    /* Отправка формы */
    eventForm.addEventListener("submit", onFormSubmit);

    /* Кнопки модального окна */
    modalCancel.addEventListener("click", closeModal);
    modalConfirm.addEventListener("click", onModalConfirm);

    /* Закрытие модалки кликом по фону */
    confirmModal.addEventListener("click", function (e) {
      if (e.target === confirmModal) {
        closeModal();
      }
    });
  }

  /**
   * Показывает заглушку, когда событие ещё не выбрано.
   */
  function showPlaceholder() {
    eventNameEl.textContent = "Выберите событие";
    eventDateEl.textContent = "Дата появится после выбора";
    setCountdownValues(0, 0, 0, 0);
    eventPassedEl.classList.add("event-passed--hidden");
    countdownEl.classList.remove("countdown--hidden");
  }

  /**
   * Проверяет, является ли тип готовым событием без дополнительных полей.
   */
  function isPresetType(type) {
    return type === "vacation" || type === "newyear";
  }

  /**
   * Обработчик клика по кнопке типа события.
   */
  function onEventButtonClick(e) {
    var type = e.currentTarget.getAttribute("data-event");

    /* Каникулы и Новый год сохраняются сразу — таймер обновляется мгновенно */
    if (isPresetType(type)) {
      applyPresetEvent(type);
      return;
    }

    /* Для дня рождения и своего события — только выбор типа, дату вводит пользователь */
    if (currentEvent && currentEvent.type !== type) {
      pendingAction = function () {
        selectEventType(type);
      };
      showConfirmDialog(
        "Вы уверены, что хотите сменить событие на «" + EVENT_NAMES[type] + "»?"
      );
      return;
    }

    selectEventType(type);
  }

  /**
   * Применяет готовое событие (каникулы / Новый год): сохраняет и запускает таймер.
   */
  function applyPresetEvent(type) {
    var eventData = buildEventData(type);
    if (!eventData) {
      return;
    }

    /* Если уже выбрано другое событие — спрашиваем подтверждение */
    if (currentEvent && !isSameEvent(currentEvent, eventData)) {
      pendingAction = function () {
        saveAndApply(eventData);
      };
      showConfirmDialog(
        "Вы уверены, что хотите сменить событие на «" + eventData.name + "»?"
      );
      return;
    }

    /* Первый выбор или повторный клик по тому же событию */
    if (!currentEvent || !isSameEvent(currentEvent, eventData)) {
      saveAndApply(eventData);
    } else {
      selectEventType(type);
    }
  }

  /**
   * Выделяет выбранный тип события и показывает нужные поля формы.
   */
  function selectEventType(type) {
    selectedType = type;

    /* Подсветка активной кнопки */
    for (var i = 0; i < eventButtons.length; i++) {
      var btn = eventButtons[i];
      if (btn.getAttribute("data-event") === type) {
        btn.classList.add("event-btn--active");
      } else {
        btn.classList.remove("event-btn--active");
      }
    }

    /* Показываем/скрываем дополнительные поля */
    birthdayFields.classList.add("form-row--hidden");
    customFields.classList.add("form-row--hidden");

    if (type === "birthday") {
      birthdayFields.classList.remove("form-row--hidden");
      if (currentEvent && currentEvent.type === "birthday") {
        birthdayDateInput.value = currentEvent.dateISO;
      }
    } else if (type === "custom") {
      customFields.classList.remove("form-row--hidden");
      if (currentEvent && currentEvent.type === "custom") {
        customNameInput.value = currentEvent.name;
        customDateInput.value = currentEvent.dateISO;
      }
    }

    /* Для каникул и Нового года — сразу можно сохранять */
    if (type === "vacation" || type === "newyear") {
      saveEventBtn.textContent = "Сохранить событие";
    } else {
      saveEventBtn.textContent = "Сохранить событие";
    }

    /* Меняем тему фона страницы */
    document.body.setAttribute("data-theme", type);
  }

  /**
   * Обработчик отправки формы — сохранение события.
   */
  function onFormSubmit(e) {
    e.preventDefault();

    if (!selectedType) {
      alert("Пожалуйста, выберите тип события.");
      return;
    }

    var eventData = buildEventData(selectedType);
    if (!eventData) {
      return;
    }

    /* Если меняем уже сохранённое событие — подтверждение */
    if (currentEvent && !isSameEvent(currentEvent, eventData)) {
      pendingAction = function () {
        saveAndApply(eventData);
      };
      showConfirmDialog(
        "Сохранить новое событие «" + eventData.name + "» на " +
        Logic.formatDateRu(Logic.resolveEventDate(eventData)) + "?"
      );
      return;
    }

    saveAndApply(eventData);
  }

  /**
   * Собирает объект события из формы по выбранному типу.
   * @returns {Object|null}
   */
  function buildEventData(type) {
    var name;
    var dateISO;

    switch (type) {
      case "birthday":
        dateISO = birthdayDateInput.value;
        if (!dateISO) {
          alert("Укажите дату вашего дня рождения.");
          return null;
        }
        name = "День рождения";
        break;

      case "vacation":
        name = "Каникулы";
        dateISO = formatDateToISO(Logic.getNextVacation());
        break;

      case "newyear":
        name = "Новый год";
        dateISO = formatDateToISO(Logic.getNextNewYear());
        break;

      case "custom":
        name = customNameInput.value.trim();
        dateISO = customDateInput.value;
        if (!name) {
          alert("Введите название своего события.");
          return null;
        }
        if (!dateISO) {
          alert("Укажите дату события.");
          return null;
        }
        break;

      default:
        return null;
    }

    return { type: type, name: name, dateISO: dateISO };
  }

  /**
   * Преобразует Date в строку YYYY-MM-DD.
   */
  function formatDateToISO(date) {
    var y = date.getFullYear();
    var m = Logic.padZero(date.getMonth() + 1);
    var d = Logic.padZero(date.getDate());
    return y + "-" + m + "-" + d;
  }

  /**
   * Проверяет, совпадают ли два события.
   */
  function isSameEvent(a, b) {
    return a.type === b.type && a.name === b.name && a.dateISO === b.dateISO;
  }

  /**
   * Сохраняет событие в localStorage и обновляет интерфейс.
   */
  function saveAndApply(eventData) {
    Storage.saveEvent(eventData);
    currentEvent = eventData;
    applyEventToUI(eventData);
    startCountdown();
    loadDailyContent(eventData.type);
  }

  /**
   * Обновляет блоки с информацией о событии.
   */
  function applyEventToUI(eventData) {
    selectEventType(eventData.type);

    var targetDate = Logic.resolveEventDate(eventData);
    eventNameEl.textContent = eventData.name;
    eventDateEl.textContent = Logic.formatDateRu(targetDate);

    document.body.setAttribute("data-theme", eventData.type);
  }

  /**
   * Запускает интервал обновления таймера (каждую секунду).
   */
  function startCountdown() {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
  }

  /**
   * Обновляет значения таймера на экране.
   */
  function updateCountdown() {
    if (!currentEvent) {
      return;
    }

    var targetDate = Logic.resolveEventDate(currentEvent);
    var remaining = Logic.calculateRemaining(targetDate);

    if (remaining.isPassed) {
      /* Событие уже наступило */
      eventPassedEl.classList.remove("event-passed--hidden");
      countdownEl.classList.add("countdown--hidden");
      setCountdownValues(0, 0, 0, 0);

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      return;
    }

    eventPassedEl.classList.add("event-passed--hidden");
    countdownEl.classList.remove("countdown--hidden");
    setCountdownValues(
      remaining.days,
      remaining.hours,
      remaining.minutes,
      remaining.seconds
    );
  }

  /**
   * Устанавливает числа в блоке таймера с анимацией при смене секунд.
   */
  function setCountdownValues(days, hours, minutes, seconds) {
    animateValue(daysEl, days);
    animateValue(hoursEl, hours);
    animateValue(minutesEl, minutes);
    animateValue(secondsEl, seconds, true);
  }

  /**
   * Обновляет элемент таймера с ведущим нулём и короткой анимацией.
   */
  function animateValue(el, value, isSeconds) {
    var text = Logic.padZero(value);
    if (el.textContent !== text) {
      el.textContent = text;
      if (isSeconds) {
        el.classList.add("countdown__value--tick");
        setTimeout(function () {
          el.classList.remove("countdown__value--tick");
        }, 150);
      }
    }
  }

  /**
   * Загружает факт дня, цитату и картинку.
   */
  function loadDailyContent(eventType) {
    var content = Data.getDailyContent(eventType);

    factEl.textContent = content.fact;

    quoteEl.innerHTML =
      '<p class="quote__text">«' + escapeHtml(content.quote.text) + '»</p>' +
      '<cite class="quote__author">— ' + escapeHtml(content.quote.author) + '</cite>';

    /* Картинка дня */
    dayImageArt.textContent = content.image.emoji;
    dayImageArt.className = "day-image__art day-image__art--theme-" + content.image.theme;
    dayImageCaption.textContent = content.image.caption;
  }

  /**
   * Экранирует HTML-символы для безопасной вставки текста.
   */
  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /* --- Модальное окно подтверждения --- */

  function showConfirmDialog(message) {
    modalText.textContent = message;
    confirmModal.showModal();
  }

  function closeModal() {
    confirmModal.close();
    pendingAction = null;
  }

  function onModalConfirm() {
    if (pendingAction) {
      var action = pendingAction;
      pendingAction = null;
      confirmModal.close();
      action();
    } else {
      closeModal();
    }
  }

  /* Запуск приложения после загрузки DOM */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
