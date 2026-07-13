/**
 * timer.js — логика обратного отсчёта и расчёта дат событий.
 * Обёрнут в IIFE.
 */
(function (window) {
  "use strict";

  /**
   * Форматирует дату для отображения на русском языке.
   * @param {Date} date
   * @returns {string}
   */
  function formatDateRu(date) {
    var months = [
      "января", "февраля", "марта", "апреля", "мая", "июня",
      "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    var day = date.getDate();
    var month = months[date.getMonth()];
    var year = date.getFullYear();
    return day + " " + month + " " + year + " г.";
  }

  /**
   * Добавляет ведущий ноль к числу (для таймера: 05 вместо 5).
   * @param {number} num
   * @returns {string}
   */
  function padZero(num) {
    return num < 10 ? "0" + num : String(num);
  }

  /**
   * Вычисляет дату следующего дня рождения по дате рождения.
   * @param {string} birthdayISO — дата в формате YYYY-MM-DD
   * @returns {Date}
   */
  function getNextBirthday(birthdayISO) {
    var parts = birthdayISO.split("-");
    var month = parseInt(parts[1], 10) - 1;
    var day = parseInt(parts[2], 10);
    var now = new Date();
    var year = now.getFullYear();

    var next = new Date(year, month, day, 0, 0, 0, 0);

    /* Если день рождения в этом году уже прошёл — берём следующий год */
    if (next.getTime() <= now.getTime()) {
      next = new Date(year + 1, month, day, 0, 0, 0, 0);
    }

    return next;
  }

  /**
   * Вычисляет дату начала летних каникул (1 июня ближайшего года).
   * @returns {Date}
   */
  function getNextVacation() {
    var now = new Date();
    var year = now.getFullYear();
    var vacation = new Date(year, 5, 1, 0, 0, 0, 0); /* 1 июня */

    if (vacation.getTime() <= now.getTime()) {
      vacation = new Date(year + 1, 5, 1, 0, 0, 0, 0);
    }

    return vacation;
  }

  /**
   * Вычисляет дату следующего Нового года (1 января).
   * @returns {Date}
   */
  function getNextNewYear() {
    var now = new Date();
    var year = now.getFullYear();
    var newYear = new Date(year, 0, 1, 0, 0, 0, 0);

    if (newYear.getTime() <= now.getTime()) {
      newYear = new Date(year + 1, 0, 1, 0, 0, 0, 0);
    }

    return newYear;
  }

  /**
   * Преобразует строку YYYY-MM-DD в объект Date (полночь локального времени).
   * @param {string} dateISO
   * @returns {Date}
   */
  function parseISODate(dateISO) {
    var parts = dateISO.split("-");
    return new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10),
      0, 0, 0, 0
    );
  }

  /**
   * Считает оставшееся время до события.
   * @param {Date} targetDate — дата события
   * @returns {Object} — { days, hours, minutes, seconds, totalMs, isPassed }
   */
  function calculateRemaining(targetDate) {
    var now = new Date();
    var diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: diff,
        isPassed: true
      };
    }

    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    return {
      days: days,
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60,
      totalMs: diff,
      isPassed: false
    };
  }

  /**
   * Определяет целевую дату события по типу и сохранённым данным.
   * @param {Object} eventData — { type, name, dateISO }
   * @returns {Date}
   */
  function resolveEventDate(eventData) {
    switch (eventData.type) {
      case "birthday":
        return getNextBirthday(eventData.dateISO);
      case "vacation":
        return getNextVacation();
      case "newyear":
        return getNextNewYear();
      case "custom":
        return parseISODate(eventData.dateISO);
      default:
        return new Date();
    }
  }

  window.EventTimerLogic = {
    formatDateRu: formatDateRu,
    padZero: padZero,
    getNextBirthday: getNextBirthday,
    getNextVacation: getNextVacation,
    getNextNewYear: getNextNewYear,
    parseISODate: parseISODate,
    calculateRemaining: calculateRemaining,
    resolveEventDate: resolveEventDate
  };
})(window);
