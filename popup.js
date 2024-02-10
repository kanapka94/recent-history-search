document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('searchInput');
  var tabsList = document.getElementById('tabsList');
  var currentSelectionIndex = -1;

  let searchLimitTimestamp = undefined;

  getSearchLimitDate().then((result) => {
    console.log('promise end:', result);
    searchLimitTimestamp = new Date(result).getTime();
  });

  chrome.tabs.getCurrent(function (tab) {
    searchInput.focus();
  });

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
          var listItem = document.createElement('li');
          var favicon = document.createElement('img');
          favicon.classList.add('favicon');
          favicon.src = getFaviconUrl(result.url);
          listItem.appendChild(favicon);

          const title = document.createElement('span');
          title.classList.add('title');
          title.textContent = result.title;
          listItem.appendChild(title);

          const lastVisit = document.createElement('span');
          lastVisit.classList.add('last-visit');
          lastVisit.textContent = new Date(result.lastVisitTime).toLocaleDateString();
          listItem.appendChild(lastVisit);

          listItem.setAttribute('data-url', result.url);
          listItem.addEventListener('click', function () {
            chrome.tabs.create({ url: result.url });
          });
          tabsList.appendChild(listItem);
        }
      });

      currentSelectionIndex = -1;
    });
  }

  function getAllHistoryResults(query, callback) {
    var startTime = searchLimitTimestamp;
    var endTime = Date.now();
    var resultsSoFar = [];

    chrome.history.search(
      { text: query, startTime: startTime, endTime: endTime, maxResults: 1000 },
      function (results) {
        resultsSoFar = resultsSoFar.concat(results);

        callback(resultsSoFar);
      }
    );
  }

  function navigateTabs(direction) {
    var items = tabsList.querySelectorAll('li');

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
});
