(function () {
  "use strict";

  var D = window.EMPIRE_DATA;
  if (!D) { document.body.insertAdjacentHTML("afterbegin", '<p role="alert">The codex index could not be loaded.</p>'); return; }

  var labels = {overview:"OVERVIEW",chronicle:"CHRONICLE",characters:"CHARACTERS",portfolio:"SOMNUS PORTFOLIO",worlds:"WORLDS & HOLDINGS",archive:"SOURCE ARCHIVE"};
  var routes = Object.keys(labels);
  var index = new Map();
  var types = [
    ["people", "characters", "Character"],
    ["portfolio", "portfolio", "Company"],
    ["exclusions", "portfolio", "Ownership boundary"],
    ["events", "chronicle", "Chronicle"],
    ["worlds", "worlds", "World"]
  ];
  types.forEach(function (row) {
    D[row[0]].forEach(function (item) { index.set(item.id, {item:item, route:row[1], kind:row[2]}); });
  });
  var searchIndex = [];
  index.forEach(function (entry, id) {
    var item = entry.item;
    searchIndex.push({id:id, route:entry.route, kind:entry.kind, label:item.name || item.title,
      sub:item.role || item.chapter || item.type || item.summary || "",
      haystack:[item.name,item.title,item.role,item.chapter,item.alias,item.summary,item.blurb,item.detail,item.owner,
        (item.facts || []).join(" ")].filter(Boolean).join(" ").toLowerCase()});
  });
  D.files.forEach(function (item) {
    searchIndex.push({file:item, kind:"Source file",label:item.title,sub:item.path,
      haystack:(item.title+" "+item.path+" "+item.summary+" "+item.type).toLowerCase()});
  });

  var sidebar = document.getElementById("sidebar");
  var scrim = document.getElementById("navScrim");
  var menuToggle = document.getElementById("menuToggle");
  var searchInput = document.getElementById("searchInput");
  var searchResults = document.getElementById("searchResults");
  var drawer = document.getElementById("detailDrawer");
  var backdrop = document.getElementById("drawerBackdrop");
  var drawerContent = document.getElementById("drawerContent");
  var drawerClose = document.getElementById("drawerClose");
  var previousFocus = null;
  var currentTimeline = "all", currentPeople = "all";

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function sourceUrl(path) {
    return D.repo + String(path).split("/").map(encodeURIComponent).join("/");
  }
  function statusClass(status) {
    return /^(Active|Operating)$/i.test(status) ? "active" : /^(Building|Transfer pending|Review|Consent pending|Reserved)$/i.test(status) ? "pending" : "";
  }
  function pill(status) {
    return '<span class="status-pill '+statusClass(status)+'">'+esc(status)+'</span>';
  }

  function renderTimeline(filter) {
    currentTimeline = filter || "all";
    document.querySelectorAll("[data-timeline]").forEach(function (button) {
      var yes = button.dataset.timeline === currentTimeline;
      button.classList.toggle("selected", yes);
      button.setAttribute("aria-pressed", String(yes));
    });
    var items = D.events.filter(function (e) { return currentTimeline === "all" || e.era === currentTimeline; });
    document.getElementById("timelineList").innerHTML = items.map(function (e) {
      return '<article class="timeline-item"><button class="timeline-btn" data-open="'+esc(e.id)+'" aria-label="Read '+esc(e.title)+'">' +
        '<span class="timeline-top"><span class="timeline-kicker">'+esc(e.chapter)+'</span><span class="timeline-type">'+esc(e.era)+'</span></span>' +
        '<strong class="timeline-title">'+esc(e.title)+'</strong><span class="timeline-desc">'+esc(e.summary)+'</span>' +
        '<span class="timeline-foot">READ ENTRY ↗</span></button></article>';
    }).join("");
  }
  function renderPeople(filter) {
    currentPeople = filter || "all";
    document.querySelectorAll("[data-people]").forEach(function (button) {
      var yes = button.dataset.people === currentPeople;
      button.classList.toggle("selected", yes);
      button.setAttribute("aria-pressed", String(yes));
    });
    var items = D.people.filter(function (p) {return currentPeople === "all" || p.group === currentPeople;});
    document.getElementById("peopleGrid").innerHTML = items.map(function (p) {
      return '<button class="person-card" data-open="'+esc(p.id)+'" aria-label="Open dossier for '+esc(p.name)+'">' +
        '<span class="portrait-frame"><img class="person-portrait" loading="lazy" decoding="async" src="./images/characters/'+encodeURIComponent(p.id)+'.svg" alt="Stylized portrait of '+esc(p.name)+'"></span>' +
        '<span class="person-role">'+esc(p.role)+'</span><strong class="person-name">'+esc(p.name)+'</strong>' +
        '<span class="person-blurb">'+esc(p.blurb)+'</span><span class="person-more">VIEW DOSSIER ↗</span></button>';
    }).join("");
  }
  function renderPortfolio() {
    document.getElementById("orgGrid").innerHTML = D.portfolio.map(function (p) {
      return '<button class="org-node" data-open="'+esc(p.id)+'" aria-label="Inspect '+esc(p.name)+'">' +
        '<span class="org-top"><span class="org-symbol" aria-hidden="true">'+esc(p.glyph)+'</span>'+pill(p.status)+'</span>' +
        '<strong class="org-name">'+esc(p.name)+'</strong><span class="org-summary">'+esc(p.summary)+'</span></button>';
    }).join("");
    document.getElementById("exclusionGrid").innerHTML = D.exclusions.map(function (p) {
      return '<button class="exclusion-card" data-open="'+esc(p.id)+'"><strong>'+esc(p.glyph)+' '+esc(p.name)+'</strong><span>'+esc(p.summary)+'</span></button>';
    }).join("");
    document.getElementById("milestoneList").innerHTML = D.milestones.map(function (m) {
      return '<div class="milestone"><span class="marker">'+esc(m.icon)+'</span><div><strong>'+esc(m.title)+'</strong><span>'+esc(m.text)+'</span></div></div>';
    }).join("");
  }
  function renderWorlds() {
    document.getElementById("worldGrid").innerHTML = D.worlds.map(function (w) {
      return '<button class="world-card" data-open="'+esc(w.id)+'" aria-label="Inspect '+esc(w.name)+'">' +
        '<span class="world-glyph" aria-hidden="true">'+esc(w.glyph)+'</span><span class="world-label">'+esc(w.type)+'</span>' +
        '<strong>'+esc(w.name)+'</strong><p>'+esc(w.summary)+'</p><span class="world-ownership">'+esc(w.owner)+' ↗</span></button>';
    }).join("");
  }
  function renderArchive() {
    document.getElementById("archiveGrid").innerHTML = D.files.map(function (f) {
      return '<a class="file-card" href="'+esc(sourceUrl(f.path))+'" target="_blank" rel="noopener noreferrer">' +
        '<span class="file-icon" aria-hidden="true">▤</span><span class="file-body"><span class="eyebrow">'+esc(f.type)+'</span>' +
        '<strong>'+esc(f.title)+'</strong><p>'+esc(f.summary)+'</p><span class="file-path">'+esc(f.path)+'</span></span>' +
        '<span class="outbound" aria-hidden="true">↗</span></a>';
    }).join("");
  }
  function hideMobileNav() {
    sidebar.classList.remove("open");
    scrim.classList.remove("visible");
    menuToggle.setAttribute("aria-expanded", "false");
  }
  function setRoute(route, updateHash) {
    if (!labels[route]) route = "overview";
    routes.forEach(function (name) {
      document.getElementById("view-"+name).hidden = name !== route;
    });
    document.querySelectorAll("[data-route]").forEach(function (el) {
      var active = el.dataset.route === route;
      el.classList.toggle("active", active && el.classList.contains("nav-item"));
      if (el.classList.contains("nav-item")) {
        if (active) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
      }
    });
    document.getElementById("currentCrumb").textContent = labels[route];
    hideMobileNav();
    closeSearch();
    closeDrawer();
    if (updateHash && location.hash.substring(1) !== route) {
      location.hash = route;
    }
    window.scrollTo({top:0,behavior:"auto"});
  }

  function showDrawer(id) {
    var entry = index.get(id);
    if (!entry) return;
    closeSearch();
    previousFocus = document.activeElement;
    var v = entry.item;
    var name = v.name || v.title;
    var facts = v.facts || [];
    var sub = v.role || v.tag || v.type || v.chapter || entry.kind;
    var lead = v.detail || v.summary || v.blurb || "";
    var ownership = v.owner ? '<div class="drawer-box"><h3>Ownership / jurisdiction</h3><p>'+esc(v.owner)+'</p></div>' : "";
    var factsHtml = facts.length ? '<div class="drawer-box"><h3>Established facts</h3><ul>'+facts.map(function (fact) {return '<li>'+esc(fact)+'</li>';}).join("")+'</ul></div>' : "";
    var statusHtml = v.status ? '<div style="margin:18px 0">'+pill(v.status)+'</div>' : "";
    drawerContent.innerHTML = '<span class="drawer-tagline">'+esc(entry.kind.toUpperCase())+' / '+esc(sub.toUpperCase())+'</span>' +
      '<h2 class="drawer-title" id="drawerTitle">'+esc(name)+'</h2>'+(entry.kind === "Character" ? '<img class="drawer-portrait" src="./images/characters/'+encodeURIComponent(v.id)+'.svg" alt="Stylized portrait of '+esc(name)+'">' : '')+statusHtml
      '<p class="drawer-lead">'+esc(lead)+'</p>'+ownership+factsHtml+
      (v.source ? '<a class="drawer-source" href="'+esc(sourceUrl(v.source))+'" target="_blank" rel="noopener noreferrer">READ CANON SOURCE ↗</a>' : "");
    backdrop.hidden = false;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("modal-open");
    drawerClose.focus();
  }
  function closeDrawer() {
    if (!drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;
    document.documentElement.classList.remove("modal-open");
    if (previousFocus && previousFocus.isConnected) previousFocus.focus({preventScroll:true});
    previousFocus = null;
  }
  function closeSearch() {
    searchResults.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
  }
  function renderSearch() {
    var query = searchInput.value.trim().toLowerCase();
    if (!query) {closeSearch();return;}
    var words = query.split(/\s+/).filter(Boolean);
    var matches = searchIndex.filter(function (x) {return words.every(function (w) {return x.haystack.indexOf(w) !== -1;});}).slice(0,15);
    searchResults.innerHTML = matches.length ? matches.map(function (match) {
      return '<button class="search-result" role="option" data-result="'+esc(match.id || "")+'" data-file="'+esc(match.file ? match.file.path : "")+'">' +
        '<span>'+esc(match.kind.toUpperCase())+'</span><strong>'+esc(match.label)+'</strong><span>'+esc(match.sub)+'</span></button>';
    }).join("") : '<div class="search-empty">No matches in the current codex index. Try another keyword.</div>';
    searchResults.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  renderTimeline("all");
  renderPeople("all");
  renderPortfolio();
  renderWorlds();
  renderArchive();

  document.addEventListener("click", function (event) {
    var nav = event.target.closest("[data-route]");
    if (nav) {
      event.preventDefault();
      setRoute(nav.dataset.route, true);
      return;
    }
    var opener = event.target.closest("[data-open]");
    if (opener) {showDrawer(opener.dataset.open);return;}
    var filter = event.target.closest("[data-timeline]");
    if (filter) {renderTimeline(filter.dataset.timeline);return;}
    var peopleFilter = event.target.closest("[data-people]");
    if (peopleFilter) {renderPeople(peopleFilter.dataset.people);return;}
    var searchButton = event.target.closest("[data-result], [data-file]");
    if (searchButton) {
      var path = searchButton.dataset.file;
      if (path) {window.open(sourceUrl(path), "_blank", "noopener,noreferrer");}
      else {
        var entry = index.get(searchButton.dataset.result);
        if (entry) {setRoute(entry.route, true);showDrawer(searchButton.dataset.result);}
      }
      closeSearch();
      return;
    }
    if (!event.target.closest(".search-shell")) closeSearch();
  });

  searchInput.addEventListener("input", renderSearch);
  searchInput.addEventListener("focus", function () {if(searchInput.value.trim()) renderSearch();});
  searchInput.addEventListener("keydown", function (event) {
    if(event.key === "Enter" && !searchResults.hidden) {
      var first = searchResults.querySelector("button");
      if(first) {event.preventDefault(); first.click();}
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && !/input|textarea/i.test(document.activeElement.tagName) && !drawer.classList.contains("open")) {
      event.preventDefault();searchInput.focus();searchInput.select();
    }
    if (event.key === "Escape") {closeSearch();closeDrawer();hideMobileNav();}
    if (event.key === "Tab" && drawer.classList.contains("open")) {
      var focusable = Array.from(drawer.querySelectorAll("button:not([disabled]), a[href]"));
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) {event.preventDefault();focusable[focusable.length-1].focus();}
      if (!event.shiftKey && document.activeElement === focusable[focusable.length-1]) {event.preventDefault();focusable[0].focus();}
    }
  });
  drawerClose.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  menuToggle.addEventListener("click", function () {
    var open = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);scrim.classList.toggle("visible", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  scrim.addEventListener("click", hideMobileNav);

  var theme = "dark";
  try {theme = localStorage.getItem("empire-theme") === "light" ? "light" : "dark";} catch(e) {}
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeToggle").addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme",next);
    try {localStorage.setItem("empire-theme",next);} catch(e) {}
  });
  window.addEventListener("hashchange",function () {setRoute(location.hash.slice(1),false);});
  setRoute(location.hash.slice(1) || "overview", false);
})();