import { formatDistance } from 'date-fns';

document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('searchInput');
  var tabsList = document.getElementById('tabsList');
  var currentSelectionIndex = -1;

  let searchLimitTimestamp = undefined;

  getSearchLimitDate().then((result) => {
    searchLimitTimestamp = new Date(result).getTime();
  });

  chrome.tabs.getCurrent(function (tab) {
    searchInput.focus();
  });

  function displayHistoryResults() {
    chrome.history.search({ text: '', maxResults: 20 }, function (results) {
      results.forEach(function (result) {
        tabsList.appendChild(getListItem(result));
      });
    });
  }

  try {
    displayHistoryResults();
  } catch (ex) {
    console.error(ex);
  }

  searchInput.addEventListener('input', function () {
    var searchQuery = searchInput.value.trim().toLowerCase();
    searchTabs(searchQuery);
  });

  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp') {
      navigateTabs('up');
    } else if (event.key === 'ArrowDown') {
      navigateTabs('down');
    } else if (event.key === 'Enter') {
      openSelectedTab();
    }
  });

  function searchTabs(query) {
    tabsList.innerHTML = '';

    getAllHistoryResults(query, function (results) {
      results.forEach(function (result, index) {
        if (
          result.title.toLowerCase().includes(query) ||
          result.url.toLowerCase().includes(query)
        ) {
          tabsList.appendChild(getListItem(result));
        }
      });

      if (results.length === 0) {
        addNotFoundItem();
      }

      currentSelectionIndex = -1;
    });
  }

  function addNotFoundItem() {
    var notFoundItem = document.createElement('li');
    notFoundItem.textContent = 'No results found';
    tabsList.appendChild(notFoundItem);
  }

  function getAllHistoryResults(query, callback) {
    var startTime = searchLimitTimestamp;
    var endTime = Date.now();
    var resultsSoFar = [];

    chrome.history.search(
      { text: query, startTime: startTime, endTime: endTime, maxResults: 100 },
      function (results) {
        resultsSoFar = resultsSoFar.concat(results);

        callback(resultsSoFar);
      }
    );
  }

  function navigateTabs(direction) {
    var items = tabsList.querySelectorAll('[role="option"]');

    if (direction === 'up') {
      currentSelectionIndex = Math.max(currentSelectionIndex - 1, 0);
    } else if (direction === 'down') {
      currentSelectionIndex = Math.min(currentSelectionIndex + 1, items.length - 1);
    }

    items.forEach(function (item, index) {
      if (index === currentSelectionIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (items[currentSelectionIndex]) {
      items[currentSelectionIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function openSelectedTab() {
    var selectedItem = tabsList.querySelector('li.active');
    if (selectedItem) {
      var url = selectedItem.getAttribute('data-url');
      chrome.tabs.create({ url: url });
    }
  }

  function getFaviconUrl(url) {
    return `chrome-extension://${
      chrome.runtime.id
    }/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
  }

  function getSearchLimitDate() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['searchLimitDate'], function (result) {
        resolve(result.searchLimitDate);
      });
    });
  }

  function getListItem(item) {
    const listItem = document.createElement('li');
    listItem.setAttribute('role', 'option');

    const favicon = document.createElement('img');
    favicon.classList.add('favicon');
    favicon.src = getFaviconUrl(item.url);

    listItem.appendChild(favicon);

    const title = document.createElement('span');
    title.classList.add('title');
    title.textContent = item.title;
    listItem.appendChild(title);

    const lastVisit = document.createElement('span');
    lastVisit.classList.add('last-visit');
    lastVisit.textContent = formatDistance(new Date(item.lastVisitTime), new Date(), {
      addSuffix: true,
    });
    listItem.appendChild(lastVisit);

    listItem.setAttribute('data-url', item.url);
    listItem.addEventListener('click', function () {
      chrome.tabs.create({ url: item.url });
    });

    return listItem;
  }
});
