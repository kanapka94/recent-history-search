document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('searchInput');
  var tabsList = document.getElementById('tabsList');
  var currentSelectionIndex = -1;

  // Zaznacz pole wyszukiwania po kliknięciu w ikonkę wtyczki
  chrome.tabs.getCurrent(function (tab) {
    searchInput.focus();
  });

  // Obsługa zdarzenia wprowadzania tekstu w polu wyszukiwania
  searchInput.addEventListener('input', function () {
    var searchQuery = searchInput.value.trim().toLowerCase();
    searchTabs(searchQuery);
  });

  // Obsługa zdarzenia naciśnięcia klawiszy strzałek
  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowUp') {
      navigateTabs('up');
    } else if (event.key === 'ArrowDown') {
      navigateTabs('down');
    } else if (event.key === 'Enter') {
      openSelectedTab();
    }
  });

  // Funkcja wyszukująca pasujące karty
  function searchTabs(query) {
    // Wyczyść listę kart przed aktualizacją wyników wyszukiwania
    tabsList.innerHTML = '';

    // Pobierz historię przeglądarki
    chrome.history.search({ text: query }, function (results) {
      results.forEach(function (result, index) {
        // Dodaj wyniki wyszukiwania do listy
        var listItem = document.createElement('li');
        var favicon = document.createElement('img');
        favicon.classList.add('favicon');
        favicon.src = 'chrome://favicon/' + result.url;
        listItem.appendChild(favicon);
        listItem.textContent = result.title;
        listItem.setAttribute('data-url', result.url);
        listItem.addEventListener('click', function () {
          // Otwórz wybraną kartę po kliknięciu na niej
          chrome.tabs.create({ url: result.url });
        });
        tabsList.appendChild(listItem);
      });

      // Zresetuj indeks wyboru, gdy lista zostanie zaktualizowana
      currentSelectionIndex = -1;
    });
  }

  // Funkcja obsługująca nawigację w górę i w dół po liście
  function navigateTabs(direction) {
    var items = tabsList.querySelectorAll('li');

    if (direction === 'up') {
      currentSelectionIndex = Math.max(currentSelectionIndex - 1, 0);
    } else if (direction === 'down') {
      currentSelectionIndex = Math.min(currentSelectionIndex + 1, items.length - 1);
    }

    // Zaznacz wybrany element
    items.forEach(function (item, index) {
      if (index === currentSelectionIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Przewiń do wybranego elementu
    if (items[currentSelectionIndex]) {
      items[currentSelectionIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Funkcja otwierająca zaznaczoną kartę
  function openSelectedTab() {
    var selectedItem = tabsList.querySelector('li.active');
    if (selectedItem) {
      var url = selectedItem.getAttribute('data-url');
      chrome.tabs.create({ url: url });
    }
  }
});
