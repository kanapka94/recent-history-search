import { subYears } from 'date-fns';

document.addEventListener('DOMContentLoaded', function () {
  const elForm = document.getElementById('settings-form') as HTMLFormElement;
  const submitButton = document.querySelector('[data-trigger="save-settings"]');

  const startSearchDateInput = document.getElementById('start-search-date') as HTMLInputElement;
  const endSearchDateInput = document.getElementById('end-search-date') as HTMLInputElement;

  setDateFromSettings();
  setInitialSearchDates();

  submitButton.addEventListener('click', function () {
    elForm.dispatchEvent(new Event('submit'));
  });

  elForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const startSearchDate = startSearchDateInput.value;
    const endSearchDate = endSearchDateInput.value;

    chrome.storage.local.set({ startSearchDate: startSearchDate }).then(() => {
      console.log('Zapisano datę: ' + startSearchDate);
    });

    chrome.storage.local.set({ endSearchDate: endSearchDate }).then(() => {
      console.log('Zapisano datę: ' + endSearchDate);
    });
  });

  function setDateFromSettings() {
    chrome.storage.local.get(['startSearchDate'], function (result) {
      if (result) {
        startSearchDateInput.value = result.startSearchDate;
      }
    });
  }

  function setInitialSearchDates() {
    if (!startSearchDateInput.value) {
      startSearchDateInput.value = subYears(new Date(), 1).toISOString().split('T')[0];
    }

    if (!endSearchDateInput.value) {
      endSearchDateInput.value = new Date().toISOString().split('T')[0];
    }

    chrome.storage.local.set({ startSearchDate: startSearchDateInput.value }).then(() => {
      console.log('Zapisano datę: ' + startSearchDateInput.value);
    });

    chrome.storage.local.set({ endSearchDate: endSearchDateInput.value }).then(() => {
      console.log('Zapisano datę: ' + endSearchDateInput.value);
    });
  }
});
