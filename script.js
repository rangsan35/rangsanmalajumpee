let buildingData = {};
let selectedBuildingId = '';

document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('./data.json');
    buildingData = await res.json();
    
    // เติม Dropdown
    const select = document.getElementById('building-select');
    Object.keys(buildingData).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `ตึก ${key.split('_')[1]}: ${buildingData[key].name_th}`;
        select.appendChild(opt);
    });

    select.onchange = (e) => e.target.value && selectBuilding(e.target.value);
    document.getElementById('search-input').oninput = handleSearch;
});

function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    const resDiv = document.getElementById('search-results');
    resDiv.innerHTML = '';
    
    if (q.length < 2) return resDiv.classList.add('hidden');

    Object.keys(buildingData).forEach(id => {
        const b = buildingData[id];
        b.departments.forEach(d => {
            if (d.name_th.toLowerCase().includes(q) || d.keywords.some(k => k.includes(q))) {
                const item = document.createElement('div');
                item.className = 'result-item';
                item.innerHTML = `<strong>${d.name_th}</strong> <span class="floor-badge">ชั้น ${d.floor}</span><br><small>${b.name_th}</small>`;
                item.onclick = () => {
                    selectBuilding(id, d);
                    resDiv.classList.add('hidden');
                    document.getElementById('search-input').value = d.name_th;
                };
                resDiv.appendChild(item);
            }
        });
    });
    resDiv.classList.remove('hidden');
}

function selectBuilding(id, dept = null) {
    selectedBuildingId = id;
    const b = buildingData[id];
    document.getElementById('building-number').textContent = id.split('_')[1];
    document.getElementById('building-name-th').textContent = b.name_th;
    document.getElementById('building-name-en').textContent = b.name_en;
    document.getElementById('building-photo').src = b.photo_path;
    
    const desc = document.getElementById('building-description');
    desc.innerHTML = dept 
        ? `<p style="color:#e74c3c">📍 พบที่: <b>${dept.name_th} ชั้น ${dept.floor}</b></p>${b.description}`
        : b.description;

    document.getElementById('details-section').classList.remove('hidden');
    document.getElementById('details-section').scrollIntoView({behavior: 'smooth'});
}

function startNavigation() {
    if (!selectedBuildingId) return;
    const b = buildingData[selectedBuildingId];
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=walking`, '_blank');
}