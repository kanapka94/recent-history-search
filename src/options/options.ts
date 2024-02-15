import { subYears } from 'date-fns';

document.addEventListener('DOMContentLoaded', function () {
  const elForm = document.getElementById('settings-form');
  const searchDateInput = document.getElementById('search-date');

  setDateFromSettings();
  setInitialDate();

  elForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const searchDate = searchDateInput.value;

    chrome.storage.local.set({ searchLimitDate: searchDate }).then(() => {
      console.log('Zapisano datę: ' + searchDate);
    });
  });

  function setDateFromSettings() {
    chrome.storage.local.get(['searchLimitDate'], function (result) {
      if (result) {
        searchDateInput.value = result.searchLimitDate;
      }
    });
  }

  function setInitialDate() {
    if (!searchDateInput.value) {
      searchDateInput.value = subYears(new Date(), 1).toISOString().split('T')[0];
    }

    chrome.storage.local.set({ searchLimitDate: searchDateInput.value }).then(() => {
      console.log('Zapisano datę: ' + searchDateInput.value);
    });
  }
});
