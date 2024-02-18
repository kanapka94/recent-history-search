import { subYears } from 'date-fns';

document.addEventListener('DOMContentLoaded', function () {
  const elForm = document.getElementById('settings-form') as HTMLFormElement;
  const submitButton = document.querySelector('[data-trigger="save-settings"]');

  const startSearchDateInput = document.getElementById('start-search-date') as HTMLInputElement;
  const endSearchDateInput = document.getElementById('end-search-date') as HTMLInputElement;
  const maxSearchResultsInput = document.getElementById('max-search-results') as HTMLInputElement;

  loadDateFromSettings();
  setInputBadgetIfEndDateIsSet();

  submitButton.addEventListener('click', function () {
    elForm.dispatchEvent(new Event('submit'));
  });

  elForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const startSearchDate = startSearchDateInput.value;
    const endSearchDate = endSearchDateInput.value;
    const maxSearchResults = maxSearchResultsInput.value;

    chrome.storage.local.set({ startSearchDate: startSearchDate }).then(() => {});

    chrome.storage.session.set({ endSearchDate: endSearchDate }).then(() => {});

    chrome.storage.local.set({ maxSearchResults: maxSearchResults }).then(() => {});

    showNotification('Settings saved!');
    setInputBadgetIfEndDateIsSet();
  });

  function loadDateFromSettings() {
    chrome.storage.local.get(['startSearchDate'], function (result) {
      if (result) {
        startSearchDateInput.value = result.startSearchDate;
      } else {
        setInitialOptions();
      }
    });

    chrome.storage.session.get(['endSearchDate'], function (result) {
      if (result.endSearchDate) {
        endSearchDateInput.value = result.endSearchDate;
      }
    });

    chrome.storage.local.get(['maxSearchResults'], function (result) {
      if (result.maxSearchResults) {
        maxSearchResultsInput.value = result.maxSearchResults;
      } else {
        setInitialOptions();
      }
    });
  }

  function setInitialOptions() {
    if (!startSearchDateInput.value) {
      startSearchDateInput.value = subYears(new Date(), 1).toISOString().split('T')[0];
    }

    chrome.storage.local.set({ startSearchDate: startSearchDateInput.value }).then(() => {});

    if (!maxSearchResultsInput.value) {
      maxSearchResultsInput.value = '500';
    }

    chrome.storage.local.set({ maxSearchResults: maxSearchResultsInput.value }).then(() => {});
  }

  function showNotification(message: string) {
    const notification = document.getElementById('notification') as HTMLDivElement;
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  function setInputBadgetIfEndDateIsSet() {
    const element = document.getElementById('end-search-date') as HTMLInputElement;

    chrome.storage.session.get(['endSearchDate'], function (result) {
      if (result.endSearchDate) {
        element.classList.add('badge');
      } else {
        element.classList.remove('badge');
      }
    });
  }

  function getDefaultEndDate() {
    return new Date().toISOString().split('T')[0];
  }
});
