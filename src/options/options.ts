import { subYears } from 'date-fns';

document.addEventListener('DOMContentLoaded', function () {
  const elForm = document.getElementById('settings-form') as HTMLFormElement;
  const submitButton = document.querySelector('[data-trigger="save-settings"]');

  const startSearchDateInput = document.getElementById('start-search-date') as HTMLInputElement;
  const endSearchDateInput = document.getElementById('end-search-date') as HTMLInputElement;

  loadDateFromSettings();
  setInitialSearchDates();
  setInputBadgetIfEndDateIsSet();

  submitButton.addEventListener('click', function () {
    elForm.dispatchEvent(new Event('submit'));
  });

  elForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const startSearchDate = startSearchDateInput.value;
    const endSearchDate = endSearchDateInput.value;

    chrome.storage.local.set({ startSearchDate: startSearchDate }).then(() => {});

    chrome.storage.session.set({ endSearchDate: endSearchDate }).then(() => {});

    showNotification('Settings saved!');
    setInputBadgetIfEndDateIsSet();
  });

  function loadDateFromSettings() {
    chrome.storage.local.get(['startSearchDate'], function (result) {
      if (result) {
        startSearchDateInput.value = result.startSearchDate;
      }
    });

    chrome.storage.session.get(['endSearchDate'], function (result) {
      if (result.endSearchDate) {
        endSearchDateInput.value = result.endSearchDate;
      }
    });
  }

  function setInitialSearchDates() {
    if (!startSearchDateInput.value) {
      startSearchDateInput.value = subYears(new Date(), 1).toISOString().split('T')[0];
    }

    chrome.storage.local.set({ startSearchDate: startSearchDateInput.value }).then(() => {});
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
