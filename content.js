const COLORS = {
  GREEN: '#00b06f',
  BLUE: '#0077ff',
  RED: '#ff3e3e',
};

const { getURL } = chrome.runtime;

const sleep = time => new Promise(res => setTimeout(res, time * 1000));

const get = async (url) => {
  try {
    const request = await fetch(`https://${url}`);
    if (!request.ok) throw new Error('Request failed');

    return await request.json();
  } catch (error) {
    await sleep(0.2);
    return await get(url);
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

const size = document.getElementById('rsbx-size');
const type = document.getElementById('rsbx-type');
const input = document.getElementById('rsbx-input');
const search = document.getElementById('rsbx-search');
const status = document.getElementById('rsbx-status');
const pageNum = document.getElementById('rsbx-page');
const pageStatus = document.getElementById('rsbx-maxPages');
input.style.visibility = 'hidden';
input.value = 1;
pageNum.style.visibility = 'hidden';
pageNum.value = 1;

size.src = getURL('images/10.png');
type.src = getURL('images/desc.png');
search.src = getURL('images/search.png');

const color = hex => {
  search.style.backgroundColor = hex;
};

let buttondel = false;
let asc = false;

let foundAllServers = false;
let allPlayers = [];
let playersCount = 0;
let playersChecked = 0;
let maxPlayers = 0;

let maxServers = 10;
let maxPages = 1;
let page = 1;

let playerImageUrl = 'https://tr.rbxcdn.com/837aca8a1522baa27e951da106284553/150/150/AvatarHeadshot/Png';

let targetServersId = {
  serverId: "",
  serverSize: 0
};
let highlighted = [];

const allThumbnails = new Map();

input.oninput = (async => {
  input.value = input.value.replace(/[e\+\-]/gi, "");
  if (!(isNaN(input.value) || input.value == "" || input.value == " " || input.value == 0 || input.value == null || input.value == false))
    mid();
});

async function mid() {
  await updateUser();
  const [, place] = window.location.href.match(/games\/(\d+)\//);
  reloadServers(place);
}

pageNum.oninput = () => {

  pageNum.value = pageNum.value.replace(/[e\+\-]/gi, "");
  
  if (pageNum.value > maxPages || isNaN(pageNum.value) || pageNum.value == "" || pageNum.value == " " || pageNum.value == 0 || pageNum.value == null || pageNum.value == false)
    pageNum.value = page;
  else
    page = pageNum.value;

  const [, place] = window.location.href.match(/games\/(\d+)\//);

  reloadServers(place);
}

async function fetchServers(place = '', cursor = '', attempts = 0) {
  const { nextPageCursor, data } = await get(`games.roblox.com/v1/games/${place}/servers/Public?limit=100&cursor=${cursor}`);

  if (attempts >= 30) {
    foundAllServers = true;
    return;
  }

  if (!data || data.length === 0) {
    if (!nextPageCursor) {
      foundAllServers = true;
      return;
    }
    await sleep(1);
    return fetchServers(place, cursor, attempts + 1);
  }

  data.forEach((server) => {
    server.playerTokens.forEach((playerToken) => {
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

  if (!nextPageCursor) {
    foundAllServers = true;
    return;
  }
  return fetchServers(place, nextPageCursor);
}

async function findTarget(place) {
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

        if (!thumbnails.includes(thumbnailData.imageUrl)) {
          thumbnails.push(thumbnailData.imageUrl);
        }

        //const foundTarget = thumbnailData.imageUrl === imageUrl ? thumbnailData.requestId : null;

        let containsId = false;
        targetServersId.forEach((targetServerId) => {
          if(targetServerId.serverId == thumbnailData.requestId)
            containsId = true;
        });
        if (!(containsId))
        targetServersId.push({serverId: thumbnailData.requestId});
      });
    });
  }
  targetServersId.forEach((targetServerId) => {
    targetServerId.serverSize = allThumbnails.get(targetServerId.serverId).length
  });
  if (targetServersId.length) {
    targetServersId.forEach(targetServerId => {
      const thumbnails = allThumbnails.get(targetServerId.serverId);
      thumbnails.reverse();
    })
    reloadServers(place);
  } else {
    color(COLORS.RED);
    status.innerText = 'Error, likely 0 servers found.';
  }
}

async function find(place) {
  allPlayers = [];
  targetServersId = [];

  allThumbnails.clear();
  foundAllServers = false;
  allPlayers = [];
  playersCount = 0;
  playersChecked = 0;
  maxPlayers = 0;

  status.innerText = 'Discovering... (Bigger games require longer searches!)';
  color(COLORS.BLUE);
  deleteExtraInfo();

  fetchServers(place);
  findTarget(place);
}

async function updateUser() {
  try {
    const { data: [{ imageUrl }] } = await get(`thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${input.value}&size=150x150&format=Png&isCircular=false`);
    if (imageUrl.length > 0 && imageUrl != 'https://t3.rbxcdn.com/894dca84231352d56ec346174a3c0cf9' && imageUrl != 'https://t5.rbxcdn.com/5228e2fd54377f39e87d3c25a58dd018')
      playerImageUrl = imageUrl
    input.style.color = '#ffffff';
    if (imageUrl == 'https://t3.rbxcdn.com/894dca84231352d56ec346174a3c0cf9' || imageUrl == 'https://t5.rbxcdn.com/5228e2fd54377f39e87d3c25a58dd018')
      input.style.color = '#ff0000';
  } catch (error) {
    input.style.color = '#ff0000';
  }
};

search.addEventListener('click', async event => {
  // Prevents page from refreshing
  event.preventDefault();

  search.disabled = true;
  type.disabled = true;
  size.disabled = true;
  pageNum.style.visibility = 'hidden';
  input.style.visibility = 'hidden';
  pageStatus.innerText = '';

  pageNum.value = 1;
  page = 1;

  const [, place] = window.location.href.match(/games\/(\d+)\//);

  find(place);
});

type.addEventListener('click', async event => {
  event.preventDefault();

  if (asc)
    type.src = getURL('images/desc.png');
  else
    type.src = getURL('images/asc.png');
  
  asc = !asc;

  search.disabled = true;
  type.disabled = true;
  size.disabled = true;

  const [, place] = window.location.href.match(/games\/(\d+)\//);

  reloadServers(place);
});

size.addEventListener('click', async event => {
  event.preventDefault();

  if (maxServers == 1000000) {
    maxServers = 10;
    size.src = getURL('images/10.png');
  } else if (maxServers == 50) {
    maxServers = 1000000;
    size.src = getURL('images/inf.png');
  } else if (maxServers == 25) {
    maxServers = 50;
    size.src = getURL('images/50.png');
  } else if (maxServers == 10) {
    maxServers = 25;
    size.src = getURL('images/25.png');
  };

  pageNum.value = 1;
  page = 1;

  const [, place] = window.location.href.match(/games\/(\d+)\//);

  reloadServers(place);
});

function deleteExtraInfo() {
  if (!buttondel) {
    var loadbutton = document.getElementById('rbx-running-games');
    loadbutton.firstElementChild.remove();
    loadbutton.lastElementChild.remove();
    var loadbutton = document.getElementsByClassName('btr-pager');
    while (loadbutton.length > 0)
      loadbutton.remove();
    buttondel = true;
  }
  if (asc)
    targetServersId.sort((a, b) => {
      return a.serverSize - b.serverSize;
    });
  else
    targetServersId.sort((a, b) => {
      return b.serverSize - a.serverSize;
    });
  var servers = document.getElementsByClassName('stack-row rbx-game-server-item');
    while (servers.length > 0)
      servers[0].parentNode.removeChild(servers[0]);
  var servers = document.getElementsByClassName('rbx-game-server-item col-md-3 col-sm-4 col-xs-6');
    for (let i = 0; i < servers.length; i++)
      while(servers[i].hasChildNodes())
        servers[i].removeChild(servers[i].firstChild);
};

function reloadServers(place) {
  deleteExtraInfo();
  maxPages = 1;
  let serverCount = targetServersId.length;
  while (serverCount > maxServers) {
    maxPages += 1;
    serverCount -= maxServers;
  }
  pageStatus.innerText = 'Page ⠀⠀⠀⠀⠀of ' + maxPages;
  pageNum.disabled = false;

  let contains = false;
  targetServersId.forEach((targetServerId) => {
    const thumbnails = allThumbnails.get(targetServerId.serverId);
    for (let j = 0; j < thumbnails.length; j++) {
      if (thumbnails[j] === playerImageUrl ? thumbnails[j] : null) {
        input.style.color = '#09b000';
        contains = true;
      }
    }
  });
  if (!contains)
  input.style.backgroundColor = '#393b3d';

  for (let i = maxServers * (page - 1); i < maxServers * page; i++) {
    if (i >= targetServersId.length)
      break;
    color(COLORS.GREEN);

    const first = document.querySelectorAll('.rbx-game-server-item-container')[0] || document.querySelectorAll('#rbx-running-games > div.section-content-off.empty-game-instances-container > p')[0];
    
    if (first.className == 'no-servers-message') {
      first.parentNode.style['display'] = 'flex';
      first.parentNode.style['flex-direction'] = 'column';
    }

    const item = document.createElement('li');

    const thumbnails = allThumbnails.get(targetServersId[i].serverId);

    let foundTarget = false;
    for (let j = 0; j < thumbnails.length; j++) {
      if (!foundTarget)
        foundTarget = thumbnails[j] === playerImageUrl ? thumbnails[j] : null;
    }

    item.className = 'stack-row rbx-game-server-item';
    item.innerHTML = `
      <div class="section-left rbx-game-server-details'">
      <div class="text-info rbx-game-status rbx-game-server-status'">${thumbnails.length} of ${maxPlayers} people max</div>
      <span>
      <button data-id="${targetServersId[i].serverId}" type="button" class="btn-full-width btn-control-xs rbx-game-server-join btn-primary-md btn-min-width">Join</button>
      </span>
      </div>
      <div class="section-right rbx-game-server-players">
      ${thumbnails.map(url => `<span class="avatar avatar-headshot-sm player-avatar"><span class="thumbnail-2d-container avatar-card-image"><img src="${url}"></span></span>`).join('')}
      </div>`;
    let leftSide = item.firstElementChild;
    let rightSide = item.lastElementChild;
    let heightss = 80;
    let tempLength = thumbnails.length;
    while (tempLength > 13) {
      heightss += 52;
      tempLength -= 13;
    }

    // Neatness....
    item.style.backgroundColor = '#393b3d';
    item.style.height = heightss + 'px';
    item.style.margin = '0 0 6px';
    item.style.padding = '12px';
    item.style.position = 'relative';
    item.style.textAlign = 'center';
    item.style.width = '970px';
    item.style.transform = 'translate(0px, 17px)';
    leftSide.style.width = '23%';
    leftSide.style.textAlign = 'center';
    rightSide.style.width = '77%';
    rightSide.style.textAlign = 'left';
    rightSide.style.transform = 'translate(5px, 0px)';
    item.style.borderColor = 'rgb(101, 102, 104)'
    item.style.borderStyle = 'solid';
    item.style.borderWidth = '1px';
    if (foundTarget)
      item.style.borderColor = 'rgb(0, 176, 111)'
    if (foundTarget)
      input.style.color = '#00ffa2';

    first.parentNode.insertBefore(item, first);
    highlighted.push(item);

    const [join] = document.querySelectorAll(`[data-id="${targetServersId[i].serverId}"]`);
    join.onclick = () => chrome.runtime.sendMessage({ message: { place, id: targetServersId[i].serverId } });
    status.innerText = 'Search completed';
  }
  search.disabled = false;
  type.disabled = false;
  pageNum.style.visibility = 'visible';
  input.style.visibility = 'visible';
  input.disabled = false;
  size.disabled = false;
};