let buildingData = {};
let selectedBuildingId = '';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('./data.json');
        if (!res.ok) throw new Error('Network response was not ok');
        buildingData = await res.json();
        
        // เติม Dropdown
        const select = document.getElementById('building-select');
        Object.keys(buildingData).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            // ดึงตัวเลขจาก key เช่น building_10 -> 10
            const num = key.split('_')[1];
            opt.textContent = `ตึก ${num}: ${buildingData[key].name_th}`;
            select.appendChild(opt);
        });

        select.onchange = (e) => e.target.value && selectBuilding(e.target.value);
        document.getElementById('search-input').oninput = handleSearch;
    } catch (error) {
        console.error('Error loading data:', error);
        alert('ไม่สามารถโหลดข้อมูลแผนที่ได้ กรุณาตรวจสอบไฟล์ data.json');
    }
});

function handleSearch(e) {
    const q = e.target.value.toLowerCase();
    const resDiv = document.getElementById('search-results');
    resDiv.innerHTML = '';
    
    if (q.length < 2) return resDiv.classList.add('hidden');

    Object.keys(buildingData).forEach(id => {
        const b = buildingData[id];
        if (b.departments) {
            b.departments.forEach(d => {
                const isMatch = d.name_th.toLowerCase().includes(q) || 
                               (d.keywords && d.keywords.some(k => k.includes(q)));
                
                if (isMatch) {
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
        }
    });
    resDiv.classList.remove('hidden');
}

function selectBuilding(id, dept = null) {
    selectedBuildingId = id;
    const b = buildingData[id];
    if (!b) return;

    // แสดงตัวเลขตึก
    document.getElementById('building-number').textContent = id.split('_')[1];
    document.getElementById('building-name-th').textContent = b.name_th;
    document.getElementById('building-name-en').textContent = b.name_en || '';
    document.getElementById('building-photo').src = b.photo_path;
    
    const desc = document.getElementById('building-description');
    // ตรวจสอบว่ามี description หรือไม่ ถ้าไม่มีให้ว่างไว้
    const buildingDesc = b.description || "";
    
    desc.innerHTML = dept 
        ? `<div style="background:#fff3f3; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #ffcccc;">
             <p style="color:#e74c3c; margin:0;">📍 แผนกที่ค้นหา: <b>${dept.name_th}</b></p>
             <p style="margin:5px 0 0 0;"><b>ตั้งอยู่ชั้นที่ ${dept.floor}</b></p>
           </div>${buildingDesc}`
        : buildingDesc;

    document.getElementById('details-section').classList.remove('hidden');
    document.getElementById('details-section').scrollIntoView({ behavior: 'smooth' });
}

function startNavigation() {
    if (!selectedBuildingId) return;
    const b = buildingData[selectedBuildingId];
    // ใช้เครื่องหมาย $ ในการเชื่อมตัวแปร ${b.lat}
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=walking`, '_blank');
}