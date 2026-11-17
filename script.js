let buildingData = {};
let selectedBuildingId = '';
let openDepartment = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // ตรวจกับเซิร์ฟเวอร์ทุกครั้ง เพื่อให้เห็นข้อมูลที่ admin เพิ่งแก้
        const res = await fetch('./data.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Network response was not ok');
        buildingData = await res.json();

        // เติม Dropdown เรียงตามเลขตึกที่แสดงบนแผนที่
        const select = document.getElementById('building-select');
        Object.keys(buildingData)
            .sort((a, b) => Number(buildingNumber(a)) - Number(buildingNumber(b)))
            .forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = `ตึก ${buildingNumber(key)}: ${buildingData[key].name_th}`;
                select.appendChild(opt);
            });

        select.onchange = (e) => e.target.value && selectBuilding(e.target.value);
        document.getElementById('search-input').oninput = handleSearch;
    } catch (error) {
        console.error('Error loading data:', error);
        alert('ไม่สามารถโหลดข้อมูลแผนที่ได้ กรุณาตรวจสอบไฟล์ data.json');
    }
});

/** เลขตึกที่แสดง = เลขในวงกลมบนแผนที่ (ถ้าไม่พบหมุด ใช้เลขจากรหัส เช่น building_10 -> 10) */
function buildingNumber(id) {
    const pin = document.querySelector(`.b-group[onclick*="'${id}'"] .b-label`);
    return pin ? pin.textContent.trim() : id.split('_')[1];
}

function createFloorBadge(floor) {
    const badge = document.createElement('span');
    badge.className = 'floor-badge';
    badge.textContent = `ชั้น ${floor}`;
    return badge;
}

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
                               (d.keywords && d.keywords.some(k => k.toLowerCase().includes(q)));

                if (isMatch) {
                    const item = document.createElement('div');
                    item.className = 'result-item';
                    const name = document.createElement('strong');
                    name.textContent = d.name_th;
                    const buildingName = document.createElement('small');
                    buildingName.textContent = b.name_th;
                    item.append(name, ' ', createFloorBadge(d.floor), document.createElement('br'), buildingName);
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

/** เลือกตึก ถ้าส่งแผนกมาด้วย (จากการค้นหา) จะกางรูปแผนกนั้นและเลื่อนไปหา */
function selectBuilding(id, dept = null) {
    selectedBuildingId = id;
    const b = buildingData[id];
    if (!b) return;

    // แสดงตัวเลขตึก
    document.getElementById('building-number').textContent = buildingNumber(id);
    document.getElementById('building-name-th').textContent = b.name_th;
    document.getElementById('building-name-en').textContent = b.name_en || '';
    const photo = document.getElementById('building-photo');
    photo.src = b.photo_path;
    photo.alt = b.name_th;
    document.getElementById('building-description').textContent = b.description || '';

    openDepartment = dept;
    const openEntry = renderDepartmentList(b);

    document.getElementById('details-section').classList.remove('hidden');
    (openEntry || document.getElementById('details-section')).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** สร้างรายชื่อแผนก และคืนแถวของแผนกที่กางอยู่ (ถ้ามี) */
function renderDepartmentList(b) {
    const section = document.getElementById('department-section');
    const list = document.getElementById('department-list');
    list.innerHTML = '';

    const departments = [...(b.departments || [])].sort((x, y) => x.floor - y.floor);
    section.classList.toggle('hidden', departments.length === 0);

    let openEntry = null;
    departments.forEach((d, index) => {
        const isOpen = d === openDepartment;
        const panelId = `department-panel-${index}`;
        const entry = document.createElement('div');
        entry.className = 'department-entry';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'department-item';
        button.setAttribute('aria-expanded', String(isOpen));
        button.setAttribute('aria-controls', panelId);
        if (isOpen) button.classList.add('active');
        const name = document.createElement('span');
        name.className = 'department-name';
        name.textContent = d.name_th;
        button.append(name, createFloorBadge(d.floor));
        button.onclick = () => toggleDepartment(b, d);
        entry.appendChild(button);

        if (isOpen) {
            entry.appendChild(createDepartmentPanel(d, panelId));
            openEntry = entry;
        }
        list.appendChild(entry);
    });
    return openEntry;
}

/** แตะแผนกที่กางอยู่ = หุบ, แตะแผนกอื่น = หุบอันเดิมแล้วกางอันใหม่ */
function toggleDepartment(b, d) {
    openDepartment = openDepartment === d ? null : d;
    const openEntry = renderDepartmentList(b);
    if (openEntry) openEntry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function createDepartmentPanel(d, panelId) {
    const panel = document.createElement('div');
    panel.className = 'department-panel';
    panel.id = panelId;

    const floor = document.createElement('p');
    floor.className = 'department-floor';
    floor.textContent = `📍 ตั้งอยู่ชั้นที่ ${d.floor}`;
    panel.appendChild(floor);

    const photos = Array.isArray(d.photos) ? d.photos : [];
    if (photos.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'department-no-photo';
        empty.textContent = 'ยังไม่มีรูปของแผนกนี้';
        panel.appendChild(empty);
    } else {
        panel.appendChild(createGallery(photos, d.name_th));
    }
    return panel;
}

/** แกลเลอรีของแผนกเดียว: ปุ่มซ้าย/ขวา, ปัดบนมือถือ, ตัวนับรูป */
function createGallery(photos, altText) {
    let index = 0;
    const gallery = document.createElement('div');
    gallery.className = 'dept-gallery';
    const img = document.createElement('img');
    gallery.appendChild(img);

    const counter = document.createElement('div');
    const show = (step) => {
        index = (index + step + photos.length) % photos.length;
        img.src = photos[index];
        img.alt = `${altText} รูปที่ ${index + 1}`;
        counter.textContent = `${index + 1} / ${photos.length}`;
    };

    if (photos.length > 1) {
        const prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'gallery-nav gallery-prev';
        prev.setAttribute('aria-label', 'รูปก่อนหน้า');
        prev.textContent = '‹';
        prev.onclick = () => show(-1);

        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'gallery-nav gallery-next';
        next.setAttribute('aria-label', 'รูปถัดไป');
        next.textContent = '›';
        next.onclick = () => show(1);

        counter.className = 'gallery-counter';
        counter.setAttribute('aria-live', 'polite');
        gallery.append(prev, next, counter);

        let touchStartX = null;
        gallery.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });
        gallery.addEventListener('touchend', (e) => {
            if (touchStartX === null) return;
            const distance = e.changedTouches[0].clientX - touchStartX;
            touchStartX = null;
            if (Math.abs(distance) >= 40) show(distance < 0 ? 1 : -1);
        }, { passive: true });
    }
    show(0);
    return gallery;
}

function startNavigation() {
    if (!selectedBuildingId) return;
    const b = buildingData[selectedBuildingId];
    // ใช้พิกัดของตึกเสมอ แม้จะเลือกแผนกย่อยอยู่
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=walking`, '_blank');
}
