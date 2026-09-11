/* ============================================================
 * desktop-pages.js  --  desktop-only page renderers (Workforce Task Manager)
 * Loaded only when !_wfIsMobileEarly() -- see loader at end of block 3 in index.html.
 * Split out of index.html so mobile skips downloading/parsing ~4,400 unused lines.
 * Classic script (not a module): shares global scope with index.html; always loads after block 3.
 * Contains: MapZone, Gantt, Dashboard, Calendar, DateRangePicker, WeekPicker, Planner, Report, EmpKPI, Tasks page.
 * ============================================================ */

var _mzMap = null, _mzMarkerLayer = null, _mzDateFrom = null, _mzDateTo = null, _mzDept = '', _mzTeam = '', _mzOfficeOnly = false;

const MZ_OFFICE = { lat: 13.732778404777, lng: 100.49555736197, radiusM: 300 };

function _mzDistM(lat1, lng1, lat2, lng2) {
  var R = 6371000;
  var dLat = (lat2-lat1) * Math.PI/180, dLng = (lng2-lng1) * Math.PI/180;
  var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}


function _mzLoadLeaflet(cb) {
  if (window.L && window.L.markerClusterGroup) { cb(); return; }
  if (!document.getElementById('mz-leaflet-css')) {
    var link = document.createElement('link');
    link.id = 'mz-leaflet-css'; link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);
  }
  if (!document.getElementById('mz-mc-css')) {
    var link2 = document.createElement('link');
    link2.id = 'mz-mc-css'; link2.rel = 'stylesheet';
    link2.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css';
    document.head.appendChild(link2);
  }
  if (!document.getElementById('mz-mc-css-default')) {
    var link3 = document.createElement('link');
    link3.id = 'mz-mc-css-default'; link3.rel = 'stylesheet';
    link3.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css';
    document.head.appendChild(link3);
  }
  function loadMarkerCluster() {
    var mcScript = document.createElement('script');
    mcScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js';
    mcScript.onload = cb;
    mcScript.onerror = function(){ toast('โหลดไลบรารีคลัสเตอร์หมุด (MarkerCluster) ไม่สำเร็จ — เช็คอินเทอร์เน็ตแล้วลองใหม่', 'er'); };
    document.head.appendChild(mcScript);
  }
  if (window.L) { loadMarkerCluster(); return; }
  var script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  script.onload = loadMarkerCluster;
  script.onerror = function(){ toast('โหลดไลบรารีแผนที่ (Leaflet) ไม่สำเร็จ — เช็คอินเทอร์เน็ตแล้วลองใหม่', 'er'); };
  document.head.appendChild(script);
}

var MZ_DEPTS = ['LED','Digital Signage & Retail','Business Development']; 

function pgMapZone() {
  var now = new Date();
  var first = new Date(now.getFullYear(), now.getMonth(), 1);
  var last  = new Date(now.getFullYear(), now.getMonth()+1, 0);
  _mzDateFrom = _localDateStr(first);
  _mzDateTo   = _localDateStr(last);
  _mzDept     = ''; 
  _mzTeam     = ''; 
  _mzOfficeOnly = false;

  var deptOpts = '<option value="">ทุกแผนก</option>' + MZ_DEPTS.map(function(d){ return '<option value="'+d+'">'+d+'</option>'; }).join('');

  document.getElementById('content').innerHTML =
    '<div class="card" style="padding:0;">' +
      '<div style="padding:14px 16px;border-bottom:1px solid var(--line-2);display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;">' +
        '<div class="dash-filter-group">' +
          '<div class="dash-filter-label">Date Range</div>' +
          '<div class="drp-trigger" id="mz-drp-trigger" onclick="drpOpen(this,\'mapzone\')">' +
            '<span class="drp-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>' +
            '<span class="drp-text" id="mz-drp-trigger-text">'+_drpFmtDisplay(_mzDateFrom)+' — '+_drpFmtDisplay(_mzDateTo)+'</span>' +
          '</div>' +
        '</div>' +
        '<div class="dash-filter-group">' +
          '<div class="dash-filter-label">Department</div>' +
          '<select class="dept-select-pill" id="mz-dept-sel" onchange="_mzOnDeptChange()">'+deptOpts+'</select>' +
        '</div>' +
        '<div class="dash-filter-group" id="mz-team-group">' +
          '<div class="dash-filter-label">Team</div>' +
          '<select class="dept-select-pill" id="mz-team-sel" onchange="_mzTeam=this.value;_mzRedrawMap();"><option value="">ทุกทีม</option></select>' +
        '</div>' +
        '<div class="dash-filter-group">' +
          '<div class="dash-filter-label">สำนักงาน</div>' +
          '<label style="display:flex;align-items:center;gap:6px;height:38px;padding:0 12px;border:1px solid var(--line);border-radius:var(--r);cursor:pointer;background:var(--surface);">' +
            '<input type="checkbox" id="mz-office-chk" onchange="_mzOfficeOnly=this.checked;_mzRedrawMap();" style="width:15px;height:15px;accent-color:#2563EB;cursor:pointer;">' +
            '<span style="font-size:12px;color:var(--ink-2);">เฉพาะที่สำนักงาน</span>' +
          '</label>' +
        '</div>' +
      '</div>' +
      '<div id="mz-status" style="padding:8px 16px;font-size:11px;color:var(--ink-3);"></div>' +
      '<div id="mz-map" style="height:440px;min-height:440px;width:100%;background:var(--bg-2);border-radius:0 0 var(--rl) var(--rl);overflow:hidden;"></div>' +
      '<style>#mz-map .leaflet-tile-pane{filter:grayscale(88%) brightness(1.07) contrast(.9);}</style>' +
    '</div>';

  
  
  
  if (_mzMap) {
    try { _mzMap.remove(); } catch (_) {}
    _mzMap = null;
    _mzMarkerLayer = null;
  }

  
  var mapEl = document.getElementById('mz-map');
  if (mapEl) {
    var top = mapEl.getBoundingClientRect().top;
    var h = Math.max(440, window.innerHeight - top - 24);
    mapEl.style.height = h + 'px';
  }

  _mzLoadLeaflet(function(){ _mzInitMap(); _mzLoadData(); });
}

function _mzOnDeptChange() {
  _mzDept = (document.getElementById('mz-dept-sel')||{}).value || '';
  _mzUpdateTeamOptions();
  _mzRedrawMap();
}


function _mzUpdateTeamOptions() {
  var sel = document.getElementById('mz-team-sel');
  if (!sel) return;
  var teams = [];
  if (_mzDept) {
    teams = (DB.schedTeams && DB.schedTeams[_mzDept] && DB.schedTeams[_mzDept].length) ? DB.schedTeams[_mzDept] : [];
  } else {
    MZ_DEPTS.forEach(function(dn){
      if (DB.schedTeams && DB.schedTeams[dn]) teams = teams.concat(DB.schedTeams[dn]);
    });
  }
  _mzTeam = '';
  sel.innerHTML = '<option value="">ทุกทีม</option>' + teams.map(function(t){ return '<option value="'+t+'">'+t+'</option>'; }).join('');
}

function _mzInitMap() {
  if (_mzMap) return; 
  
  var TH_BOUNDS = L.latLngBounds([4.5, 95.5], [21.5, 107.0]);
  _mzMap = L.map('mz-map', {
    scrollWheelZoom: true,
    maxBounds: TH_BOUNDS,
    maxBoundsViscosity: 1.0, 
    minZoom: 5,
  }).setView([13.0, 101.0], 6);
  // OpenStreetMap — ฟรี ไม่ต้อง API key ไม่มีลายน้ำ (CARTO เลิกให้ใช้ฟรีแล้ว → ขึ้น "API KEY REQUIRED")
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maxZoom: 19,
  }).addTo(_mzMap);
  
  
  L.circle([MZ_OFFICE.lat, MZ_OFFICE.lng], {
    radius: MZ_OFFICE.radiusM, color: '#16A34A', weight: 2, fillColor: '#16A34A', fillOpacity: 0.15,
  }).addTo(_mzMap).bindPopup('สำนักงาน พุช มีเดีย (รัศมี '+MZ_OFFICE.radiusM+' ม.)');
  L.marker([MZ_OFFICE.lat, MZ_OFFICE.lng]).addTo(_mzMap)
    .bindPopup('<b>สำนักงาน พุช มีเดีย</b>');
  
  setTimeout(function(){ _mzMap.invalidateSize(); }, 100);
  
  if (window._mzResizeHandler) window.removeEventListener('resize', window._mzResizeHandler);
  window._mzResizeHandler = function(){
    if (!_mzMap) return;
    var mapEl = document.getElementById('mz-map');
    if (mapEl) {
      var top = mapEl.getBoundingClientRect().top;
      mapEl.style.height = Math.max(440, window.innerHeight - top - 24) + 'px';
    }
    _mzMap.invalidateSize();
  };
  window.addEventListener('resize', window._mzResizeHandler);
}

var _mzAllPoints = []; 
var _mzEmpDeptMap = {}; 
var _mzEmpMap = {}; 

async function _mzLoadData() {
  var statusEl = document.getElementById('mz-status');
  if (statusEl) statusEl.textContent = 'กำลังโหลดข้อมูลเช็คอิน...';
  _drpUpdateTrigger();

  var res = await apiGet('checkinPoints', { dateFrom: _mzDateFrom, dateTo: _mzDateTo });
  _mzAllPoints = (res && res.points) || [];

  _mzEmpDeptMap = {};
  _mzEmpMap = {};
  DB.employees.forEach(function(e){
    _mzEmpDeptMap[e.code] = { dept: e.dept, dept2: e.dept2, team: e.team, team2: e.team2 };
    _mzEmpMap[e.code] = e;
  });

  _mzUpdateTeamOptions();
  _mzRedrawMap();
}


function _mzAvatarIcon(emp, count) {
  var d = emp ? dOfN(emp.dept) : null;
  var color = d ? d.color : '#888';
  var photoHtml = (emp && emp.photo)
    ? '<img src="'+emp.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">'
    : '<span style="font-size:11px;font-weight:700;color:#fff;">'+(((emp&&(emp.nickname||emp.name))||'?').slice(0,2).toUpperCase())+'</span>';
  var html =
    '<div style="position:relative;width:32px;height:32px;">' +
      '<div style="width:32px;height:32px;border-radius:50%;background:'+color+';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;overflow:hidden;">'+photoHtml+'</div>' +
      (count > 1 ? '<div style="position:absolute;bottom:-3px;right:-3px;background:#fff;color:'+color+';border:1.5px solid '+color+';border-radius:9px;font-size:9px;font-weight:800;padding:0 4px;line-height:15px;min-width:16px;text-align:center;">'+count+'</div>' : '') +
    '</div>';
  return L.divIcon({ html: html, className: '', iconSize: [32,32], iconAnchor: [16,16] });
}

function _mzRedrawMap() {
  if (!_mzMap || !window.L || !window.L.markerClusterGroup) return;
  var points = _mzAllPoints;
  if (_mzDept) {
    points = points.filter(function(p){
      var emp = _mzEmpDeptMap[p.code];
      return emp && (emp.dept === _mzDept || emp.dept2 === _mzDept);
    });
  }
  if (_mzTeam) {
    points = points.filter(function(p){
      var emp = _mzEmpDeptMap[p.code];
      return emp && (emp.team === _mzTeam || emp.team2 === _mzTeam);
    });
  }
  if (_mzOfficeOnly) {
    points = points.filter(function(p){ return _mzDistM(p.lat, p.lng, MZ_OFFICE.lat, MZ_OFFICE.lng) <= MZ_OFFICE.radiusM; });
  }

  
  var byEmp = {};
  points.forEach(function(p){
    var b = byEmp[p.code];
    if (!b) { b = byEmp[p.code] = { code: p.code, count: 0, lat: p.lat, lng: p.lng, lastDs: p.ds }; }
    b.count++;
    if (p.ds >= b.lastDs) { b.lastDs = p.ds; b.lat = p.lat; b.lng = p.lng; }
  });
  var empPoints = Object.keys(byEmp).map(function(k){ return byEmp[k]; });

  var statusEl = document.getElementById('mz-status');
  if (statusEl) {
    var filterLabel = (_mzDept ? ' · แผนก ' + _mzDept : '') + (_mzTeam ? ' · ทีม ' + _mzTeam : '') + (_mzOfficeOnly ? ' · เฉพาะที่สำนักงาน' : '');
    statusEl.textContent = points.length
      ? 'เช็คอินทั้งหมด ' + points.length + ' ครั้ง · ' + empPoints.length + ' พนักงาน · ช่วงวันที่ ' + fDate(_mzDateFrom) + ' – ' + fDate(_mzDateTo) + filterLabel
      : 'ไม่พบข้อมูลพิกัดเช็คอินในช่วงวันที่นี้ (เช็คว่ามีการบันทึกพิกัด GPS ไว้ในคอลัมน์ L ของชีตเช็คอินหรือไม่)';
  }

  if (_mzMarkerLayer) { _mzMap.removeLayer(_mzMarkerLayer); _mzMarkerLayer = null; }
  _mzMarkerLayer = L.markerClusterGroup({ maxClusterRadius: 45, spiderfyOnMaxZoom: true, showCoverageOnHover: false });

  var markers = empPoints.map(function(b){
    var emp = _mzEmpMap[b.code];
    var marker = L.marker([b.lat, b.lng], { icon: _mzAvatarIcon(emp, b.count) });
    var name = emp ? (emp.nickname || emp.name) : b.code;
    var deptLine = emp && emp.dept ? emp.dept : '';
    marker.bindPopup(
      '<div style="font-size:12px;line-height:1.6;">' +
        '<b>' + name + '</b>' + (deptLine ? '<br>' + deptLine : '') +
        '<br>เช็คอิน ' + b.count + ' ครั้ง' +
        '<br>ล่าสุด ' + fDate(b.lastDs) +
      '</div>'
    );
    return marker;
  });
  _mzMarkerLayer.addLayers(markers);
  _mzMap.addLayer(_mzMarkerLayer);

  if (markers.length) {
    _mzMap.fitBounds(_mzMarkerLayer.getBounds(), { padding: [40,40], maxZoom: 15 });
  }
}

function pgGantt() {
  if (can('createTask'))
    document.getElementById('tb-actions').innerHTML =
      '<button class="btn btn-p" onclick="openCreate()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> เพิ่มงาน</button>';
  _ganttView   = 'week';
  renderGantt();
}

var _ganttView   = 'week';
var _ganttFilter = { dept:'', team:'', customer:'' };
var _GCOL = { day:38, week:34, month:20 };


var _ganttDR = (function() {
  var today = _localDateStr(new Date());
  return { start: today.slice(0,7)+'-01', end: today };
})();

function renderGantt() {
  var GC_CAL_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var tasks  = vTasks();
  var depts  = vDepts();
  var today  = new Date(); today.setHours(0,0,0,0);
  var todayStr = _localDateStr(today);

  
  
  var colW = _GCOL[_ganttView] || 28;
  var viewStart = _ganttDR.start, viewEnd = _ganttDR.end;
  var cols = _ganttCols(viewStart, viewEnd, _ganttView);
  var startDate = new Date(cols[0].str + 'T00:00:00');
  var totalW    = cols.length * colW;

  
  
  
  var f = _ganttFilter;
  var rows = tasks.filter(function(t) {
    if (f.dept   && t.deptName !== f.dept)   return false;
    if (f.team   && t.teamName !== f.team)   return false;
    if (f.customer && !(t.title||'').toLowerCase().includes(f.customer.toLowerCase()) && !(t.site||'').toLowerCase().includes(f.customer.toLowerCase())) return false;
    var ts = _normDateStr(t.start), te = _normDateStr(t.end||t.start);
    if (!ts) return false;
    if (ts > viewEnd || te < viewStart) return false; 
    return true;
  });

  
  var statAll=rows.length;

  
  
  function _hexToHsl(hex) {
    hex = String(hex||'#94A3B8').replace('#','');
    if (hex.length===3) hex = hex.split('').map(function(c){return c+c;}).join('');
    var r = parseInt(hex.substr(0,2),16)/255, g = parseInt(hex.substr(2,2),16)/255, b = parseInt(hex.substr(4,2),16)/255;
    var max=Math.max(r,g,b), min=Math.min(r,g,b), h=0,s=0,l=(max+min)/2;
    if (max!==min) {
      var d=max-min;
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      if (max===r) h=(g-b)/d+(g<b?6:0);
      else if (max===g) h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h/=6;
    }
    return [h*360, s*100, l*100];
  }
  function _hslToHex(h,s,l) {
    s/=100; l/=100;
    var c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, r,g,b;
    if(h<60){r=c;g=x;b=0;} else if(h<120){r=x;g=c;b=0;} else if(h<180){r=0;g=c;b=x;}
    else if(h<240){r=0;g=x;b=c;} else if(h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
    function toHex(v){ var s=Math.round((v+m)*255).toString(16); return s.length<2?'0'+s:s; }
    return '#'+toHex(r)+toHex(g)+toHex(b);
  }
  function _strHash(s) {
    var h=0; s=String(s||'');
    for (var i=0;i<s.length;i++) { h = (h<<5)-h + s.charCodeAt(i); h|=0; }
    return Math.abs(h);
  }
  function ganttBarColor(t) {
    var dept = dOfN(t.deptName);
    var base = dept ? dept.color : '#94A3B8';
    var hsl  = _hexToHsl(base);
    var offset = (_strHash(t.teamName) % 7) - 3; 
    var l = Math.min(66, Math.max(30, hsl[2] + offset*6));
    return _hslToHex(hsl[0], hsl[1], l);
  }
  function progPct(t) {
    var ts=_normDateStr(t.start), te=_normDateStr(t.end||t.start);
    if(!ts||!te) return 0;
    var s=new Date(ts+'T00:00:00'), e=new Date(te+'T00:00:00');
    var total=Math.round((e-s)/86400000)+1;
    var elapsed=Math.round((today-s)/86400000);
    return Math.min(100,Math.max(0,Math.round(elapsed/total*100)));
  }

  
  var SCHED_GANTT_DEPTS = ['LED','Digital Signage & Retail','Business Development'];
  var deptOpts = '<option value="">ทุกแผนก</option>'+depts.filter(function(d){ return SCHED_GANTT_DEPTS.indexOf(d.name)>=0; }).map(function(d){
    return '<option value="'+d.name+'"'+(f.dept===d.name?' selected':'')+'>'+d.name+'</option>';
  }).join('');
  
  var GANTT_TEAM_WHITELIST = {
    'LED': ['LED','LED-A','LED-B','LED-C'],
    'Digital Signage & Retail': ['DS','RI','Service'],
    'Business Development': ['Push Logix','Service'],
  };
  
  var teamOpts = '<option value="">ทุกทีม</option>'+DB.teams
    .filter(function(tm){
      if (f.dept && tm.deptName!==f.dept) return false;
      var wl = GANTT_TEAM_WHITELIST[tm.deptName];
      return wl && wl.indexOf(tm.name) >= 0;
    })
    .map(function(tm){
      var lbl = f.dept ? tm.name : (tm.deptName+' — '+tm.name); 
      return '<option value="'+tm.name+'"'+(f.team===tm.name?' selected':'')+'>'+lbl+'</option>';
    }).join('');

  
  var groupOrder = [];
  var groupMap   = {};
  depts.forEach(function(d){ if(!groupMap[d.name]){ groupMap[d.name]={dept:d,items:[]}; groupOrder.push(d.name); } });
  rows.forEach(function(t){
    if(!groupMap[t.deptName]){ var d=dOfN(t.deptName)||{name:t.deptName,color:'#888',icon:''}; groupMap[t.deptName]={dept:d,items:[]}; groupOrder.push(t.deptName); }
    groupMap[t.deptName].items.push(t);
  });

  
  var LEFT='', RIGHT='';
  var ROW_H = 50, DEPT_H = 34;

  
  var COL_HDR = '<div style="display:flex;position:sticky;top:0;z-index:9;background:var(--bg);border-bottom:2px solid var(--line);">';
  cols.forEach(function(c){
    var isSun=(new Date(c.str+'T00:00:00').getDay()===0);
    var isSat=(new Date(c.str+'T00:00:00').getDay()===6);
    var isNH=DB.holidays.some(function(h){return h.date===c.str;});
    var isT=(c.str===todayStr);
    var bg=isT?'rgba(14,159,117,.1)':isSun||isNH?'':isSat?'':'' ;
    var clr=isT?'var(--teal)':isSun?'var(--red)':isNH?'#7C3AED':'var(--ink-3)';
    var bb=isT?'border-bottom:2px solid var(--teal);':'';
    COL_HDR+='<div style="width:'+colW+'px;min-width:'+colW+'px;flex-shrink:0;text-align:center;font-size:10px;font-weight:700;padding:5px 0;border-right:1px solid var(--line-2);color:'+clr+';background:'+(isSun?'#fff0f0':isNH?'#f3f0ff':bg||'transparent')+';'+bb+'">'+
      '<div>'+c.label+'</div>'+
      (_ganttView==='day'||_ganttView==='week'?'<div style="font-size:8.5px;opacity:.7;">'+c.dow+'</div>':'')+
    '</div>';
  });
  COL_HDR+='</div>';

  
  var todayDayOffset=Math.round((today-startDate)/86400000);
  var todayLineX=(todayDayOffset*colW)+(colW/2);

  groupOrder.forEach(function(dname){
    var g=groupMap[dname];
    if(!g||!g.items.length) return;
    var dept=g.dept;

    
    LEFT +='<div style="height:'+DEPT_H+'px;display:flex;align-items:center;padding:0 14px;background:var(--bg);border-bottom:1px solid var(--line-2);border-left:3px solid '+(dept.color||'#888')+';">' +
      '<span style="font-size:11px;font-weight:800;color:'+(dept.color||'#888')+';text-transform:uppercase;letter-spacing:.06em;">'+dept.name+'</span></div>';
    RIGHT+='<div style="height:'+DEPT_H+'px;display:flex;background:var(--bg);border-bottom:1px solid var(--line-2);">'+
      cols.map(function(c){
        var isSun=(new Date(c.str+'T00:00:00').getDay()===0);
        var isNH=DB.holidays.some(function(h){return h.date===c.str;});
        return '<div style="width:'+colW+'px;min-width:'+colW+'px;flex-shrink:0;border-right:1px solid var(--line-2);background:'+(c.str===todayStr?'rgba(14,159,117,.06)':isSun?'#fff0f0':isNH?'#f3f0ff':'transparent')+';"></div>';
      }).join('')+
    '</div>';

    g.items.forEach(function(t){
      var ts=_normDateStr(t.start), te=_normDateStr(t.end||t.start);
      var members=(t.members||[]).map(function(c){var e=eOf(c);return e?e.nickname:c;}).slice(0,2).join(', ');
      var pct=progPct(t);
      var dot=ganttBarColor(t);

      
      LEFT+='<div onclick="openDetail('+t.id+')" style="height:'+ROW_H+'px;display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid var(--line-2);cursor:pointer;transition:background .1s;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">' +
        '<div style="width:9px;height:9px;border-radius:50%;background:'+dot+';flex-shrink:0;"></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+escapeHtml(t.title)+'">'+escapeHtml(t.title)+'</div>' +
          '<div style="font-size:10.5px;color:var(--ink-3);">'+(t.teamName||'')+(members?' · '+members:'')+'</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          '<div style="font-size:10.5px;font-weight:700;color:'+dot+';">'+pct+'%</div>' +
          '<div style="font-size:9.5px;color:var(--ink-3);">'+fDate(ts)+'</div>' +
        '</div>' +
      '</div>';

      
      var dayStart=Math.round((new Date(ts+'T00:00:00')-startDate)/86400000);
      var dayEnd  =Math.round((new Date(te+'T00:00:00')-startDate)/86400000);
      var barL = dayStart*colW;
      var barW = Math.max(colW*0.8, (dayEnd-dayStart+1)*colW);
      var color= ganttBarColor(t);

      var cells = cols.map(function(c){
        var isSun=(new Date(c.str+'T00:00:00').getDay()===0);
        var isNH=DB.holidays.some(function(h){return h.date===c.str;});
        return '<div style="width:'+colW+'px;min-width:'+colW+'px;flex-shrink:0;height:'+ROW_H+'px;border-right:1px solid var(--line-2);background:'+(c.str===todayStr?'rgba(14,159,117,.06)':isSun?'#fff0f0':isNH?'#f3f0ff':'transparent')+';"></div>';
      }).join('');

      var barHTML='';
      if(ts && te && barL < totalW && barL+barW > 0){
        var cl=Math.max(0,barL), cw=Math.min(barW+Math.min(0,barL), totalW-cl);
        if(cw>3){
          barHTML='<div onclick="openDetail('+t.id+')" title="'+escapeHtml(t.title)+' | '+escapeHtml(t.deptName)+' · '+escapeHtml(t.teamName||'')+' | '+fDate(ts)+' – '+fDate(te)+'" style="position:absolute;left:'+cl+'px;top:9px;width:'+cw+'px;height:32px;border-radius:6px;background:'+color+';cursor:pointer;display:flex;align-items:center;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.15);transition:opacity .12s;" onmouseover="this.style.opacity=\'.85\'" onmouseout="this.style.opacity=\'1\'">' +
            '<div style="position:absolute;left:0;top:0;height:100%;width:'+pct+'%;background:rgba(0,0,0,.18);border-radius:6px 0 0 6px;"></div>' +
            (cw>50?'<span style="position:relative;z-index:1;padding:0 10px;font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escapeHtml(t.site)+'</span>':'')+
          '</div>';
        }
      }

      RIGHT+='<div style="height:'+ROW_H+'px;position:relative;border-bottom:1px solid var(--line-2);">'+
        '<div style="position:absolute;inset:0;display:flex;">'+cells+'</div>'+
        barHTML+
      '</div>';
    });
  });

  if(!LEFT) {
    LEFT  ='<div style="padding:32px 16px;text-align:center;color:var(--ink-3);font-size:12px;">ไม่มีงานที่ตรงกับเงื่อนไข</div>';
    RIGHT ='';
  }

  
  var SCHED_GANTT_D = ['LED','Digital Signage & Retail','Business Development'];
  var deptCounts = {};
  SCHED_GANTT_D.forEach(function(dn){ deptCounts[dn] = 0; });
  rows.forEach(function(t){ if(deptCounts[t.deptName]!==undefined) deptCounts[t.deptName]++; });
  var deptColors2 = {};
  depts.forEach(function(d){ deptColors2[d.name]=d.color; });

  
  document.getElementById('content').innerHTML =
    
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">'+
      _gBadge('งานทั้งหมด',statAll,'var(--ink-2)','var(--bg-2)')+
      SCHED_GANTT_D.map(function(dn){
        var c = deptColors2[dn] || 'var(--teal)';
        return _gBadge(dn, deptCounts[dn]||0, c, c+'15');
      }).join('')+
    '</div>'+
    
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">'+
      '<button class="btn btn-ico" onclick="_ganttShiftDR(-1)" title="ย้อนกลับ (เท่ากับความยาวช่วงที่เลือก)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'+
      '<div class="drp-trigger" id="gc-drp-trigger" onclick="drpOpen(this,\'gantt\')" style="min-width:180px;">'+
        '<span class="drp-icon">'+GC_CAL_ICON+'</span>'+
        '<span class="drp-text" id="gc-drp-trigger-text">'+_drpFmtDisplay(_ganttDR.start)+' — '+_drpFmtDisplay(_ganttDR.end)+'</span>'+
      '</div>'+
      '<button class="btn btn-ico" onclick="_ganttShiftDR(1)" title="ถัดไป (เท่ากับความยาวช่วงที่เลือก)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>'+
      '<button class="btn btn-sm" onclick="_ganttResetDR();renderGantt()">เดือนนี้</button>'+
      '<div style="display:flex;border:1px solid var(--line);border-radius:7px;overflow:hidden;">'+
        ['day','week','month'].map(function(v){
          var lbl={day:'วัน',week:'สัปดาห์',month:'เดือน'}[v];
          return '<button onclick="_ganttView=\''+v+'\';renderGantt()" title="ปรับความกว้างคอลัมน์ (ไม่เปลี่ยนช่วงวันที่ที่นับ)" style="padding:5px 11px;font-size:11px;font-weight:600;border:none;cursor:pointer;font-family:inherit;background:'+(_ganttView===v?'var(--teal)':'var(--surface)')+';color:'+(_ganttView===v?'#fff':'var(--ink-2)')+';transition:all .1s;">'+lbl+'</button>';
        }).join('')+
      '</div>'+
      '<select class="fc" style="width:auto;padding:5px 10px;font-size:11px;" onchange="_ganttFilter.dept=this.value;_ganttFilter.team=\'\';renderGantt()">'+deptOpts+'</select>'+
      '<select class="fc" style="width:auto;padding:5px 10px;font-size:11px;" onchange="_ganttFilter.team=this.value;renderGantt()">'+teamOpts+'</select>'+
      '<input type="text" class="fc" placeholder="ค้นหาชื่องาน..." style="width:160px;padding:5px 10px;font-size:11px;" value="'+escapeHtml(f.customer)+'" oninput="_ganttFilter.customer=this.value;renderGantt()">'+
    '</div>'+
    '<div style="font-size:10.5px;color:var(--ink-3);margin:-4px 0 10px;">สีแท่งงาน = แผนก/ทีม (แผนกเดียวกันจะเป็นโทนสีใกล้เคียงกัน ทีมต่างกันจะอ่อน-เข้มต่างกัน) · % = สัดส่วนเวลาที่ผ่านไปของงานนั้น</div>'+
    
    '<div style="display:flex;height:calc(100vh - 230px);border:1px solid var(--line);border-radius:var(--rl);overflow:hidden;background:var(--surface);">'+
      
      '<div id="g-left" style="width:380px;min-width:380px;flex-shrink:0;border-right:2px solid var(--line);overflow-y:auto;overflow-x:hidden;" onscroll="document.getElementById(\'g-right\').scrollTop=this.scrollTop">'+
        '<div style="height:36px;display:flex;align-items:center;padding:0 14px;background:var(--bg);border-bottom:2px solid var(--line);position:sticky;top:0;z-index:10;">'+
          '<span style="font-size:10.5px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;flex:1;">งาน / ทีม</span>'+
          '<span style="font-size:10.5px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;">%</span>'+
        '</div>'+
        LEFT+
      '</div>'+
      
      '<div id="g-right" style="flex:1;overflow:auto;" onscroll="document.getElementById(\'g-left\').scrollTop=this.scrollTop">'+
        '<div style="min-width:'+totalW+'px;position:relative;">'+
          COL_HDR+
          '<div style="position:relative;">'+
            
            (todayLineX>=0&&todayLineX<=totalW?'<div style="position:absolute;top:0;bottom:0;left:'+todayLineX+'px;width:2px;background:var(--teal);opacity:.4;z-index:8;pointer-events:none;"></div>':'')+
            RIGHT+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';

  
  var gLeft=document.getElementById('g-left');
  var gRight=document.getElementById('g-right');
  if(gLeft&&gRight){
    gLeft.onscroll=function(){ gRight.scrollTop=gLeft.scrollTop; };
    gRight.onscroll=function(){ gLeft.scrollTop=gRight.scrollTop; };
    
    if(todayStr >= viewStart && todayStr <= viewEnd) setTimeout(function(){
      gRight.scrollLeft=Math.max(0,todayLineX-gRight.clientWidth/2);
    },60);
  }
}


function _ganttShiftDR(dir) {
  var s = new Date(_ganttDR.start + 'T00:00:00'), e = new Date(_ganttDR.end + 'T00:00:00');
  var spanDays = Math.round((e - s) / 86400000) + 1;
  s.setDate(s.getDate() + dir * spanDays);
  e.setDate(e.getDate() + dir * spanDays);
  _ganttDR.start = _localDateStr(s);
  _ganttDR.end   = _localDateStr(e);
  renderGantt();
}

function _ganttResetDR() {
  var today = _localDateStr(new Date());
  _ganttDR.start = today.slice(0,7)+'-01';
  _ganttDR.end   = today;
}

function _gBadge(label, count, color, bg) {
  return '<div style="background:'+bg+';border-radius:8px;padding:7px 14px;display:flex;align-items:center;gap:8px;border:1px solid '+color+'20;">'+
    '<div style="font-size:20px;font-weight:800;color:'+color+';">'+count+'</div>'+
    '<div style="font-size:10px;color:'+color+';font-weight:600;white-space:nowrap;">'+label+'</div>'+
  '</div>';
}

function _ganttCols(rangeStart, rangeEnd, view) {
  var cols=[], DOW=['อา','จ','อ','พ','พฤ','ศ','ส'];
  var MON=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  var start = new Date(rangeStart+'T00:00:00'), end = new Date(rangeEnd+'T00:00:00');
  var count = Math.max(1, Math.round((end-start)/86400000)+1);
  for(var i=0;i<count;i++){
    var d=new Date(start); d.setDate(start.getDate()+i);
    var ds=_localDateStr(d);
    var dow=d.getDay();
    var lbl=view==='day'?String(d.getDate())
           :view==='week'?(dow===1?String(d.getDate())+'/'+String(d.getMonth()+1):DOW[dow])
           :(d.getDate()===1?MON[d.getMonth()]:String(d.getDate()));
    cols.push({str:ds,label:lbl,dow:DOW[dow],isSun:dow===0,isSat:dow===6});
  }
  return cols;
}






var _dashDR = (function() {
  var today = _localDateStr(new Date());
  var firstOfMonth = today.slice(0,7)+'-01';
  return { start: firstOfMonth, end: today };
})();
var _dashDept = 'all';
var _dashName = '';


(function() {
  try {
    var saved = localStorage.getItem('wf_dash_cards');
    if (saved !== null) {
      DB.dashCards = saved ? saved.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : null;
    }
  } catch(_) {}
})();


var calDeptFilter = 'all';
var calYear       = new Date().getFullYear();
var calMonth      = new Date().getMonth();
var calSelDate    = _localDateStr(new Date());


var _drpState = {
  open: false,
  hoverDate: null,
  selecting: null,  
  tempStart: null,
  tempEnd: null,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  anchor: null,     
  caller: 'dashboard', 
};


function _drpFmtDisplay(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}
function _drpYMD(y, m, d) {
  return y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
}
function _drpMonthName(y, m) {
  var d = new Date(y, m, 1);
  return d.toLocaleString('en-US', { month: 'long' }) + ' ' + (y + 543);
}
function _drpDateCmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}


function drpOpen(triggerEl, caller) {
  _drpState.open    = true;
  _drpState.caller  = caller || 'dashboard';
  if (_drpState.caller === 'mapzone') {
    _drpState.tempStart = _mzDateFrom;
    _drpState.tempEnd   = _mzDateTo;
  } else if (_drpState.caller === 'empkpi') {
    _drpState.tempStart = _empKpiDR.start;
    _drpState.tempEnd   = _empKpiDR.end;
  } else if (_drpState.caller === 'gantt') {
    _drpState.tempStart = _ganttDR.start;
    _drpState.tempEnd   = _ganttDR.end;
  } else {
    _drpState.tempStart = _dashDR.start;
    _drpState.tempEnd   = _dashDR.end;
  }
  _drpState.selecting = null;
  _drpState.hoverDate = null;
  _drpState.viewYear  = new Date(_drpState.tempStart + 'T00:00:00').getFullYear();
  _drpState.viewMonth = new Date(_drpState.tempStart + 'T00:00:00').getMonth();
  _drpState.anchor    = triggerEl;
  _drpRender();
  document.addEventListener('mousedown', _drpOutsideClick);
}
function _drpTriggerId() { return _drpState.caller === 'mapzone' ? 'mz-drp-trigger' : (_drpState.caller === 'empkpi' ? 'ek-drp-trigger' : (_drpState.caller === 'gantt' ? 'gc-drp-trigger' : 'drp-trigger')); }
function drpClose() {
  _drpState.open = false;
  var popup = document.getElementById('drp-popup');
  if (popup) popup.remove();
  document.removeEventListener('mousedown', _drpOutsideClick);
  var trigger = document.getElementById(_drpTriggerId());
  if (trigger) trigger.classList.remove('active');
}
function _drpOutsideClick(e) {
  var popup = document.getElementById('drp-popup');
  var trigger = document.getElementById(_drpTriggerId());
  if (popup && !popup.contains(e.target) && trigger && !trigger.contains(e.target)) {
    drpClose();
  }
}


function _drpApplyPreset(key) {
  var today = _localDateStr(new Date());
  var d = new Date(); d.setHours(0,0,0,0);
  var s, e;
  if (key === 'today') {
    s = e = today;
  } else if (key === 'yesterday') {
    var y = new Date(d); y.setDate(d.getDate()-1);
    s = e = _localDateStr(y);
  } else if (key === 'thisweek') {
    var mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay()+6)%7));
    var sun = new Date(mon); sun.setDate(mon.getDate()+6);
    s = _localDateStr(mon); e = _localDateStr(sun);
  } else if (key === 'thismonth') {
    s = today.slice(0,7)+'-01'; e = today;
  } else if (key === 'lastmonth') {
    var lm = new Date(d.getFullYear(), d.getMonth()-1, 1);
    var lme = new Date(d.getFullYear(), d.getMonth(), 0);
    s = _localDateStr(lm); e = _localDateStr(lme);
  } else if (key === '2monthsago') {
    var mm = new Date(d.getFullYear(), d.getMonth()-2, 1);
    var mme = new Date(d.getFullYear(), d.getMonth()-1, 0);
    s = _localDateStr(mm); e = _localDateStr(mme);
  }
  _drpState.tempStart = s;
  _drpState.tempEnd   = e;
  _drpState.selecting = null;
  _drpState.viewYear  = new Date(s + 'T00:00:00').getFullYear();
  _drpState.viewMonth = new Date(s + 'T00:00:00').getMonth();
  _drpRenderCals();
}


function _drpDayClick(ds) {
  if (!_drpState.selecting || _drpState.selecting === 'start') {
    _drpState.tempStart = ds;
    _drpState.tempEnd   = null;
    _drpState.selecting = 'end';
  } else {
    if (_drpDateCmp(ds, _drpState.tempStart) < 0) {
      _drpState.tempEnd   = _drpState.tempStart;
      _drpState.tempStart = ds;
    } else {
      _drpState.tempEnd = ds;
    }
    _drpState.selecting = null;
  }
  
  
  _drpRenderCals();
}
function _drpDayHover(ds) {
  if (_drpState.selecting === 'end') {
    _drpState.hoverDate = ds;
    _drpRenderCals();
  }
}
function _drpApply() {
  if (!_drpState.tempStart) return;
  if (_drpState.caller === 'mapzone') {
    _mzDateFrom = _drpState.tempStart;
    _mzDateTo   = _drpState.tempEnd || _drpState.tempStart;
    drpClose();
    _drpUpdateTrigger();
    _mzLoadData(); 
    return;
  }
  if (_drpState.caller === 'empkpi') {
    _empKpiDR.start = _drpState.tempStart;
    _empKpiDR.end   = _drpState.tempEnd || _drpState.tempStart;
    drpClose();
    _drpUpdateTrigger();
    renderEmpKPI(); 
    return;
  }
  if (_drpState.caller === 'gantt') {
    _ganttDR.start = _drpState.tempStart;
    _ganttDR.end   = _drpState.tempEnd || _drpState.tempStart;
    drpClose();
    _drpUpdateTrigger();
    renderGantt(); 
    return;
  }
  _dashDR.start = _drpState.tempStart;
  _dashDR.end   = _drpState.tempEnd || _drpState.tempStart;
  drpClose();
  _drpUpdateTrigger();
}

function _drpUpdateTrigger() {
  if (_drpState.caller === 'mapzone') {
    var mzEl = document.getElementById('mz-drp-trigger-text');
    if (mzEl) mzEl.textContent = _drpFmtDisplay(_mzDateFrom) + ' — ' + _drpFmtDisplay(_mzDateTo);
    return;
  }
  if (_drpState.caller === 'empkpi') {
    var ekEl = document.getElementById('ek-drp-trigger-text');
    if (ekEl) ekEl.textContent = _drpFmtDisplay(_empKpiDR.start) + ' — ' + _drpFmtDisplay(_empKpiDR.end);
    return;
  }
  if (_drpState.caller === 'gantt') {
    var gcEl = document.getElementById('gc-drp-trigger-text');
    if (gcEl) gcEl.textContent = _drpFmtDisplay(_ganttDR.start) + ' — ' + _drpFmtDisplay(_ganttDR.end);
    return;
  }
  var el = document.getElementById('drp-trigger-text');
  if (el) {
    el.textContent = _drpFmtDisplay(_dashDR.start) + ' — ' + _drpFmtDisplay(_dashDR.end);
  }
}


function _drpRenderOneCal(y, m) {
  var DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  var today = _localDateStr(new Date());
  var firstDay = new Date(y, m, 1).getDay();
  var daysInMonth = new Date(y, m+1, 0).getDate();
  var prevDays = new Date(y, m, 0).getDate();

  var s = _drpState.tempStart;
  var e = _drpState.tempEnd || (_drpState.selecting === 'end' && _drpState.hoverDate ? _drpState.hoverDate : _drpState.tempStart);
  var rangeS = s && e ? (s < e ? s : e) : s;
  var rangeE = s && e ? (s < e ? e : s) : s;

  var html = '<div class="drp-grid">';
  DOW.forEach(function(d) { html += '<div class="drp-dow">'+d+'</div>'; });

  
  for (var i = 0; i < firstDay; i++) {
    html += '<div class="drp-day drp-day-other">'+(prevDays - firstDay + i + 1)+'</div>';
  }
  
  for (var day = 1; day <= daysInMonth; day++) {
    var ds = _drpYMD(y, m, day);
    var cls = 'drp-day';
    if (ds === today) cls += ' drp-day-today';
    if (ds === s && ds === e) cls += ' drp-day-selected drp-day-range-single';
    else if (ds === rangeS && rangeS !== rangeE) cls += ' drp-day-selected drp-day-range-start';
    else if (ds === rangeE && rangeS !== rangeE) cls += ' drp-day-selected drp-day-range-end';
    else if (rangeS && rangeE && ds > rangeS && ds < rangeE) cls += ' drp-day-in-range';
    else if (ds === s || ds === e) cls += ' drp-day-selected drp-day-range-single';
    html += '<div class="'+cls+'" onclick="_drpDayClick(\''+ds+'\')" onmouseenter="_drpDayHover(\''+ds+'\')">'+day+'</div>';
  }
  
  var total = firstDay + daysInMonth;
  var remaining = (7 - (total % 7)) % 7;
  for (var nd = 1; nd <= remaining; nd++) {
    html += '<div class="drp-day drp-day-other">'+nd+'</div>';
  }
  html += '</div>';
  return html;
}

function _drpRenderCals() {
  var c1 = document.getElementById('drp-cal-1');
  var c2 = document.getElementById('drp-cal-2');
  if (!c1 || !c2) return;
  var y1 = _drpState.viewYear, m1 = _drpState.viewMonth;
  var m2 = m1 + 1 >= 12 ? 0 : m1 + 1;
  var y2 = m1 + 1 >= 12 ? y1 + 1 : y1;
  c1.innerHTML = _drpRenderOneCal(y1, m1);
  c2.innerHTML = _drpRenderOneCal(y2, m2);
  
  var t1 = document.getElementById('drp-title-1');
  var t2 = document.getElementById('drp-title-2');
  if (t1) t1.textContent = _drpMonthName(y1, m1);
  if (t2) t2.textContent = _drpMonthName(y2, m2);
  
  var fi1 = document.getElementById('drp-fi-start');
  var fi2 = document.getElementById('drp-fi-end');
  if (fi1 && document.activeElement !== fi1) fi1.value = _drpState.tempStart || '';
  if (fi2 && document.activeElement !== fi2) fi2.value = _drpState.tempEnd || '';
  
  document.querySelectorAll('.drp-preset').forEach(function(el) {
    el.classList.remove('active');
  });
}

function _fmtDateSlash(ds) {
  if (!ds) return '';
  var p = ds.split('-');
  return p[2]+'/'+p[1]+'/'+p[0];
}


function _drpInputChange(which, ds) {
  if (!ds || isNaN(new Date(ds+'T00:00:00').getTime())) { _drpRenderCals(); return; } 
  if (which === 'start') {
    _drpState.tempStart = ds;
    if (_drpState.tempEnd && _drpDateCmp(_drpState.tempEnd, ds) < 0) _drpState.tempEnd = ds; 
    _drpState.viewYear  = new Date(ds+'T00:00:00').getFullYear();
    _drpState.viewMonth = new Date(ds+'T00:00:00').getMonth();
  } else {
    _drpState.tempEnd = ds;
    if (_drpState.tempStart && _drpDateCmp(ds, _drpState.tempStart) < 0) _drpState.tempStart = ds; 
  }
  _drpState.selecting = null;
  _drpRenderCals();
}

function _drpNav(dir) {
  _drpState.viewMonth += dir;
  if (_drpState.viewMonth < 0)  { _drpState.viewMonth = 11; _drpState.viewYear--; }
  if (_drpState.viewMonth > 11) { _drpState.viewMonth = 0;  _drpState.viewYear++; }
  _drpRenderCals();
}

function _drpRender() {
  var existing = document.getElementById('drp-popup');
  if (existing) existing.remove();

  var trigger = document.getElementById(_drpTriggerId());
  if (!trigger) return;
  trigger.classList.add('active');

  var rect = trigger.getBoundingClientRect();
  var popup = document.createElement('div');
  popup.id = 'drp-popup';
  popup.className = 'drp-popup';

  var presets = [
    { key: 'today',      label: 'Today' },
    { key: 'yesterday',  label: 'Yesterday' },
    { key: 'thisweek',   label: 'This week' },
    { key: 'thismonth',  label: 'This month' },
    { key: 'lastmonth',  label: 'Last month' },
    { key: '2monthsago', label: '2 months ago' },
  ];
  var presetHTML = presets.map(function(p) {
    return '<div class="drp-preset" onclick="_drpApplyPreset(\''+p.key+'\')">'+p.label+'</div>';
  }).join('');

  var calIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var chevL = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var chevR = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

  popup.innerHTML =
    '<div class="drp-presets">'+presetHTML+'</div>'+
    '<div class="drp-calendars">'+
      '<div class="drp-cal-row">'+
        '<div class="drp-cal">'+
          '<div class="drp-cal-head">'+
            '<button class="drp-nav-btn" onclick="_drpNav(-1)">'+chevL+'</button>'+
            '<div class="drp-cal-title" id="drp-title-1"></div>'+
            '<div style="width:28px;"></div>'+
          '</div>'+
          '<div id="drp-cal-1"></div>'+
        '</div>'+
        '<div class="drp-cal" style="border-left:1px solid var(--line);">'+
          '<div class="drp-cal-head">'+
            '<div style="width:28px;"></div>'+
            '<div class="drp-cal-title" id="drp-title-2"></div>'+
            '<button class="drp-nav-btn" onclick="_drpNav(1)">'+chevR+'</button>'+
          '</div>'+
          '<div id="drp-cal-2"></div>'+
        '</div>'+
      '</div>'+
      '<div class="drp-footer">'+
        '<div class="drp-input" style="padding:0;">'+
          '<input type="date" id="drp-fi-start" style="border:none;width:126px;padding:6px 10px 6px 10px;font-size:12px;font-family:inherit;color:var(--ink);outline:none;" onchange="_drpInputChange(\'start\',this.value)">'+
        '</div>'+
        '<div class="drp-dash">—</div>'+
        '<div class="drp-input" style="padding:0;">'+
          '<input type="date" id="drp-fi-end" style="border:none;width:126px;padding:6px 10px 6px 10px;font-size:12px;font-family:inherit;color:var(--ink);outline:none;" onchange="_drpInputChange(\'end\',this.value)">'+
        '</div>'+
        '<button class="drp-cancel-btn" onclick="drpClose()">Cancel</button>'+
        '<button class="drp-apply-btn" onclick="_drpApply()">Apply</button>'+
      '</div>'+
    '</div>';

  document.body.appendChild(popup);

  
  var top = rect.bottom + 6;
  var left = rect.left;
  var popupW = 640;
  if (left + popupW > window.innerWidth - 8) left = window.innerWidth - popupW - 8;
  if (top + 420 > window.innerHeight) top = rect.top - 420 - 6;
  popup.style.top  = top + 'px';
  popup.style.left = left + 'px';

  _drpRenderCals();
}


var _dashTeam = 'all';

function _dashFilterBarHTML() {
  var calIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var SCHED_DNAMES = ['LED','Digital Signage & Retail','Business Development'];
  var depts = vDepts().filter(function(d){ return SCHED_DNAMES.indexOf(d.name) >= 0; });
  var deptOpts = '<option value="all">ทุกแผนก</option>' +
    depts.map(function(d){ return '<option value="'+d.name+'"'+(d.name===_dashDept?' selected':'')+'>'+d.name+'</option>'; }).join('');

  
  var SCHED_DNAMES2 = ['LED','Digital Signage & Retail','Business Development'];
  var teams = [];
  if (_dashDept !== 'all' && DB.schedTeams && DB.schedTeams[_dashDept]) {
    teams = DB.schedTeams[_dashDept];
  } else {
    SCHED_DNAMES2.forEach(function(dn){
      if (DB.schedTeams && DB.schedTeams[dn]) teams = teams.concat(DB.schedTeams[dn]);
    });
  }
  var teamOpts = '<option value="all">ทุกทีม</option>' +
    teams.map(function(t){ return '<option value="'+t+'\"'+(_dashTeam===t?' selected':'')+'>'+t+'</option>'; }).join('');

  return '<div class="dash-filter-bar" id="dash-filter-bar">'+
    '<div class="dash-filter-group">'+
      '<div class="dash-filter-label">Date Range</div>'+
      '<div class="drp-trigger" id="drp-trigger" onclick="drpOpen(this)">'+
        '<span class="drp-icon">'+calIcon+'</span>'+
        '<span class="drp-text" id="drp-trigger-text">'+_drpFmtDisplay(_dashDR.start)+' — '+_drpFmtDisplay(_dashDR.end)+'</span>'+
      '</div>'+
    '</div>'+
    '<div class="dash-filter-group">'+
      '<div class="dash-filter-label">Department</div>'+
      '<select class="dept-select-pill" onchange="_dashDept=this.value;_dashTeam=\'all\';_dashFilterBarUpdate();renderDashContent()">'+deptOpts+'</select>'+
    '</div>'+
    '<div class="dash-filter-group" id="dash-team-group">'+
      '<div class="dash-filter-label">Team</div>'+
      '<select class="dept-select-pill" id="dash-team-sel" onchange="_dashTeam=this.value;renderDashContent()">'+teamOpts+'</select>'+
    '</div>'+
    '<div class="dash-filter-group">'+
      '<div class="dash-filter-label">ค้นหาชื่องาน</div>'+
      '<input type="text" id="dash-name-input" class="name-search-pill" placeholder="พิมพ์ชื่องาน..." value="'+_dashName+'" oninput="_dashName=this.value;renderDashContent()" style="min-width:180px;" autocomplete="off">'+
    '</div>'+
    '<button class="calc-btn" onclick="renderDash()">Calculate</button>'+
  '</div>';
}

function _dashFilterBarUpdate() {
  
  var bar = document.getElementById('dash-filter-bar');
  if (bar) bar.outerHTML = _dashFilterBarHTML();
  else document.getElementById('dash-filter-wrap').innerHTML = _dashFilterBarHTML();
}

function pgDash() {
  document.getElementById('tb-actions').innerHTML =
    '<button class="btn btn-p" onclick="openCreate()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> สร้างงาน</button>';
  
  if (!_dashDR.start) {
    var today = _localDateStr(new Date());
    _dashDR.start = today.slice(0,7)+'-01';
    _dashDR.end   = today;
  }
  renderDash();
}

function renderDash() {
  document.getElementById('content').innerHTML =
    '<div id="dash-filter-wrap">' + _dashFilterBarHTML() + '</div>' +
    '<div id="dash-content"></div>';
  renderDashContent();
}



function openCostBreakdown() {
  var d = window._dashCostBreakdown;
  if (!d) return;

  function miniTable(items) {
    if (!items.length) return '<div style="padding:14px;text-align:center;color:var(--ink-3);font-size:11px;">ไม่มีรายการ</div>';
    var rows = items.map(function(t){
      return '<tr style="cursor:pointer;" onclick="closeMd();openDetail('+t.id+')" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'+
        '<td style="font-size:9.5px;color:var(--ink-3);white-space:nowrap;">#'+t.id+'</td>'+
        '<td style="font-size:11.5px;font-weight:600;">'+escapeHtml(t.title)+'<br><span style="font-size:9.5px;color:var(--ink-3);font-weight:400;">'+escapeHtml(t.site||'')+'</span></td>'+
        '<td style="font-size:10px;color:var(--ink-2);white-space:nowrap;">'+(t.teamName||'-')+'</td>'+
        '<td style="font-size:10.5px;white-space:nowrap;">'+fDate(t.start)+(t.end&&t.end!==t.start?' – '+fDate(t.end):'')+'</td>'+
        '<td style="text-align:right;font-weight:700;color:var(--red);font-size:11px;white-space:nowrap;">'+fMoney(t.amt)+'</td>'+
      '</tr>';
    }).join('');
    return '<div class="tw" style="max-height:220px;overflow-y:auto;"><table>'+
      '<thead style="position:sticky;top:0;background:var(--surface);"><tr><th>#</th><th>งาน</th><th>ทีม</th><th>วันที่</th><th style="text-align:right;">จำนวน</th></tr></thead>'+
      '<tbody>'+rows+'</tbody>'+
    '</table></div>';
  }

  function section(key, icon, label, desc, amt, color, items) {
    var pct = d.total > 0 ? Math.round(amt/d.total*100) : 0;
    var secId = 'cbk-'+key;
    return '<div style="border-bottom:1px solid var(--line);">'+
      '<div style="padding:12px 0;cursor:pointer;" onclick="var e=document.getElementById(\''+secId+'\');e.style.display=e.style.display===\'none\'?\'block\':\'none\';">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;">'+
          '<div style="display:flex;align-items:center;gap:9px;">'+
            '<div style="width:30px;height:30px;border-radius:8px;background:'+color+'18;color:'+color+';display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+icon+'</div>'+
            '<div><div style="font-size:12.5px;font-weight:700;color:var(--ink);">'+label+'</div><div style="font-size:10px;color:var(--ink-3);">'+desc+' · '+items.length+' งาน</div></div>'+
          '</div>'+
          '<div style="text-align:right;flex-shrink:0;display:flex;align-items:center;gap:6px;">'+
            '<div><div style="font-size:14.5px;font-weight:800;color:'+color+';">'+fMoney(amt)+'</div><div style="font-size:9.5px;color:var(--ink-3);">'+pct+'%</div></div>'+
            fi('chevron-down',14,'','color:var(--ink-3);')+
          '</div>'+
        '</div>'+
        '<div style="height:5px;background:var(--bg-2);border-radius:3px;overflow:hidden;margin-top:8px;"><div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:3px;"></div></div>'+
      '</div>'+
      '<div id="'+secId+'" style="display:none;margin-bottom:10px;">'+miniTable(items)+'</div>'+
    '</div>';
  }

  var ic_prov = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  var ic_wage = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ic_hol  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  
  
  
  var provAmt = d.provTotal;
  var wageAmt = d.wage.reduce(function(s,t){ return s+t.amt; },0);
  var hdAmt   = d.holTotal;
  openMd(
    '<div class="md md-lg" style="max-width:520px;">'+
      '<div class="mh"><h3>รายละเอียดค่าใช้จ่ายรวม</h3><button class="mc" onclick="closeMd()">'+fi('x',16)+'</button></div>'+
      '<div class="mb" style="max-height:70vh;overflow-y:auto;">'+
        '<div style="font-size:10.5px;color:var(--ink-3);margin-bottom:6px;">ช่วงวันที่ '+d.rangeLabel+' · คลิกที่หัวข้อเพื่อดูรายการงาน</div>'+
        '<div style="font-size:24px;font-weight:800;color:var(--red);margin-bottom:4px;">'+fMoney(d.total)+'</div>'+
        '<div style="font-size:9.5px;color:var(--ink-3);margin-bottom:10px;">ยอดเบี้ยเลี้ยง/เงินพิเศษวันหยุด คิดไม่เกิน 1 ครั้งต่อคนต่อวัน แม้วันนั้นจะมีมากกว่า 1 งานที่เข้าเงื่อนไข — รายการงานด้านล่างแสดงทุกงานที่ติดธงนี้เพื่ออ้างอิง</div>'+
        section('prov', ic_prov, 'ค่าเบี้ยเลี้ยงต่างจังหวัด', 'งานที่ทำเครื่องหมายต่างจังหวัด', provAmt, '#7C3AED', d.prov) +
        section('wage', ic_wage, 'ค่าจ้าง (รายวัน)', 'ค่าจ้างพนักงานจ้างรายวัน', wageAmt, '#D97706', d.wage) +
        section('hd',   ic_hol,  'ค่าวันหยุดพิเศษ', 'ค่าตอบแทนวันหยุดนักขัตฤกษ์', hdAmt, '#2563EB', d.hd) +
      '</div>'+
      '<div class="mf"><button class="btn" onclick="closeMd()">ปิด</button></div>'+
    '</div>'
  );
}

function renderDashContent() {
  var dashEl = document.getElementById('dash-content');
  if (!dashEl) return;

  var SCHED_DNAMES = ['LED','Digital Signage & Retail','Business Development'];
  var allTasks = vTasks();
  var depts    = vDepts().filter(function(d){ return SCHED_DNAMES.indexOf(d.name) >= 0; });
  var emps     = DB.employees.filter(function(e){ return e.status==1||e.status==null||e.status===undefined; });
  var today    = _localDateStr(new Date());
  var drStart  = _dashDR.start || (today.slice(0,7)+'-01');
  var drEnd    = _dashDR.end   || today;
  var rangeLabel = _drpFmtDisplay(drStart)+' – '+_drpFmtDisplay(drEnd);

  
  var execTasks = allTasks.filter(function(t){ var ts=t.start||'', te=t.end||ts; return ts<=drEnd && te>=drStart; });

  
  
  var tasks = execTasks;
  if (_dashDept && _dashDept !== 'all') tasks = tasks.filter(function(t){ return t.deptName === _dashDept; });
  if (_dashTeam && _dashTeam !== 'all') tasks = tasks.filter(function(t){ return t.teamName === _dashTeam; });
  if (_dashName && _dashName.trim()) {
    var nameQ = _dashName.trim().toLowerCase();
    tasks = tasks.filter(function(t){ return (t.title||'').toLowerCase().indexOf(nameQ)>=0 || (t.site||'').toLowerCase().indexOf(nameQ)>=0; });
  }
  var isFiltered = (_dashDept && _dashDept!=='all') || (_dashTeam && _dashTeam!=='all') || (_dashName && _dashName.trim());
  var scopeLabel = isFiltered ? ('ภาพรวม' + (_dashTeam!=='all'&&_dashTeam ? ' — ทีม '+_dashTeam : (_dashDept!=='all'&&_dashDept ? ' — แผนก '+_dashDept : '')) + (_dashName?' — ค้นหา "'+_dashName+'"':'')) : 'ภาพรวมบริษัท';

  
  
  
  var totalManDay  = tasks.reduce(function(s,t){ return s+taskManDays(t); }, 0);
  var wageCostAll = tasks.reduce(function(s,t){ return s+(t.dailyWorkers||[]).reduce(function(ss,w){ return ss+(w.wage||0); }, 0); }, 0);
  
  var _extraPay   = computeExtraPayDeduped(tasks, drStart, drEnd);
  var provCostAll = _extraPay.provTotal;
  var hdCostAll   = _extraPay.holTotal;
  var totalCostAll = provCostAll + hdCostAll + wageCostAll;
  
  window._dashCostBreakdown = {
    total: totalCostAll, rangeLabel: rangeLabel,
    provTotal: provCostAll, holTotal: hdCostAll, 
    prov: tasks.filter(function(t){ return provinceCost(t) > 0; })
      .map(function(t){ return { id:t.id, title:t.title, site:t.site, deptName:t.deptName, teamName:t.teamName, start:t.start, end:t.end, amt:provinceCost(t) }; })
      .sort(function(a,b){ return (b.start||'').localeCompare(a.start||''); }),
    wage: tasks.filter(function(t){ return (t.dailyWorkers||[]).some(function(w){ return w.wage; }); })
      .map(function(t){ return { id:t.id, title:t.title, site:t.site, deptName:t.deptName, teamName:t.teamName, start:t.start, end:t.end, amt:(t.dailyWorkers||[]).reduce(function(ss,w){ return ss+(w.wage||0); },0) }; })
      .sort(function(a,b){ return (b.start||'').localeCompare(a.start||''); }),
    hd: tasks.filter(function(t){ return hdCost(t) > 0; })
      .map(function(t){ return { id:t.id, title:t.title, site:t.site, deptName:t.deptName, teamName:t.teamName, start:t.start, end:t.end, amt:hdCost(t) }; })
      .sort(function(a,b){ return (b.start||'').localeCompare(a.start||''); }),
  };
  var costPerTask  = tasks.length ? totalCostAll/tasks.length : 0;
  
  var productivity = totalManDay ? (tasks.length/totalManDay) : 0;
  
  var empScope = emps, empScopeAll = DB.employees;
  if (_dashTeam && _dashTeam!=='all') {
    empScope = emps.filter(function(e){ return e.team===_dashTeam || e.team2===_dashTeam; });
    empScopeAll = DB.employees.filter(function(e){ return e.team===_dashTeam || e.team2===_dashTeam; });
  } else if (_dashDept && _dashDept!=='all') {
    empScope = emps.filter(function(e){ return e.dept===_dashDept || e.dept2===_dashDept; });
    empScopeAll = DB.employees.filter(function(e){ return e.dept===_dashDept || e.dept2===_dashDept; });
  }
  var activeEmpCount = empScope.length, totalEmpCount = empScopeAll.length;

  
  var prevRange = _prevPeriodRange(drStart, drEnd);
  var prevTasks = prevRange ? allTasks.filter(function(t){ var ts=t.start||'', te=t.end||ts; return ts<=prevRange.end && te>=prevRange.start; }) : [];
  if (_dashDept && _dashDept !== 'all') prevTasks = prevTasks.filter(function(t){ return t.deptName === _dashDept; });
  if (_dashTeam && _dashTeam !== 'all') prevTasks = prevTasks.filter(function(t){ return t.teamName === _dashTeam; });
  var prevWage    = prevTasks.reduce(function(s,t){ return s+(t.dailyWorkers||[]).reduce(function(ss,w){ return ss+(w.wage||0); }, 0); }, 0);
  var prevCost    = computeExtraPayDeduped(prevTasks, prevRange ? prevRange.start : null, prevRange ? prevRange.end : null).total + prevWage;
  var prevManDay  = prevTasks.reduce(function(s,t){ return s+taskManDays(t); }, 0);
  var prevProd    = prevManDay ? (prevTasks.length/prevManDay) : 0;
  var trendCost = _pctChange(totalCostAll, prevCost);
  var trendTask = _pctChange(tasks.length, prevTasks.length);
  var trendMD   = _pctChange(totalManDay, prevManDay);
  var trendProd = _pctChange(productivity, prevProd);

  function trendHtml(pct, invert) {
    if (pct === null) return '';
    var isUp = pct > 0, isFlat = pct === 0;
    var good = invert ? !isUp : isUp;
    var color = isFlat ? 'var(--ink-3)' : (good ? '#16A34A' : '#DC2626');
    var arrow = isFlat ? '' : (isUp ? '↑ ' : '↓ ');
    return '<span style="font-size:10.5px;font-weight:800;color:'+color+';margin-left:6px;">'+arrow+Math.abs(pct)+'%</span>';
  }

  function kpiCard(icon, label, value, sub, color, trend, onClick) {
    var clickable = !!onClick;
    return '<div class="card" style="flex:1;min-width:165px;padding:16px 18px;'+(clickable?'cursor:pointer;transition:box-shadow .15s,transform .15s;':'')+'"'+
      (clickable?' onclick="'+onClick+'" onmouseover="this.style.boxShadow=\'0 4px 14px rgba(0,0,0,.09)\';this.style.transform=\'translateY(-1px)\'" onmouseout="this.style.boxShadow=\'\';this.style.transform=\'\'"':'')+'>'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'+
        '<div style="font-size:10.5px;font-weight:600;color:var(--ink-3);">'+label+'</div>'+
        '<div style="color:'+color+';opacity:.7;">'+icon+'</div>'+
      '</div>'+
      '<div style="display:flex;align-items:baseline;flex-wrap:wrap;">'+
        '<div style="font-size:26px;font-weight:800;color:'+color+';">'+value+'</div>'+(trend||'')+
      '</div>'+
      (sub?'<div style="font-size:10px;color:var(--ink-3);margin-top:3px;">'+sub+'</div>':'')+
    '</div>';
  }
  var ic_emp   ='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ic_task  ='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  var ic_md    ='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var ic_cost  ='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
  var ic_avg   ='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
  var ic_prod  ='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 14 8 12"/></svg>';

  var kpiRow = '<div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--ink-3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;">'+fi('bar-chart-2',13,'','color:var(--ink-3);')+scopeLabel+' ('+rangeLabel+')'+(isFiltered?'<button onclick="_dashDept=\'all\';_dashTeam=\'all\';_dashName=\'\';renderDash()" style="margin-left:8px;background:none;border:none;color:var(--teal);font-size:10.5px;font-weight:700;text-transform:none;letter-spacing:0;cursor:pointer;text-decoration:underline;font-family:inherit;">ล้างตัวกรอง — ดูทั้งบริษัท</button>':'')+'</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">' +
    kpiCard(ic_emp,  'พนักงาน', activeEmpCount, 'Active จากทั้งหมด '+totalEmpCount+' คน', '#2563EB') +
    kpiCard(ic_task, 'งานทั้งหมด', execTasks.length, 'ในช่วง '+rangeLabel, 'var(--teal)', trendHtml(trendTask,false)) +
    kpiCard(ic_md,   'Man-Day รวม', totalManDay.toLocaleString('th-TH'), 'คน × วัน ทำงานรวมทั้งหมด', '#7C3AED', trendHtml(trendMD,false)) +
    kpiCard(ic_cost, 'ค่าใช้จ่ายรวม', fMoney(totalCostAll), 'เบี้ยเลี้ยง + วันหยุด + รายวัน · คลิกดูรายละเอียด', 'var(--red)', trendHtml(trendCost,true), 'openCostBreakdown()') +
    kpiCard(ic_avg,  'ค่าใช้จ่ายเฉลี่ย/งาน', fMoney(Math.round(costPerTask)), 'Cost per Task', 'var(--amber)') +
    kpiCard(ic_prod, 'Productivity', (productivity*100).toFixed(1)+'%', 'จำนวนงาน ÷ Man-Day', '#16A34A', trendHtml(trendProd,false)) +
  '</div>';

  
  
  
  var teamStats = DB.teams.filter(function(tm){ return SCHED_DNAMES.indexOf(tm.deptName) >= 0; }).map(function(tm){
    var tTasks = execTasks.filter(function(t){ return t.teamName===tm.name && t.deptName===tm.deptName; });
    var tCost  = tTasks.reduce(function(s,t){ return s+totalCost(t); }, 0);
    var tMD    = tTasks.reduce(function(s,t){ return s+taskManDays(t); }, 0);
    var uniqueMembers = {}; tTasks.forEach(function(t){ (t.members||[]).forEach(function(c){ uniqueMembers[c]=1; }); });
    return {
      dept: tm.deptName, team: tm.name, color: (depts.find(function(d){return d.name===tm.deptName;})||{}).color || '#888',
      taskCount: tTasks.length, memberCount: Object.keys(uniqueMembers).length,
      manDay: tMD, cost: tCost, costPerTask: tTasks.length ? tCost/tTasks.length : 0,
      productivity: tMD ? tTasks.length/tMD : 0, 
    };
  }).filter(function(s){ return s.taskCount > 0; });
  teamStats.sort(function(a,b){ return b.productivity - a.productivity; });
  var bestTeamKey = teamStats.length ? (teamStats[0].dept+'::'+teamStats[0].team) : null;

  
  
  
  
  var flagsRed = [], flagsYellow = [], flagsGreen = [];
  teamStats.forEach(function(s){
    
    if (s.taskCount >= 3 && costPerTask > 0 && s.costPerTask > costPerTask * 1.6) {
      var pctOver = Math.round(((s.costPerTask - costPerTask) / costPerTask) * 100);
      flagsRed.push({ text: 'ทีม '+s.team+' ('+s.dept+') ต้นทุนต่องานสูงกว่าค่าเฉลี่ยบริษัท '+pctOver+'% ('+s.taskCount+' งาน)', teamKey: s.dept+'::'+s.team, mag: pctOver });
    }
  });
  depts.forEach(function(d){
    var curTasksD  = execTasks.filter(function(t){ return t.deptName===d.name; });
    var curC = curTasksD.reduce(function(s,t){ return s+totalCost(t); }, 0);
    var prevC = prevTasks.filter(function(t){ return t.deptName===d.name; }).reduce(function(s,t){ return s+totalCost(t); }, 0);
    var pct = _pctChange(curC, prevC);
    
    if (pct !== null && pct > 15 && curC > 1000) {
      flagsRed.push({ text: 'แผนก '+d.name+' ค่าใช้จ่ายเพิ่มขึ้น '+pct+'% จากช่วงก่อนหน้า ('+fMoney(curC)+')', deptKey: d.name, mag: pct });
    }
  });
  
  (function(){
    var mdList = execTasks.map(taskManDays).filter(function(n){ return n>0; });
    if (mdList.length >= 6) {
      var mean = mdList.reduce(function(s,n){ return s+n; },0) / mdList.length;
      var variance = mdList.reduce(function(s,n){ return s+Math.pow(n-mean,2); },0) / mdList.length;
      var sd = Math.sqrt(variance);
      var threshold = mean + 2.5*sd;
      execTasks.forEach(function(t){
        var md = taskManDays(t);
        if (sd > 0 && md > threshold && md > mean*2) {
          flagsYellow.push({ text: 'งาน "'+t.title+'" ใช้ Man-Day สูงผิดปกติ ('+md+' คน-วัน เทียบเฉลี่ย '+mean.toFixed(1)+')', taskId: t.id, mag: md });
        }
      });
    }
  })();
  if (teamStats.length && teamStats[0].productivity > 0 && teamStats[0].taskCount >= 3) {
    flagsGreen.push({ text: 'ทีม '+teamStats[0].team+' ('+teamStats[0].dept+') บริหารกำลังคนได้มีประสิทธิภาพสูงสุด — Productivity '+(teamStats[0].productivity*100).toFixed(1)+'%', teamKey: teamStats[0].dept+'::'+teamStats[0].team, mag: 0 });
  }
  
  flagsRed.sort(function(a,b){ return b.mag-a.mag; });
  flagsYellow.sort(function(a,b){ return b.mag-a.mag; });
  var FLAG_SHOW_MAX = 3;
  var extraRed    = Math.max(0, flagsRed.length    - FLAG_SHOW_MAX);
  var extraYellow = Math.max(0, flagsYellow.length - FLAG_SHOW_MAX);
  var flags = flagsRed.slice(0,FLAG_SHOW_MAX).map(function(f){ return Object.assign({sev:'red'},f); })
    .concat(flagsYellow.slice(0,FLAG_SHOW_MAX).map(function(f){ return Object.assign({sev:'yellow'},f); }))
    .concat(flagsGreen.map(function(f){ return Object.assign({sev:'green'},f); }));

  var SEV_META = {
    red:    { icon: fi('alert-circle',14,'','color:#991B1B;flex-shrink:0;'),   bg:'var(--red-bg)',   color:'#991B1B' },
    yellow: { icon: fi('alert-triangle',14,'','color:#92400E;flex-shrink:0;'), bg:'var(--amber-bg)', color:'#92400E' },
    green:  { icon: fi('check-circle',14,'','color:#166534;flex-shrink:0;'),   bg:'var(--green-bg)', color:'#166534' },
  };
  var extraNote = (extraRed||extraYellow)
    ? '<div style="font-size:10.5px;color:var(--ink-3);margin-top:6px;">'+
        (extraRed?'+ อีก '+extraRed+' ทีม/แผนกที่ต้นทุนสูงผิดปกติ':'')+
        (extraRed&&extraYellow?' · ':'')+
        (extraYellow?'+ อีก '+extraYellow+' งานที่ Man-Day สูงผิดปกติ':'')+
        ' — ดูรายละเอียดเพิ่มเติมได้ที่ตาราง Performance ด้านล่าง'+
      '</div>' : '';
  var attentionHtml = '<div class="card" style="margin-bottom:12px;">' +
    '<div class="ct" style="margin-bottom:10px;display:flex;align-items:center;gap:6px;">'+fi('alert-triangle',14,'','color:var(--ink-2);')+' Attention Required <span style="font-weight:400;color:var(--ink-3);font-size:10.5px;">— จุดที่ควรดูก่อน ('+rangeLabel+')</span></div>' +
    (flags.length
      ? '<div style="display:flex;flex-direction:column;gap:6px;">' + flags.map(function(f){
          var m = SEV_META[f.sev];
          var clickAttr = f.teamKey ? ' onclick="_dashDrillTeam(\''+f.teamKey.replace(/'/g,"\\'")+'\')" style="cursor:pointer;"' :
                           f.deptKey ? ' onclick="_dashScrollToDept(\''+f.deptKey.replace(/'/g,"\\'")+'\',event)" style="cursor:pointer;"' :
                           f.taskId  ? ' onclick="openDetail('+f.taskId+')" style="cursor:pointer;"' : '';
          return '<div'+clickAttr+' style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:'+m.bg+';border-radius:8px;">' +
            m.icon +
            '<span style="font-size:12px;color:'+m.color+';font-weight:600;flex:1;">'+escapeHtml(f.text)+'</span>' +
          '</div>';
        }).join('') + '</div>' + extraNote
      : '<div style="text-align:center;padding:20px;color:var(--ink-3);font-size:12px;display:flex;flex-direction:column;align-items:center;gap:6px;">'+fi('check-circle',20,'','color:#16A34A;')+'<span>ไม่พบสิ่งผิดปกติในช่วงเวลานี้</span></div>') +
  '</div>';

  
  
  
  var rankRows = teamStats.map(function(s, i){
    var isBest = (s.dept+'::'+s.team) === bestTeamKey;
    var isSel  = (_dashDept===s.dept && _dashTeam===s.team);
    return '<tr onclick="_dashDrillTeam(\''+(s.dept+'::'+s.team).replace(/'/g,"\\'")+'\')" style="cursor:pointer;'+(isSel?'background:var(--teal-dim);':'')+'" onmouseover="this.style.background=\''+(isSel?'var(--teal-dim)':'var(--bg)')+'\'" onmouseout="this.style.background=\''+(isSel?'var(--teal-dim)':'')+'\'">'+
      '<td style="font-size:11px;color:var(--ink-3);">'+(i+1)+'</td>'+
      '<td><div style="display:flex;align-items:center;gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:'+s.color+';flex-shrink:0;"></span><span style="font-size:12px;font-weight:700;">'+s.team+'</span></div><div style="font-size:9.5px;color:var(--ink-3);margin-left:13px;">'+s.dept+'</div></td>'+
      '<td style="text-align:center;font-size:12px;">'+s.taskCount+'</td>'+
      '<td style="text-align:center;font-size:12px;">'+s.memberCount+'</td>'+
      '<td style="text-align:center;font-size:12px;">'+s.manDay+'</td>'+
      '<td style="text-align:right;font-size:12px;">'+fMoney(s.cost)+'</td>'+
      '<td style="text-align:right;font-size:12px;">'+fMoney(Math.round(s.costPerTask))+'</td>'+
      '<td style="text-align:right;font-size:12px;font-weight:700;color:'+(isBest?'#16A34A':'var(--ink)')+';"><span style="display:inline-flex;align-items:center;gap:4px;justify-content:flex-end;">'+(isBest?'<svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>':'')+'<span>'+(s.productivity*100).toFixed(1)+'%</span></span></td>'+
    '</tr>';
  }).join('');

  var rankingHtml = '<div class="card" style="padding:0;overflow:hidden;margin-bottom:14px;">' +
    '<div style="padding:12px 16px;border-bottom:1px solid var(--line-2);display:flex;align-items:center;justify-content:space-between;">' +
      '<div><div class="ct" style="display:flex;align-items:center;gap:6px;">'+fi('trending-up',13,'','color:var(--ink-2);')+'Department / Team Performance</div><div style="font-size:10.5px;color:var(--ink-3);margin-top:1px;">เรียงตามประสิทธิภาพ — คลิกแถวเพื่อดูรายละเอียดงานของทีมนั้น</div></div>' +
      (_dashDept!=='all'?'<button class="btn btn-sm" onclick="_dashDept=\'all\';_dashTeam=\'all\';renderDash()">ล้างตัวกรอง</button>':'') +
    '</div>' +
    '<div class="tw"><table>' +
      '<thead><tr><th>#</th><th>ทีม</th><th style="text-align:center;">งาน</th><th style="text-align:center;">คน</th><th style="text-align:center;">Man-Day</th><th style="text-align:right;">Cost</th><th style="text-align:right;">Cost/Task</th><th style="text-align:right;">Productivity</th></tr></thead>' +
      '<tbody>'+(rankRows || '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--ink-3);">ไม่มีข้อมูลทีมในช่วงนี้</td></tr>')+'</tbody>' +
    '</table></div>' +
  '</div>';

  
  
  
  var recentRows = tasks.slice().sort(function(a,b){ return (b.start||'').localeCompare(a.start||''); }).slice(0,50).map(function(t){
    var cost = totalCost(t);
    var membersTxt = (t.members||[]).map(function(c){ var e=eOf(c); return e?e.nickname:c; }).slice(0,3).join(', ')||'—';
    return '<tr style="cursor:pointer;" onclick="openDetail('+t.id+')" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'+
      '<td style="font-size:10px;color:var(--ink-3);">#'+t.id+'</td>'+
      '<td style="font-weight:600;font-size:12px;">'+escapeHtml(t.title)+'<br><span style="font-size:9.5px;color:var(--ink-3);font-weight:400;">'+escapeHtml(t.site)+'</span></td>'+
      '<td>'+deptBadge(t.deptName)+'</td>'+
      '<td style="font-size:11px;color:var(--ink-2);">'+t.teamName+'</td>'+
      '<td style="font-size:11px;">'+fDate(t.start)+(t.end&&t.end!==t.start?' – '+fDate(t.end):'')+'</td>'+
      '<td style="font-size:11px;color:var(--ink-3);">'+membersTxt+'</td>'+
      '<td style="text-align:right;font-weight:700;color:'+(cost?'var(--red)':'var(--ink-3)')+';">'+(cost?fMoney(cost):'—')+'</td>'+
    '</tr>';
  }).join('');

  var taskTableHtml = '<div class="card" id="dash-task-table" style="padding:0;overflow:hidden;">'+
      '<div style="padding:12px 16px;border-bottom:1px solid var(--line-2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">'+
        '<div style="font-size:12px;font-weight:700;">งานในช่วง: <span style="color:var(--teal);">'+rangeLabel+'</span>'+
          (_dashDept!=='all'?' · <span style="color:var(--teal);">'+_dashDept+'</span>':'')+
          (_dashTeam!=='all'?' · <span style="color:var(--teal);">'+_dashTeam+'</span>':'')+
          (_dashName?' · <span style="color:var(--teal);">"'+_dashName+'"</span>':'')+
          ' <span style="color:var(--ink-3);font-weight:400;">('+tasks.length+' งาน)</span>'+
        '</div>'+
        '<div style="display:flex;gap:6px;">'+
          ((_dashDept!=='all'||_dashTeam!=='all'||_dashName)
            ?'<button class="btn btn-sm" onclick="_dashDept=\'all\';_dashTeam=\'all\';_dashName=\'\';renderDash()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> ล้างทั้งหมด</button>'
            :'')+
          '<button class="btn btn-sm" onclick="go(\'tasks\')">ดูทั้งหมด →</button>'+
        '</div>'+
      '</div>'+
      '<div class="tw"><table>'+
        '<thead><tr><th>#</th><th>ชื่องาน / รายละเอียด</th><th>แผนก</th><th>ทีม</th><th>วันที่</th><th>สมาชิก</th><th style="text-align:right;">ค่าพิเศษ</th></tr></thead>'+
        '<tbody>'+(recentRows||'<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ink-3);">ไม่มีรายการ</td></tr>')+'</tbody>'+
      '</table></div>'+
    '</div>';

  dashEl.innerHTML = kpiRow + attentionHtml + rankingHtml + taskTableHtml;
}


function _dashDrillTeam(teamKey) {
  var parts = teamKey.split('::');
  var dept = parts[0], team = parts[1];
  if (_dashDept === dept && _dashTeam === team) { _dashDept = 'all'; _dashTeam = 'all'; } 
  else { _dashDept = dept; _dashTeam = team; }
  renderDash();
  setTimeout(function() {
    var el = document.getElementById('dash-task-table');
    var ca = document.querySelector('.ca');
    if (el && ca) ca.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
  }, 60);
}


function _dashScrollToDept(deptName, evt) {
  if (evt) evt.stopPropagation();
  _dashDept = (_dashDept===deptName) ? 'all' : deptName;
  _dashTeam = 'all';
  renderDash();
  setTimeout(function() {
    var el = document.getElementById('dash-task-table');
    var ca = document.querySelector('.ca');
    if (el && ca) ca.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
  }, 60);
}

function pgCal() {
  if (can('createTask'))
    document.getElementById('tb-actions').innerHTML = `<button class="btn btn-p" onclick="openCreate()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> สร้างงาน</button>`;
  const today = new Date();
  calYear  = today.getFullYear();
  calMonth = today.getMonth();
  calSelDate = today.toISOString().slice(0, 10);
  renderCal();
}

function renderCal() {
  const tasks  = vTasks();
  const depts  = vDepts();
  const today  = _localDateStr(new Date());
  if (!calSelDate) calSelDate = today;

  let filtered = tasks;
  if (calDeptFilter !== 'all') filtered = tasks.filter(t => t.deptName === calDeptFilter);

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay  = new Date(calYear, calMonth + 1, 0);
  const totalDays = lastDay.getDate();
  const startDow  = firstDay.getDay();

  const teamsInFilter = calDeptFilter === 'all' ? vTeams() : vTeams().filter(t => t.deptName === calDeptFilter);
  const maxTeams = Math.max(teamsInFilter.length, 1);

  
  const dayMap = {};
  filtered.forEach(task => {
    let cur = new Date(task.start + 'T00:00:00');
    const end = new Date((task.end || task.start) + 'T00:00:00');
    while (cur <= end) {
      const ds = _localDateStr(cur);
      if (!dayMap[ds]) dayMap[ds] = [];
      if (!dayMap[ds].find(x => x.id === task.id)) dayMap[ds].push(task);
      cur.setDate(cur.getDate() + 1);
    }
  });

  const monthName = firstDay.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  function occColor(pct) {
    if (pct >= 1) return 'var(--red)';
    if (pct >= 0.8) return 'var(--amber)';
    if (pct >= 0.4) return 'var(--teal)';
    return '#9FE1CB';
  }

  const DOW = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  let gridHTML = DOW.map((d,i) => `<div class="cal-dow${i===0?' sun':i===6?' sat':''}">${d}</div>`).join('');

  for (let i = 0; i < startDow; i++) gridHTML += '<div class="day-cell other-month"></div>';

  for (let day = 1; day <= totalDays; day++) {
    const ds  = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const hol = isHol(ds), holN = holName(ds);
    const isToday = ds === today, isSel = ds === calSelDate;
    const dayTasks = dayMap[ds] || [];
    const occ = dayTasks.length / maxTeams;
    const pct = Math.round(Math.min(occ, 1) * 100);
    const dow3    = new Date(ds + 'T00:00:00').getDay();
    const isSun3  = (dow3 === 0);
    const isSat3  = (dow3 === 6);
    const isNHol3 = DB.holidays.some(h => h.date === ds);
    const dayCls  = isSun3 ? 'is-sunday' : (isNHol3 ? 'is-nat-hol' : (isSat3 ? 'is-saturday' : ''));
    const cls = ['day-cell', isToday?'today':'', isSel?'selected':'', dayCls].filter(Boolean).join(' ');

    gridHTML += `<div class="${cls}" onclick="calSelDate='${ds}';renderCalRight()">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div class="day-num">${day}</div>
        ${pct > 0 ? `<span class="occ-pct" style="color:${occColor(occ)};">${pct}%</span>` : ''}
      </div>
      ${isNHol3 ? `<div class="day-hol-name nat-hol">${holN}</div>` : (isSun3 ? `<div class="day-hol-name">วันอาทิตย์</div>` : '')}
      <div class="occ-bar"><div class="occ-fill" style="width:${pct}%;background:${occColor(occ)};"></div></div>
      <div class="cell-chips">
        ${dayTasks.slice(0,2).map(t => {
          const d = dOfN(t.deptName);
          return `<div class="cell-chip" style="background:${d?.color||'#888'}22;color:${d?.color||'#888'};">${escapeHtml(t.site)}</div>`;
        }).join('')}
        ${dayTasks.length > 2 ? `<div class="cell-more">+${dayTasks.length-2} เพิ่ม</div>` : ''}
      </div>
    </div>`;
  }

  // Dept tabs — show only depts with schedTeams configured
  var SCHED_DEPT_NAMES = ['LED','Digital Signage & Retail','Business Development'];
  var calTabDepts = depts.filter(function(d){ return SCHED_DEPT_NAMES.indexOf(d.name) >= 0; });
  const deptTabs = `<div class="team-tabs">
    <div class="team-tab ${calDeptFilter==='all'?'active':''}" onclick="calDeptFilter='all';renderCal()">ทุกแผนก</div>
    ${calTabDepts.map(d => `<div class="team-tab ${calDeptFilter===d.name?'active':''}" onclick="calDeptFilter='${d.name}';renderCal()" style="${calDeptFilter===d.name?'color:'+d.color+';border-bottom-color:'+d.color+';':''}">${d.icon} ${d.name}</div>`).join('')}
  </div>`;

  document.getElementById('content').innerHTML = `
  ${deptTabs}
  <div class="cal-wrap">
    <div>
      <div class="cal-header">
        <div>
          <div class="cal-month">${monthName}</div>
          <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">อัตราการใช้ทีมงานรายวัน</div>
        </div>
        <div class="cal-nav">
          <button class="btn btn-ico" onclick="calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
          <button class="btn btn-sm" onclick="calYear=new Date().getFullYear();calMonth=new Date().getMonth();calSelDate=_localDateStr(new Date());renderCal()">วันนี้</button>
          <button class="btn btn-ico" onclick="calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
      </div>
      <div class="card" style="padding:10px;">
        <div class="cal-grid" id="cal-grid">${gridHTML}</div>
        <div class="occ-legend">
          <span><span class="occ-dot" style="background:#9FE1CB;"></span>ต่ำ</span>
          <span><span class="occ-dot" style="background:var(--teal);"></span>ปานกลาง</span>
          <span><span class="occ-dot" style="background:var(--amber);"></span>สูง</span>
          <span><span class="occ-dot" style="background:var(--red);"></span>เต็ม</span>
          <span><span class="occ-dot" style="background:#fff0f0;border:1px solid #fca5a5;"></span>อาทิตย์ (+700฿)</span>
          <span><span class="occ-dot" style="background:#f3f0ff;border:1px solid #c4b5fd;"></span>วันหยุดนักขัตฤกษ์ (+700฿)</span>
        </div>
      </div>
    </div>
    <div id="cal-right"><div class="rpanel">กำลังโหลด...</div></div>
  </div>`;

  renderCalRight(dayMap);
  window._calDayMap = dayMap; // cache for right panel updates
}

function renderCalRight(dayMap) {
  dayMap = dayMap || window._calDayMap || {};
  const selTasks = dayMap[calSelDate] || [];
  const selHol   = isHol(calSelDate);
  const selHolN  = holName(calSelDate);
  const selDate  = fDateLong(calSelDate);

  let html = `<div class="rpanel">
    <div class="rpanel-head">
      <div class="rpanel-title">มุมมองรายวัน</div>
      <div class="rpanel-date">${selDate}</div>
    </div>
    <div class="rpanel-body">
      ${selHol && selHolN ? `<div class="al al-e">${selHolN} — วันหยุด</div>` : ''}
      ${can('createTask') ? `<div class="add-slot" onclick="openCreate(null,'${calSelDate}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> เพิ่มงานวันนี้</div>` : ''}`;

  if (!selTasks.length) {
    html += '<div class="rpanel-empty"><br>ไม่มีงานในวันนี้</div>';
  } else {
    const groups = {};
    selTasks.forEach(t => { const k = t.deptName||'other'; if(!groups[k])groups[k]=[]; groups[k].push(t); });

    Object.entries(groups).forEach(([dname, ts]) => {
      const d = dOfN(dname);
      html += `<div class="slot-section">
        <div class="slot-label" style="color:${d?.color||'#888'};">${d?.icon||''} ${dname}</div>
        ${ts.map(t => {
          const cost  = totalCost(t);
          const hd2   = hdDays(t).includes(calSelDate);
          const cardId = 'tc-'+t.id;
          const detId  = 'td-'+t.id;

          
          const members = taskMembersOn(t, calSelDate).map(code => {
            const emp = eOf(code);
            if (!emp) return null;
            const ini = ((emp.nickname||emp.name||'?').slice(0,2).toUpperCase());
            const col = d?.color||'#888';
            return { emp, ini, col };
          }).filter(Boolean);

          const avatarBar = members.length ? `<div style="display:flex;gap:-4px;margin-top:6px;flex-wrap:wrap;gap:4px;">
            ${members.map(m => `<div style="display:flex;align-items:center;gap:5px;background:var(--bg-2);border-radius:20px;padding:2px 8px 2px 3px;border:1px solid var(--line);">
              <div style="width:20px;height:20px;border-radius:50%;background:${m.col};color:#fff;display:flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:700;flex-shrink:0;overflow:hidden;">
                ${m.emp.photo
                  ? `<img src="${m.emp.photo}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextSibling.style.display='flex'">`
                    +`<span style="display:none;font-size:7.5px;font-weight:700;">${m.ini}</span>`
                  : m.ini}
              </div>
              <span style="font-size:10px;font-weight:600;color:var(--ink-2);white-space:nowrap;">${m.emp.nickname||m.emp.name}</span>
            </div>`).join('')}
          </div>` : '<div style="font-size:10px;color:var(--ink-3);margin-top:5px;">ยังไม่มีสมาชิก</div>';

          // ── Detail panel (hidden by default) ────────────────
          const dateStr = t.start === t.end || !t.end
            ? fDate(t.start)
            : fDate(t.start) + ' – ' + fDate(t.end);
          const detailPanel = `<div id="${detId}" style="max-height:0;overflow:hidden;transition:max-height .28s ease,opacity .25s ease;opacity:0;">
            <div style="border-top:1px solid var(--line-2);margin-top:8px;padding-top:10px;">
              <!-- Date & Team row -->
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
                <span style="display:inline-flex;align-items:center;gap:4px;background:var(--bg);border-radius:6px;padding:3px 8px;font-size:10px;color:var(--ink-2);border:1px solid var(--line);">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ${dateStr}
                </span>
                ${t.teamName ? `<span style="display:inline-flex;align-items:center;gap:4px;background:${d?.color||'#888'}15;color:${d?.color||'#888'};border-radius:6px;padding:3px 8px;font-size:10px;font-weight:600;border:1px solid ${d?.color||'#888'}25;">${t.teamName}</span>` : ''}
                ${t.province ? `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--bg);border-radius:6px;padding:3px 8px;font-size:10px;color:var(--ink-3);border:1px solid var(--line);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${t.province}</span>` : ''}
              </div>

              <!-- Members -->
              <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-3);margin-bottom:6px;">สมาชิก (${members.length} คน)</div>
              ${avatarBar}

              <!-- Cost + actions -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid var(--line-2);">
                <div>
                  ${cost > 0 ? `<div style="font-size:13px;font-weight:800;color:var(--red);font-family:'IBM Plex Mono',monospace;">${fMoney(cost)}</div><div style="font-size:9px;color:var(--ink-3);">ค่าพิเศษ</div>` : '<div style="font-size:10px;color:var(--ink-3);">ไม่มีค่าพิเศษ</div>'}
                </div>
                <button onclick="event.stopPropagation();openDetail(${t.id},'${calSelDate}')" style="background:${d?.color||'var(--teal)'};color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .1s;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                  ดูรายละเอียด →
                </button>
              </div>
            </div>
          </div>`;

          return `<div class="task-card" id="${cardId}" style="border-left-color:${d?.color||'#ccc'};cursor:pointer;" onclick="_tcToggle(${t.id})">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
              <div style="flex:1;min-width:0;">
                <div class="tc-id">TASK-${String(t.id).padStart(4,'0')}</div>
                <div class="tc-title">${escapeHtml(t.title)}</div>
                <div class="tc-meta">
                  <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${escapeHtml(t.site)}</span>
                  ${t.teamName ? `<span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> ${t.teamName}</span>` : ''}
                  ${hd2 ? `<span class="badge br" style="font-size:9px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> วันหยุด</span>` : ''}
                  ${t.otHours ? `<span class="badge ba" style="font-size:9px;">OT ${t.otHours}ชม.</span>` : ''}
                </div>
              </div>
              <!-- Quick member thumbs (collapsed) -->
              <div style="display:flex;flex-direction:row-reverse;flex-shrink:0;" id="tc-thumbs-${t.id}">
                ${members.slice(0,4).map((m,mi) => `<div title="${m.emp.name}" style="width:22px;height:22px;border-radius:50%;background:${m.col};color:#fff;display:flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:700;overflow:hidden;border:2px solid var(--surface);margin-left:${mi===0?'0':'-6px'};">
                  ${m.emp.photo
                    ? `<img src="${m.emp.photo}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
                    : m.ini}
                </div>`).reverse().join('')}
                ${members.length > 4 ? `<div style="width:22px;height:22px;border-radius:50%;background:var(--bg-2);color:var(--ink-3);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;border:2px solid var(--surface);margin-left:-6px;">+${members.length-4}</div>` : ''}
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:flex-end;margin-top:5px;">
              ${cost > 0 ? `<div class="tc-cost">${fMoney(cost)}</div>` : ''}
            </div>
            ${detailPanel}
          </div>`;
        }).join('')}
      </div>`;
    });
  }
  html += '</div></div>';
  const el = document.getElementById('cal-right');
  if (el) el.innerHTML = html;
}

// Toggle task card detail panel
var _tcExpanded = null;
function _tcToggle(taskId) {
  const detId  = 'td-' + taskId;
  const cardId = 'tc-' + taskId;
  const det  = document.getElementById(detId);
  const card = document.getElementById(cardId);
  if (!det) return;

  const isOpen = det.style.maxHeight && det.style.maxHeight !== '0px';
  
  if (_tcExpanded && _tcExpanded !== taskId) {
    const prev = document.getElementById('td-'+_tcExpanded);
    if (prev) { prev.style.maxHeight='0'; prev.style.opacity='0'; }
    const pc = document.getElementById('tc-'+_tcExpanded);
    if (pc) pc.style.background='';
  }
  if (isOpen) {
    det.style.maxHeight = '0';
    det.style.opacity   = '0';
    if (card) card.style.background = '';
    _tcExpanded = null;
  } else {
    det.style.maxHeight = '600px';
    det.style.opacity   = '1';
    if (card) card.style.background = 'var(--bg)';
    _tcExpanded = taskId;
    
    setTimeout(function() {
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }
}






let rpOff = 0;

var rpDateRange = null; 



var _wpickViewDate = null; 





var _wpickViewDate = null;   
var _wpickSelStart = null;   
var _wpickSelEnd   = null;   
var _wpickCaller   = 'planner'; 

function _wpickOpen(anchorEl) {
  
  _wpickCaller = (typeof _ganttView !== 'undefined' && document.getElementById('n-gantt') &&
    document.getElementById('n-gantt').classList.contains('active')) ? 'gantt' : 'planner';
  if (document.getElementById('wpick-popup')) { _wpickClose(); return; }

  
  var today = new Date();
  var curMon = new Date(today);
  curMon.setDate(today.getDate() - ((today.getDay()+6)%7) + rpOff * 7);
  var curSun = new Date(curMon); curSun.setDate(curMon.getDate() + 6);
  _wpickSelStart = _localDateStr(curMon);
  _wpickSelEnd   = _localDateStr(curSun);
  
  _wpickViewDate = new Date(curMon.getFullYear(), curMon.getMonth(), 1);

  var ov = document.createElement('div');
  ov.className = 'wpick-overlay'; ov.id = 'wpick-overlay';
  ov.onclick = _wpickClose;
  document.body.appendChild(ov);

  var pop = document.createElement('div');
  pop.className = 'wpick-popup'; pop.id = 'wpick-popup';
  pop.onclick = function(ev) { ev.stopPropagation(); };
  document.body.appendChild(pop);

  
  var rect = anchorEl.getBoundingClientRect();
  var pw = 690;
  var left = Math.max(8, Math.min(rect.left + rect.width/2 - pw/2, window.innerWidth - pw - 8));
  var top  = rect.bottom + 6;
  if (top + 420 > window.innerHeight) top = rect.top - 420 - 6;
  pop.style.left = left + 'px';
  pop.style.top  = top + 'px';
  pop.style.width = pw + 'px';

  _wpickRender();
}

function _wpickClose() {
  ['wpick-overlay','wpick-popup'].forEach(function(id){
    var el = document.getElementById(id); if (el) el.remove();
  });
}

function _wpickRender() {
  var pop = document.getElementById('wpick-popup');
  if (!pop) return;

  var today    = new Date();
  var todayStr = _localDateStr(today);
  var MONTHS   = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  var DOW      = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  
  var shortcuts = [
    { lbl:'Today',       fn:'_wpickShortcut(0)' },
    { lbl:'Yesterday',   fn:'_wpickShortcut(1)' },
    { lbl:'This week',   fn:'_wpickShortcut(2)' },
    { lbl:'This month',  fn:'_wpickShortcut(3)' },
    { lbl:'Last month',  fn:'_wpickShortcut(4)' },
    { lbl:'2 months ago',fn:'_wpickShortcut(5)' },
  ];
  var scHtml = shortcuts.map(function(s){
    return '<button class="wpick-sc-btn" onclick="'+s.fn+'">'+s.lbl+'</button>';
  }).join('');

  
  function buildCal(year, month, showPrev, showNext) {
    var label = MONTHS[month] + ' ' + (year + 543);
    var firstDow = new Date(year, month, 1).getDay(); 
    var daysInMonth = new Date(year, month+1, 0).getDate();
    var prevDays = new Date(year, month, 0).getDate();

    var dowHtml = DOW.map(function(d){ return '<div class="wpick-dow">'+d+'</div>'; }).join('');
    var cells = '';

    
    for (var pi = firstDow - 1; pi >= 0; pi--) {
      cells += '<div class="wpick-day other-month">'+(prevDays-pi)+'</div>';
    }
    
    for (var d = 1; d <= daysInMonth; d++) {
      var ds = _localDateStr(new Date(year, month, d));
      var cls = 'wpick-day';
      if (ds === todayStr) cls += ' is-today';
      if (_wpickSelStart && _wpickSelEnd) {
        if (ds === _wpickSelStart && ds === _wpickSelEnd) cls += ' range-start range-end';
        else if (ds === _wpickSelStart) cls += ' range-start';
        else if (ds === _wpickSelEnd)   cls += ' range-end';
        else if (ds > _wpickSelStart && ds < _wpickSelEnd) cls += ' in-range';
      } else if (_wpickSelStart && ds === _wpickSelStart) {
        cls += ' range-start range-end';
      }
      cells += '<div class="'+cls+'" onclick="_wpickClickDay(\''+ds+'\')">'+d+'</div>';
    }
    
    var total = firstDow + daysInMonth;
    var remain = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (var ni = 1; ni <= remain; ni++) {
      cells += '<div class="wpick-day other-month">'+ni+'</div>';
    }

    var prevBtn = showPrev
      ? '<button class="wpick-nav" onclick="_wpickNavMonth(-1)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>'
      : '<button class="wpick-nav hidden"></button>';
    var nextBtn = showNext
      ? '<button class="wpick-nav" onclick="_wpickNavMonth(1)"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>'
      : '<button class="wpick-nav hidden"></button>';

    return '<div class="wpick-cal">'+
      '<div class="wpick-header">'+prevBtn+'<span class="wpick-month-label">'+label+'</span>'+nextBtn+'</div>'+
      '<div class="wpick-grid">'+dowHtml+cells+'</div>'+
    '</div>';
  }

  var ly = _wpickViewDate.getFullYear(), lm = _wpickViewDate.getMonth();
  var ry = lm === 11 ? ly+1 : ly, rm = lm === 11 ? 0 : lm+1;

  pop.innerHTML =
    '<div style="display:flex;">' +
      '<div class="wpick-shortcuts">'+scHtml+'</div>' +
      '<div style="display:flex;flex-direction:column;flex:1;">' +
        '<div class="wpick-body"><div class="wpick-calendars">'+
          buildCal(ly, lm, true, false) +
          buildCal(ry, rm, false, true) +
        '</div></div>' +
        '<div class="wpick-footer">' +
          '<div class="wpick-inputs">' +
            '<input type="date" class="wpick-input" id="wpick-from" value="'+(_wpickSelStart||'')+'" onchange="_wpickInputChange()">' +
            '<span class="wpick-input-sep">—</span>' +
            '<input type="date" class="wpick-input" id="wpick-to" value="'+(_wpickSelEnd||'')+'" onchange="_wpickInputChange()">' +
          '</div>' +
          '<div class="wpick-footer-btns">' +
            '<button class="wpick-btn-cancel" onclick="_wpickClose()">Cancel</button>' +
            '<button class="wpick-btn-apply" onclick="_wpickApply()">Apply</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function _wpickNavMonth(dir) {
  _wpickViewDate.setMonth(_wpickViewDate.getMonth() + dir);
  _wpickRender();
}

function _wpickClickDay(ds) {
  if (!_wpickSelStart || (_wpickSelStart && _wpickSelEnd)) {
    
    _wpickSelStart = ds; _wpickSelEnd = null;
  } else {
    
    if (ds < _wpickSelStart) { _wpickSelEnd = _wpickSelStart; _wpickSelStart = ds; }
    else { _wpickSelEnd = ds; }
  }
  _wpickRender();
}

function _wpickShortcut(idx) {
  var today = new Date();
  var y = today.getFullYear(), m = today.getMonth();
  var s, e;
  if (idx === 0) { 
    s = e = _localDateStr(today);
  } else if (idx === 1) { 
    var yd = new Date(today); yd.setDate(today.getDate()-1);
    s = e = _localDateStr(yd);
  } else if (idx === 2) { 
    var mon = new Date(today); mon.setDate(today.getDate()-((today.getDay()+6)%7));
    var sun = new Date(mon); sun.setDate(mon.getDate()+6);
    s = _localDateStr(mon); e = _localDateStr(sun);
  } else if (idx === 3) { 
    s = _localDateStr(new Date(y, m, 1));
    e = _localDateStr(new Date(y, m+1, 0));
  } else if (idx === 4) { 
    s = _localDateStr(new Date(y, m-1, 1));
    e = _localDateStr(new Date(y, m, 0));
  } else if (idx === 5) { 
    s = _localDateStr(new Date(y, m-2, 1));
    e = _localDateStr(new Date(y, m-1, 0));
  }
  _wpickSelStart = s; _wpickSelEnd = e;
  
  var sp = s.split('-');
  _wpickViewDate = new Date(parseInt(sp[0]), parseInt(sp[1])-1, 1);
  _wpickRender();
}

function _wpickInputChange() {
  var fEl = document.getElementById('wpick-from');
  var tEl = document.getElementById('wpick-to');
  var s = fEl && fEl.value ? fEl.value : null; 
  var e = tEl && tEl.value ? tEl.value : null;
  if (s) _wpickSelStart = s;
  if (e) _wpickSelEnd   = e;
  if (s && e && s <= e) _wpickRender();
}

function _wpickApply() {
  if (!_wpickSelStart) { _wpickClose(); return; }
  var end = _wpickSelEnd || _wpickSelStart;

  
  var s = new Date(_wpickSelStart + 'T00:00:00');
  var e = new Date(end + 'T00:00:00');
  var diffDays = Math.round((e - s) / 86400000) + 1;
  if (diffDays <= 7 && s.getDay() === 1) {
    rpDateRange = null;
    var today2 = new Date();
    var thisMon = new Date(today2);
    thisMon.setDate(today2.getDate() - ((today2.getDay()+6)%7));
    rpOff = Math.round((s - thisMon) / (7*86400000));
  } else {
    rpDateRange = { start: _wpickSelStart, end: end };
  }
  _wpickClose();
  renderPlanner();
}



function toggleMobileSidebar() {
  var sb = document.querySelector('.sb');
  var bd = document.getElementById('sb-backdrop');
  if (!sb) return;
  var open = sb.classList.toggle('mobile-open');
  if (bd) bd.classList.toggle('show', open);
}


function toggleSidebarCollapse() {
  var sb = document.querySelector('.sb');
  if (!sb) return;
  var collapsed = sb.classList.toggle('collapsed');
  try { localStorage.setItem('sb_collapsed', collapsed ? '1' : '0'); } catch(_){}
  _sbUpdateCollapseIcon(collapsed);
  if (collapsed) {
    
    _plannerOpen = false;
    var sub   = document.getElementById('n-planner-sub');
    var arrow = document.getElementById('n-planner-arrow');
    if (sub)   sub.style.display = 'none';
    if (arrow) arrow.style.transform = '';
  }
}
function _sbUpdateCollapseIcon(collapsed) {
  var icon = document.getElementById('sb-collapse-icon');
  if (!icon) return;
  icon.innerHTML = collapsed
    ? '<polyline points="9 18 15 12 9 6"></polyline>'
    : '<polyline points="15 18 9 12 15 6"></polyline>';
}
(function _sbRestoreCollapse() {
  var apply = function() {
    var sb = document.querySelector('.sb');
    if (!sb) return;
    var wasCollapsed = false;
    try { wasCollapsed = localStorage.getItem('sb_collapsed') === '1'; } catch(_){}
    if (wasCollapsed) sb.classList.add('collapsed');
    _sbUpdateCollapseIcon(wasCollapsed);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();

function togglePlannerMenu() {
  var sb = document.querySelector('.sb');
  if (sb && sb.classList.contains('collapsed') && window.innerWidth > 860) {
    
    
    openPlanner('all');
    return;
  }
  _plannerOpen = !_plannerOpen;
  var sub   = document.getElementById('n-planner-sub');
  var arrow = document.getElementById('n-planner-arrow');
  if (sub)   sub.style.display = _plannerOpen ? 'block' : 'none';
  if (arrow) arrow.style.transform = _plannerOpen ? 'rotate(90deg)' : '';
  if (_plannerOpen) {
    renderPlannerSidebar();
    
    document.querySelectorAll('.ni').forEach(function(el){ el.classList.remove('active'); });
    document.getElementById('n-planner').classList.add('active');
  }
}

function openPlanner(deptName) {
  _plannerDept = deptName || 'all';
  _plannerTeam = null;
  if (_plannerDept !== 'all') {
    if (!window._sidebarExpanded) window._sidebarExpanded = {};
    window._sidebarExpanded[_plannerDept] = true;
  }
  try { sessionStorage.setItem('plannerDept', _plannerDept); } catch(_){}
  document.querySelectorAll('.ni.ns').forEach(function(el){ el.classList.remove('active'); });
  var el = document.getElementById('n-planner-' + (deptName === 'all' ? 'all' : deptName.replace(/[^a-zA-Z0-9]/g,'_')));
  if (el) el.classList.add('active');
  document.getElementById('n-planner').classList.add('active');
  go('planner');
}

function renderPlannerSidebar() {
  var subEl = document.getElementById('n-planner-depts');
  if (!subEl) return;
  var DEPT_ORDER = ['LED','Digital Signage & Retail','Business Development'];
  var depts = vDepts().filter(function(d){ return DEPT_ORDER.indexOf(d.name) >= 0 || (DB.schedTeams && DB.schedTeams[d.name] && DB.schedTeams[d.name].length); });
  depts.sort(function(a,b){
    var ai = DEPT_ORDER.indexOf(a.name), bi = DEPT_ORDER.indexOf(b.name);
    if (ai<0 && bi<0) return a.name.localeCompare(b.name);
    if (ai<0) return 1; if (bi<0) return -1;
    return ai - bi;
  });

  if (!window._sidebarExpanded) window._sidebarExpanded = {};

  subEl.innerHTML = depts.map(function(d) {
    var safeId     = d.name.replace(/[^a-zA-Z0-9]/g,'_');
    var teams      = (DB.schedTeams && DB.schedTeams[d.name]) || [];
    var isDeptActive = _plannerDept === d.name;
    var isExpanded   = !!window._sidebarExpanded[d.name];
    var dname        = d.name.replace(/'/g,"\\'");

    var teamItems = '';
    if (isExpanded && teams.length) {
      teamItems = teams.map(function(tname) {
        var isTeamActive = isDeptActive && _plannerTeam === tname;
        var tnameEsc = tname.replace(/'/g,"\\'");
        return '<div class="ni ns'+(isTeamActive?' active':'')+'" onclick="openPlannerTeam(\''+dname+'\',\''+tnameEsc+'\')" style="padding-left:48px;min-height:34px;font-size:11px;display:flex;align-items:center;gap:8px;cursor:pointer;'+(isTeamActive?'color:'+d.color+';font-weight:700;':'color:var(--ink-3);')+'">' +
          '<span style="width:5px;height:5px;border-radius:50%;background:'+d.color+';opacity:'+(isTeamActive?'1':'.5')+';flex-shrink:0;display:inline-block;"></span>' +
          tname +
        '</div>';
      }).join('');
    }

    var arrowBtn = teams.length
      ? '<div onclick="event.stopPropagation();_toggleSidebarDept(\''+dname+'\')" style="width:36px;min-height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .2s;transform:'+(isExpanded?'rotate(90deg)':'rotate(0deg)')+';opacity:.55;pointer-events:none;"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</div>'
      : '<div style="width:36px;"></div>';

    var badge = teams.length
      ? '<span style="background:rgba(255,255,255,.12);border-radius:10px;padding:1px 6px;font-size:9px;flex-shrink:0;">'+teams.length+'</span>'
      : '';

    return '<div>' +
      '<div class="ni ns'+(isDeptActive&&!_plannerTeam?' active':'')+'" id="n-planner-'+safeId+'" style="padding:0;min-height:36px;display:flex;align-items:stretch;">' +
        '<div onclick="openPlanner(\''+dname+'\')" style="display:flex;align-items:center;gap:6px;flex:1;cursor:pointer;padding:0 6px 0 32px;font-size:11px;min-width:0;">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:'+d.color+';flex-shrink:0;display:inline-block;"></span>' +
          '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+d.name+'</span>' +
          badge +
        '</div>' +
        arrowBtn +
      '</div>' +
      (isExpanded && teams.length ? teamItems : '') +
    '</div>';
  }).join('');
}

function _toggleSidebarDept(deptName) {
  if (!window._sidebarExpanded) window._sidebarExpanded = {};
  var isExpanded = !!window._sidebarExpanded[deptName];
  window._sidebarExpanded[deptName] = !isExpanded;
  
  if (isExpanded && _plannerDept === deptName) {
    _plannerTeam = null;
  }
  renderPlannerSidebar();
}

function openPlannerTeam(deptName, teamName) {
  _plannerDept = deptName;
  _plannerTeam = teamName;
  try { sessionStorage.setItem('plannerDept', _plannerDept); } catch(_){}
  document.getElementById('n-planner').classList.add('active');
  go('planner');
}

function pgPlanner() {
  
  _plannerOpen = true;
  var sub   = document.getElementById('n-planner-sub');
  var arrow = document.getElementById('n-planner-arrow');
  if (sub)   sub.style.display = 'block';
  if (arrow) arrow.style.transform = 'rotate(90deg)';
  renderPlannerSidebar();
  if (can('createTask'))
    document.getElementById('tb-actions').innerHTML = '<button class="btn btn-p" onclick="openCreate()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> เพิ่มงาน</button>';
  renderPlanner();
}


if (!window._rpExtraRows) window._rpExtraRows = {};







function _rlEnsurePersonColsLoaded() {
  if (!window._rlPersonCols || typeof window._rlPersonCols !== 'object') {
    try {
      var savedCols = JSON.parse(sessionStorage.getItem('rlPersonColsV2')||'{}');
      window._rlPersonCols = (savedCols && typeof savedCols === 'object') ? savedCols : {};
    } catch(_){ window._rlPersonCols = {}; }
  }
}
function _rlColsFor(rowKey) {
  _rlEnsurePersonColsLoaded();
  return window._rlPersonCols[rowKey] || 5;
}



function renderPlannerTeamList() {
  var today    = new Date();
  var dates    = [];
  if (rpDateRange) {
    var cur = new Date(rpDateRange.start + 'T00:00:00');
    var end = new Date(rpDateRange.end   + 'T00:00:00');
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
  } else {
    var mon = new Date(today);
    mon.setDate(today.getDate() - today.getDay() + 1 + rpOff * 7);
    for (var i = 0; i < 7; i++) { var dd = new Date(mon); dd.setDate(mon.getDate()+i); dates.push(dd); }
  }
  var dateStrs = dates.map(function(d){ return _localDateStr(d); });
  var s = dates[0].toLocaleDateString('th-TH',{day:'numeric',month:'short'});
  var e = dates[dates.length-1].toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'});

  var tasks = vTasks();
  var depts = vDepts();
  var emps  = DB.employees || [];
  var myDept = _myDept();

  
  
  var busyMap = {}; 
  tasks.forEach(function(t) {
    var ts = _normDateStr(t.start), te = _normDateStr(t.end||t.start);
    dateStrs.forEach(function(ds){
      if (ds >= ts && ds <= te) {
        var mems = taskMembersOn(t, ds).concat(t.borrowedMembers||[]);
        mems.forEach(function(code){ busyMap[code+'::'+ds] = true; });
      }
    });
  });

  
  var svgList = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
  var svgGrid = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
  var svgTeam = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

  var titleEl = document.getElementById('pg-title');
  if (titleEl) titleEl.textContent = 'รายชื่อทีม';

  
  var deptMap = {}; 
  emps.forEach(function(emp) {
    var dn = emp.dept || 'ไม่ระบุแผนก';
    var tn = emp.team || 'ไม่ระบุทีม';
    if (!deptMap[dn]) deptMap[dn] = {};
    if (!deptMap[dn][tn]) deptMap[dn][tn] = [];
    deptMap[dn][tn].push(emp);
  });

  
  var DOW_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];

  
  var deptOrder = depts.map(function(d){ return d.name; });
  
  Object.keys(deptMap).forEach(function(dn){ if (deptOrder.indexOf(dn)<0) deptOrder.push(dn); });

  var sections = '';
  deptOrder.forEach(function(deptName) {
    if (!deptMap[deptName]) return;
    
    if (_plannerDept !== 'all' && deptName !== _plannerDept) return;

    var deptObj  = depts.find(function(d){ return d.name===deptName; }) || {};
    var deptColor = deptObj.color || 'var(--teal)';
    var teamMap  = deptMap[deptName];
    var teamOrder = Object.keys(teamMap).sort();

    var teamBlocks = '';
    teamOrder.forEach(function(teamName) {
      if (_plannerTeam && teamName !== _plannerTeam) return;
      var members = teamMap[teamName];

      
      var memberRows = '';
      members.forEach(function(emp) {
        var ini = (emp.nickname||emp.name||'?').slice(0,2).toUpperCase();
        var ph  = emp.photo
          ? '<img src="'+emp.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">'
          : '<span style="font-size:9px;font-weight:700;color:#fff;">'+ini+'</span>';

        
        var dateCells = '';
        var freeCount = 0;
        dateStrs.forEach(function(ds) {
          var isBusy = busyMap[emp.code+'::'+ds];
          var dow    = new Date(ds+'T00:00:00').getDay();
          var isWknd = dow===0||dow===6;
          var attData  = DB.attendance && DB.attendance[emp.code+'::'+ds];
          var attTime  = (attData && _rlShowAttTime) ? (attData.time||attData) : null;
          var attLoc   = attData && attData.loc ? attData.loc : '';
          var attColor = attLoc==='Pushmedia'?'#16A34A':attLoc==='นอกพื้นที่'?'#D97706':'#DC2626';

          var cellBg = isWknd ? 'background:#fafafa;' : '';
          if (isBusy) {
            dateCells += '<td style="text-align:center;padding:6px 4px;'+cellBg+'">' +
              '<span style="font-size:9px;font-weight:700;color:#DC2626;background:#fff0f0;border:1px solid #fca5a5;border-radius:4px;padding:2px 6px;display:inline-block;">ไม่ว่าง</span>' +
              (attTime?'<br><span style="font-size:8px;font-weight:700;color:'+attColor+';">'+attTime+'</span>':'') +
              '</td>';
          } else {
            
            var leaveKey  = emp.code + '::' + ds;
            var leaveData = DB.leaves && DB.leaves[leaveKey];
            if (leaveData) {
              
              var leaveLabel = leaveData.type || 'ลา';
              var leaveShort = leaveLabel === 'ลาป่วย' ? 'ป่วย' : leaveLabel === 'ลาพักร้อน' ? 'พักร้อน' : leaveLabel === 'ลากิจ' ? 'กิจ' : 'ลา';
              dateCells += '<td style="text-align:center;padding:6px 4px;'+cellBg+'">' +
                '<span style="font-size:9px;font-weight:700;color:#7c3aed;background:#ede9fe;border:1px solid #c4b5fd;border-radius:4px;padding:2px 6px;display:inline-block;">ลา '+leaveShort+'</span>' +
                (attTime?'<br><span style="font-size:8px;font-weight:700;color:'+attColor+';">'+attTime+'</span>':'') +
                '</td>';
              freeCount--; 
            } else {
              freeCount++;
              dateCells += '<td style="text-align:center;padding:6px 4px;'+cellBg+'">' +
                '<span style="font-size:9px;font-weight:700;color:#16A34A;background:#f0fdf4;border:1px solid #86efac;border-radius:4px;padding:2px 6px;display:inline-block;">ว่าง</span>' +
                (attTime?'<br><span style="font-size:8px;font-weight:700;color:'+attColor+';">'+attTime+'</span>':'') +
                '</td>';
            }
          }
        });

        memberRows +=
          '<tr style="border-bottom:1px solid var(--line-2);">' +
            '<td style="padding:8px 12px;min-width:160px;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<div style="width:32px;height:32px;min-width:32px;border-radius:50%;background:'+deptColor+';overflow:hidden;display:flex;align-items:center;justify-content:center;">'+ph+'</div>' +
                '<div>' +
                  '<div style="font-size:12px;font-weight:700;color:var(--ink);">'+(emp.nickname||emp.name)+'</div>' +
                  '<div style="font-size:9px;color:var(--ink-3);">'+(emp.position||'')+'</div>' +
                '</div>' +
              '</div>' +
            '</td>' +
            dateCells +
            '<td style="text-align:center;padding:6px 8px;">' +
              '<span style="font-size:10px;font-weight:700;color:'+(freeCount>0?'#16A34A':'#DC2626')+';">'+freeCount+'/'+dateStrs.length+'</span>' +
              '<div style="font-size:8px;color:var(--ink-3);">วันว่าง</div>' +
            '</td>' +
          '</tr>';
      });

      
      var thCells = dateStrs.map(function(ds) {
        var d   = new Date(ds+'T00:00:00');
        var dow = d.getDay();
        var isWknd = dow===0||dow===6;
        var isTod  = ds===_localDateStr(today);
        return '<th style="text-align:center;padding:6px 4px;font-size:10px;font-weight:600;color:'+(isTod?'var(--teal)':isWknd?'var(--ink-3)':'var(--ink-2)')+';white-space:nowrap;min-width:70px;border-bottom:2px solid var(--line);">'+
          DOW_TH[dow]+'<br><span style="font-size:9px;font-weight:'+(isTod?'800':'500')+';">'+d.getDate()+'</span>'+
        '</th>';
      }).join('');

      teamBlocks +=
        '<div style="margin-bottom:16px;">' +
          '<div style="font-size:11px;font-weight:700;color:'+deptColor+';padding:8px 12px;background:'+deptColor+'18;border-left:3px solid '+deptColor+';border-radius:0 6px 6px 0;margin-bottom:0;">'+teamName+'</div>' +
          '<div style="overflow-x:auto;">' +
            '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
              '<thead><tr>' +
                '<th style="text-align:left;padding:6px 12px;font-size:10px;font-weight:600;color:var(--ink-3);border-bottom:2px solid var(--line);min-width:160px;">พนักงาน</th>' +
                thCells +
                '<th style="text-align:center;padding:6px 8px;font-size:10px;font-weight:600;color:var(--ink-3);border-bottom:2px solid var(--line);white-space:nowrap;min-width:55px;">สรุป</th>' +
              '</tr></thead>' +
              '<tbody>'+memberRows+'</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    });

    if (teamBlocks) {
      sections +=
        '<div style="margin-bottom:24px;">' +
          '<div style="font-size:13px;font-weight:800;color:'+deptColor+';padding:10px 16px;border-left:4px solid '+deptColor+';background:'+deptColor+'10;border-radius:0 8px 8px 0;margin-bottom:12px;">'+deptName+'</div>' +
          teamBlocks +
        '</div>';
    }
  });

  var btnHtml =
    '<div style="display:flex;gap:4px;">' +
      '<button class="rp-view-btn'+(_plannerView==='list'?' active':'')+'" onclick="_plannerView=\'list\';renderPlanner()">'+svgList+' รายการ</button>' +
      '<button class="rp-view-btn'+(_plannerView==='grid'?' active':'')+'" onclick="_plannerView=\'grid\';renderPlanner()">'+svgGrid+' ตาราง</button>' +
      '<button class="rp-view-btn'+(_plannerView==='team'?' active':'')+'" onclick="_plannerView=\'team\';renderPlanner()">'+svgTeam+' รายชื่อทีม</button>' +
      _attTimeToggleBtnHtml() +
    '</div>';

  document.getElementById('content').innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
      '<div style="display:flex;align-items:center;gap:5px;">' +
        '<button class="btn btn-ico" onclick="rpDateRange=null;rpOff--;renderPlanner()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' +
        '<span class="wpick-label" onclick="_wpickOpen(this)" title="คลิกเพื่อเลือกช่วงวันที่">'+s+' – '+e+'</span>' +
        '<button class="btn btn-ico" onclick="rpDateRange=null;rpOff++;renderPlanner()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
        '<button class="btn btn-sm" onclick="rpDateRange=null;rpOff=0;renderPlanner()">สัปดาห์นี้</button>' +
      '</div>' +
      btnHtml +
    '</div>' +
    '<div class="card" style="padding:16px;">' +
      (sections || '<div style="text-align:center;padding:40px;color:var(--ink-3);">ไม่พบข้อมูลพนักงาน</div>') +
    '</div>';
}

function renderPlanner() {
  if (_plannerView === 'list') { renderPlannerList(); return; }
  if (_plannerView === 'team') { renderPlannerTeamList(); return; }
  var today = new Date();
  var dates = [];
  if (rpDateRange) {
    var cur = new Date(rpDateRange.start + 'T00:00:00');
    var end = new Date(rpDateRange.end   + 'T00:00:00');
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
  } else {
    var mon = new Date(today);
    mon.setDate(today.getDate() - today.getDay() + 1 + rpOff * 7);
    for (var i = 0; i < 7; i++) { var d = new Date(mon); d.setDate(mon.getDate()+i); dates.push(d); }
  }
  var tasks = vTasks();
  var depts = vDepts();
  var DOW2  = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  var s = dates[0].toLocaleDateString('th-TH',{day:'numeric',month:'short'});
  var e = dates[dates.length-1].toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'});

  var DEFAULT_SCHED = {
    'LED'                     : ['LED','LED-A','LED-B','LED-C'],
    'Digital Signage & Retail': ['RI','Service','DS'],
    'Business Development'    : ['Push Logix'],
  };
  var SCHED_DEPTS = Object.keys(DEFAULT_SCHED);

  var showDepts = depts.filter(function(d) {
    if (_plannerDept !== 'all' && d.name !== _plannerDept) return false;
    var st = DB.schedTeams && DB.schedTeams[d.name];
    return (st && st.length) || SCHED_DEPTS.indexOf(d.name) >= 0;
  });

  var rows = '';
  showDepts.forEach(function(dept) {
    var allowed = (DB.schedTeams && DB.schedTeams[dept.name] && DB.schedTeams[dept.name].length)
                  ? DB.schedTeams[dept.name]
                  : (DEFAULT_SCHED[dept.name] || []);
    
    if (_plannerTeam) allowed = allowed.filter(function(t){ return t === _plannerTeam; });
    if (!allowed.length) return;

    rows += '<tr class="rp-dh"><td colspan="'+(dates.length+1)+'" style="color:'+dept.color+';border-left:3px solid '+dept.color+';">'+dept.name+'</td></tr>';

    allowed.forEach(function(tname) {
      var rowKey = dept.name + '::' + tname;

      
      var dayRowCounts = {}, dayTasksMap = {};
      dates.forEach(function(d) {
        var ds = _localDateStr(d);
        var dateKey = rowKey + '::' + ds;
        var dayExtra = (window._rpExtraRows && window._rpExtraRows[dateKey]) || 0;
        var dt = tasks.filter(function(t){
          var tn_ = (t.teamName||'').trim().toLowerCase();
          var dn_ = (t.deptName||'').trim().toLowerCase();
          var ts  = _normDateStr(t.start), te = _normDateStr(t.end||t.start);
          return tn_===tname.trim().toLowerCase() && dn_===dept.name.trim().toLowerCase() && ts<=ds && te>=ds;
        });
        dayTasksMap[ds]  = dt;
        dayRowCounts[ds] = Math.max(dt.length + dayExtra, 1);
      });

      
      var totalRows = 1;
      dates.forEach(function(d){ var n = dayRowCounts[_localDateStr(d)]; if(n > totalRows) totalRows = n; });

      var seenTaskIds = {}, totCost = 0;

      for (var rowIdx = 0; rowIdx < totalRows; rowIdx++) {
        var isFirst = (rowIdx === 0);
        var labelCell = '';
        if (isFirst) {
          labelCell = '<td class="tm" rowspan="'+totalRows+'">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-weight:700;color:var(--ink);white-space:nowrap;">'+tname+'</span>' +
              '<span style="font-size:9px;font-weight:700;background:'+dept.color+'20;color:'+dept.color+';border-radius:10px;padding:1px 6px;white-space:nowrap;">'+totalRows+'</span>' +
            '</div>' +
          '</td>';
        }

        rows += '<tr>' + labelCell;

        dates.forEach(function(d) {
          var ds       = _localDateStr(d);
          var dateKey  = rowKey + '::' + ds;
          var dayCount = dayRowCounts[ds]; 
          var dt       = dayTasksMap[ds];

          
          
          if (rowIdx >= dayCount) {
            return; 
          }

          var task = dt[rowIdx] || null;
          
          
          var cellRowspan = (rowIdx === dayCount - 1 && dayCount < totalRows)
            ? (totalRows - rowIdx)
            : 1;
          var rsAttr = cellRowspan > 1 ? ' rowspan="'+cellRowspan+'"' : '';

          if (task) {
            var d2 = dOfN(task.deptName);
            var isSunCell  = (d.getDay() === 0);
            var isNHolCell = DB.holidays.some(function(h){ return h.date===ds; });
            var accentColor = d2 ? d2.color : '#888';
            var bg = isSunCell ? '#ffeded' : (isNHolCell ? '#f0eeff' : accentColor+'1a');
            var tc = isSunCell ? '#c0392b' : (isNHolCell ? '#7C3AED' : accentColor);

            if (!seenTaskIds[task.id]) {
              seenTaskIds[task.id] = true;
              totCost += hdCost(task) + provinceCost(task);
            }

            var members = taskMembersOn(task, ds).map(eOf).filter(Boolean);
            var MAX_AV = 4;
            var avatarStack = members.slice(0, MAX_AV).map(function(emp) {
              var ini = (emp.nickname||emp.name||'?').slice(0,2).toUpperCase();
              var img = emp.photo
                ? '<img src="'+emp.photo+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">'
                  +'<span style="display:none;font-size:7px;font-weight:700;width:100%;height:100%;align-items:center;justify-content:center;">'+ini+'</span>'
                : '<span style="font-size:7px;font-weight:700;">'+ini+'</span>';
              return '<div class="rp-c-avatar" style="background:'+accentColor+';">'+img+'</div>';
            }).join('');
            if (members.length > MAX_AV) avatarStack += '<div class="rp-c-avatar" style="background:rgba(0,0,0,.15);color:'+tc+';font-size:7px;">+'+(members.length-MAX_AV)+'</div>';
            var nameStr = members.slice(0,2).map(function(e){ return e.nickname||e.name; }).join(', ');
            if (members.length > 2) nameStr += ' +' + (members.length-2);
            var shiftBadge = task.shift === 'night' ? '<span style="font-size:8px;background:rgba(124,58,237,.18);color:#7C3AED;border-radius:4px;padding:1px 4px;margin-left:3px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></span>' : '';

            rows += '<td'+rsAttr+' onclick="openDetail('+task.id+',\''+ds+'\')" style="cursor:pointer;padding:3px;">' +
              '<div class="rp-c" style="background:'+bg+';">' +
                '<div class="rp-c-title" style="color:'+tc+';">'+escapeHtml(task.title)+shiftBadge+'</div>' +
                (task.site ? '<div style="font-size:9px;color:'+tc+';opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escapeHtml(task.site)+'</div>' : '') +
                (members.length ? '<div class="rp-c-avatars">'+avatarStack+'<span class="rp-c-names" style="color:'+tc+';">'+nameStr+'</span></div>'
                                : '<div style="font-size:8.5px;color:'+tc+';opacity:.45;margin-top:2px;">— ยังไม่มีคน</div>') +
              '</div>' +
            '</td>';
          } else {
            var dow2    = d.getDay();
            var isSun2  = (dow2 === 0);
            var isNHol2 = DB.holidays.some(function(h){ return h.date===ds; });
            var cellBg  = isSun2 ? '#ffeded' : (isNHol2 ? '#f0eeff' : '');
            var emBorder = isSun2 ? '#fca5a5' : (isNHol2 ? '#c4b5fd' : 'var(--line)');
            var emColor  = isSun2 ? '#fca5a5' : (isNHol2 ? '#c4b5fd' : 'var(--line)');
            var dateKeyJs = dateKey.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
            var isLastRowForDay = (rowIdx === dayCount - 1);
            var addBtn = isLastRowForDay
              ? '<div onclick="event.stopPropagation();rpOpenRowMgr(\''+dateKeyJs+'\',\''+tname.replace(/'/g,"\\'")+'\',\''+dept.color+'\')" style="position:absolute;bottom:2px;right:2px;width:16px;height:16px;border-radius:50%;background:'+dept.color+'30;color:'+dept.color+';display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;font-weight:700;" title="เพิ่มแถววันนี้">+</div>'
              : '';
            rows += '<td'+rsAttr+' onclick="rpQuickAdd(\x27'+dept.name+'\x27,\x27'+tname+'\x27,\x27'+ds+'\x27)" style="cursor:pointer;padding:3px;position:relative;'+(cellBg?'background:'+cellBg+';':'')+'">'+
              '<div class="rp-empty" style="border-color:'+emBorder+';color:'+emColor+';">'+
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'+
              '</div>'+addBtn+'</td>';
          }
        }); 

        rows += '</tr>';
      } 

    }); 
  }); 

  
  var titleEl = document.getElementById('pg-title');
  if (titleEl) { titleEl.innerHTML=''; titleEl.textContent = _plannerDept==='all'?'ตารางงาน':(_plannerTeam?'ตารางงาน — '+_plannerTeam:'ตารางงาน — '+_plannerDept); }

  var svgGrid = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
  var svgList = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';

  var thCells = dates.map(function(d) {
    var ds      = _localDateStr(d);
    var dow     = d.getDay();
    var isToday = ds === _localDateStr(new Date());
    var isSun   = (dow === 0);
    var isNatHol = DB.holidays.some(function(h){ return h.date === ds; });
    var bg, textColor, borderBottom;
    if (isSun) { bg='#fff0f0'; textColor='var(--red)'; }
    else if (isNatHol) { bg='#f3f0ff'; textColor='#7C3AED'; }
    else { bg=''; textColor = isToday ? 'var(--teal)' : 'var(--ink)'; }
    borderBottom = isToday ? 'border-bottom:2px solid var(--teal);' : '';
    var holLabel = '';
    if (isNatHol) {
      var hname = DB.holidays.find(function(h){ return h.date===ds; });
      holLabel = '<div style="font-size:7.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56px;margin:0 auto;color:'+(isSun?'var(--red)':'#7C3AED')+';margin-top:1px;">'+(hname?hname.name.slice(0,8):'วันหยุด')+'</div>';
    } else if (isSun) {
      holLabel = '<div style="font-size:7.5px;color:var(--red);margin-top:1px;">วันอาทิตย์</div>';
    }
    return '<th style="'+(bg?'background:'+bg+';':'')+(isSun?'color:var(--red);':isNatHol?'color:#7C3AED;':'')+borderBottom+'">' +
      '<div style="font-size:9.5px;font-weight:600;">'+DOW2[dow]+'</div>' +
      '<div style="font-size:15px;font-weight:800;color:'+textColor+';">'+d.getDate()+'</div>' +
      holLabel +
    '</th>';
  }).join('');

  document.getElementById('content').innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
      '<div style="display:flex;align-items:center;gap:5px;">' +
        '<button class="btn btn-ico" onclick="rpDateRange=null;rpOff--;renderPlanner()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' +
        '<span class="wpick-label" onclick="_wpickOpen(this)" title="คลิกเพื่อเลือกสัปดาห์">'+s+' – '+e+'</span>' +
        '<button class="btn btn-ico" onclick="rpDateRange=null;rpOff++;renderPlanner()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
        '<button class="btn btn-sm" onclick="rpDateRange=null;rpOff=0;renderPlanner()">สัปดาห์นี้</button>' +
      '</div>' +
      '<div style="display:flex;gap:4px;">' +
        '<button class="rp-view-btn'+(_plannerView==='list'?' active':'')+'" onclick="_plannerView=\'list\';renderPlanner()">'+svgList+' รายการ</button>' +
        '<button class="rp-view-btn'+(_plannerView==='grid'?' active':'')+'" onclick="_plannerView=\'grid\';renderPlanner()">'+svgGrid+' ตาราง</button>' +
        '<button class="rp-view-btn'+(_plannerView==='team'?' active':'')+'" onclick="_plannerView=\'team\';renderPlanner()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> รายชื่อทีม</button>' +
        _attTimeToggleBtnHtml() +
      '</div>' +
      '<div style="margin-left:auto;display:flex;gap:10px;font-size:10px;align-items:center;color:var(--ink-3);">' +
        '<span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#fff0f0;border:1.5px solid #fca5a5;margin-right:4px;vertical-align:middle;"></span>อาทิตย์ (+700฿)</span>' +
        '<span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#f3f0ff;border:1.5px solid #c4b5fd;margin-right:4px;vertical-align:middle;"></span>วันหยุด (+700฿)</span>' +
      '</div>' +
    '</div>' +
    '<div class="card" style="padding:0;overflow:hidden;">' +
      '<div class="rp-wrap"><table class="rp">' +
        '<thead><tr><th class="tc2">ทีม</th>'+thCells+'</tr></thead>' +
        '<tbody>'+(rows||'<tr><td colspan="'+(dates.length+1)+'" style="text-align:center;padding:32px;color:var(--ink-3);">ยังไม่มีงานในสัปดาห์นี้</td></tr>')+'</tbody>' +
      '</table></div>' +
    '</div>';
}




try { window._rpExtraRows = JSON.parse(sessionStorage.getItem('rpExtraRows')||'{}'); } catch(_){ window._rpExtraRows = {}; }


var _plannerView = 'list';


var _rlShowAttTime = true;
try { var _savedAtt = localStorage.getItem('rl_show_att_time'); if (_savedAtt !== null) _rlShowAttTime = _savedAtt === '1'; } catch(_){}
function _rlToggleAttTime() {
  _rlShowAttTime = !_rlShowAttTime;
  try { localStorage.setItem('rl_show_att_time', _rlShowAttTime ? '1' : '0'); } catch(_){}
  renderPlanner();
}
function _attTimeToggleBtnHtml() {
  return '<button class="rp-view-btn' + (_rlShowAttTime ? ' active' : '') + '" onclick="_rlToggleAttTime()" title="แสดง/ซ่อนเวลาเข้างานข้างชื่อ">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
    ' เวลาเข้างาน' +
  '</button>';
}


function renderPlannerList() {
  var today = new Date();
  var dates = [];
  if (rpDateRange) {
    
    var cur = new Date(rpDateRange.start + 'T00:00:00');
    var end = new Date(rpDateRange.end   + 'T00:00:00');
    while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate()+1); }
  } else {
    var mon = new Date(today);
    mon.setDate(today.getDate() - today.getDay() + 1 + rpOff * 7);
    for (var i = 0; i < 7; i++) { var dd = new Date(mon); dd.setDate(mon.getDate()+i); dates.push(dd); }
  }
  var tasks  = vTasks();
  var depts  = vDepts();
  var DOW_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  var s = dates[0].toLocaleDateString('th-TH',{day:'numeric',month:'short'});
  var e = dates[dates.length-1].toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'});

  
  
  var _rpCostGrants = _rpComputeCostGrants(tasks, dates.map(function(d){ return _localDateStr(d); }));

  
  
  var _attDateFrom = _localDateStr(dates[0]);
  var _attDateTo   = _localDateStr(dates[dates.length - 1]);
  var _weekMonth   = _attDateFrom.slice(0, 7); 

  if (DB._attMonth !== _weekMonth) {
    
    var _cachedAtt = null, _cachedLv = null;
    try {
      var _ca = sessionStorage.getItem('att_month_' + _weekMonth);
      var _cl = sessionStorage.getItem('lv_month_'  + _weekMonth);
      if (_ca) _cachedAtt = JSON.parse(_ca);
      if (_cl) _cachedLv  = JSON.parse(_cl);
    } catch(_) {}

    if (_cachedAtt) {
      DB.attendance = _cachedAtt;
      DB.leaves     = _cachedLv || {};
      DB._attMonth  = _weekMonth;
    } else {
      
      var _fm = _weekMonth + '-01';
      var _fp = _weekMonth.split('-');
      var _ld = new Date(parseInt(_fp[0]), parseInt(_fp[1]), 0).getDate();
      var _tm = _weekMonth + '-' + String(_ld).padStart(2,'0');
      DB._attMonth = _weekMonth; 
      Promise.all([
        apiGet('attendance', { dateFrom: _fm, dateTo: _tm }),
        apiGet('leaves',     { dateFrom: _fm, dateTo: _tm })
      ]).then(function(res) {
        if (res[0] && !res[0].error) {
          DB.attendance = res[0];
          try { sessionStorage.setItem('att_month_' + _weekMonth, JSON.stringify(res[0])); } catch(_){}
        }
        if (res[1] && !res[1].error) {
          DB.leaves = res[1];
          try { sessionStorage.setItem('lv_month_' + _weekMonth, JSON.stringify(res[1])); } catch(_){}
        }
        renderPlannerTeamList();
      }).catch(function(){});
    }
  }

  var DEFAULT_SCHED = {
    'LED'                     : ['LED','LED-A','LED-B','LED-C'],
    'Digital Signage & Retail': ['RI','Service','DS'],
    'Business Development'    : ['Push Logix'],
  };
  var showDepts = depts.filter(function(d) {
    if (_plannerDept !== 'all' && d.name !== _plannerDept) return false;
    var st = DB.schedTeams && DB.schedTeams[d.name];
    return (st && st.length) || DEFAULT_SCHED[d.name];
  });
  
  var _teamFilter = _plannerTeam || null;

  
  
  
  _rlEnsurePersonColsLoaded();

  
  
  
  
  var PERSON_CAP = 5;
  var MAXCOLS = PERSON_CAP;
  showDepts.forEach(function(dept) {
    var allowedForMax = (DB.schedTeams && DB.schedTeams[dept.name] && DB.schedTeams[dept.name].length)
                  ? DB.schedTeams[dept.name] : (DEFAULT_SCHED[dept.name] || []);
    if (_plannerTeam) allowedForMax = allowedForMax.filter(function(t){ return t === _plannerTeam; });
    allowedForMax.forEach(function(tname) {
      var rk = dept.name + '::' + tname;
      var c  = Math.min(PERSON_CAP, _rlColsFor(rk)); 
      if (c > MAXCOLS) MAXCOLS = c;
    });
  });

  var ROW_H = '62px'; 

  var svgGrid = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
  var svgList = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';

  
  function mkCell(content, style, onclick, title, rowspan) {
    return '<td '+(rowspan&&rowspan>1?'rowspan="'+rowspan+'" ':'')+'style="height:'+ROW_H+';'+style+'" '
      + (onclick ? 'onclick="'+onclick+'" ' : '')
      + (title  ? 'title="'+title+'" ' : '')
      + '>' + content + '</td>';
  }

  function personCell(taskId, slotIdx, emp, deptColor, deptName, tname, ds, taskObj, shiftBg) {
    var BASE = 'padding:0;cursor:pointer;'+(shiftBg||'');
    var INNER = 'display:flex;align-items:center;gap:7px;padding:6px 10px;height:100%;box-sizing:border-box;';
    if (emp) {
      
      
      var isBorrowed = taskObj && (taskObj.borrowedMembers||[]).indexOf(emp.code) >= 0 && !_empInTeam(emp, taskObj.deptName, taskObj.teamName);
      var ini = (emp.nickname||emp.name||'?').slice(0,2).toUpperCase();
      var ph  = emp.photo
        ? '<img src="'+emp.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">'
        : '<span style="font-size:10px;font-weight:700;">'+ini+'</span>';
      
      var bgCol = isBorrowed ? '#fff7ed' : ((CONFIG.positionColors && CONFIG.positionColors[emp.position]) || 'var(--surface)');
      var dot   = isBorrowed ? '<div style="position:absolute;bottom:-1px;right:-1px;width:14px;height:14px;background:#f97316;border-radius:50%;border:1.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:7px;color:#fff;font-weight:800;">ย</div>' : '';
      var badge = isBorrowed ? '<span style="font-size:8.5px;font-weight:700;background:#f97316;color:#fff;border-radius:3px;padding:1px 4px;white-space:nowrap;flex-shrink:0;">ยืม</span>' : '';

      
      var attKey  = emp.code + '::' + ds;
      var attData = DB.attendance && DB.attendance[attKey];
      var attTime = attData ? (attData.time || attData) : null;
      var attLoc  = attData && attData.loc ? attData.loc : '';
      
      var attColor = '#DC2626'; 
      if      (attLoc === 'Pushmedia')    attColor = '#16A34A'; 
      else if (attLoc === 'นอกพื้นที่')   attColor = '#D97706'; 
      else if (attLoc === 'Time Adjust')  attColor = '#DC2626'; 
      var attBadge = (attTime && _rlShowAttTime)
        ? '<span style="font-size:9.5px;font-weight:700;color:'+attColor+';white-space:nowrap;letter-spacing:.01em;">'+attTime+'</span>'
        : '';

      var inner = '<div style="'+INNER+'background:'+bgCol+';position:relative;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\''+bgCol+'\'">'
        + '<div style="position:relative;width:38px;height:38px;min-width:38px;flex-shrink:0;">'
          + '<div style="width:38px;height:38px;border-radius:50%;background:'+deptColor+';overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;">'+ph+'</div>'
          + dot
        + '</div>'
        + '<div style="min-width:0;overflow:hidden;">'
          + '<div style="display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden;">'
            + '<span style="font-size:13px;font-weight:800;color:var(--ink);overflow:hidden;text-overflow:ellipsis;">'+(emp.nickname||emp.name)+'</span>'
            + (attBadge ? attBadge : '')
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:4px;">'
            + '<div style="font-size:11px;font-weight:600;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(emp.position||'')+'</div>'
            + badge
          + '</div>'
        + '</div>'
        + '</div>';
      return mkCell(inner, BASE, '_rlPickPerson('+taskId+','+slotIdx+',event,\''+ds+'\')', 'เปลี่ยนคน');
    } else if (taskId) {
      var inner2 = '<div style="'+INNER+'background:var(--bg);justify-content:center;" onmouseover="this.style.background=\'var(--bg-2)\'" onmouseout="this.style.background=\'var(--bg)\'">'
        + '<span style="font-size:22px;font-weight:200;color:var(--line);">+</span>'
        + '</div>';
      return mkCell(inner2, BASE, '_rlPickPerson('+taskId+','+slotIdx+',event,\''+ds+'\')', 'เพิ่มพนักงาน');
    } else {
      var inner3 = '<div style="'+INNER+'background:var(--bg);justify-content:center;" onmouseover="this.style.background=\'var(--bg-2)\'" onmouseout="this.style.background=\'var(--bg)\'"></div>';
      var rkAct = deptName ? ("rpQuickAdd('" + deptName.replace(/'/g,"\\'") + "','" + tname.replace(/'/g,"\\'") + "','" + ds + "')") : '';
      return mkCell(inner3, 'padding:0;cursor:pointer;', rkAct, '');
    }
  }

  function emptySiteCell(deptName, tname, ds) {
    return mkCell(
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--line);font-size:11px;" onmouseover="this.style.color=\'var(--teal)\'" onmouseout="this.style.color=\'var(--line)\'">+ เพิ่มงาน</div>',
      'padding:0;cursor:pointer;background:var(--bg);',
      deptName ? 'rpQuickAdd(\''+deptName.replace(/'/g,"\\'")+'\',\''+tname.replace(/'/g,"\\'")+'\',\''+ds+'\')' : '',
      'คลิกเพื่อเพิ่มงาน'
    );
  }

  var sections = dates.map(function(d) {
    var ds      = _localDateStr(d);
    var dow     = d.getDay();
    var isSun   = (dow===0), isSat = (dow===6);
    var isToday = ds === _localDateStr(new Date());
    var natHol  = DB.holidays.find(function(h){ return h.date===ds; });
    var isHolDay= !!natHol;

    var dayBg    = isSun ? '#fff3f3' : (isSat ? '#fff8f3' : (isHolDay ? '#f3f0ff' : (isToday ? '#f0fbf8' : 'var(--bg)')));
    var dayColor = isSun ? '#c0392b' : (isSat ? '#d35400' : (isHolDay ? '#7C3AED' : (isToday ? 'var(--teal)' : 'var(--ink)')));
    var dayNum   = d.getDate();
    var dayDow   = DOW_TH[dow];
    var dayMon   = d.toLocaleDateString('th-TH',{month:'short',year:'2-digit'});

    var teamRows = [];
    showDepts.forEach(function(dept) {
      var allowed = (DB.schedTeams && DB.schedTeams[dept.name] && DB.schedTeams[dept.name].length)
                    ? DB.schedTeams[dept.name] : (DEFAULT_SCHED[dept.name] || []);
      
      if (_teamFilter) allowed = allowed.filter(function(t){ return t === _teamFilter; });
      if (!allowed.length) return;
      allowed.forEach(function(tname, ti) {
        var rowKey   = dept.name + '::' + tname;
        var dateKey  = rowKey + '::' + ds;
        var extraN   = (window._rpExtraRows && window._rpExtraRows[dateKey]) || 0;
        var dayTasks = tasks.filter(function(t) {
          var ts = _normDateStr(t.start), te = _normDateStr(t.end||t.start);
          return (t.teamName||'').trim().toLowerCase()===tname.trim().toLowerCase()
            && (t.deptName||'').trim().toLowerCase()===dept.name.trim().toLowerCase()
            && ts<=ds && te>=ds;
        }).sort(function(a,b){ return (a.sortIndex||0) - (b.sortIndex||0); });

        
        var PERSON_CAP = 5;
        var taskSubRows = dayTasks.map(function(t){
          var mCount = taskMembersOn(t, ds).length + (t.dailyWorkers||[]).length;
          return Math.max(1, Math.ceil(mCount / PERSON_CAP));
        });
        var totalTaskRows = taskSubRows.reduce(function(s,n){ return s+n; }, 0);

        
        var minRows  = 1 + extraN;
        var numRows  = Math.max(totalTaskRows, minRows);

        var flatIdx = 0;
        dayTasks.forEach(function(task, di) {
          var subCount = taskSubRows[di];
          for (var s=0; s<subCount; s++) {
            teamRows.push({
              dept            : dept,
              tname           : tname,
              rowKey          : rowKey,
              dateKey         : dateKey,
              extraN          : extraN,
              task            : task,
              subIdx          : s,          
              subCount        : subCount,    
              isFirstTaskInTeam: (flatIdx===0),
              taskCount       : numRows,
              isFirstInDept   : (ti===0 && flatIdx===0)
            });
            flatIdx++;
          }
        });
        
        for (; flatIdx<numRows; flatIdx++) {
          teamRows.push({
            dept            : dept,
            tname           : tname,
            rowKey          : rowKey,
            dateKey         : dateKey,
            extraN          : extraN,
            task            : null,
            subIdx          : 0,
            subCount        : 1,
            isFirstTaskInTeam: (flatIdx===0),
            taskCount       : numRows,
            isFirstInDept   : (ti===0 && flatIdx===0)
          });
        }
      });
    });

    
    var deptSpans = {}, deptSeen = {};
    teamRows.forEach(function(r){ deptSpans[r.dept.name]=(deptSpans[r.dept.name]||0)+1; });

    var totalRows = Math.max(teamRows.length,1);
    var dateRendered = false;
    var H = 'height:62px;';

    var rowsHTML = teamRows.map(function(r,rowIdx) {
      var ac = r.dept.color || '#888';
      var isFirstDay = (rowIdx===0);
      var _isNight  = r.task && r.task.shift === 'night';
      var _isDay    = r.task && r.task.shift === 'day';
      var _shiftBg  = _isNight ? 'background:#e8e8ee;' : _isDay ? 'background:#fef9e7;' : '';
      var _shiftCls = _isNight ? 'shift-night' : _isDay ? 'shift-day' : '';
      var _borderSt = isFirstDay ? 'border-top:3px solid '+dayColor+';' : '';
      var html = '<tr class="'+_shiftCls+'" style="'+_borderSt+(r.task?'cursor:pointer;':'')+'"' +
        (r.task ? ' onclick="openDetail('+r.task.id+',\''+ds+'\')"' : '') + '>';

      
      if (!dateRendered) {
        dateRendered = true;
        html += '<td rowspan="'+totalRows+'" style="'+H+'background:'+dayBg+';padding:8px 6px;vertical-align:top;border-right:3px solid '+dayColor+';border-top:3px solid '+dayColor+';text-align:center;">' +
          '<div style="width:50px;height:50px;border-radius:12px;background:'+dayColor+';color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 4px;">' +
            '<div style="font-size:22px;font-weight:800;line-height:1;">'+dayNum+'</div>' +
            '<div style="font-size:9px;font-weight:700;opacity:.9;">'+dayDow+'</div>' +
          '</div>' +
          '<div style="font-size:10.5px;color:'+dayColor+';font-weight:700;">'+dayMon+'</div>' +
          (natHol?'<div style="font-size:7.5px;color:#7C3AED;margin-top:2px;line-height:1.2;">'+natHol.name.slice(0,10)+'</div>':'') +
        '</td>';
      }

      
      var dn = r.dept.name;
      if (!deptSeen[dn]) {
        deptSeen[dn] = true;
        html += '<td rowspan="'+deptSpans[dn]+'" style="'+H+'padding:6px 10px;font-size:11px;font-weight:800;color:'+ac+';vertical-align:middle;background:'+ac+'0d;border-left:3px solid '+ac+';">'+r.dept.name+'</td>';
      }

      
      if (r.isFirstTaskInTeam) {
        var rkEsc = (r.dateKey||r.rowKey||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        var tnEsc = r.tname.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        var acEsc = (r.dept.color||'').replace(/'/g,"\\'");
        html += '<td rowspan="'+r.taskCount+'" style="'+H+'padding:6px 8px;font-size:11px;font-weight:700;color:'+r.dept.color+';vertical-align:middle;background:'+r.dept.color+'06;cursor:pointer;" onclick="event.stopPropagation();rpOpenRowMgr(\''+rkEsc+'\',\''+tnEsc+'\',\''+acEsc+'\')" title="คลิกเพื่อเพิ่มแถววันนี้">' +
          '<div style="display:flex;align-items:center;gap:5px;">' +
            r.tname +
            '<span style="font-size:8px;font-weight:700;background:'+r.dept.color+'20;color:'+r.dept.color+';border-radius:8px;padding:1px 5px;white-space:nowrap;">'+r.taskCount+'</span>' +
          '</div>' +
        '</td>';
      }

      if (!r.task) {
        
        var teamCols = Math.min(PERSON_CAP, _rlColsFor(r.rowKey));
        html += emptySiteCell(r.dept.name, r.tname, ds);
        var qAdd = "rpQuickAdd('" + r.dept.name.replace(/'/g,"\\'") + "','" + r.tname.replace(/'/g,"\\'") + "','" + ds + "')";
        html += mkCell('<div style="height:100%;display:flex;align-items:center;justify-content:center;" onmouseover="this.style.color=\'var(--teal)\'" onmouseout="this.style.color=\'var(--line)\'"><span style="color:var(--line);font-size:20px;">+</span></div>', 'padding:0;background:var(--bg);cursor:pointer;', qAdd, '');
        for (var pi=0; pi<MAXCOLS; pi++) {
          if (pi < teamCols) html += personCell(null, pi, null, ac, r.dept.name, r.tname, ds);
          else html += mkCell('', 'background:var(--bg-2);', '', ''); 
        }
        html += mkCell('', 'background:var(--bg);', '', '');
      } else {
        var t      = r.task;
        var borrowedCodes = (t.borrowedMembers||[]);
        
        
        
        
        var mems   = taskMembersOn(t, ds).map(eOf).filter(Boolean);
        var veh    = DB.vehicles.find(function(v){ return String(v.id)===String(t.vehicleId); });
        var costV  = _rpCostForDate(t, ds, _rpCostGrants);
        var isContinuation = r.subIdx > 0; 
        if (!isContinuation) {
        
        var shiftBadgeSite = t.shift === 'night' ? ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' : t.shift === 'day' ? ' <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>' : '';
        
        var canReorder = r.taskCount > 1 && canEditTask(t, 'planner');
        var dragHandle = canReorder
          ? '<span onmousedown="event.stopPropagation()" onclick="event.stopPropagation()" title="กดค้างแล้วลากเพื่อเลื่อนลำดับงาน" style="cursor:grab;color:var(--line);flex-shrink:0;display:flex;align-items:center;">'+
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>'+
            '</span>'
          : '';
        var dragAttrs = canReorder
          ? ' draggable="true" ondragstart="_rlDragStart(event,'+t.id+',\''+r.dateKey+'\')" ondragover="_rlDragOver(event,\''+r.dateKey+'\')" ondragleave="_rlDragLeave(event)" ondrop="_rlDrop(event,'+t.id+',\''+r.dateKey+'\')" ondragend="_rlDragEnd(event)"'
          : '';
        var siteRowspan = r.subCount > 1 ? ' rowspan="'+r.subCount+'"' : '';
        html += '<td'+siteRowspan+dragAttrs+' style="height:'+ROW_H+';padding:0;cursor:pointer;'+_shiftBg+'" onclick="openDetail('+t.id+',\''+ds+'\')" title="'+escapeHtml(t.title)+'">' +
          '<div style="padding:6px 10px;height:100%;display:flex;align-items:center;gap:6px;overflow:hidden;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\''+ (_shiftBg?(_isNight?'#e8e8ee':'#fef9e7'):'') +'\'">' +
            dragHandle +
            '<div style="min-width:0;flex:1;display:flex;flex-direction:column;justify-content:center;">' +
              '<div style="font-size:12px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escapeHtml(t.title)+shiftBadgeSite+(r.subCount>1?' <span style="font-size:9px;font-weight:700;color:var(--teal);">('+(mems.length+(t.dailyWorkers||[]).length)+' คน)</span>':'')+'</div>' +
              (t.site ? '<div style="font-size:10px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">'+escapeHtml(t.site)+'</div>' : '') +
            '</div>' +
          '</div>' +
        '</td>';
        
        var tVehIds = (t.vehicleIds && t.vehicleIds.length) ? t.vehicleIds : (t.vehicleId ? [String(t.vehicleId)] : []);
        var extraVehCount = tVehIds.length - 1;
        html += mkCell(
          '<div style="padding:6px 8px;font-size:12.5px;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\''+ (_isNight?'#e8e8ee':_isDay?'#fef9e7':'') +'\'">'+
            (veh
              ? '<span style="color:var(--ink-2);">'+vehIconSvg(veh.icon,17)+'</span><span style="color:var(--ink);font-weight:800;">'+veh.plate+(extraVehCount>0?' <span style="color:var(--teal);font-weight:800;">+'+extraVehCount+'</span>':'')+'</span>'
              : '<span style="color:var(--teal);">'+vehIconSvg('pickup',17)+'</span><span style="color:var(--teal);font-weight:700;">+ รถ</span>') +
          '</div>',
          'padding:0;cursor:pointer;'+_shiftBg, '_rlEditCar('+t.id+',event)', tVehIds.length>1 ? tVehIds.map(function(vid){var vv=DB.vehicles.find(function(x){return String(x.id)===String(vid);});return vv?vv.plate:vid;}).join(', ') : 'เลือกรถ',
          r.subCount
        );
        } 
        
        var daily = (t.dailyWorkers||[]);
        var combined = mems.concat(daily.map(function(dw){ return {__daily:true, dw:dw}; }));
        var sliceStart = r.subIdx * PERSON_CAP;
        var sliceRoster = combined.slice(sliceStart, sliceStart + PERSON_CAP);
        
        var isLastSubRow = (r.subIdx === r.subCount - 1);
        var addableCols  = isLastSubRow ? Math.min(PERSON_CAP, _rlColsFor(r.rowKey)) : sliceRoster.length;
        for (var pi2=0; pi2<MAXCOLS; pi2++) {
          if (pi2 >= sliceRoster.length) {
            if (pi2 < addableCols) {
              
              html += personCell(t.id, sliceStart+pi2, null, ac, r.dept.name, r.tname, ds, t, _shiftBg);
            } else {
              html += mkCell('', 'background:var(--bg-2);'+_shiftBg, '', '');
            }
            continue;
          }
          var slot = sliceRoster[pi2];
          var globalIdx = sliceStart + pi2; 
          if (slot && slot.__daily) {
            var dw = slot.dw;
            html += mkCell(
              '<div style="display:flex;align-items:center;gap:7px;padding:6px 10px;height:100%;box-sizing:border-box;background:var(--purple-bg);" onclick="_rlPickPerson('+t.id+','+globalIdx+',event,\''+ds+'\')">' +
                '<div style="width:38px;height:38px;min-width:38px;border-radius:50%;background:var(--purple);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0;">จ้าง</div>' +
                '<div style="min-width:0;overflow:hidden;">' +
                  '<div style="font-size:11px;font-weight:700;color:var(--purple);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(dw.name||'ไม่ระบุ')+'</div>' +
                  '<div style="font-size:9px;color:#5b21b6;">'+fMoney(dw.wage||0)+'</div>' +
                '</div>' +
              '</div>',
              'padding:0;cursor:pointer;', '_rlPickPerson('+t.id+','+globalIdx+',event,\''+ds+'\')', ''
            );
          } else {
            html += personCell(t.id, globalIdx, slot, ac, r.dept.name, r.tname, ds, t, _shiftBg);
          }
        }
        
        if (!isContinuation) {
        html += mkCell(
          '<div style="padding:6px 8px;text-align:right;height:100%;display:flex;align-items:center;justify-content:flex-end;">'+
            (costV ? '<span style="font-size:11px;font-weight:700;color:var(--red);font-family:\'IBM Plex Mono\',monospace;">'+fMoney(costV)+'</span>'
                   : '<span style="color:var(--ink-3);">—</span>') +
          '</div>',
          'padding:0;'+_shiftBg, '', 'ต้นทุนวันนี้ | รวมทั้งงาน '+fMoney(totalCost(t)),
          r.subCount
        );
        }
      }
      html += '</tr>';
      return html;
    }).join('');

    if (!teamRows.length) {
      rowsHTML = '<tr style="border-top:3px solid '+dayColor+';">' +
        '<td style="background:'+dayBg+';padding:8px 6px;text-align:center;border-right:3px solid '+dayColor+';border-top:3px solid '+dayColor+';">' +
          '<div style="width:50px;height:50px;border-radius:12px;background:'+dayColor+';color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 4px;">' +
            '<div style="font-size:22px;font-weight:800;line-height:1;">'+dayNum+'</div>' +
            '<div style="font-size:9px;opacity:.9;">'+dayDow+'</div></div>' +
          '<div style="font-size:10.5px;color:'+dayColor+';font-weight:700;">'+dayMon+'</div>' +
        '</td>' +
        '<td colspan="'+(3+MAXCOLS+2)+'" style="color:var(--ink-3);font-size:11px;font-style:italic;background:var(--bg);padding:12px;">ไม่มีงาน</td>' +
      '</tr>';
    }
    return rowsHTML;
  }).join('');

  
  
  var personTHs = '';
  for (var pi=0; pi<MAXCOLS; pi++) {
    personTHs += '<th style="width:150px;text-align:center;">คนที่ '+(pi+1)+'</th>';
  }

  var _rpListBtnHtml =
    '<div style="display:flex;gap:4px;">' +
      '<button class="rp-view-btn' + (_plannerView==='list' ? ' active' : '') + '" onclick="_plannerView=\'list\';renderPlanner()">' + svgList + ' รายการ</button>' +
      '<button class="rp-view-btn' + (_plannerView==='grid' ? ' active' : '') + '" onclick="_plannerView=\'grid\';renderPlanner()">' + svgGrid + ' ตาราง</button>' +
      '<button class="rp-view-btn' + (_plannerView==='team' ? ' active' : '') + '" onclick="_plannerView=\'team\';renderPlanner()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> รายชื่อทีม</button>' +
      _attTimeToggleBtnHtml() +
    '</div>';

  var titleEl = document.getElementById('pg-title');
  if (titleEl) { titleEl.innerHTML=''; titleEl.textContent = _plannerDept==='all'?'ตารางงาน':(_plannerTeam?'ตารางงาน — '+_plannerTeam:'ตารางงาน — '+_plannerDept); }

  document.getElementById('content').innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
      '<div style="display:flex;align-items:center;gap:5px;">' +
        '<button class="btn btn-ico" onclick="rpDateRange=null;rpOff--;renderPlanner()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' +
        '<span class="wpick-label" onclick="_wpickOpen(this)" title="คลิกเพื่อเลือกสัปดาห์">'+s+' – '+e+'</span>' +
        '<button class="btn btn-ico" onclick="rpDateRange=null;rpOff++;renderPlanner()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
        '<button class="btn btn-sm" onclick="rpDateRange=null;rpOff=0;renderPlanner()">สัปดาห์นี้</button>' +
      '</div>' +
      _rpListBtnHtml +
    '</div>' +
    '<div class="card" style="padding:0;overflow:hidden;">' +
      '<div style="overflow-x:auto;">' +
      '<table class="rp-list" style="width:100%;min-width:'+(84+110+75+220+90+80+150*MAXCOLS)+'px;table-layout:fixed;border-collapse:collapse;">' +
        '<colgroup>' +
          '<col style="width:84px;">' +    
          '<col style="width:110px;">' +   
          '<col style="width:75px;">' +    
          '<col style="width:220px;">' +   
          '<col style="width:90px;">' +    
          (function(){ var s=''; for(var i=0;i<MAXCOLS;i++) s+='<col style="width:150px;">'; return s; })() +  
          '<col style="width:80px;">' +    
        '</colgroup>' +
        '<thead><tr>' +
          '<th style="text-align:center;width:84px;">Date</th>' +
          '<th style="width:110px;">Dept</th>' +
          '<th style="width:75px;">Team</th>' +
          '<th style="width:220px;">Project / Site</th>' +
          '<th style="width:90px;">Car</th>' +
          personTHs +
          '<th style="width:80px;text-align:right;">Cost</th>' +
        '</tr></thead>' +
        '<tbody>' + sections + '</tbody>' +
      '</table>' +
      '</div>' +
    '</div>';
}


function _rlPickPerson(taskId, slotIdx, evt, ds) {
  evt.stopPropagation();
  var t = DB.tasks.find(function(x){ return x.id===taskId; });
  if (!t) return;
  if (!canEditTask(t, 'planner')) { denyAccess('คุณไม่มีสิทธิ์แก้ไขงานนี้'); return; }
  var dept  = dOfN(t.deptName);
  var color = dept ? dept.color : 'var(--teal)';

  
  var team = DB.teams.find(function(tm){ return tm.name===t.teamName && tm.deptName===t.deptName; });
  var teamEmpCodes = team ? (team.members||[]) : [];
  var teamEmps = DB.employees.filter(function(e){ return teamEmpCodes.indexOf(e.code)>=0; });
  if (!teamEmps.length) teamEmps = DB.employees.filter(function(e){ return e.dept===t.deptName; });

  
  var curMembers = taskMembersOn(t, ds);

  
  window._rlLeadCode = curMembers.length ? curMembers[0] : null; 
  var empList = _rlBuildTeamListHtml(taskId, slotIdx, ds, teamEmps, color, curMembers);

  
  var existingDaily = (t.dailyWorkers||[]);
  _rlDailyIdx = 0; 

  var _dsLabel = ds ? (function(){ try { return new Date(ds+'T00:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}); } catch(_) { return ds; } })() : '';

  openMd('<div class="md" style="max-width:400px;">' +
    '<div class="mh"><h3>เลือกพนักงาน — คนที่ '+(slotIdx+1)+(_dsLabel?' <span style="font-weight:400;color:var(--ink-3);font-size:12px;">('+_dsLabel+')</span>':'')+'</h3>' +
      '<button class="mc" onclick="closeMd()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
    '</div>' +
    '<div class="mb" style="padding:12px 14px;">' +
      '<div style="font-size:10.5px;color:var(--ink-3);margin:-2px 0 8px;">การแก้ไขนี้จะมีผลเฉพาะวันที่ '+(_dsLabel||ds)+' เท่านั้น ไม่กระทบวันอื่นของงานนี้</div>' +

      
      '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">' +
        '<div style="width:4px;height:14px;border-radius:2px;background:'+color+';flex-shrink:0;"></div>' +
        '<span style="font-size:11px;font-weight:700;color:var(--ink-2);">ผู้เข้างาน (ภายในทีม)</span>' +
      '</div>' +
      '<div id="rl-team-list" style="border:1px solid var(--line);border-radius:var(--r);overflow:hidden;margin-bottom:14px;max-height:220px;overflow-y:auto;">' +
        (empList || '<div style="padding:10px 12px;font-size:11px;color:var(--ink-3);">ไม่มีพนักงานในทีม</div>') +
      '</div>' +

      
      '<div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">' +
        '<div style="width:4px;height:14px;border-radius:2px;background:var(--amber);flex-shrink:0;"></div>' +
        '<span style="font-size:11px;font-weight:700;color:var(--ink-2);">จากทีมอื่น (ยืมตัว)</span>' +
      '</div>' +
      '<div style="position:relative;margin-bottom:6px;">' +
        '<input type="text" class="fc" id="rl-ext-q" placeholder="ค้นหาชื่อพนักงาน..." oninput="_rlSearchExt(this.value,'+taskId+','+slotIdx+')" style="padding-left:32px;font-size:12px;">' +
        '<svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--ink-3);pointer-events:none;" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
      '</div>' +
      '<div id="rl-ext-results" style="border:1px solid var(--line);border-radius:var(--r);overflow:hidden;margin-bottom:6px;display:none;max-height:150px;overflow-y:auto;"></div>' +
      '<div id="rl-ext-tags" style="display:flex;flex-wrap:wrap;gap:4px;min-height:4px;margin-bottom:14px;"></div>' +

      
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<div style="display:flex;align-items:center;gap:7px;">' +
          '<div style="width:4px;height:14px;border-radius:2px;background:var(--purple);flex-shrink:0;"></div>' +
          '<span style="font-size:11px;font-weight:700;color:var(--ink-2);">จ้างรายวัน</span>' +
        '</div>' +
        '<button type="button" onclick="_rlAddDaily('+taskId+')" style="display:flex;align-items:center;gap:3px;padding:3px 9px;border:1px solid var(--purple);border-radius:20px;background:var(--purple-bg);color:var(--purple);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> เพิ่ม' +
        '</button>' +
      '</div>' +
      '<div id="rl-daily-wrap" style="display:flex;flex-direction:column;gap:5px;">' +
        existingDaily.map(function(w,i){
          return _rlDailyRowHtml(taskId, i, w.name||'', w.days||1, w.wage||0);
        }).join('') +
      '</div>' +

    '</div>' +
    '<div class="mf">' +
      '<button class="btn" onclick="closeMd()">ปิด</button>' +
      '<button class="btn btn-p" onclick="_rlSaveAll('+taskId+','+slotIdx+',\''+ds+'\')">บันทึก</button>' +
    '</div>' +
  '</div>');

  window._rlCurrentTaskId  = taskId;
  window._rlCurrentSlot    = slotIdx;
  window._rlCurrentDate    = ds;
  window._rlExtPicked      = {};  

  
  
  
  curMembers.forEach(function(code){
    var emp = DB.employees.find(function(e){ return e.code===code; });
    if (emp && !_empInTeam(emp, t.deptName, t.teamName)) { window._rlExtPicked[code] = emp; }
  });
  _rlRenderExtTags(taskId, slotIdx);
}


var _rlDailyIdx = 0;
function _rlDailyRowHtml(taskId, idx, name, days, wage) {
  return '<div id="rl-daily-'+idx+'" style="display:grid;grid-template-columns:1fr 72px 96px 26px;gap:4px;align-items:center;">' +
    '<input type="text" class="fc rl-daily-name" placeholder="ชื่อผู้รับจ้าง" value="'+name+'" style="font-size:11px;padding:5px 8px;">' +
    '<input type="number" class="fc rl-daily-days" placeholder="วัน" min="1" value="'+days+'" style="font-size:11px;padding:5px 6px;">' +
    '<input type="number" class="fc rl-daily-wage" placeholder="ยอดรวม ฿" min="0" value="'+(wage||'')+'" style="font-size:11px;padding:5px 6px;">' +
    '<button onclick="document.getElementById(\'rl-daily-'+idx+'\').remove()" style="border:none;background:var(--red-bg);color:#991b1b;border-radius:5px;cursor:pointer;font-size:14px;width:26px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">×</button>' +
  '</div>';
}

function _rlAddDaily(taskId) {
  var wrap = document.getElementById('rl-daily-wrap');
  if (!wrap) return;
  var idx = ++_rlDailyIdx;
  var div = document.createElement('div');
  div.innerHTML = _rlDailyRowHtml(taskId, idx, '', 1, '');
  wrap.appendChild(div.firstElementChild);
}


function _rlSearchExt(q, taskId, slotIdx) {
  var t = DB.tasks.find(function(x){ return x.id===taskId; });
  var team = t ? DB.teams.find(function(tm){ return tm.name===t.teamName && tm.deptName===t.deptName; }) : null;
  var teamCodes = team ? (team.members||[]) : [];
  var res = document.getElementById('rl-ext-results');
  if (!res) return;
  q = (q||'').trim().toLowerCase();
  if (!q) { res.style.display='none'; res.innerHTML=''; return; }

  var matches = DB.employees.filter(function(e){
    if (teamCodes.indexOf(e.code)>=0) return false;
    if (window._rlExtPicked && window._rlExtPicked[e.code]) return false;
    var hay = (e.name+' '+e.nickname+' '+e.position+' '+e.team+' '+e.dept).toLowerCase();
    return hay.indexOf(q)>=0;
  }).slice(0,8);

  if (!matches.length) {
    res.style.display='block';
    res.innerHTML='<div style="padding:7px 12px;font-size:11px;color:var(--ink-3);">ไม่พบพนักงาน</div>';
    return;
  }
  res.style.display='block';
  res.innerHTML = matches.map(function(e){
    var d2  = dOfN(e.dept);
    var c2  = d2 ? d2.color : '#64748b';
    var ini = (e.nickname||e.name||'?').slice(0,2).toUpperCase();
    var ph  = e.photo ? '<img src="'+e.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">' : '<span style="font-size:8px;font-weight:700;color:#fff;">'+ini+'</span>';
    return '<div onclick="_rlPickExt(\''+e.code+'\','+taskId+','+slotIdx+')" style="display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;border-bottom:1px solid var(--line-2);" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">' +
      '<div style="width:28px;height:28px;border-radius:50%;background:'+c2+';display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">'+ph+'</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+e.name+'</div>' +
        '<div style="font-size:9px;color:var(--ink-3);">'+e.team+' · '+e.dept+'</div>' +
      '</div>' +
      '<span style="font-size:9px;font-weight:700;background:var(--amber-bg);color:#92400e;border-radius:10px;padding:2px 6px;white-space:nowrap;">ยืม</span>' +
    '</div>';
  }).join('');
}

function _rlPickExt(code, taskId, slotIdx) {
  var emp = DB.employees.find(function(e){ return e.code===code; });
  if (!emp) return;
  if (!window._rlExtPicked) window._rlExtPicked = {};
  window._rlExtPicked[code] = emp;
  var ri = document.getElementById('rl-ext-results');
  var qi = document.getElementById('rl-ext-q');
  if (ri) { ri.style.display='none'; ri.innerHTML=''; }
  if (qi) qi.value='';
  _rlRenderExtTags(taskId, slotIdx);
}

function _rlRemoveExt(code, taskId, slotIdx) {
  if (window._rlExtPicked) delete window._rlExtPicked[code];
  _rlRenderExtTags(taskId, slotIdx);
}

function _rlRenderExtTags(taskId, slotIdx) {
  var wrap = document.getElementById('rl-ext-tags');
  if (!wrap) return;
  var codes = Object.keys(window._rlExtPicked||{});
  if (!codes.length) { wrap.innerHTML=''; return; }
  wrap.innerHTML = codes.map(function(code){
    var e  = window._rlExtPicked[code];
    var d2 = dOfN(e.dept);
    var c2 = d2 ? d2.color : '#64748b';
    var ini = (e.nickname||e.name||'?').slice(0,2).toUpperCase();
    var ph  = e.photo ? '<img src="'+e.photo+'" style="width:22px;height:22px;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">' : '<span style="font-size:7px;font-weight:700;color:#fff;">'+ini+'</span>';
    return '<div style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px 2px 3px;border-radius:20px;background:var(--amber-bg);border:1px solid #fcd34d;">' +
      '<div style="width:20px;height:20px;border-radius:50%;background:'+c2+';display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">'+ph+'</div>' +
      '<span style="font-size:10px;font-weight:600;color:#92400e;">'+e.nickname+'</span>' +
      '<span style="font-size:8px;color:#b45309;">(ยืม)</span>' +
      '<button onclick="_rlRemoveExt(\''+code+'\','+taskId+','+slotIdx+')" style="border:none;background:none;cursor:pointer;color:#b45309;padding:0;font-size:13px;line-height:1;margin-left:1px;">×</button>' +
    '</div>';
  }).join('');
}





function _rlSaveAll(taskId, slotIdx, ds) {
  var t = DB.tasks.find(function(x){ return x.id===taskId; });
  if (!t) return;
  if (!canEditTask(t, 'planner')) { denyAccess('คุณไม่มีสิทธิ์แก้ไขงานนี้'); closeMd(); return; }

  
  var mems = taskMembersOn(t, ds);

  
  var extCodes = Object.keys(window._rlExtPicked||{});
  extCodes.forEach(function(code){
    if (mems.indexOf(code)<0) mems.push(code);
  });
  
  
  
  mems = mems.filter(function(code){
    var emp = DB.employees.find(function(e){ return e.code===code; });
    if (emp && _empInTeam(emp, t.deptName, t.teamName)) return true;  
    return extCodes.indexOf(code)>=0;             
  });

  
  var daily = [];
  document.querySelectorAll('#rl-daily-wrap [id^="rl-daily-"]').forEach(function(row){
    var name = (row.querySelector('.rl-daily-name')?.value||'').trim();
    var days = parseInt(row.querySelector('.rl-daily-days')?.value||'1')||1;
    var wage = parseFloat(row.querySelector('.rl-daily-wage')?.value||'0')||0;
    if (name || wage) daily.push({ name: name||'ไม่ระบุ', days, wage });
  });

  setTaskMembersOn(t, ds, mems);
  t.dailyWorkers    = daily;
  t.borrowedMembers = extCodes;

  
  try { sessionStorage.setItem('cachedTasks', JSON.stringify(DB.tasks)); } catch(_){}

  if (CONFIG.GAS_URL) {
    apiPost('updateTask', { id: taskId, dayOverrides: t.dayOverrides, dailyWorkers: daily, borrowedMembers: extCodes }).catch(function(){});
  }
  closeMd();
  renderPlanner();
}


function _rlBuildTeamListHtml(taskId, slotIdx, ds, teamEmps, color, mems) {
  return teamEmps.map(function(emp){
    var isA = mems.indexOf(emp.code)>=0;
    var isLead = window._rlLeadCode === emp.code;
    var ini = (emp.nickname||emp.name||'?').slice(0,2).toUpperCase();
    var ph  = emp.photo ? '<img src="'+emp.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">' : '';
    var leadStar = '<button type="button" onclick="event.stopPropagation();_rlSetLead('+taskId+',\''+emp.code+'\',\''+ds+'\')" title="ตั้งเป็นหัวหน้างาน (Lead) — จะแสดงเป็นคนที่ 1" id="rl-lead-star-'+emp.code+'" style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:2px;display:flex;align-items:center;justify-content:center;color:'+(isLead?'#F59E0B':'var(--line)')+';">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="'+(isLead?'#F59E0B':'none')+'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' +
    '</button>';
    return '<div id="rl-row-'+emp.code+'" onclick="_rlTogglePerson('+taskId+',\''+emp.code+'\','+slotIdx+',\''+ds+'\')" style="display:flex;align-items:center;gap:6px;padding:7px 12px;cursor:pointer;border-bottom:1px solid var(--line-2);background:'+(isA?color+'15':'')+';" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\''+(isA?color+'15':'')+'\'">' +
      '<div style="width:30px;height:30px;border-radius:50%;background:'+color+';flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:700;border:'+(isA?'2px solid '+color:'1px solid transparent')+';">'+ph+(emp.photo?'':ini)+'</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:11.5px;font-weight:700;">'+(emp.nickname||emp.name)+(isLead?' <span style="font-size:8.5px;font-weight:700;color:#F59E0B;">· หัวหน้า</span>':'')+'</div>' +
        '<div style="font-size:9px;color:var(--ink-3);">'+(emp.position||emp.team||'')+'</div>' +
      '</div>' +
      leadStar +
      (isA ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+color+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '<div style="width:14px;"></div>') +
    '</div>';
  }).join('');
}


function _rlSetLead(taskId, empCode, ds) {
  var t = DB.tasks.find(function(x){ return x.id===taskId; });
  if (!t) return;
  if (!canEditTask(t, 'planner')) { denyAccess('คุณไม่มีสิทธิ์แก้ไขงานนี้'); return; }
  window._rlLeadCode = (window._rlLeadCode === empCode) ? null : empCode;

  var mems = taskMembersOn(t, ds);
  if (window._rlLeadCode) {
    if (mems.indexOf(window._rlLeadCode) < 0) mems.unshift(window._rlLeadCode); 
    else mems = [window._rlLeadCode].concat(mems.filter(function(c){ return c !== window._rlLeadCode; })); 
    setTaskMembersOn(t, ds, mems);
    if (CONFIG.GAS_URL) apiPost('updateTask', { id: taskId, dayOverrides: t.dayOverrides }).catch(function(){});
    try { sessionStorage.setItem('cachedTasks', JSON.stringify(DB.tasks)); } catch(_){}
  }

  var dept  = dOfN(t.deptName);
  var color = dept ? dept.color : 'var(--teal)';
  var team  = DB.teams.find(function(tm){ return tm.name===t.teamName && tm.deptName===t.deptName; });
  var teamEmpCodes = team ? (team.members||[]) : [];
  var teamEmps = DB.employees.filter(function(e){ return teamEmpCodes.indexOf(e.code)>=0; });
  if (!teamEmps.length) teamEmps = DB.employees.filter(function(e){ return e.dept===t.deptName; });
  var listWrap = document.querySelector('#rl-team-list');
  if (listWrap) {
    listWrap.innerHTML = _rlBuildTeamListHtml(taskId, window._rlCurrentSlot, ds, teamEmps, color, taskMembersOn(t, ds));
  }
}

function _rlTogglePerson(taskId, empCode, slotIdx, ds) {
  var t = DB.tasks.find(function(x){ return x.id===taskId; });
  if (!t) return;
  if (!canEditTask(t, 'planner')) { denyAccess('คุณไม่มีสิทธิ์แก้ไขงานนี้'); return; }
  
  
  var mems = taskMembersOn(t, ds);
  var idx  = mems.indexOf(empCode);
  if (idx >= 0) {
    mems.splice(idx, 1);
    if (window._rlLeadCode === empCode) window._rlLeadCode = null; 
  } else {
    mems.splice(slotIdx, 0, empCode);
  }
  setTaskMembersOn(t, ds, mems);
  if (CONFIG.GAS_URL) {
    apiPost('updateTask', { id: taskId, dayOverrides: t.dayOverrides }).catch(function(){});
  }
  try { sessionStorage.setItem('cachedTasks', JSON.stringify(DB.tasks)); } catch(_){}
  
  var dept  = dOfN(t.deptName);
  var color = dept ? dept.color : 'var(--teal)';
  var team  = DB.teams.find(function(tm){ return tm.name===t.teamName && tm.deptName===t.deptName; });
  var teamEmpCodes = team ? (team.members||[]) : [];
  var teamEmps = DB.employees.filter(function(e){ return teamEmpCodes.indexOf(e.code)>=0; });
  if (!teamEmps.length) teamEmps = DB.employees.filter(function(e){ return e.dept===t.deptName; });
  var listWrap = document.querySelector('#rl-team-list');
  if (listWrap) {
    listWrap.innerHTML = _rlBuildTeamListHtml(taskId, slotIdx, ds, teamEmps, color, mems);
  } else {
    
    closeMd(); renderPlanner();
  }
}



window._rlDragTaskId  = null;
window._rlDragDateKey = null; 

function _rlDragStart(evt, taskId, dateKey) {
  window._rlDragTaskId  = taskId;
  window._rlDragDateKey = dateKey;
  try { evt.dataTransfer.effectAllowed = 'move'; evt.dataTransfer.setData('text/plain', String(taskId)); } catch(_){}
  evt.currentTarget.style.opacity = '0.4';
}
function _rlDragOver(evt, dateKey) {
  if (dateKey !== window._rlDragDateKey) return; 
  evt.preventDefault();
  evt.currentTarget.style.background = 'var(--teal-dim)';
}
function _rlDragLeave(evt) {
  evt.currentTarget.style.background = '';
}
function _rlDrop(evt, targetTaskId, dateKey) {
  evt.preventDefault();
  evt.currentTarget.style.background = '';
  if (dateKey !== window._rlDragDateKey) return;
  var draggedId = window._rlDragTaskId;
  if (!draggedId || draggedId === targetTaskId) return;
  _rlReorderTasks(dateKey, draggedId, targetTaskId);
}
function _rlDragEnd(evt) {
  evt.currentTarget.style.opacity = '';
  window._rlDragTaskId  = null;
  window._rlDragDateKey = null;
}

async function _rlReorderTasks(dateKey, draggedId, targetId) {
  var parts = dateKey.split('::');
  var deptName = parts[0], teamName = parts[1], ds = parts[2];
  var group = DB.tasks.filter(function(t){
    var ts = _normDateStr(t.start), te = _normDateStr(t.end||t.start);
    return (t.teamName||'').trim().toLowerCase()===teamName.trim().toLowerCase()
      && (t.deptName||'').trim().toLowerCase()===deptName.trim().toLowerCase()
      && ts<=ds && te>=ds;
  }).sort(function(a,b){ return (a.sortIndex||0)-(b.sortIndex||0); });

  var draggedIdx = group.findIndex(function(t){ return t.id===draggedId; });
  var targetIdx  = group.findIndex(function(t){ return t.id===targetId; });
  if (draggedIdx<0 || targetIdx<0) return;

  var moved = group.splice(draggedIdx,1)[0];
  group.splice(targetIdx,0,moved);

  
  var updates = [];
  group.forEach(function(t,i){
    var newIdx = (i+1)*10;
    if (t.sortIndex !== newIdx) { t.sortIndex = newIdx; updates.push({id:t.id, sortIndex:newIdx}); }
  });
  try { sessionStorage.setItem('cachedTasks', JSON.stringify(DB.tasks)); } catch(_){}
  renderPlanner(); 

  if (CONFIG.GAS_URL) {
    for (var i=0; i<updates.length; i++) {
      await apiPost('updateTask', { id: updates[i].id, sortIndex: updates[i].sortIndex }).catch(function(){});
    }
  }
}

function _rlEditCar(taskId, evt) {
  evt.stopPropagation();
  var t = DB.tasks.find(function(x){ return x.id===taskId; });
  if (!t) return;
  if (!canEditTask(t, 'planner')) { denyAccess('คุณไม่มีสิทธิ์แก้ไขงานนี้'); return; }

  
  var initIds = (t.vehicleIds && t.vehicleIds.length) ? t.vehicleIds.slice() : (t.vehicleId ? [String(t.vehicleId)] : []);
  window._rlCarSelected = {};
  initIds.forEach(function(vid){ window._rlCarSelected[vid] = true; });

  
  var taskStart = _normDateStr(t.start)||'', taskEnd = _normDateStr(t.end||t.start)||'';
  function getVehConflicts(vid) {
    return DB.tasks.filter(function(ot) {
      if (ot.id === taskId) return false; 
      var otVids = (ot.vehicleIds && ot.vehicleIds.length) ? ot.vehicleIds : (ot.vehicleId ? [String(ot.vehicleId)] : []);
      if (otVids.indexOf(String(vid)) < 0) return false;
      var os = _normDateStr(ot.start)||'', oe = _normDateStr(ot.end||ot.start)||'';
      return os <= taskEnd && oe >= taskStart;
    });
  }

  function _renderCarList(q) {
    var filtered = DB.vehicles.filter(function(v) {
      if (!q) return true;
      return (v.plate+' '+v.model).toLowerCase().indexOf(q.toLowerCase()) >= 0;
    });
    if (!filtered.length) return '<div style="padding:16px;text-align:center;color:var(--ink-3);font-size:12px;">ไม่พบรถ</div>';

    var rows = filtered.map(function(v) {
      var isSelected = !!window._rlCarSelected[v.id];
      var conflicts  = getVehConflicts(v.id);
      var conflictBadge = '';
      if (conflicts.length) {
        var names = conflicts.slice(0,2).map(function(ot){ return escapeHtml(ot.title); }).join(', ');
        conflictBadge = '<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">'+
          '<span style="background:#fef3c7;color:#92400e;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:700;white-space:nowrap;">'+
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ใช้อยู่ '+conflicts.length+' งาน'+
          '</span>'+
          '<span style="font-size:9px;color:var(--ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+names+'</span>'+
        '</div>';
      }
      var sm = {available:'bg',in_use:'bb',maintenance:'ba'};
      var sl = {available:'ว่าง',in_use:'ใช้งาน',maintenance:'ซ่อม'};
      var statusBadge = '<span class="badge '+(sm[v.status]||'bgr')+'" style="font-size:9px;flex-shrink:0;">'+(sl[v.status]||v.status||'')+'</span>';
      var infoBtn = '<button onclick="event.stopPropagation();openVehTimeline(\''+v.id+'\')" title="ดูรายละเอียด — รถคันนี้ไปงานไหนมาบ้าง" style="flex-shrink:0;background:none;border:1px solid var(--line);border-radius:6px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--ink-3);" onmouseover="this.style.background=\'var(--bg)\';this.style.color=\'var(--teal)\'" onmouseout="this.style.background=\'none\';this.style.color=\'var(--ink-3)\'">'+
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'+
      '</button>';
      return '<div onclick="_rlToggleCarSel('+taskId+',\''+v.id+'\')" style="display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;border-bottom:1px solid var(--line-2);'+(isSelected?'background:var(--teal-dim);':conflicts.length?'background:#fffbeb;':'')+'" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\''+(isSelected?'var(--teal-dim)':conflicts.length?'#fffbeb':'')+'\'">' +
        '<input type="checkbox" '+(isSelected?'checked':'')+' onclick="event.stopPropagation();_rlToggleCarSel('+taskId+',\''+v.id+'\')" style="width:16px;height:16px;flex-shrink:0;accent-color:var(--teal);cursor:pointer;">' +
        '<span style="width:28px;height:28px;border-radius:50%;background:var(--bg-2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--ink-2);">'+vehIconSvg(v.icon,14)+'</span>' +
        '<div style="flex:1;min-width:0;">'+
          '<div style="font-size:13.5px;font-weight:800;color:var(--ink);">'+v.plate+'</div>'+
          '<div style="font-size:10.5px;color:var(--ink-3);">'+v.model+'</div>'+
          conflictBadge+
        '</div>'+
        statusBadge+
        infoBtn+
      '</div>';
    }).join('');
    return rows;
  }

  openMd('<div class="md" style="max-width:380px;">'+
    '<div class="mh"><h3>เลือกรถ <span style="font-weight:400;color:var(--ink-3);font-size:12px;">(เลือกได้มากกว่า 1 คัน)</span></h3>'+
      '<button class="mc" onclick="closeMd()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'+
    '</div>'+
    '<div style="padding:12px 14px 6px;">'+
      '<div style="position:relative;">'+
        '<input type="text" class="fc" id="car-search" placeholder="ค้นหาทะเบียน / รุ่น..." oninput="_rlCarSearch('+taskId+',this.value)" style="padding-left:34px;" autocomplete="off">'+
        '<svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--ink-3);pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'+
      '</div>'+
    '</div>'+
    '<div id="car-list" style="max-height:380px;overflow-y:auto;">'+
      _renderCarList('')+
    '</div>'+
    '<div class="mf">'+
      '<button class="btn" onclick="_rlClearCarSel('+taskId+')">ไม่ใช้รถเลย</button>'+
      '<button class="btn btn-p" onclick="_rlSaveCarSelection('+taskId+')">ยืนยัน</button>'+
    '</div>'+
  '</div>');

  window._rlCarRender = _renderCarList;
  setTimeout(function(){ document.getElementById('car-search')?.focus(); }, 60);
}

function _rlToggleCarSel(taskId, vid) {
  if (window._rlCarSelected[vid]) delete window._rlCarSelected[vid];
  else window._rlCarSelected[vid] = true;
  var q = (document.getElementById('car-search')||{}).value || '';
  _rlCarSearch(taskId, q);
}

function _rlClearCarSel(taskId) {
  window._rlCarSelected = {};
  var q = (document.getElementById('car-search')||{}).value || '';
  _rlCarSearch(taskId, q);
}

async function _rlSaveCarSelection(taskId) {
  var t = DB.tasks.find(function(x){ return x.id===taskId; });
  if (!t) return;
  if (!canEditTask(t, 'planner')) { denyAccess('คุณไม่มีสิทธิ์แก้ไขงานนี้'); closeMd(); return; }
  var vids = Object.keys(window._rlCarSelected||{});
  t.vehicleIds = vids;
  t.vehicleId  = vids[0] || '';
  if (CONFIG.GAS_URL) await apiPost('updateTask', { id: taskId, vehicleId: t.vehicleId, vehicleIds: vids });
  closeMd(); renderPlanner();
}

function _rlCarSearch(taskId, q) {
  var list = document.getElementById('car-list');
  if (!list || !window._rlCarRender) return;
  list.innerHTML = window._rlCarRender(q);
}






function _rpSave() {
  try { sessionStorage.setItem('rpExtraRows', JSON.stringify(window._rpExtraRows)); } catch(_){}
  
  if (CONFIG.GAS_URL) {
    apiPost('updateConfig', { key: 'rpExtraRows', value: JSON.stringify(window._rpExtraRows) }).catch(function(){});
  }
}




function _rpActualTaskCount(rowKey) {
  var parts = rowKey.split('::');
  if (parts.length < 3) return 0; 
  var deptName = parts[0], teamName = parts[1], ds = parts[2];
  var PERSON_CAP = 5;
  var matched = DB.tasks.filter(function(t){
    var ts = _normDateStr(t.start), te = _normDateStr(t.end||t.start);
    return (t.teamName||'').trim().toLowerCase()===teamName.trim().toLowerCase()
      && (t.deptName||'').trim().toLowerCase()===deptName.trim().toLowerCase()
      && ts<=ds && te>=ds;
  });
  return matched.reduce(function(sum, t){
    var mCount = taskMembersOn(t, ds).length + (t.dailyWorkers||[]).length;
    return sum + Math.max(1, Math.ceil(mCount / PERSON_CAP));
  }, 0);
}


window.rpOpenRowMgr = function rpOpenRowMgr(rowKey, teamName, color) {
  var old = document.getElementById('_row-mgr');
  if (old) old.remove();

  
  var parts = rowKey.split('::');
  var deptNameFromKey = parts[0] || null;
  var teamKey = parts[0] + '::' + parts[1]; 

  if (!canEditTask({ deptName: deptNameFromKey, teamName: teamName }, 'planner')) { denyAccess('คุณไม่มีสิทธิ์แก้ไขแถวของทีมนี้'); return; }

  var extraN       = (window._rpExtraRows && window._rpExtraRows[rowKey]) || 0;
  var actualCount  = _rpActualTaskCount(rowKey);
  var totalRows    = Math.max(1 + extraN, actualCount); 
  var personCols = Math.min(5, _rlColsFor(teamKey)); 

  var overlay = document.createElement('div');
  overlay.id  = '_row-mgr';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:9999;display:flex;align-items:center;justify-content:center;';

  var MAX_ROWS = 20;
  var MAX_COLS = 5, MIN_COLS = 1;
  var c = color || 'var(--teal)';
  var atMax = (totalRows >= MAX_ROWS);
  var colsAtMax = (personCols >= MAX_COLS);
  var colsAtMin = (personCols <= MIN_COLS);

  var rk  = rowKey.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  var tk  = teamKey.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  var tn  = teamName.replace(/\\/g,'\\\\').replace(/'/g,"\\'");

  overlay.innerHTML =
    '<div style="background:var(--surface);border-radius:14px;padding:24px 28px;box-shadow:0 8px 32px rgba(0,0,0,.18);width:300px;font-family:inherit;">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">' +
        '<div style="width:10px;height:10px;border-radius:50%;background:'+c+';flex-shrink:0;"></div>' +
        '<div style="font-size:14px;font-weight:700;color:var(--ink);">'+teamName+'</div>' +
      '</div>' +

      '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-radius:10px;padding:14px 18px;margin-bottom:12px;">' +
        '<span style="font-size:12px;color:var(--ink-2);font-weight:600;">จำนวนแถว</span>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<button id="_rmgr-minus" onclick="_rpMgrAdj(-1,\''+rk+'\',\''+tn+'\',\''+c+'\')" style="width:32px;height:32px;border-radius:50%;background:'+(totalRows<=Math.max(1,actualCount)?'var(--line-2)':'var(--red-bg)')+';color:'+(totalRows<=Math.max(1,actualCount)?'var(--ink-3)':'#991b1b')+';border:none;font-size:18px;font-weight:700;cursor:'+(totalRows<=Math.max(1,actualCount)?'default':'pointer')+';display:flex;align-items:center;justify-content:center;font-family:inherit;transition:all .15s;" '+(totalRows<=Math.max(1,actualCount)?'disabled':'')+'>−</button>' +
          '<span id="_rmgr-count" style="font-size:22px;font-weight:800;color:'+c+';min-width:28px;text-align:center;font-family:\'IBM Plex Mono\',monospace;">'+totalRows+'</span>' +
          '<button id="_rmgr-plus" onclick="_rpMgrAdj(1,\''+rk+'\',\''+tn+'\',\''+c+'\')" style="width:32px;height:32px;border-radius:50%;background:'+(atMax?'var(--line-2)':c+'20')+';color:'+(atMax?'var(--ink-3)':c)+';border:none;font-size:18px;font-weight:700;cursor:'+(atMax?'default':'pointer')+';display:flex;align-items:center;justify-content:center;font-family:inherit;transition:all .15s;" '+(atMax?'disabled':'')+'>+</button>' +
        '</div>' +
      '</div>' +
      '<div id="_rmgr-hint" style="font-size:10px;color:'+(atMax?'var(--amber)':'var(--ink-3)')+';margin-bottom:18px;text-align:center;">'+(atMax?'⚠ สูงสุด '+MAX_ROWS+' แถวแล้ว':(actualCount>1?'มีงานอยู่แล้ว '+actualCount+' งาน ลดต่ำกว่านี้ไม่ได้':'เพิ่มเฉพาะวันที่เลือก ไม่กระทบวันอื่น'))+'</div>' +

      '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg);border-radius:10px;padding:14px 18px;margin-bottom:12px;">' +
        '<span style="font-size:12px;color:var(--ink-2);font-weight:600;">จำนวนช่องคน</span>' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<button id="_rmgr-col-minus" onclick="_rpMgrColAdj(-1,\''+tk+'\',\''+c+'\')" style="width:32px;height:32px;border-radius:50%;background:'+(colsAtMin?'var(--line-2)':'var(--red-bg)')+';color:'+(colsAtMin?'var(--ink-3)':'#991b1b')+';border:none;font-size:18px;font-weight:700;cursor:'+(colsAtMin?'default':'pointer')+';display:flex;align-items:center;justify-content:center;font-family:inherit;transition:all .15s;" '+(colsAtMin?'disabled':'')+'>−</button>' +
          '<span id="_rmgr-col-count" style="font-size:22px;font-weight:800;color:'+c+';min-width:28px;text-align:center;font-family:\'IBM Plex Mono\',monospace;">'+personCols+'</span>' +
          '<button id="_rmgr-col-plus" onclick="_rpMgrColAdj(1,\''+tk+'\',\''+c+'\')" style="width:32px;height:32px;border-radius:50%;background:'+(colsAtMax?'var(--line-2)':c+'20')+';color:'+(colsAtMax?'var(--ink-3)':c)+';border:none;font-size:18px;font-weight:700;cursor:'+(colsAtMax?'default':'pointer')+';display:flex;align-items:center;justify-content:center;font-family:inherit;transition:all .15s;" '+(colsAtMax?'disabled':'')+'>+</button>' +
        '</div>' +
      '</div>' +
      '<div id="_rmgr-col-hint" style="font-size:10px;color:var(--ink-3);margin-bottom:18px;text-align:center;">เฉพาะของทีมนี้ — ไม่กระทบทีมอื่น (ต่ำสุด '+MIN_COLS+' สูงสุด '+MAX_COLS+' ช่อง)</div>' +

      '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
        '<button onclick="_rpMgrCancel(\''+rk+'\','+extraN+')" style="background:var(--bg);color:var(--ink-2);border:1px solid var(--line);border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">ยกเลิก</button>' +
        '<button onclick="_rpMgrConfirm(\''+rk+'\',\''+tn+'\',\''+c+'\')" style="background:'+c+';color:#fff;border:none;border-radius:8px;padding:8px 22px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">เสร็จสิ้น</button>' +
      '</div>' +
    '</div>';

  overlay.addEventListener('click', function(e){ if(e.target===overlay){ _rpMgrCancel(rowKey, extraN); } });
  document.body.appendChild(overlay);
}


window._rpMgrCancel = function(rowKey, origExtra) {
  if (origExtra === 0) delete window._rpExtraRows[rowKey];
  else window._rpExtraRows[rowKey] = origExtra;
  _rpSave();
  var ol = document.getElementById('_row-mgr');
  if (ol) ol.remove();
};


window._rpMgrConfirm = function(rowKey, teamName, color) {
  var cur   = (window._rpExtraRows && window._rpExtraRows[rowKey]) || 0;
  var total = Math.max(1 + cur, _rpActualTaskCount(rowKey));
  var ol    = document.getElementById('_row-mgr');
  openConfirmMini(
    'บันทึก ' + teamName + ' เป็น ' + total + ' แถว?',
    'ยืนยัน',
    function() { if (ol) ol.remove(); _rpSave(); renderPlanner(); }
  );
};

window._rpMgrAdj = function _rpMgrAdj(delta, rowKey, teamName, color) {
  var MAX_ROWS = 20;
  if (!window._rpExtraRows) window._rpExtraRows = {};
  var actualCount = _rpActualTaskCount(rowKey);
  var minTotal    = Math.max(1, actualCount); 
  var cur         = window._rpExtraRows[rowKey] || 0;
  var curTotal    = Math.max(1 + cur, actualCount); 
  var nextTotal   = Math.min(MAX_ROWS, Math.max(minTotal, curTotal + delta));
  var nextExtra   = Math.max(0, nextTotal - 1);
  if (nextExtra === 0) delete window._rpExtraRows[rowKey];
  else window._rpExtraRows[rowKey] = nextExtra;
  _rpSave();

  var atMax  = (nextTotal >= MAX_ROWS);
  var atMin  = (nextTotal <= minTotal);

  
  var countEl = document.getElementById('_rmgr-count');
  if (countEl) countEl.textContent = nextTotal;

  
  var minusEl = document.getElementById('_rmgr-minus');
  if (minusEl) {
    minusEl.disabled           = atMin;
    minusEl.style.background   = atMin ? 'var(--line-2)' : 'var(--red-bg)';
    minusEl.style.color        = atMin ? 'var(--ink-3)'  : '#991b1b';
    minusEl.style.cursor       = atMin ? 'default'        : 'pointer';
  }

  
  var plusEl = document.getElementById('_rmgr-plus');
  if (plusEl) {
    plusEl.disabled            = atMax;
    plusEl.style.background    = atMax ? 'var(--line-2)' : (color||'var(--teal)')+'20';
    plusEl.style.color         = atMax ? 'var(--ink-3)'  : (color||'var(--teal)');
    plusEl.style.cursor        = atMax ? 'default'        : 'pointer';
  }

  
  var hintEl = document.getElementById('_rmgr-hint');
  if (hintEl) {
    hintEl.textContent = atMax ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> สูงสุด '+MAX_ROWS+' แถวแล้ว' : (actualCount>1 ? 'มีงานอยู่แล้ว '+actualCount+' งาน ลดต่ำกว่านี้ไม่ได้' : 'แถวต่ำสุด 1 — สูงสุด '+MAX_ROWS+' แถว');
    hintEl.style.color = atMax ? 'var(--amber)' : 'var(--ink-3)';
  }
}


window._rpMgrColAdj = function _rpMgrColAdj(delta, rowKey, color) {
  var deptNameFromKey = rowKey.split('::')[0] || null;
  var teamNameFromKey = rowKey.split('::')[1] || rowKey;
  if (!canEditTask({ deptName: deptNameFromKey, teamName: teamNameFromKey }, 'planner')) { denyAccess('คุณไม่มีสิทธิ์แก้ไขแถวของทีมนี้'); return; }

  var MAX_COLS = 5, MIN_COLS = 1;
  if (!window._rlPersonCols) window._rlPersonCols = {};
  var cur  = window._rlPersonCols[rowKey] || 5;
  var next = Math.min(MAX_COLS, Math.max(MIN_COLS, cur + delta));

  
  if (delta < 0 && next < cur) {
    
    var tasks = vTasks ? vTasks() : (DB.tasks || []);
    var hasOccupied = tasks.some(function(t) {
      var tn_ = (t.teamName||'').trim().toLowerCase();
      var dn_ = (t.deptName||'').trim().toLowerCase();
      if (tn_ !== teamNameFromKey.trim().toLowerCase()) return false;
      if (dn_ !== deptNameFromKey.trim().toLowerCase()) return false;
      
      var mems = (t.members||[]);
      for (var i = next; i < cur; i++) {
        if (mems[i]) return true; 
      }
      return false;
    });

    if (hasOccupied) {
      
      var warnDiv = document.createElement('div');
      warnDiv.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);';
      warnDiv.innerHTML =
        '<div style="background:#fff;border-radius:14px;padding:24px 28px;max-width:340px;box-shadow:0 8px 32px rgba(0,0,0,.2);font-family:inherit;text-align:center;">' +
          '<div style="font-size:32px;margin-bottom:12px;">⚠️</div>' +
          '<div style="font-size:15px;font-weight:700;color:#1a2744;margin-bottom:8px;">ไม่สามารถลดช่องได้</div>' +
          '<div style="font-size:12px;color:#718096;margin-bottom:20px;line-height:1.6;">ช่องที่ต้องการลบยังมีพนักงานอยู่<br>กรุณาย้ายหรือลบพนักงานออกก่อน</div>' +
          '<button onclick="this.closest(\'[style*=fixed]\').remove()" style="background:#1a6bb5;color:#fff;border:none;border-radius:8px;padding:9px 28px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">ตกลง</button>' +
        '</div>';
      document.body.appendChild(warnDiv);
      return; 
    }
  }

  window._rlPersonCols[rowKey] = next;
  try { sessionStorage.setItem('rlPersonColsV2', JSON.stringify(window._rlPersonCols)); } catch(_){}

  var atMax = (next >= MAX_COLS);
  var atMin = (next <= MIN_COLS);

  var countEl = document.getElementById('_rmgr-col-count');
  if (countEl) countEl.textContent = next;

  var minusEl = document.getElementById('_rmgr-col-minus');
  if (minusEl) {
    minusEl.disabled         = atMin;
    minusEl.style.background = atMin ? 'var(--line-2)' : 'var(--red-bg)';
    minusEl.style.color      = atMin ? 'var(--ink-3)'  : '#991b1b';
    minusEl.style.cursor     = atMin ? 'default'        : 'pointer';
  }
  var plusEl = document.getElementById('_rmgr-col-plus');
  if (plusEl) {
    plusEl.disabled          = atMax;
    plusEl.style.background  = atMax ? 'var(--line-2)' : (color||'var(--teal)')+'20';
    plusEl.style.color       = atMax ? 'var(--ink-3)'  : (color||'var(--teal)');
    plusEl.style.cursor      = atMax ? 'default'        : 'pointer';
  }
  
};

window.rpQuickAdd  = function(dn,tn,ds){ if(!canEditTask({deptName:dn,teamName:tn},'planner')){denyAccess('คุณไม่มีสิทธิ์สร้างงานในแผนกนี้');return;} openCreate(tn,ds,dn); };









var _empKpiDR   = { start: null, end: null };
var _empKpiDept = 'all';
var _empKpiTeam = 'all';
var _empKpiName = '';
var _empKpiSort = 'taskCount'; 
var _empKpiViewMode = 'list'; 
var _empKpiSelectedEmp = null; 
var _empKpiPosition = 'all'; 
var _empKpiData = null; 

function pgEmpKPI() {
  document.getElementById('tb-actions').innerHTML = '';
  if (!_empKpiDR.start) {
    var today = _localDateStr(new Date());
    _empKpiDR.start = today.slice(0,7)+'-01';
    _empKpiDR.end   = today;
  }
  renderEmpKPI();
}

function _empKpiFilterBarHTML() {
  var calIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var SCHED_DNAMES = ['LED','Digital Signage & Retail','Business Development'];
  var depts = vDepts().filter(function(d){ return SCHED_DNAMES.indexOf(d.name) >= 0; });
  var deptOpts = '<option value="all">ทุกแผนก</option>' +
    depts.map(function(d){ return '<option value="'+d.name+'"'+(d.name===_empKpiDept?' selected':'')+'>'+d.name+'</option>'; }).join('');

  var teams = [];
  if (_empKpiDept !== 'all' && DB.schedTeams && DB.schedTeams[_empKpiDept]) teams = DB.schedTeams[_empKpiDept];
  else SCHED_DNAMES.forEach(function(dn){ if (DB.schedTeams && DB.schedTeams[dn]) teams = teams.concat(DB.schedTeams[dn]); });
  var teamOpts = '<option value="all">ทุกทีม</option>' +
    teams.map(function(t){ return '<option value="'+t+'"'+(_empKpiTeam===t?' selected':'')+'>'+t+'</option>'; }).join('');

  
  var posBase = DB.employees.filter(function(e){ return e.status==1||e.status==null||e.status===undefined; });
  if (_empKpiDept !== 'all') posBase = posBase.filter(function(e){ return e.dept===_empKpiDept || e.dept2===_empKpiDept; });
  if (_empKpiTeam !== 'all') posBase = posBase.filter(function(e){ return e.team===_empKpiTeam || e.team2===_empKpiTeam; });
  var availPositions = Array.from(new Set(posBase.map(function(e){ return (e.position||'').trim(); }).filter(Boolean))).sort();
  var posOpts = '<option value="all">ทุกตำแหน่ง</option>' +
    availPositions.map(function(p){ return '<option value="'+p+'"'+(p===_empKpiPosition?' selected':'')+'>'+p+'</option>'; }).join('');

  return '<div class="dash-filter-bar" id="empkpi-filter-bar">'+
    '<div class="dash-filter-group">'+
      '<div class="dash-filter-label">Date Range</div>'+
      '<div class="drp-trigger" id="ek-drp-trigger" onclick="drpOpen(this,\'empkpi\')">'+
        '<span class="drp-icon">'+calIcon+'</span>'+
        '<span class="drp-text" id="ek-drp-trigger-text">'+_drpFmtDisplay(_empKpiDR.start)+' — '+_drpFmtDisplay(_empKpiDR.end)+'</span>'+
      '</div>'+
    '</div>'+
    '<div class="dash-filter-group">'+
      '<div class="dash-filter-label">Department</div>'+
      '<select class="dept-select-pill" onchange="_empKpiDept=this.value;_empKpiTeam=\'all\';_empKpiPosition=\'all\';_empKpiFilterBarUpdate();renderEmpKPI()">'+deptOpts+'</select>'+
    '</div>'+
    '<div class="dash-filter-group">'+
      '<div class="dash-filter-label">Team</div>'+
      '<select class="dept-select-pill" onchange="_empKpiTeam=this.value;_empKpiPosition=\'all\';_empKpiFilterBarUpdate();renderEmpKpiContent()">'+teamOpts+'</select>'+
    '</div>'+
    '<div class="dash-filter-group">'+
      '<div class="dash-filter-label">Position</div>'+
      '<select class="dept-select-pill" onchange="_empKpiPosition=this.value;renderEmpKpiContent()">'+posOpts+'</select>'+
    '</div>'+
    '<div class="dash-filter-group">'+
      '<div class="dash-filter-label">ค้นหาพนักงาน</div>'+
      '<input type="text" class="name-search-pill" placeholder="พิมพ์ชื่อ..." value="'+_empKpiName+'" oninput="_empKpiName=this.value;renderEmpKpiContent()" style="min-width:180px;" autocomplete="off">'+
    '</div>'+
    '<button class="calc-btn" onclick="renderEmpKPI()">Calculate</button>'+
  '</div>';
}
function _empKpiFilterBarUpdate() {
  var bar = document.getElementById('empkpi-filter-bar');
  if (bar) bar.outerHTML = _empKpiFilterBarHTML();
}

async function renderEmpKPI() {
  var toggleHtml = '<div style="display:flex;gap:4px;margin-bottom:12px;">' +
    '<button class="rp-view-btn'+(_empKpiViewMode==='list'?' active':'')+'" onclick="_empKpiViewMode=\'list\';renderEmpKpiContent()">'+
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> รายชื่อทั้งหมด</button>'+
    '<button class="rp-view-btn'+(_empKpiViewMode==='individual'?' active':'')+'" onclick="_empKpiViewMode=\'individual\';renderEmpKpiContent()">'+
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> รายบุคคล</button>'+
  '</div>';
  document.getElementById('content').innerHTML =
    '<div id="empkpi-filter-wrap">' + _empKpiFilterBarHTML() + '</div>' +
    toggleHtml +
    '<div id="empkpi-content"><div style="text-align:center;padding:40px;color:var(--ink-3);font-size:12px;">กำลังโหลดข้อมูลการเข้างาน...</div></div>';

  
  var res = await Promise.all([
    apiGet('attendance', { dateFrom: _empKpiDR.start, dateTo: _empKpiDR.end }),
    apiGet('leaves',     { dateFrom: _empKpiDR.start, dateTo: _empKpiDR.end }),
  ]).catch(function(){ return [null, null]; });
  _empKpiData = { att: (res && res[0] && !res[0].error) ? res[0] : {}, lv: (res && res[1] && !res[1].error) ? res[1] : {} };

  renderEmpKpiContent();
}




function _taskHasMemberInRange(t, empCode, dateFrom, dateTo) {
  var s = _normDateStr(t.start), e = _normDateStr(t.end || t.start);
  if (!s || !e) return false;
  var rs = s < dateFrom ? dateFrom : s;
  var re = e > dateTo ? dateTo : e;
  var cur = new Date(rs + 'T00:00:00'), end = new Date(re + 'T00:00:00');
  while (cur <= end) {
    if (taskMembersOn(t, _localDateStr(cur)).indexOf(empCode) >= 0) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}


function _empKpiCalc(emp, tasksInRange, dateFrom, dateTo) {
  var empTasks = tasksInRange.filter(function(t){ return _taskHasMemberInRange(t, emp.code, dateFrom, dateTo); });
  var manDay = 0, cost = 0;
  var taskDaySet = {}; 
  var provinceDaySet = {}; 
  empTasks.forEach(function(t){
    var s = _normDateStr(t.start), e = _normDateStr(t.end || t.start);
    if (!s || !e) return;
    var cur = new Date((s < dateFrom ? dateFrom : s) + 'T00:00:00');
    var end = new Date((e > dateTo ? dateTo : e) + 'T00:00:00');
    while (cur <= end) {
      var ds = _localDateStr(cur);
      if (taskMembersOn(t, ds).indexOf(emp.code) >= 0) {
        manDay++;
        taskDaySet[ds] = true;
        if (t.isProvince) provinceDaySet[ds] = true;
      }
      cur.setDate(cur.getDate() + 1);
    }
  });
  
  
  Object.keys(taskDaySet).forEach(function(ds){
    if (isHolStrict(ds)) cost += HOL_BONUS;
    if (provinceDaySet[ds]) cost += PROV_BONUS;
  });
  var attendCount = 0, leaveCount = 0, taskDayAttendCount = 0, freeDays = 0;
  var cur2 = new Date(dateFrom + 'T00:00:00'), end2 = new Date(dateTo + 'T00:00:00');
  var att = (_empKpiData && _empKpiData.att) || {}, lv = (_empKpiData && _empKpiData.lv) || {};
  while (cur2 <= end2) {
    var ds2 = _localDateStr(cur2);
    var key = emp.code + '::' + ds2;
    if (att[key]) {
      attendCount++;
      if (taskDaySet[ds2]) taskDayAttendCount++; 
    }
    if (lv[key]) leaveCount++;
    
    if (!taskDaySet[ds2] && !lv[key] && cur2.getDay() !== 0) freeDays++;
    cur2.setDate(cur2.getDate() + 1);
  }
  var uniqueTaskDays = Object.keys(taskDaySet).length;
  
  var teamBreakdownMap = {};
  empTasks.forEach(function(t){
    var key = (t.deptName||'ไม่ระบุแผนก') + '::' + (t.teamName||'ไม่ระบุทีม');
    teamBreakdownMap[key] = (teamBreakdownMap[key]||0) + 1;
  });
  var teamBreakdown = Object.keys(teamBreakdownMap).map(function(key){
    var parts = key.split('::');
    return { dept: parts[0], team: parts[1], count: teamBreakdownMap[key] };
  }).sort(function(a,b){ return b.count-a.count; });
  return { taskCount: empTasks.length, manDay: manDay, cost: cost, attendCount: attendCount, leaveCount: leaveCount, freeDays: freeDays, uniqueTaskDays: uniqueTaskDays, taskDayAttendCount: taskDayAttendCount, teamBreakdown: teamBreakdown };
}

function renderEmpKpiContent() {
  if (_empKpiViewMode === 'individual') { _empKpiRenderIndividual(); return; }
  _empKpiRenderList();
}

function _empKpiRenderList() {
  var el = document.getElementById('empkpi-content');
  if (!el) return;

  var SCHED_DNAMES = ['LED','Digital Signage & Retail','Business Development'];
  var dateFrom = _empKpiDR.start, dateTo = _empKpiDR.end;
  var rangeLabel = _drpFmtDisplay(dateFrom) + ' – ' + _drpFmtDisplay(dateTo);

  var tasksInRange = vTasks().filter(function(t){ var ts=t.start||'', te=t.end||ts; return ts<=dateTo && te>=dateFrom; });

  var emps = DB.employees.filter(function(e){ return e.status==1||e.status==null||e.status===undefined; });
  if (_empKpiDept !== 'all') emps = emps.filter(function(e){ return e.dept===_empKpiDept || e.dept2===_empKpiDept; });
  if (_empKpiTeam !== 'all') emps = emps.filter(function(e){ return e.team===_empKpiTeam || e.team2===_empKpiTeam; });
  if (_empKpiPosition !== 'all') emps = emps.filter(function(e){ return (e.position||'').trim() === _empKpiPosition; });
  if (_empKpiName && _empKpiName.trim()) {
    var q = _empKpiName.trim().toLowerCase();
    emps = emps.filter(function(e){ return (e.name||'').toLowerCase().indexOf(q)>=0 || (e.nickname||'').toLowerCase().indexOf(q)>=0; });
  }

  var rows = emps.map(function(e){
    var stat = _empKpiCalc(e, tasksInRange, dateFrom, dateTo);
    return Object.assign({ emp: e }, stat);
  });

  var SORT_KEY = { taskCount:'taskCount', manDay:'manDay', cost:'cost', attend:'attendCount', free:'freeDays', leave:'leaveCount' };
  var sk = SORT_KEY[_empKpiSort] || 'taskCount';
  rows.sort(function(a,b){ return b[sk]-a[sk]; });

  
  
  
  
  var sumTaskCount = tasksInRange.length;
  var sumManDay    = tasksInRange.reduce(function(s,t){ return s+taskManDays(t); }, 0);
  var sumWage      = tasksInRange.reduce(function(s,t){ return s+(t.dailyWorkers||[]).reduce(function(ss,w){ return ss+(w.wage||0); }, 0); }, 0);
  var sumCost      = computeExtraPayDeduped(tasksInRange, dateFrom, dateTo).total + sumWage;
  var sumLeave     = rows.reduce(function(s,r){ return s+r.leaveCount; }, 0); 

  function sortBtn(key, label) {
    var active = _empKpiSort === key;
    return '<th style="cursor:pointer;user-select:none;'+(active?'color:var(--teal);':'')+'" onclick="_empKpiSort=\''+key+'\';renderEmpKpiContent()">'+label+(active?' ▼':'')+'</th>';
  }

  var bodyRows = rows.map(function(r){
    var e = r.emp;
    var d = dOfN(e.dept);
    var avHtml = e.photo
      ? '<img src="'+e.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">'
      : '<span style="font-size:10px;font-weight:700;color:#fff;">'+((e.nickname||e.name||'?').slice(0,2).toUpperCase())+'</span>';
    var teamChips = (r.teamBreakdown && r.teamBreakdown.length)
      ? r.teamBreakdown.map(function(x){
          var td = dOfN(x.dept);
          var c = td ? td.color : '#888';
          return '<span style="display:inline-flex;align-items:center;gap:3px;background:'+c+'15;color:'+c+';border-radius:5px;padding:2px 7px;font-size:11px;font-weight:700;white-space:nowrap;margin:1px 3px 1px 0;">'+x.team+' ('+x.count+')</span>';
        }).join('')
      : '<span style="font-size:11.5px;color:var(--ink-3);">— ไม่มีงานในช่วงนี้ —</span>';
    return '<tr onclick="_empKpiOpenDetail(\''+e.code+'\')" style="cursor:pointer;" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'+
      '<td><div style="display:flex;align-items:center;gap:8px;">'+
        '<div style="width:30px;height:30px;border-radius:50%;background:'+(d?d.color:'#888')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">'+avHtml+'</div>'+
        '<div class="kpi-emp-name-cell"><div style="font-size:13.5px;font-weight:700;">'+(e.nickname||e.name)+'</div><div style="font-size:11px;color:var(--ink-3);">'+(e.position||'')+' · ทีมต้นสังกัด '+(e.team||'—')+'</div></div>'+
      '</div></td>'+
      '<td style="max-width:220px;">'+teamChips+'</td>'+
      '<td style="text-align:center;font-size:13.5px;font-weight:700;">'+r.taskCount+'</td>'+
      '<td style="text-align:center;font-size:13.5px;font-weight:700;">'+r.manDay+'</td>'+
      '<td style="text-align:center;font-size:13.5px;color:#16A34A;font-weight:600;">'+r.attendCount+'</td>'+
      '<td style="text-align:center;font-size:13.5px;color:#16A34A;font-weight:600;">'+r.freeDays+'</td>'+
      '<td style="text-align:center;font-size:13.5px;color:#7C3AED;font-weight:600;">'+r.leaveCount+'</td>'+
      '<td style="text-align:right;font-size:13.5px;font-weight:700;color:'+(r.cost?'var(--red)':'var(--ink-3)')+';">'+(r.cost?fMoney(r.cost):'—')+'</td>'+
    '</tr>';
  }).join('');

  el.innerHTML =
    '<div class="al al-i no-print" style="margin-bottom:12px;font-size:11px;">'+
      fi('info',12)+' ตัวเลขในหน้านี้เป็นข้อมูลดิบ (จำนวนงาน/Man-Day/เข้างาน/วันว่าง/ลา/ค่าใช้จ่าย) ยังไม่มีการให้คะแนนหรือจัดอันดับ KPI รวม — ควรกำหนดสูตร/น้ำหนักร่วมกับฝ่าย HR ก่อนนำไปใช้ประเมินผลงานพนักงานจริง วันว่างไม่นับรวมวันอาทิตย์'+
    '</div>'+
    
    '<div class="no-print" style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">'+
      [
        {lbl:'พนักงาน', val:rows.length+' คน', color:'#2563EB'},
        {lbl:'งานรวม', val:sumTaskCount+' งาน', color:'var(--teal)'},
        {lbl:'Man-Day รวม', val:sumManDay.toLocaleString('th-TH'), color:'#7C3AED'},
        {lbl:'วันลารวม', val:sumLeave+' วัน', color:'#D97706'},
        {lbl:'ค่าใช้จ่ายรวม', val:fMoney(sumCost), color:'var(--red)'},
      ].map(function(s){
        return '<div class="card" style="flex:1;min-width:130px;padding:12px 14px;">'+
          '<div style="font-size:10px;color:var(--ink-3);font-weight:600;">'+s.lbl+'</div>'+
          '<div style="font-size:18px;font-weight:800;color:'+s.color+';margin-top:2px;">'+s.val+'</div>'+
        '</div>';
      }).join('')+
    '</div>'+
    '<div class="card" id="empkpi-print-area" style="padding:0;overflow:hidden;">'+
      
      '<div class="print-only pr-flex" style="padding:0 0 16px;border-bottom:2px solid #222;margin-bottom:14px;align-items:center;gap:14px;">'+
        (CONFIG.company.logo && CONFIG.company.logo.startsWith('data:')
          ? '<img src="'+CONFIG.company.logo+'" style="width:52px;height:52px;object-fit:cover;border-radius:10px;flex-shrink:0;">'
          : '<div style="width:52px;height:52px;border-radius:10px;background:#222;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0;">'+((CONFIG.company.name||'P').slice(0,1))+'</div>')+
        '<div style="flex:1;">'+
          '<div style="font-size:16px;font-weight:800;color:#111;">'+(CONFIG.company.name||'Push Media Co., Ltd')+'</div>'+
          '<div style="font-size:11px;color:#555;">รายงาน KPI พนักงาน (ข้อมูลดิบ)</div>'+
        '</div>'+
        '<div style="text-align:right;">'+
          '<div style="font-size:12px;font-weight:700;color:#111;">ช่วงวันที่ '+rangeLabel+'</div>'+
          '<div style="font-size:10px;color:#777;">พิมพ์เมื่อ '+_drpFmtDisplay(_localDateStr(new Date()))+'</div>'+
        '</div>'+
      '</div>'+
      
      '<div class="print-only pr-grid" style="grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;">'+
        [
          {lbl:'พนักงาน', val:rows.length+' คน'},
          {lbl:'งานรวม', val:sumTaskCount+' งาน'},
          {lbl:'Man-Day รวม', val:sumManDay.toLocaleString('th-TH')},
          {lbl:'วันลารวม', val:sumLeave+' วัน'},
          {lbl:'ค่าใช้จ่ายรวม', val:fMoney(sumCost)},
        ].map(function(s){
          return '<div style="border:1px solid #ddd;border-radius:8px;padding:8px 10px;overflow:hidden;">'+
            '<div style="font-size:9.5px;color:#777;white-space:nowrap;">'+s.lbl+'</div>'+
            '<div style="font-size:14px;font-weight:800;color:#111;white-space:nowrap;">'+s.val+'</div>'+
          '</div>';
        }).join('')+
      '</div>'+
      '<div style="padding:12px 16px;border-bottom:1px solid var(--line-2);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">'+
        '<div class="ct">KPI พนักงาน — <span style="color:var(--teal);">'+rangeLabel+'</span> <span style="color:var(--ink-3);font-weight:400;">('+rows.length+' คน)</span></div>'+
        '<button class="btn btn-p btn-sm no-print" onclick="window.print()">'+fi('file-text',12)+' พิมพ์ / บันทึกเป็น PDF</button>'+
      '</div>'+
      '<div class="tw"><table>'+
        '<thead><tr><th>พนักงาน</th><th>ไปทำงานทีม/แผนกไหนบ้าง</th>'+
          sortBtn('taskCount','งานที่รับ')+sortBtn('manDay','Man-Day')+sortBtn('attend','เข้างาน')+sortBtn('free','วันว่าง')+sortBtn('leave','ลา')+sortBtn('cost','ค่าใช้จ่าย')+
        '</tr></thead>'+
        '<tbody>'+(bodyRows||'<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--ink-3);">ไม่พบพนักงานที่ตรงกับตัวกรอง</td></tr>')+'</tbody>'+
      '</table></div>'+
      
      '<div class="print-only" style="padding:14px 16px 0;margin-top:6px;border-top:1px solid #ddd;font-size:10px;color:#666;line-height:1.6;">'+
        '<b>หมายเหตุ:</b> ตัวเลขในรายงานนี้เป็นข้อมูลดิบ (จำนวนงาน/Man-Day/เข้างาน/วันว่าง/ลา/ค่าใช้จ่าย) ที่ดึงจากระบบโดยตรง ยังไม่มีการให้คะแนนหรือจัดอันดับ KPI รวม — ควรกำหนดสูตรและน้ำหนักการประเมินร่วมกับฝ่าย HR ก่อนนำไปใช้ประเมินผลงานพนักงานจริง · วันว่างไม่นับรวมวันอาทิตย์'+
      '</div>'+
    '</div>';
}


function _empKpiOpenDetail(empCode) {
  var e = DB.employees.find(function(x){ return x.code===empCode; });
  if (!e) return;
  var dateFrom = _empKpiDR.start, dateTo = _empKpiDR.end;
  var tasksInRange = vTasks().filter(function(t){ var ts=t.start||'', te=t.end||ts; return ts<=dateTo && te>=dateFrom && _taskHasMemberInRange(t, empCode, dateFrom, dateTo); });
  var stat = _empKpiCalc(e, tasksInRange, dateFrom, dateTo);

  
  var att = (_empKpiData && _empKpiData.att) || {}, lv = (_empKpiData && _empKpiData.lv) || {};
  var DOW_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  var dayRows = [];
  var cur = new Date(dateFrom + 'T00:00:00'), end = new Date(dateTo + 'T00:00:00');
  
  var dayCount = Math.round((end - cur) / 86400000) + 1;
  var capped = dayCount > 92;
  var loopEnd = capped ? new Date(cur.getTime() + 91*86400000) : end;

  while (cur <= loopEnd) {
    var ds = _localDateStr(cur);
    var dow = cur.getDay();
    var dayTask = null;
    for (var i = 0; i < tasksInRange.length; i++) {
      var t = tasksInRange[i];
      var ts = _normDateStr(t.start), te = _normDateStr(t.end||t.start);
      if (ds >= ts && ds <= te && taskMembersOn(t, ds).indexOf(empCode) >= 0) { dayTask = t; break; }
    }
    var leaveInfo = lv[empCode+'::'+ds];
    var attInfo   = att[empCode+'::'+ds];
    var attTime   = attInfo ? (attInfo.time || attInfo) : null;
    dayRows.push({ ds: ds, dow: dow, task: dayTask, leave: leaveInfo, attTime: attTime });
    cur.setDate(cur.getDate() + 1);
  }

  var dayRowsHtml = dayRows.map(function(r){
    var isWeekend = r.dow===0 || r.dow===6;
    var dateLbl = '<div style="width:52px;flex-shrink:0;text-align:center;">'+
      '<div style="font-size:9.5px;font-weight:700;color:'+(isWeekend?'var(--ink-3)':'var(--ink-2)')+';">'+DOW_TH[r.dow]+'</div>'+
      '<div style="font-size:13px;font-weight:800;color:var(--ink);">'+parseInt(r.ds.slice(8,10))+'</div>'+
    '</div>';
    var statusHtml;
    if (r.task) {
      var d = dOfN(r.task.deptName);
      statusHtml = '<div onclick="closeMd();openDetail('+r.task.id+',\''+r.ds+'\')" style="flex:1;min-width:0;cursor:pointer;background:'+(d?d.color+'12':'var(--bg)')+';border-left:3px solid '+(d?d.color:'var(--line)')+';border-radius:6px;padding:6px 10px;">'+
        '<div style="font-size:11.5px;font-weight:700;color:'+(d?d.color:'var(--ink)')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escapeHtml(r.task.title)+'</div>'+
        '<div style="font-size:9.5px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escapeHtml(r.task.site||'')+(r.attTime?' · เข้างาน '+r.attTime:'')+'</div>'+
      '</div>';
    } else if (r.leave) {
      statusHtml = '<div style="flex:1;background:var(--purple-bg);border-left:3px solid var(--purple);border-radius:6px;padding:6px 10px;">'+
        '<div style="font-size:11.5px;font-weight:700;color:var(--purple);">ลา'+(r.leave.type?' — '+r.leave.type:'')+'</div>'+
      '</div>';
    } else {
      statusHtml = '<div style="flex:1;background:var(--green-bg);border-left:3px solid #16A34A;border-radius:6px;padding:6px 10px;display:flex;align-items:center;">'+
        '<span style="font-size:11.5px;font-weight:700;color:#16A34A;">ว่าง</span>'+
        (r.attTime?'<span style="font-size:9.5px;color:#16A34A;margin-left:auto;">เช็คอิน '+r.attTime+'</span>':'')+
      '</div>';
    }
    return '<div style="display:flex;align-items:stretch;gap:8px;padding:4px 12px;">'+dateLbl+statusHtml+'</div>';
  }).join('') || '<div style="padding:20px;text-align:center;color:var(--ink-3);font-size:12px;">ไม่มีข้อมูลในช่วงนี้</div>';

  var cappedNote = capped ? '<div style="font-size:10px;color:var(--amber);text-align:center;padding:6px;">แสดงได้สูงสุด 92 วัน — ช่วงที่เลือกยาวกว่านี้ กรุณาย่อช่วงวันที่ลง</div>' : '';

  openMd(
    '<div class="md" style="max-width:460px;">'+
      '<div class="mh"><h3>'+(e.nickname||e.name)+' <span style="font-weight:400;color:var(--ink-3);font-size:12px;">('+(e.position||'')+')</span></h3>'+
        '<button class="mc" onclick="closeMd()">'+fi('x',16)+'</button>'+
      '</div>'+
      '<div style="display:flex;gap:8px;padding:12px 18px 0;flex-wrap:wrap;">'+
        '<div style="flex:1;min-width:70px;text-align:center;background:var(--bg);border-radius:8px;padding:8px;"><div style="font-size:16px;font-weight:800;color:var(--teal);">'+stat.taskCount+'</div><div style="font-size:9px;color:var(--ink-3);">งาน</div></div>'+
        '<div style="flex:1;min-width:70px;text-align:center;background:var(--bg);border-radius:8px;padding:8px;"><div style="font-size:16px;font-weight:800;color:#7C3AED;">'+stat.manDay+'</div><div style="font-size:9px;color:var(--ink-3);">Man-Day</div></div>'+
        '<div style="flex:1;min-width:70px;text-align:center;background:var(--bg);border-radius:8px;padding:8px;"><div style="font-size:16px;font-weight:800;color:#16A34A;">'+stat.attendCount+'</div><div style="font-size:9px;color:var(--ink-3);">เข้างาน</div></div>'+
        '<div style="flex:1;min-width:70px;text-align:center;background:var(--bg);border-radius:8px;padding:8px;"><div style="font-size:16px;font-weight:800;color:var(--red);">'+(stat.cost?fMoney(stat.cost):'—')+'</div><div style="font-size:9px;color:var(--ink-3);">ค่าใช้จ่าย</div></div>'+
      '</div>'+
      '<div class="mb" style="padding-top:12px;">'+
        '<div class="fl" style="margin-bottom:6px;">ตารางรายวัน ('+_drpFmtDisplay(dateFrom)+' – '+_drpFmtDisplay(dateTo)+')</div>'+
        cappedNote+
        '<div style="border:1px solid var(--line);border-radius:var(--r);max-height:340px;overflow-y:auto;padding:6px 0;">'+dayRowsHtml+'</div>'+
      '</div>'+
      '<div class="mf"><button class="btn" onclick="closeMd()">ปิด</button></div>'+
    '</div>'
  );
}


function _empKpiSearchPicker(q) {
  var box = document.getElementById('ek-emp-search-results');
  if (!box) return;
  var list = window._empKpiCurrentEmps || [];
  q = (q||'').trim().toLowerCase();
  var matches = q
    ? list.filter(function(e){ return (e.name||'').toLowerCase().indexOf(q)>=0 || (e.nickname||'').toLowerCase().indexOf(q)>=0 || (e.position||'').toLowerCase().indexOf(q)>=0; })
    : list;
  matches = matches.slice(0, 30); 

  if (!matches.length) {
    box.innerHTML = '<div style="padding:10px 14px;font-size:12px;color:var(--ink-3);">ไม่พบพนักงาน</div>';
    box.style.display = 'block';
    return;
  }
  box.innerHTML = matches.map(function(e){
    var d = dOfN(e.dept);
    var ini = (e.nickname||e.name||'?').slice(0,2).toUpperCase();
    var ph = e.photo ? '<img src="'+e.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">' : '<span style="font-size:9px;font-weight:700;color:#fff;">'+ini+'</span>';
    return '<div onmousedown="_empKpiPickEmp(\''+e.code+'\')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--line-2);" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'+
      '<div style="width:26px;height:26px;border-radius:50%;background:'+(d?d.color:'#888')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">'+ph+'</div>'+
      '<div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(e.nickname||e.name)+'</div>'+
      '<div style="font-size:10px;color:var(--ink-3);">'+(e.position||'')+' · '+(e.dept||'')+'</div></div>'+
    '</div>';
  }).join('');
  box.style.display = 'block';
}
function _empKpiPickEmp(code) {
  _empKpiSelectedEmp = code;
  var box = document.getElementById('ek-emp-search-results');
  if (box) box.style.display = 'none';
  renderEmpKpiContent();
}
document.addEventListener('click', function(e){
  var box = document.getElementById('ek-emp-search-results');
  var input = document.getElementById('ek-emp-search');
  if (box && box.style.display !== 'none' && e.target !== input && !box.contains(e.target)) box.style.display = 'none';
});


function _empKpiRenderIndividual() {
  var el = document.getElementById('empkpi-content');
  if (!el) return;

  var dateFrom = _empKpiDR.start, dateTo = _empKpiDR.end;
  var empsBase = DB.employees.filter(function(e){ return e.status==1||e.status==null||e.status===undefined; });
  if (_empKpiDept !== 'all') empsBase = empsBase.filter(function(e){ return e.dept===_empKpiDept || e.dept2===_empKpiDept; });
  if (_empKpiTeam !== 'all') empsBase = empsBase.filter(function(e){ return e.team===_empKpiTeam || e.team2===_empKpiTeam; });
  if (_empKpiName && _empKpiName.trim()) {
    var q0 = _empKpiName.trim().toLowerCase();
    empsBase = empsBase.filter(function(e){ return (e.name||'').toLowerCase().indexOf(q0)>=0 || (e.nickname||'').toLowerCase().indexOf(q0)>=0; });
  }
  var emps = empsBase;
  if (_empKpiPosition !== 'all') emps = emps.filter(function(e){ return (e.position||'').trim() === _empKpiPosition; });
  emps.sort(function(a,b){ return (a.nickname||a.name||'').localeCompare(b.nickname||b.name||'', 'th'); });

  if (!emps.length) {
    el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--ink-3);">ไม่พบพนักงานที่ตรงกับตัวกรอง</div>';
    return;
  }
  if (!_empKpiSelectedEmp || !emps.some(function(e){ return e.code===_empKpiSelectedEmp; })) {
    _empKpiSelectedEmp = emps[0].code;
  }
  var emp = emps.find(function(e){ return e.code===_empKpiSelectedEmp; });
  window._empKpiCurrentEmps = emps; 

  
  
  
  
  var tasksInRange = vTasks().filter(function(t){ var ts=t.start||'', te=t.end||ts; return ts<=dateTo && te>=dateFrom; });
  var stat = _empKpiCalc(emp, tasksInRange, dateFrom, dateTo);
  var empTasks = tasksInRange.filter(function(t){ return _taskHasMemberInRange(t, emp.code, dateFrom, dateTo); });

  var positionPeers = emps.filter(function(e){ return (e.position||'') === (emp.position||'') && e.code !== emp.code; });
  var comparePeers = positionPeers, peerLabelPosition = emp.position || 'นี้', usingBroaderGroup = false;
  
  
  function _empKpiPosGroup(position) {
    var p = position || '';
    if (/technician/i.test(p)) return 'ทีมช่างเทคนิค (Technician / Lead Technician / Senior Technician)';
    if (/it support|senior it/i.test(p)) return 'ทีม IT Support';
    if (/project manager|project assistant|coordinator/i.test(p)) return 'ทีมบริหารโครงการ (Project Manager / Project Assistant)';
    return null;
  }
  if (positionPeers.length < 2) {
    var groupLabel = _empKpiPosGroup(emp.position);
    if (groupLabel) {
      var broaderPeers = emps.filter(function(e){ return _empKpiPosGroup(e.position) === groupLabel && e.code !== emp.code; });
      if (broaderPeers.length >= 2) { comparePeers = broaderPeers; peerLabelPosition = groupLabel; usingBroaderGroup = true; }
    }
  }
  var allStats = [stat].concat(comparePeers.map(function(e){ return _empKpiCalc(e, tasksInRange, dateFrom, dateTo); }));
  var hasEnoughPeers = comparePeers.length >= 2;

  
  var att = (_empKpiData && _empKpiData.att) || {}, lv = (_empKpiData && _empKpiData.lv) || {};
  var DOW_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  var dayRows = [];
  var cur = new Date(dateFrom + 'T00:00:00'), rangeEnd = new Date(dateTo + 'T00:00:00');
  var dayCount = Math.round((rangeEnd - cur) / 86400000) + 1;
  var capped = dayCount > 92;
  var loopEnd = capped ? new Date(cur.getTime() + 91*86400000) : rangeEnd;
  while (cur <= loopEnd) {
    var ds = _localDateStr(cur);
    var dow = cur.getDay();
    var dayTask = null;
    for (var i=0;i<empTasks.length;i++) {
      var t = empTasks[i];
      var ts=_normDateStr(t.start), te=_normDateStr(t.end||t.start);
      if (ds>=ts && ds<=te && taskMembersOn(t,ds).indexOf(emp.code)>=0) { dayTask=t; break; }
    }
    var leaveInfo = lv[emp.code+'::'+ds];
    var attInfo = att[emp.code+'::'+ds];
    dayRows.push({ ds:ds, dow:dow, task:dayTask, leave:leaveInfo, attTime: attInfo?(attInfo.time||attInfo):null });
    cur.setDate(cur.getDate()+1);
  }

  
  var teamBreakdownList = stat.teamBreakdown || [];

  
  var attTableRows = dayRows.map(function(r){
    var isWeekend = r.dow===0||r.dow===6;
    var statusCell;
    if (r.task) {
      var d = dOfN(r.task.deptName);
      statusCell = '<span style="color:'+(d?d.color:'var(--ink)')+';font-weight:700;">'+escapeHtml(r.task.title)+'</span> <span style="color:var(--ink-3);">— '+escapeHtml(r.task.site||'')+'</span>';
    } else if (r.leave) {
      statusCell = '<span style="color:var(--purple);font-weight:700;">ลา'+(r.leave.type?' ('+r.leave.type+')':'')+'</span>';
    } else {
      statusCell = '<span style="color:#16A34A;font-weight:700;">ว่าง</span>';
    }
    return '<tr style="'+(isWeekend?'background:var(--bg);':'')+'">'+
      '<td style="font-size:11px;white-space:nowrap;">'+DOW_TH[r.dow]+' '+parseInt(r.ds.slice(8,10))+'/'+parseInt(r.ds.slice(5,7))+'</td>'+
      '<td style="font-size:11px;">'+statusCell+'</td>'+
      '<td style="font-size:11px;text-align:center;color:var(--ink-3);">'+(r.attTime||'—')+'</td>'+
    '</tr>';
  }).join('');

  var freeDayRows = dayRows.filter(function(r){ return !r.task && !r.leave && r.dow !== 0; }); 
  var freeDaysChips = freeDayRows.map(function(r){
    return '<span style="display:inline-flex;align-items:center;gap:3px;background:var(--green-bg);color:#166534;border-radius:6px;padding:3px 8px;font-size:10.5px;font-weight:700;white-space:nowrap;">'+DOW_TH[r.dow]+' '+parseInt(r.ds.slice(8,10))+'/'+parseInt(r.ds.slice(5,7))+'</span>';
  }).join('');

  
  var taskTableRows = empTasks.slice().sort(function(a,b){ return (a.start||'').localeCompare(b.start||''); }).map(function(t){
    var d = dOfN(t.deptName);
    var c = totalCost(t);
    return '<tr>'+
      '<td style="font-size:11px;font-weight:600;">'+escapeHtml(t.title)+'<div style="font-size:9.5px;color:var(--ink-3);font-weight:400;">'+escapeHtml(t.site||'')+'</div></td>'+
      '<td>'+deptBadge(t.deptName)+'</td>'+
      '<td style="font-size:11px;">'+t.teamName+'</td>'+
      '<td style="font-size:11px;white-space:nowrap;">'+fDate(t.start)+(t.end&&t.end!==t.start?' – '+fDate(t.end):'')+'</td>'+
      '<td style="text-align:right;font-size:11px;font-weight:700;color:'+(c?'var(--red)':'var(--ink-3)')+';">'+(c?fMoney(c):'—')+'</td>'+
    '</tr>';
  }).join('') || '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--ink-3);">ไม่มีงานในช่วงนี้</td></tr>';

  
  var n = allStats.length || 1;
  var avgTask  = allStats.reduce(function(s,r){ return s+r.taskCount; },0)/n;
  var avgMD    = allStats.reduce(function(s,r){ return s+r.manDay; },0)/n;
  var avgLeave = allStats.reduce(function(s,r){ return s+r.leaveCount; },0)/n;
  var peerLabel = (usingBroaderGroup ? peerLabelPosition : 'ตำแหน่ง '+peerLabelPosition) + ' ('+(comparePeers.length+1)+' คน)';

  var insights = [];
  if (!hasEnoughPeers) {
    insights.push({ sev:'neutral', text:'ในขอบเขตที่กรองไว้ มีพนักงานตำแหน่ง '+(emp.position||'นี้')+' อยู่เพียงคนเดียว (และไม่มีตำแหน่งใกล้เคียงพอให้เทียบแทนได้) จึงยังไม่มีข้อมูลเพียงพอสำหรับเปรียบเทียบ — ลองขยายขอบเขตแผนก/ทีมที่กรองไว้ ถ้าต้องการดูค่าเทียบเคียง' });
  } else if (usingBroaderGroup) {
    insights.push({ sev:'neutral', text:'มีพนักงานตำแหน่ง '+emp.position+' เพียงคนเดียวในขอบเขตที่กรองไว้ — เปรียบเทียบกับ'+peerLabelPosition+'แทน เพื่อให้มีฐานเทียบที่มีความหมายมากขึ้น' });
  }
  if (stat.taskCount === 0) {
    insights.push({ sev:'warn', text:'ไม่มีงานที่ถูกจัดสรรในช่วงเวลานี้เลย (จากตารางงาน) — ควรตรวจสอบว่าเป็นช่วงพัก/ไม่ได้ลงตาราง หรือข้อมูลตกหล่น' });
  } else if (hasEnoughPeers && avgTask > 0) {
    var ratio = stat.taskCount / avgTask;
    if (ratio >= 1.3) insights.push({ sev:'good', text:'จำนวนงานที่รับ (จากตารางงาน) สูงกว่าค่าเฉลี่ยของเพื่อนร่วม'+peerLabel+' '+Math.round((ratio-1)*100)+'% — '+stat.taskCount+' งาน เทียบค่าเฉลี่ย '+avgTask.toFixed(1)+' งาน' });
    else if (ratio <= 0.6) insights.push({ sev:'warn', text:'จำนวนงานที่รับ (จากตารางงาน) ต่ำกว่าค่าเฉลี่ยของเพื่อนร่วม'+peerLabel+'ค่อนข้างมาก — '+stat.taskCount+' งาน เทียบค่าเฉลี่ย '+avgTask.toFixed(1)+' งาน อาจมีกำลังคนว่างให้จัดงานเพิ่มได้'});
    else insights.push({ sev:'neutral', text:'จำนวนงานที่รับ (จากตารางงาน) อยู่ในระดับใกล้เคียงค่าเฉลี่ยของเพื่อนร่วม'+peerLabel+' — '+stat.taskCount+' งาน เทียบค่าเฉลี่ย '+avgTask.toFixed(1)+' งาน' });
  }
  
  if (stat.uniqueTaskDays > 0) {
    var attRatio = stat.taskDayAttendCount / stat.uniqueTaskDays;
    var missedDays = stat.uniqueTaskDays - stat.taskDayAttendCount;
    if (attRatio >= 0.9) insights.push({ sev:'good', text:'มีข้อมูลเช็คอิน (จากระบบเช็คอิน) ตรงกับวันที่มีงานจริงครบเกือบทั้งหมด — เช็คอินแล้ว '+stat.taskDayAttendCount+' จาก '+stat.uniqueTaskDays+' วันที่มีงาน ('+Math.round(attRatio*100)+'%)' });
    else if (attRatio < 0.6) insights.push({ sev:'warn', text:'มีวันที่มีงาน (จากตารางงาน) แต่ไม่พบข้อมูลเช็คอิน (จากระบบเช็คอิน) '+missedDays+' วัน จากทั้งหมด '+stat.uniqueTaskDays+' วันที่มีงาน — ควรตรวจสอบสาเหตุ (ลืมเช็คอิน หรือทำงานนอกพื้นที่ที่ไม่ได้บันทึก)'});
    if (stat.attendCount > stat.taskDayAttendCount) {
      insights.push({ sev:'neutral', text:'มีการเช็คอินเพิ่มเติมอีก '+(stat.attendCount-stat.taskDayAttendCount)+' วัน ในวันที่ไม่มีงานถูกจัดไว้ในตารางงาน (เช่น เข้าออฟฟิศ/งานที่ไม่ได้ลงระบบ) — รวมเช็คอินทั้งหมดในช่วงนี้ '+stat.attendCount+' วัน' });
    }
  }
  if (hasEnoughPeers && stat.leaveCount >= 2 && avgLeave > 0 && stat.leaveCount > avgLeave*1.5) {
    insights.push({ sev:'warn', text:'จำนวนวันลา (จากระบบการลา) สูงกว่าค่าเฉลี่ยของเพื่อนร่วม'+peerLabel+' — '+stat.leaveCount+' วัน เทียบค่าเฉลี่ย '+avgLeave.toFixed(1)+' วัน' });
  }
  if (stat.cost > 0) {
    insights.push({ sev:'neutral', text:'มีค่าใช้จ่ายพิเศษที่คำนวณจากวันที่เข้างานจริงรวม '+fMoney(stat.cost)+' ในช่วงเวลานี้ (ค่าวันหยุด 700฿/วัน + ค่าต่างจังหวัด 300฿/วัน เฉพาะวันที่พนักงานคนนี้เข้างานจริงเท่านั้น)' });
  }
  if (!insights.length) insights.push({ sev:'neutral', text:'ไม่มีข้อมูลเพียงพอสำหรับสรุปประเมินในช่วงเวลานี้' });

  var SEV_C = { good:'#16A34A', warn:'#D97706', neutral:'var(--ink-2)' };
  var SEV_ICON = { good:'check-circle', warn:'alert-triangle', neutral:'info' };
  var insightsHtml = insights.map(function(ins){
    return '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid var(--line-2);">'+
      fi(SEV_ICON[ins.sev],14,'','color:'+SEV_C[ins.sev]+';flex-shrink:0;margin-top:1px;')+
      '<span style="font-size:12px;color:var(--ink-2);line-height:1.5;">'+ins.text+'</span>'+
    '</div>';
  }).join('');

  var d0 = dOfN(emp.dept);
  var avHtml = emp.photo
    ? '<img src="'+emp.photo+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display=\'none\'">'
    : '<span style="font-size:18px;font-weight:700;color:#fff;">'+((emp.nickname||emp.name||'?').slice(0,2).toUpperCase())+'</span>';

  el.innerHTML =
    '<div class="no-print" style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;flex-wrap:wrap;">'+
      '<div style="flex:1;min-width:240px;position:relative;">'+
        '<div class="dash-filter-label" style="margin-bottom:4px;">เลือกพนักงาน ('+emps.length+' คน)</div>'+
        '<div style="position:relative;">'+
          '<input type="text" class="name-search-pill" id="ek-emp-search" placeholder="'+(emp.nickname||emp.name)+' — '+(emp.position||'')+'" oninput="_empKpiSearchPicker(this.value)" onfocus="_empKpiSearchPicker(this.value)" autocomplete="off" style="width:100%;">'+
          '<div id="ek-emp-search-results" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:0 8px 24px rgba(0,0,0,.12);max-height:260px;overflow-y:auto;z-index:60;"></div>'+
        '</div>'+
      '</div>'+
      '<button class="btn btn-p" onclick="window.print()">'+fi('file-text',13)+' พิมพ์ / บันทึกเป็น PDF</button>'+
    '</div>'+
    '<div class="card" id="empkpi-print-area" style="padding:20px 22px;">'+
      
      '<div class="print-only pr-flex" style="padding:0 0 14px;border-bottom:2px solid #222;margin-bottom:14px;align-items:center;gap:14px;">'+
        (CONFIG.company.logo && CONFIG.company.logo.startsWith('data:')
          ? '<img src="'+CONFIG.company.logo+'" style="width:46px;height:46px;object-fit:cover;border-radius:9px;flex-shrink:0;">'
          : '<div style="width:46px;height:46px;border-radius:9px;background:#222;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;flex-shrink:0;">'+((CONFIG.company.name||'P').slice(0,1))+'</div>')+
        '<div style="flex:1;">'+
          '<div style="font-size:14px;font-weight:800;color:#111;">'+(CONFIG.company.name||'Push Media Co., Ltd')+'</div>'+
          '<div style="font-size:10.5px;color:#555;">รายงาน KPI พนักงานรายบุคคล (ข้อมูลดิบ)</div>'+
        '</div>'+
        '<div style="font-size:10px;color:#777;text-align:right;">พิมพ์เมื่อ '+_drpFmtDisplay(_localDateStr(new Date()))+'</div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:2px solid var(--line-2);margin-bottom:16px;">'+
        '<div style="width:56px;height:56px;border-radius:50%;background:'+(d0?d0.color:'var(--teal)')+';display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;">'+avHtml+'</div>'+
        '<div style="flex:1;">'+
          '<div style="font-size:18px;font-weight:800;color:var(--ink);">'+(emp.nickname?emp.nickname+' — ':'')+emp.name+'</div>'+
          '<div style="font-size:12px;color:var(--ink-3);">'+(emp.position||'')+' · '+(emp.dept||'')+(emp.team?' · '+emp.team:'')+'</div>'+
        '</div>'+
        '<div style="text-align:right;">'+
          '<div style="font-size:9.5px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.04em;">รายงาน KPI พนักงานรายบุคคล</div>'+
          '<div style="font-size:12px;font-weight:700;color:var(--ink-2);">'+_drpFmtDisplay(dateFrom)+' – '+_drpFmtDisplay(dateTo)+'</div>'+
        '</div>'+
      '</div>'+

      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">'+
        '<div style="flex:1;min-width:90px;text-align:center;background:var(--bg);border-radius:8px;padding:10px;"><div style="font-size:20px;font-weight:800;color:var(--teal);">'+stat.taskCount+'</div><div style="font-size:9.5px;color:var(--ink-3);">งานที่รับ</div></div>'+
        '<div style="flex:1;min-width:90px;text-align:center;background:var(--bg);border-radius:8px;padding:10px;"><div style="font-size:20px;font-weight:800;color:#7C3AED;">'+stat.manDay+'</div><div style="font-size:9.5px;color:var(--ink-3);">Man-Day</div></div>'+
        '<div style="flex:1;min-width:90px;text-align:center;background:var(--bg);border-radius:8px;padding:10px;"><div style="font-size:20px;font-weight:800;color:#16A34A;">'+stat.attendCount+'</div><div style="font-size:9.5px;color:var(--ink-3);">เข้างาน</div></div>'+
        '<div style="flex:1;min-width:90px;text-align:center;background:var(--bg);border-radius:8px;padding:10px;"><div style="font-size:20px;font-weight:800;color:var(--purple);">'+stat.leaveCount+'</div><div style="font-size:9.5px;color:var(--ink-3);">ลา</div></div>'+
        '<div style="flex:1;min-width:90px;text-align:center;background:var(--bg);border-radius:8px;padding:10px;"><div style="font-size:20px;font-weight:800;color:var(--red);">'+(stat.cost?fMoney(stat.cost):'—')+'</div><div style="font-size:9.5px;color:var(--ink-3);">ค่าใช้จ่าย</div></div>'+
      '</div>'+

      (teamBreakdownList.length ? (
        '<div style="font-size:12.5px;font-weight:800;color:var(--ink);margin-bottom:8px;">แยกงานตามแผนก/ทีม ('+teamBreakdownList.length+' ทีม)</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">'+
          teamBreakdownList.map(function(x){
            var d = dOfN(x.dept);
            var color = d ? d.color : '#888';
            return '<div style="background:'+color+'12;border-left:3px solid '+color+';border-radius:6px;padding:8px 12px;min-width:130px;">'+
              '<div style="font-size:11.5px;font-weight:700;color:'+color+';">'+x.team+'</div>'+
              '<div style="font-size:9.5px;color:var(--ink-3);margin-bottom:3px;">'+x.dept+'</div>'+
              '<div style="font-size:15px;font-weight:800;color:'+color+';">'+x.count+' <span style="font-size:9.5px;font-weight:600;color:var(--ink-3);">งาน</span></div>'+
            '</div>';
          }).join('') +
        '</div>'
      ) : '') +

      '<div style="font-size:12.5px;font-weight:800;color:var(--ink);margin-bottom:8px;">วันว่าง ('+freeDayRows.length+' วัน — ไม่รวมวันอาทิตย์'+(capped?', จาก 92 วันแรก':'')+')</div>'+
      (freeDayRows.length
        ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;">'+freeDaysChips+'</div>'
        : '<div style="font-size:11px;color:var(--ink-3);margin-bottom:20px;">ไม่มีวันว่างในช่วงเวลานี้ — ถูกจัดงานหรือลาเต็มทุกวัน</div>') +

      '<div style="font-size:12.5px;font-weight:800;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px;">'+fi('zap',13,'','color:#7C3AED;')+'สรุปประเมินอัตโนมัติ</div>'+
      '<div style="background:var(--bg);border-radius:8px;padding:4px 14px;margin-bottom:8px;">'+insightsHtml+'</div>'+
      '<div style="font-size:9.5px;color:var(--ink-3);margin-bottom:8px;">สรุปนี้คำนวณจากกฎเปรียบเทียบทางสถิติกับ<strong>เพื่อนร่วมตำแหน่งเดียวกัน</strong>เท่านั้น ('+peerLabel+' ในขอบเขตที่กรองไว้) — ไม่ได้เทียบกับพนักงานทุกตำแหน่งรวมกัน เพราะแต่ละตำแหน่งมีรูปแบบงานต่างกัน ไม่ใช่การให้คะแนนหรือประเมินผลงานอย่างเป็นทางการ ควรใช้ประกอบการพิจารณาร่วมกับดุลยพินิจของหัวหน้างาน/ฝ่าย HR</div>'+
      '<div style="font-size:9.5px;color:var(--ink-3);margin-bottom:20px;background:var(--bg);border-radius:6px;padding:8px 12px;">'+
        '<strong style="color:var(--ink-2);">ที่มาของข้อมูล:</strong> งานที่รับ/Man-Day = ตารางงาน (Planner/Task Manager) · เข้างาน = ระบบเช็คอิน (คอลัมน์ตำแหน่ง GPS ในชีตเช็คอินรายเดือน) · ลา = ระบบบันทึกการลา · ค่าใช้จ่าย = คำนวณจากวันหยุด (700฿/วัน) และต่างจังหวัด (300฿/วัน) เฉพาะวันที่พนักงานคนนี้เข้างานจริงตามตารางงาน'+
      '</div>'+

      '<div style="font-size:12.5px;font-weight:800;color:var(--ink);margin-bottom:8px;">ตารางการลงเวลา ('+dayRows.length+' วัน'+(capped?' — แสดงสูงสุด 92 วันแรก':'')+')</div>'+
      '<div style="border:1px solid var(--line);border-radius:var(--r);overflow:hidden;margin-bottom:20px;">'+
        '<div style="max-height:320px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;">'+
          '<thead style="position:sticky;top:0;"><tr><th style="text-align:left;">วันที่</th><th style="text-align:left;">สถานะ</th><th style="text-align:center;">เวลาเช็คอิน</th></tr></thead>'+
          '<tbody>'+attTableRows+'</tbody>'+
        '</table></div>'+
      '</div>'+

      '<div style="font-size:12.5px;font-weight:800;color:var(--ink);margin-bottom:8px;">รายละเอียดงาน ('+empTasks.length+' งาน)</div>'+
      '<div class="tw" style="border:1px solid var(--line);border-radius:var(--r);overflow:hidden;">'+
        '<table><thead><tr><th>ชื่องาน / สถานที่</th><th>แผนก</th><th>ทีม</th><th>วันที่</th><th style="text-align:right;">ค่าใช้จ่าย</th></tr></thead>'+
        '<tbody>'+taskTableRows+'</tbody></table>'+
      '</div>'+

      '<div style="margin-top:20px;padding-top:12px;border-top:1px solid var(--line-2);font-size:9.5px;color:var(--ink-3);text-align:center;">'+
        'ตัวเลขในรายงานนี้เป็นข้อมูลดิบ ยังไม่มีการให้คะแนนหรือจัดอันดับ KPI — ควรกำหนดสูตร/น้ำหนักร่วมกับฝ่าย HR ก่อนนำไปใช้ประเมินผลงานจริง · วันว่างไม่นับรวมวันอาทิตย์'+
      '</div>'+
      '<div style="margin-top:4px;font-size:9.5px;color:var(--ink-3);text-align:center;">'+
        'ออกรายงานเมื่อ '+new Date().toLocaleString('th-TH')+' · '+(CONFIG.company.name||'Push Media Co., Ltd')+' — Workforce Task Manager'+
      '</div>'+
    '</div>';
}

function pgTasks() {
  if (can('createTask'))
    document.getElementById('tb-actions').innerHTML = `<button class="btn btn-p" onclick="openCreate()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> สร้างงาน</button>`;
  const SCHED_TASK_DEPTS = ['LED','Digital Signage & Retail','Business Development'];
  const depts = vDepts().filter(d => SCHED_TASK_DEPTS.includes(d.name));
  document.getElementById('content').innerHTML = `
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
    <div class="search-bar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" placeholder="ค้นหางาน..." id="ts-q" oninput="filterTasks()"></div>
    <select class="fc" style="width:auto;padding:5px 10px;" id="ts-d" onchange="filterTasks()">
      <option value="all">ทุกแผนก</option>
      ${depts.map(d => `<option value="${d.name}">${d.icon} ${d.name}</option>`).join('')}
    </select>
  </div>
  <div class="card" style="padding:0;overflow:hidden;" id="task-table">
    ${buildTaskTbl(vTasks())}
  </div>`;
}

function buildTaskTbl(tasks) {
  if (!tasks.length) return '<div style="text-align:center;padding:40px;color:var(--ink-3);font-size:13px;">ไม่มีงานที่ตรงกัน</div>';
  return `<div class="tw"><table>
    <thead><tr><th>#</th><th>งาน / สถานที่</th><th>แผนก</th><th>ทีม</th><th>วันที่</th><th>OT</th><th>ค่าพิเศษ</th><th></th></tr></thead>
    <tbody>${tasks.map(t => {
      const cost = totalCost(t), hd = hdDays(t).length;
      return `<tr>
        <td style="font-family:\x27IBM Plex Mono\x27,monospace;font-size:10px;color:var(--ink-3);">${t.id}</td>
        <td style="cursor:pointer;" onclick="openDetail(${t.id})">
          <div style="font-weight:600;font-size:12px;">${escapeHtml(t.title)}</div>
          <div style="font-size:10px;color:var(--ink-3);"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${escapeHtml(t.site)}</div>
          ${hd > 0 ? `<div style="font-size:10px;color:var(--red);display:flex;align-items:center;gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> ${hd} วันหยุด</div>` : ''}
          ${(function(){ try{ var c = WTMPhoto.countFor(t.id); return c ? `<div style="font-size:10px;color:var(--ink-3);">📷 ${c} รูปหน้างาน</div>` : ''; }catch(_){ return ''; } })()}
        </td>
        <td>${deptBadge(t.deptName)}</td>
        <td style="font-size:11px;">${t.teamName || '-'}</td>
        <td style="font-size:11px;white-space:nowrap;">${fDate(t.start)}${t.start !== t.end ? `–${fDate(t.end)}` : ''}</td>
        <td style="text-align:center;">${t.otHours ? `<span class="badge ba">${t.otHours}h</span>` : '<span style="color:var(--ink-3);">—</span>'}</td>
        <td style="text-align:right;font-family:\x27IBM Plex Mono\x27,monospace;">${cost ? `<span style="color:var(--red);font-weight:700;">${fMoney(cost)}</span>` : '<span style="color:var(--ink-3);">—</span>'}</td>
        <td>${canEditTask(t) ? `<button class="btn btn-sm btn-ico" onclick="openEdit(${t.id})" title="แก้ไข"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>` : ''}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function filterTasks() {
  const q  = (document.getElementById('ts-q')?.value || '').toLowerCase();
  const dF = document.getElementById('ts-d')?.value || 'all';
  let tasks = vTasks();
  if (q)   tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.site.toLowerCase().includes(q) || (t.customer||'').toLowerCase().includes(q));
  if (dF !== 'all') tasks = tasks.filter(t => t.deptName === dF);
  document.getElementById('task-table').innerHTML = buildTaskTbl(tasks);
}