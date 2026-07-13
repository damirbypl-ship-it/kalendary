/**
 * storage.js — работа с localStorage для сохранения выбранного события.
 * Обёрнут в IIFE.
 */
(function (window) {
  "use strict";

  /** Ключ, под которым данные хранятся в localStorage */
  var STORAGE_KEY = "eventTimer_savedEvent";

  /**
   * Сохраняет событие в localStorage.
   * @param {Object} eventData — { type, name, dateISO }
   */
  function saveEvent(eventData) {
    try {
      var json = JSON.stringify(eventData);
      localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (err) {
      console.warn("Не удалось сохранить событие:", err);
      return false;
    }
  }

  /**
   * Загружает сохранённое событие из localStorage.
   * @returns {Object|null} — { type, name, dateISO } или null
   */
  function loadEvent() {
    try {
      var json = localStorage.getItem(STORAGE_KEY);
      if (!json) {
        return null;
      }
      var data = JSON.parse(json);

      /* Проверяем, что данные содержат нужные поля */
      if (data && data.type && data.name && data.dateISO) {
        return data;
      }
      return null;
    } catch (err) {
      console.warn("Не удалось загрузить событие:", err);
      return null;
    }
  }

  /**
   * Удаляет сохранённое событие.
   */
  function clearEvent() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("Не удалось удалить событие:", err);
    }
  }

  window.EventTimerStorage = {
    saveEvent: saveEvent,
    loadEvent: loadEvent,
    clearEvent: clearEvent
  };
})(window);
