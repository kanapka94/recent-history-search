document.addEventListener('DOMContentLoaded', function () {
  const elForm = document.getElementById('settings-form');

  elForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const searchDate = document.getElementById('search-date').value;

    chrome.storage.local.set({ searchLimitDate: searchDate }).then(() => {
      console.log('Zapisano datę: ' + searchDate);
    });
  });

  chrome.storage.local.get(['searchLimitDate'], function (result) {
    if (result) {
      document.getElementById('search-date').value = result.searchLimitDate;
    }
  });
});
