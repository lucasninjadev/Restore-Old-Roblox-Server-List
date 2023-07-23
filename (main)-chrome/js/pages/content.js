// the entire script in an async function because I need await ¯\_(ツ)_/¯
(async() => {
  const [, place] = window.location.href.match(/games\/(\d+)\//);
  
  // Load panel

  function waitForElm(selector) {
    return new Promise(resolve => {
      if (document.querySelector(selector)) resolve(document.querySelector(selector));
  
      const observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
  
  const div = document.createElement('div');
  div.id = 'rorsl-panel';
  div.innerHTML = await fetch(chrome.runtime.getURL('html/main.html')).then(res => res.text())
  if (document.body.classList.contains('dark-theme')) div.classList.add('dark');
  div.style.display = 'none';
  const mainContainer = await waitForElm('#container-main');
  mainContainer.parentNode.insertBefore(div, mainContainer);

  // Done injecting panel

  const COLORS = {
    GREEN: '#00b06f',
    BLUE: '#0077ff',
    RED: '#ff3e3e',
  };

  const { getURL } = chrome.runtime;

  const sleep = time => new Promise(res => setTimeout(res, time * 1000));

  const get = async (url, includeCreds = false) => {
    try {
      creds = 'omit';
      if (includeCreds) creds = 'include';
      const request = await fetch(`https://${url}`, {credentials: creds});
      if (!request.ok) throw new Error('Request failed');

      return await request.json();
    } catch (error) {
      await sleep(0.2);
      return await get(url, includeCreds);
    }
  };

  const post = async (url, body) => {
    try {
      const request = await fetch(`https://${url}`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!request.ok) throw new Error('Request failed');

      return await request.json();
    } catch (error) {
      await sleep(0.2);
      return await post(url, body);
    }
  };
  
  const settingsButton = document.getElementById('rorsl-settings-button');
  settingsButton.src = getURL('images/settings_icon.svg');
  const settingsWindow = document.getElementById('rorsl-settings')
  const infoIcons = document.getElementsByClassName("rorsl-info-button");
  for (icon of infoIcons)
    icon.src = getURL('images/info_icon.png');
  const reloadButtonContainer = document.getElementById('rorsl-reload-container');
  const reloadButton = document.getElementById('rorsl-reload');
  reloadButton.src = getURL('images/reload_icon.svg');
  const searchButtonContainer = document.getElementById('rorsl-search-container');
  const searchButton = document.getElementById('rorsl-search');
  searchButton.src = getURL('images/search_icon.svg');
  const userImage = document.getElementById('rorsl-userImage');
  const status = document.getElementById('rorsl-status');
  const pageNum = document.getElementById('rorsl-page');
  const userStatus = document.getElementById('rorsl-userStatus');
  const pageStatus = document.getElementById('rorsl-maxPages');
  pageNum.style.visibility = 'hidden';
  let panelReady = false;

  const color = hex => {
    searchButtonContainer.style.backgroundColor = hex;
  };

  let foundAllServers = false;
  let allPlayers = [];
  let playersCount = 0;
  let playersChecked = 0;
  let maxPlayers = 0;

  let maxServersPerPage = 10;
  let maxPages = 1;
  let page = 1;

  let playerImageUrl;
  let playerUrlReady = false;

  let targetServerIds = {
    serverId: "",
    serverSize: 0
  };
  const serverIds = new Set();

  const friendServers = new Map();
  const allThumbnails = new Map();

  chrome.storage.local.get('autoAttach').then(value => {
    if (value.autoAttach) searchServers();
  });

  async function fetchServers(pass = 1, cursor = '', attempts = 0) {
    const { nextPageCursor, data } = await get(`games.roblox.com/v1/games/${place}/servers/Public?limit=100&cursor=${cursor}`);
    if (pass == 1 && cursor == '') {
      const { id } = await get(`users.roblox.com/v1/users/authenticated`, true);
      const { data } = await get(`friends.roblox.com/v1/users/${id}/friends`);
      const friendIds = [];
      data.forEach((friend) => {
        friendIds.push(friend.id);
      });
      if (friendIds.length > 0) {
        const { data } = await get(`games.roblox.com/v1/games/${place}/servers/Friend?limit=100`,true);
        data.forEach((server) => {
          server.players.forEach((player) => {
            if (friendIds.includes(player.id)) {
              const friends = friendServers.get(server.id) || [];
              if (friends.length == 0) friendServers.set(server.id, friends);
              friends.push(player);
            }
          });
        });
      }
    }
    status.innerText = `Discovering... (Bigger games require longer searches!) Pass ${pass}, ${serverIds.size} Servers Found`;
    if (attempts >= 30) return;

    if (!data || data.length === 0) {
      if (!nextPageCursor) return;
      await sleep(1);
      return fetchServers(pass, cursor, attempts + 1);
    }

    data.forEach((server) => {
      if (!serverIds.has(server.id))
        server.playerTokens.forEach((playerToken) => {
          serverIds.add(server.id);
          playersCount += 1;
          allPlayers.push({
            token: playerToken,
            type: 'AvatarHeadshot',
            size: '150x150',
            requestId: server.id,
          });
        });
      maxPlayers = server.maxPlayers;
    });
    
    if (!nextPageCursor) return;
    return fetchServers(pass, nextPageCursor);
  }

  async function findTarget() {
    while (true) {
      const chosenPlayers = [];

      for (let i = 0; i < 100; i++) {
        const playerToken = allPlayers.shift();
        if (!playerToken) break;
        chosenPlayers.push(playerToken);
      }

      if (!chosenPlayers.length) {
        await sleep(0.1);
        if (playersChecked === playersCount && foundAllServers) {
          break;
        }
        continue;
      }

      post('thumbnails.roblox.com/v1/batch', JSON.stringify(chosenPlayers)).then(({ data: thumbnailsData }) => {

        thumbnailsData.forEach((thumbnailData) => {
          const thumbnails = allThumbnails.get(thumbnailData.requestId) || [];

          if (thumbnails.length == 0) {
            allThumbnails.set(thumbnailData.requestId, thumbnails);
          }

          playersChecked += 1;

          thumbnails.push(thumbnailData.imageUrl);

          //const foundTarget = thumbnailData.imageUrl === imageUrl ? thumbnailData.requestId : null;

          let containsId = false;
          targetServerIds.forEach((targetServerId) => {
            if (targetServerId.serverId == thumbnailData.requestId) containsId = true;
          });
          if (!containsId) targetServerIds.push({serverId: thumbnailData.requestId});
        });
      });
    }
    targetServerIds.forEach((targetServerId) => {
      targetServerId.serverSize = allThumbnails.get(targetServerId.serverId).length;
    });
    if (targetServerIds.length) {
      targetServerIds.forEach(targetServerId => {
        const thumbnails = allThumbnails.get(targetServerId.serverId);
        thumbnails.reverse();
      })
      preLoadServers();
    } else {
      color(COLORS.RED);
      status.innerText = 'No servers found.';
      searchButton.disabled = false;
      searchButtonContainer.style.opacity = '100%';
    }
  }

  async function updateUser() {
    try {
      let userName = "Roblox";
      await chrome.storage.local.get('username').then(value => {
        if (userName != undefined) userName = value.username;
      });
      const { data: [{ id }] } = await post('users.roblox.com/v1/usernames/users', `{"usernames": ["${userName}"],"excludeBannedUsers": false}`)
      const { data: [{ imageUrl }] } = await get(`thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=false`);
      userStatus.innerText = '';
      userImage.src = imageUrl;
      if (imageUrl.includes('https://tr.rbxcdn.com')) playerImageUrl = imageUrl;
      else userStatus.innerText = 'User thumbnail is a common error thumbnail, unable to find user';
      playerUrlReady = true;
    } catch (error) {
      userStatus.innerText = 'Username is Invalid for thumbnail, unable to find user';
      userImage.src = 'https://t6.rbxcdn.com/b48637b2a6266bd379a09afb5a8d5131';
      playerUrlReady = true;
    }
  };

  async function searchServers() {
    searchButton.disabled = true;
    reloadButton.disabled = true;
    pageNum.style.visibility = 'hidden';
    searchButtonContainer.style.opacity = '50%';
    reloadButtonContainer.style.opacity = '50%';
    if (div.hasAttribute('page-shown')) div.removeAttribute('page-shown');
    pageStatus.innerText = '';
    
    targetServerIds = [];
    serverIds.clear();
    friendServers.clear();
    allThumbnails.clear();
    foundAllServers = false;
    allPlayers = [];
    playersCount = 0;
    playersChecked = 0;
    maxPlayers = 0;

    status.innerText = 'Discovering... (Bigger games require longer searches!) Pass 1, 0 Servers Found';
    color(COLORS.BLUE);
    removeExtraInfo();
    deleteRorslServers();
    updateUser();
    playerUrlReady = false;
    var passes = 1;
    chrome.storage.local.get('searchPasses').then(value => {
      if (!isNaN(value.searchPasses)) passes = value.searchPasses;
      if (passes < 1) passes = 1;
      if (passes > 10) passes = 10;
    });
    findTarget();
    for (var pass = 0; pass < passes; pass++)
      if (!foundAllServers) await fetchServers(pass+1);
    foundAllServers = true;
  }

  async function removeExtraInfo() {
    var noServers = document.getElementsByClassName("no-servers-message");
    for (var i = 0; i < noServers.length; i++) {
      if (noServers[i].innerText !== 'No Servers Found.')
        if (noServers[i].parentElement.parentElement.id == 'rbx-running-games')
          noServers[i].parentElement.parentElement.firstElementChild.firstElementChild.lastElementChild.click();
    }
    var loadMore = document.getElementsByClassName('rbx-running-games-load-more btn-control-md btn-full-width');
    for (let button of loadMore)
      if (button.innerText == 'Load More')
        button.style.display = 'none';
    var refresh = document.getElementsByClassName('btn-more rbx-refresh refresh-link-icon btn-control-xs btn-min-width');
    for (let button of refresh)
      if (button.parentElement.parentElement.parentElement.id == 'rbx-running-games')
        button.style.display = 'none';
    var listoptions = document.getElementsByClassName('server-list-options');
    if (listoptions.length > 0)
      listoptions[0].style.display = 'none';
    var btr = document.getElementsByClassName('btr-pager');
    if (btr.length > 0)
      btr[0].style.display = 'none';
    var roprofilters = document.getElementById('roproServerFiltersButton');
    if (roprofilters)
      roprofilters.style.display = 'none';
    var roprofooter = document.getElementsByClassName('ropro-running-games-footer');
    if (roprofooter.length > 0)
      roprofooter[0].style.display = 'none';

    var servers = document.getElementsByClassName('rbx-game-server-item col-md-3 col-sm-4 col-xs-6');
    for (let i = 0; i < servers.length; i++)
      while(servers[i].hasChildNodes())
        servers[i].removeChild(servers[i].firstChild);
  };

  async function deleteRorslServers() {
    var rorslServers = document.getElementsByClassName('stack-row rbx-game-server-item');
    while (rorslServers.length > 0)
      rorslServers[0].parentNode.removeChild(rorslServers[0]);
  }

  async function preLoadServers() {
    targetServerIds.sort((a, b) => {
      return b.serverSize - a.serverSize;
    });
    await chrome.storage.local.get('descending').then(value => {
      if (value.descending) targetServerIds.reverse();
    });
    
    await chrome.storage.local.get('listSize').then(value => {
      if (!isNaN(value.listSize)) maxServersPerPage = value.listSize;
      if (maxServersPerPage < 1) maxServersPerPage = 1;
      if (maxServersPerPage > 250) maxServersPerPage = 250;
    });

    maxPages = 1;
    let serverCount = targetServerIds.length;
    while (serverCount > maxServersPerPage) {
      maxPages += 1;
      serverCount -= maxServersPerPage;
    }

    if (page > maxPages) {
      page = maxPages;
      pageNum.value = maxPages;
    }

    while (!playerUrlReady) await sleep(.1);
    if (!userStatus.innerText.includes('Username is Invalid for thumbnail') && !userStatus.innerText.includes('User thumbnail is a common error thumbnail'))
      for (let i = 0; i < targetServerIds.length; i++) {
        const thumbnails = allThumbnails.get(targetServerIds[i].serverId);
        for (let j = 0; j < thumbnails.length; j++) {
          if (thumbnails[j] === playerImageUrl ? thumbnails[j] : null) {
            let serverCount = i + 1;
            let serverPage = 1;
            while (serverCount > maxServersPerPage) {
              serverCount -= maxServersPerPage;
              serverPage++;
            }
            if (!userStatus.innerText.includes('User found!'))
              userStatus.innerText += ' User found! Server on page ' + serverPage;
          }
        }
      }
    if (!userStatus.innerText.includes('User found!') && !userStatus.innerText.includes('User not found') && !userStatus.innerText.includes('Username is Invalid for thumbnail') && !userStatus.innerText.includes('User thumbnail is a common error thumbnail'))
      userStatus.innerText += ' User not found';
    loadServers();
  };

  async function loadServers() {
    if (!panelReady)
      setTimeout(loadServers, 100);
    else {
      await waitForElm('.rbx-game-server-item-container');
      removeExtraInfo();
      deleteRorslServers();

      for (let serverNumber = maxServersPerPage * (page - 1); serverNumber < maxServersPerPage * page; serverNumber++) {
        if (serverNumber >= targetServerIds.length)
          break;
        color(COLORS.GREEN);

        const first = document.querySelectorAll('.rbx-game-server-item-container')[0] || document.querySelectorAll('#rbx-running-games > div.section-content-off.empty-game-instances-container > p')[0];
        
        if (first.className == 'no-servers-message') {
          first.parentNode.style['display'] = 'flex';
          first.parentNode.style['flex-direction'] = 'column';
        }

        const item = document.createElement('li');
        const thumbnails = allThumbnails.get(targetServerIds[serverNumber].serverId);

        let friendTags = '';
        if (friendServers.has(targetServerIds[serverNumber].serverId)) {
          const friends = friendServers.get(targetServerIds[serverNumber].serverId);
          for (let friend = 0; friend < friends.length; friend++)
            if (friend+1 < friends.length) friendTags += `<a class="text-name" href="https://www.roblox.com/users/${friends[friend].id}/profile" style="padding:0;margin-right:5px;display:inline-block;">${friends[friend].displayName},</a>`;
            else friendTags += `<a class="text-name" href="https://www.roblox.com/users/${friends[friend].id}/profile" style="padding:0;display:inline-block;">${friends[friend].displayName}</a>`;
        }
        item.className = 'rorsl-server stack-row rbx-game-server-item';
        var itemHtml = `
          <div class="section-left rbx-game-server-details'">
          <div class="text-info rbx-game-status rbx-game-server-status'">${thumbnails.length} of ${maxPlayers} people max</div>
          <span>
          <button onclick='Roblox.GameLauncher.joinGameInstance(${place}, "${targetServerIds[serverNumber].serverId}")' type="button" class="btn-full-width btn-control-xs rbx-game-server-join btn-primary-md">Join</button>
          </span>`;
        if (friendTags.length > 0) itemHtml += `<div style="margin-top:5px;" class="text friends-in-server-label">Friends in this server: ${friendTags}</div>`;
        itemHtml += `</div>
          <div class="section-right rbx-game-server-players">
          ${thumbnails.map(url => `<span class="avatar avatar-headshot-sm player-avatar"><span class="thumbnail-2d-container avatar-card-image"><img src="${url}"></span></span>`).join('')}
          </div>`;
        item.innerHTML = itemHtml;

        for (let j = 0; j < thumbnails.length; j++)
          if (thumbnails[j].includes(playerImageUrl))
            item.style.borderColor = 'rgb(0, 176, 111)';

        first.parentNode.insertBefore(item, first);

        status.innerText = `Search completed, ${serverIds.size} Servers Found`;
      }
      searchButton.disabled = false;
      searchButtonContainer.style.opacity = '100%';
      pageStatus.innerText = 'Page ⠀⠀⠀⠀⠀of ' + maxPages;
      pageNum.disabled = false;
      pageNum.style.visibility = 'visible';
      div.setAttribute('page-shown', true);
      reloadButtonContainer.style.opacity = '100%';
      reloadButton.disabled = false;
      removeExtraInfo();
      for (let i = 0; i < 10; i++) {
        await sleep(1);
        removeExtraInfo();
      }
    }
  };

  let inAnim = false;
  settingsButton.addEventListener('click', async event => {
    event.preventDefault();
    if (settingsWindow.hasAttribute('showing') && !inAnim) {
      inAnim = true;
      settingsWindow.style.overflow = 'hidden';
      settingsWindow.style.display = 'block';
      settingsWindow.removeAttribute('showing');
      await sleep(.3);
      inAnim = false;
    } else if (!inAnim) {
      inAnim = true;
      settingsWindow.setAttribute('showing', true);
      await sleep(.3);
      settingsWindow.style.overflow = 'visible';
      settingsWindow.style.display = 'table';
      inAnim = false;
    }
  })

  document.getElementById('rorsl-advanced-settings').addEventListener('click', async event => {
    event.preventDefault();

    chrome.runtime.sendMessage('rorsl open advanced settings');
  })

  reloadButton.addEventListener('click', async event => {
    event.preventDefault();

    await updateUser();
    preLoadServers();
  });

  searchButton.addEventListener('click', async event => {
    event.preventDefault();

    searchServers();
  });

  pageNum.addEventListener('input', async event => {
    event.preventDefault();
    pageNum.value = pageNum.value.replace(/[e\+\-]/gi, "");
    if (pageNum.value == '')
      page = 1;
    else if (pageNum.value > maxPages)
      pageNum.value = maxPages;
    else if (pageNum.value < 1)
      pageNum.value = 1;
    else
      page = pageNum.value;
    loadServers();
  });

  async function loadSettings() {
    chrome.storage.local.get("autoAttach").then((value) => {
      if (!value.autoAttach) {
        chrome.storage.local.set({ autoAttach: false });
        $("#rorsl-autoAttach").prop("checked", false);
      } else {
        $("#rorsl-autoAttach").prop("checked", value.autoAttach);
      }
    });
  
    chrome.storage.local.get("listSize").then((value) => {
      if (!value.listSize || value.listSize < 1 || value.listSize > 250) {
        chrome.storage.local.set({ listSize: 10 });
        $("#rorsl-listSize").val(10);
      } else {
        $("#rorsl-listSize").val(value.listSize);
      }
    });
  
    chrome.storage.local.get("descending").then((value) => {
      if (!value.descending) {
        chrome.storage.local.set({ descending: false });
        $("#rorsl-descending").prop("checked", false);
      } else {
        $("#rorsl-descending").prop("checked", value.descending);
      }
    });
  
    chrome.storage.local.get("username").then((value) => {
      if (value.username == undefined) {
        chrome.storage.local.set({ username: "Roblox" });
        $("#rorsl-username").val("Roblox");
      } else {
        $("#rorsl-username").val(value.username);
      }
    });
  }
  
  $(function () {
    loadSettings();
    $("#rorsl-autoAttach").change(function () {
      chrome.storage.local.set({ autoAttach: this.checked });
      chrome.runtime.sendMessage("rorsl background refresh settings");
    });
  
    $("#rorsl-listSize").on("input", function () {
      var size = $("#rorsl-listSize").val();
      size = size.replace(/[e\+\-]/gi, "");
      $("#rorsl-listSize").val(size);
      if (size && size > 0 && size < 251) {
        chrome.storage.local.set({ listSize: size });
      } else if (size < 1) {
        chrome.storage.local.set({ listSize: 1 });
        $('#rorsl-listSize').val(1);
      } else if (size > 250) {
        chrome.storage.local.set({ listSize: 250 });
        $('#rorsl-listSize').val(250);
      }
      chrome.runtime.sendMessage("rorsl background refresh settings");
    });
  
    $("#rorsl-descending").change(function () {
      chrome.storage.local.set({ descending: this.checked });
      chrome.runtime.sendMessage("rorsl background refresh settings");
    });
  
    $("#rorsl-username").on("input", function () {
      var username = $("#rorsl-username").val();
      username = username.replace(/[\W ]+/g, "");
      $("#rorsl-username").val(username);
      if (username != undefined) {
        chrome.storage.local.set({ username: username });
      }
      chrome.runtime.sendMessage("rorsl background refresh settings");
    });
  });
  
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request == "rorsl refresh settings") loadSettings();
  });

  const runningGames = await waitForElm('#rbx-running-games');
  runningGames.parentNode.insertBefore(div, runningGames);
  div.style.display = 'block';
  panelReady = true;
})();