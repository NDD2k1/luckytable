---
name: localization
description: "Guidelines and standards for i18n localization and English-only codebase rules. Enforces that all code, variables, functions, comments, log messages, and commits are written strictly in English. Instructs agents on how to declare and use the i18n translation system (EN & VI) for all user-facing UI elements."
metadata:
    namespace: project
---
# Codebase Language & Localization (i18n) Guidelines

This repository strictly enforces **English-only source code** and an **internationalization (i18n) localization architecture** for user-facing text.

## 1. Core Principles

1. **Code & Comments in English Only**:
   - All variable names, function names, class names, file names, API payloads, and internal comments MUST be written in English.
   - Never write Vietnamese text directly inside JavaScript logic, Python scripts, or server middleware.
   - Git commit messages must be written in English using Conventional Commits format (`feat: ...`, `fix: ...`, `refactor: ...`).

2. **No Hardcoded UI Strings in Business Logic**:
   - User-facing text must be defined in the central dictionary located at `js/i18n.js` and `public/js/i18n.js`.
   - Never hardcode user notification strings, modal labels, or error messages directly in controller files.
   - Use `i18n.t('key', { params })` to fetch translated strings dynamically.

3. **DOM Declarative Translation**:
   - In HTML files, attach `data-i18n="translation.key"` to any text element.
   - For form inputs, attach `data-i18n-placeholder="translation.key"`.
   - The `i18n` engine will automatically populate text based on the active language (`en` or `vi`) and handle language toggle events.

## 2. Adding New Translated Strings

To add a new message or label:

1. Open `public/js/i18n.js` (and synchronize `js/i18n.js`).
2. Add the key under both `vi` and `en` dictionaries:
   ```javascript
   vi: {
     'game.action.bet': 'Đặt Cược',
     'toast.win_coins': 'Bạn nhận được +{amount} xu!'
   },
   en: {
     'game.action.bet': 'Place Bet',
     'toast.win_coins': 'You received +{amount} coins!'
   }
   ```
3. In HTML:
   ```html
   <button data-i18n="game.action.bet">Place Bet</button>
   ```
4. In JavaScript:
   ```javascript
   // English code logic
   const message = window.i18n ? window.i18n.t('toast.win_coins', { amount: 5000 }) : '+5,000 coins!';
   this.showToast(message, 'success');
   ```

## 3. Switching Languages

- Users switch language via `.btn-lang-toggle`.
- The active language is saved to `localStorage.getItem('lucky_casino_lang')`.
- Listen for language changes in game components:
  ```javascript
  window.addEventListener('languageChanged', (e) => {
    const lang = e.detail.lang; // 'vi' or 'en'
    this.refreshDynamicLabels();
  });
  ```

## 4. Agent Checklist Before Committing

- [ ] Are all new comments, variable names, and function names written in English?
- [ ] Are all user-facing strings registered in `i18n.js` under both `vi` and `en`?
- [ ] Do new HTML elements use `data-i18n` instead of raw static text?
- [ ] Has the language switcher been tested on Desktop and Mobile?
