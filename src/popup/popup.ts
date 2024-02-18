import { formatDistance } from 'date-fns';

document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('searchInput');
  const SettingsButton = document.getElementById('settings-button');
  var tabsList = document.getElementById('tabsList');
  var currentSelectionIndex = -1;

  let startSearchTimestamp = undefined;
  let endSearchTimestamp = undefined;
  let searchMaxResults = undefined;

  getStartSearchDate().then((result) => {
    startSearchTimestamp = new Date(result).getTime();
  });

  getEndSearchDate().then((result: string) => {
    endSearchTimestamp = !result ? new Date().getTime() : new Date(result).getTime();
  });

  getSearchMaxResults().then((result) => {
    searchMaxResults = Number(result);
  });

  chrome.tabs.getCurrent(function (tab) {
    searchInput.focus();
  });

  setButtonBadgeIfEndDateIsSet();

  try {
    displayHistoryResults();
  } catch (ex) {
    console.error(ex);
  }

  function displayHistoryResults() {
    chrome.history.search({ text: '', maxResults: searchMaxResults }, function (results) {
      results.forEach(function (result) {
        tabsList.appendChild(getListItem(result));
      });

      selectFirstTab();
    });
  }

  SettingsButton.addEventListener('click', navigateToSettings);

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
      results.forEach(function (result) {
        tabsList.appendChild(getListItem(result, query));
      });

      currentSelectionIndex = -1;

      if (results.length === 0) {
        addNoResultsItem();
        return;
      }

      selectFirstTab();
    });
  }

  function addNoResultsItem() {
    var notFoundItem = document.createElement('li');
    notFoundItem.classList.add('no-results');
    notFoundItem.textContent = 'No results found';
    tabsList.appendChild(notFoundItem);
  }

  type Callback = (results: chrome.history.HistoryItem[]) => void;

  function getAllHistoryResults(query: string, callback: Callback) {
    var startTime = startSearchTimestamp;
    var endTime = endSearchTimestamp;

    chrome.history.search(
      { text: query, startTime: startTime, endTime: endTime, maxResults: searchMaxResults },
      callback
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

  function selectFirstTab() {
    var firstItem = tabsList.querySelector('li');

    if (firstItem) {
      currentSelectionIndex = 0;
      firstItem.classList.add('active');
    }
  }

  function getFaviconUrl(url) {
    return `chrome-extension://${
      chrome.runtime.id
    }/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
  }

  function getStartSearchDate() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['startSearchDate'], function (result) {
        resolve(result.startSearchDate);
      });
    });
  }

  function getEndSearchDate() {
    return new Promise((resolve) => {
      chrome.storage.session.get(['endSearchDate'], function (result) {
        resolve(result.endSearchDate);
      });
    });
  }

  function getSearchMaxResults() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['maxSearchResults'], function (result) {
        resolve(result.maxSearchResults);
      });
    });
  }

  function getListItem(item, query: string | undefined = undefined) {
    const listItem = document.createElement('li');
    listItem.classList.add('list-item');
    listItem.setAttribute('role', 'option');

    const Container = document.createElement('div');
    Container.classList.add('container');

    const favicon = document.createElement('img');
    favicon.classList.add('favicon');
    favicon.src = getFaviconUrl(item.url);

    Container.appendChild(favicon);

    const Wrapper = document.createElement('div');
    Wrapper.classList.add('wrapper');
    Container.appendChild(Wrapper);

    const title = document.createElement('p');
    title.classList.add('title');
    const sanitizedTitle = document.createElement('div');
    sanitizedTitle.textContent = item.title;
    title.innerHTML = !query
      ? sanitizedTitle.innerHTML
      : highlightText(sanitizedTitle.innerHTML, query);
    Wrapper.appendChild(title);

    const domain = document.createElement('p');
    domain.classList.add('domain');
    domain.textContent = new URL(item.url).hostname;
    Wrapper.appendChild(domain);

    const lastVisit = document.createElement('p');
    lastVisit.classList.add('last-visit');

    if (item.lastVisitTime) {
      lastVisit.textContent = formatDistance(new Date(item.lastVisitTime), new Date(), {
        addSuffix: true,
      });
    }

    listItem.appendChild(Container);
    listItem.appendChild(lastVisit);

    listItem.setAttribute('data-url', item.url);
    listItem.addEventListener('click', function () {
      if (!item.lastVisitTime) {
        chrome.tabs.update(item.id, { active: true });
        return;
      }

      chrome.tabs.create({ url: item.url });
    });

    return listItem;
  }

  function highlightText(text: string, searchTerm: string) {
    var highlightedText = text.replace(
      new RegExp(searchTerm, 'gi'),
      "<span class='highlight'>" + searchTerm + '</span>'
    );

    return highlightedText;
  }

  function navigateToSettings() {
    chrome.runtime.openOptionsPage();
  }

  function setButtonBadgeIfEndDateIsSet() {
    getEndSearchDate().then((result) => {
      if (result) {
        SettingsButton.classList.add('badge');
      }
    });
  }
});
