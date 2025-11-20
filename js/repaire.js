
    const API_URL = 'https://script.google.com/macros/s/AKfycbzqYCUBP4veNrL1AujcuaCLwGtO59HSTcCcfdCgXqOCYE5Jc7bD5Ewnf3_qiPpIWtks/exec';
    
    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let employeeData = [];
    let idUpdateInterval;

    function closeAddModal() {
        document.getElementById('addModal').classList.remove('active');
        document.getElementById('addForm').reset();
        stopIdUpdate();
    }

    function closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
        document.getElementById('editForm').reset();
    }

    function closeCopyModal() {
        document.getElementById('copyModal').classList.remove('active');
        document.getElementById('copyForm').reset();
        stopIdUpdate();
    }

    // ========== 5-SECOND COOLDOWN SYSTEM ==========
    let isUpdateInProgress = false;
    let lastUpdateTime = 0;
    const UPDATE_COOLDOWN = 5000; // 5 ວິນາທີ

    function canUpdate() {
        const now = Date.now();
        if (isUpdateInProgress) {
            Swal.fire({
                icon: 'warning',
                title: 'ກະລຸນາລໍຖ້າບໍ່ດົນ',
                text: 'ກຳລັງດຳເນີນການອັບເດດຂໍ້ມູນ',
                confirmButtonColor: '#3b82f6'
            });
            return false;
        }
        
        if (now - lastUpdateTime < UPDATE_COOLDOWN) {
            const remainingTime = Math.ceil((UPDATE_COOLDOWN - (now - lastUpdateTime)) / 1000);
            Swal.fire({
                icon: 'info',
                title: 'ກະລຸນາລໍຖ້າ',
                text: `ສາມາດອັບເດດໄດ້ອີກຄັ້ງໃນ ${remainingTime} ວິນາທີ`,
                confirmButtonColor: '#3b82f6'
            });
            return false;
        }
        
        return true;
    }

    function startUpdateCooldown() {
        isUpdateInProgress = true;
        lastUpdateTime = Date.now();
        
        setTimeout(() => {
            isUpdateInProgress = false;
        }, UPDATE_COOLDOWN);
    }

    function disableActionButtons(disabled) {
        const actionButtons = document.querySelectorAll('.action-buttons button');
        actionButtons.forEach(button => {
            button.disabled = disabled;
            if (disabled) {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            } else {
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
        });
    }
    // ========== END COOLDOWN SYSTEM ==========

    // ການຕັ້ງຄ່າພື້ນຖານຂອງທ່ານ...
    const defaultConfig = {
        project_name: 'ລະບົບຈັດການໂຄງການ',
        main_menu_text: 'ເມນູຫຼັກ',
        open_file_text: 'ເປີດໄຟລ໌',
        primary_color: '#3b82f6',
        secondary_color: '#f8fafc',
        text_color: '#475569',
        button_color: '#10b981',
        danger_color: '#ef4444'
    };

    let config = { ...defaultConfig };

    async function onConfigChange(newConfig) {
        config = { ...newConfig };
        
        document.getElementById('projectName').textContent = config.project_name || defaultConfig.project_name;
        document.getElementById('mainMenu').textContent = config.main_menu_text || defaultConfig.main_menu_text;
        document.getElementById('openFile').textContent = config.open_file_text || defaultConfig.open_file_text;
        
        const primaryColor = config.primary_color || defaultConfig.primary_color;
        const buttonColor = config.button_color || defaultConfig.button_color;
        const dangerColor = config.danger_color || defaultConfig.danger_color;
        
        document.querySelectorAll('.btn-primary').forEach(el => {
            el.style.background = primaryColor;
        });
        
        document.querySelectorAll('.btn-success').forEach(el => {
            el.style.background = buttonColor;
        });
        
        document.querySelectorAll('.btn-danger').forEach(el => {
            el.style.background = dangerColor;
        });
        
        document.querySelector('.project-name').style.color = primaryColor;
    }

    function mapToCapabilities(config) {
        return {
            recolorables: [
                {
                    get: () => config.primary_color || defaultConfig.primary_color,
                    set: (value) => {
                        config.primary_color = value;
                        window.elementSdk.setConfig({ primary_color: value });
                    }
                },
                {
                    get: () => config.button_color || defaultConfig.button_color,
                    set: (value) => {
                        config.button_color = value;
                        window.elementSdk.setConfig({ button_color: value });
                    }
                },
                {
                    get: () => config.danger_color || defaultConfig.danger_color,
                    set: (value) => {
                        config.danger_color = value;
                        window.elementSdk.setConfig({ danger_color: value });
                    }
                }
            ],
            borderables: [],
            fontEditable: undefined,
            fontSizeable: undefined
        };
    }

    function mapToEditPanelValues(config) {
        return new Map([
            ['project_name', config.project_name || defaultConfig.project_name],
            ['main_menu_text', config.main_menu_text || defaultConfig.main_menu_text],
            ['open_file_text', config.open_file_text || defaultConfig.open_file_text]
        ]);
    }

    if (window.elementSdk) {
        window.elementSdk.init({
            defaultConfig,
            onConfigChange,
            mapToCapabilities,
            mapToEditPanelValues
        });
    }

    let autoUpdateInterval;
    let lastDataHash = '';

    async function fetchEmployeeData() {
        try {
            console.log('🔄 ກຳລັງດຶງຂໍ້ມູນພະນັກງານຈາກ Sheet 3...');
            const response = await fetch(`${API_URL}?action=getEmployees`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📊 ຂໍ້ມູນທີ່ໄດ້ຮັບຈາກ Sheet 3:', data);
            
            if (data.status === 'success' && data.data) {
                employeeData = data.data;
                console.log(`✅ ໂຫຼດຂໍ້ມູນພະນັກງານ ${employeeData.length} ລາຍການສຳເລັດ`);
                updateEmployeeDropdowns();
            } else {
                console.warn('⚠️ ບໍ່ພົບຂໍ້ມູນພະນັກງານໃນ Sheet 3');
                employeeData = [];
                updateEmployeeDropdowns();
            }
        } catch (error) {
            console.error('❌ ເກີດຂໍ້ຜິດພາດໃນການດຶງຂໍ້ມູນພະນັກງານ:', error);
            
            const employeeSelects = document.querySelectorAll('#formEmployeeId, #editFormEmployeeId, #copyFormEmployeeId');
            employeeSelects.forEach(select => {
                select.innerHTML = '<option value="">⚠️ ບໍ່ສາມາດໂຫຼດຂໍ້ມູນພະນັກງານໄດ້</option>';
            });
            
            setTimeout(() => {
                console.log('🔄 ລອງດຶງຂໍ້ມູນພະນັກງານອີກຄັ້ງ...');
                fetchEmployeeData();
            }, 5000);
        }
    }

    function updateEmployeeDropdowns() {
        const addSelect = document.getElementById('formEmployeeId');
        const editSelect = document.getElementById('editFormEmployeeId');
        const copySelect = document.getElementById('copyFormEmployeeId');
        
        if (employeeData.length === 0) {
            const noDataOption = '<option value="">📋 ບໍ່ມີຂໍ້ມູນພະນັກງານໃນ Sheet 3</option>';
            addSelect.innerHTML = noDataOption;
            editSelect.innerHTML = noDataOption;
            copySelect.innerHTML = noDataOption;
            return;
        }
        
        console.log('🔄 ອັບເດດ dropdown ດ້ວຍຂໍ້ມູນພະນັກງານ:', employeeData);
        
        const options = employeeData.map(emp => {
            const empId = emp[0] || '';
            const empName = emp[1] || '';
            const displayText = empName ? `${empId} - ${empName}` : empId;
            return `<option value="${empId}">${displayText}</option>`;
        }).join('');
        
        const defaultOption = '<option value="">ເລືອກພະແນກ</option>';
        addSelect.innerHTML = defaultOption + options;
        editSelect.innerHTML = defaultOption + options;
        copySelect.innerHTML = defaultOption + options;
        
        console.log(`✅ ອັບເດດ dropdown ສຳເລັດ - ມີ ${employeeData.length} ລາຍການ`);
    }

    async function fetchData(showLoading = false) {
        try {
            if (showLoading) {
                document.getElementById('tableBody').innerHTML = '<tr><td colspan="8" class="loading">ກຳລັງໂຫຼດຂໍ້ມູນ...</td></tr>';
            }
            
            const response = await fetch(`${API_URL}?action=getData`);
            const data = await response.json();
            
            const currentDataHash = JSON.stringify(data.data);
            if (currentDataHash !== lastDataHash) {
                allData = data.data || [];
                filteredData = [...allData];
                renderTable();
                lastDataHash = currentDataHash;
            }
        } catch (error) {
            if (showLoading) {
                document.getElementById('tableBody').innerHTML = '<tr><td colspan="8" class="no-data">ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ</td></tr>';
            }
        }
    }

    function updateIdField() {
        const maxId = allData.length > 0 ? Math.max(...allData.map(row => parseInt(row[0]) || 0)) : 0;
        document.getElementById('formId').value = maxId + 1;
        document.getElementById('copyFormId').value = maxId + 1;
    }

    function startIdUpdate() {
        updateIdField();
        idUpdateInterval = setInterval(updateIdField, 1000);
    }

    function stopIdUpdate() {
        if (idUpdateInterval) {
            clearInterval(idUpdateInterval);
            idUpdateInterval = null;
        }
    }

    function startAutoUpdate() {
        if (autoUpdateInterval) {
            clearInterval(autoUpdateInterval);
        }
        
        autoUpdateInterval = setInterval(() => {
            fetchData(false);
        }, 3000);
    }

    function stopAutoUpdate() {
        if (autoUpdateInterval) {
            clearInterval(autoUpdateInterval);
            autoUpdateInterval = null;
        }
    }

    function renderTable() {
        const tbody = document.getElementById('tableBody');
        
        const sortedData = [...filteredData].sort((a, b) => {
            const idA = parseInt(a[0]) || 0;
            const idB = parseInt(b[0]) || 0;
            return idB - idA;
        });
        
        const start = (currentPage - 1) * (itemsPerPage === 'all' ? sortedData.length : itemsPerPage);
        const end = itemsPerPage === 'all' ? sortedData.length : start + itemsPerPage;
        const pageData = sortedData.slice(start, end);

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">ບໍ່ພົບຂໍ້ມູນ</td></tr>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = pageData.map((row, index) => {
            let displayDate = row[2] || '-';
            if (row[2]) {
                const date = new Date(row[2]);
                if (!isNaN(date.getTime())) {
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    displayDate = `${day}/${month}/${year}`;
                }
            }

            let displayEmployeeId = row[1] || '-';
            if (row[1]) {
                const employee = employeeData.find(emp => emp[0] === row[1]);
                if (employee && employee[1]) {
                    displayEmployeeId = `${row[1]} - ${employee[1]}`;
                }
            }
            
            return `
                <tr>
                    <td>${row[0] || '-'}</td>
                    <td>${displayEmployeeId}</td>
                    <td>${row[10] || '-'}</td>
                    <td>${displayDate}</td>
                    <td>${row[3] || '-'}</td>
                    <td>${row[4] || '-'}</td>
                    <td>${row[5] || '-'}</td>
                   <td>
    <div class="action-buttons">
        <button class="btn-info" onclick="copyRow(${filteredData.indexOf(row)})"><i class="fa-solid fa-copy"></i></button>
        <button class="btn-warning" onclick="editRow(${filteredData.indexOf(row)})"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="btn-danger" onclick="deleteRow(${filteredData.indexOf(row)})"><i class="fa-solid fa-trash"></i></button>
        <button class="btn-success" onclick="sendData('${row[0]}')"><i class="fa-solid fa-print"></i></button>
        <button class="btn-success" onclick="sendDatas('${row[0]}')"><i class="fa-solid fa-file"></i></button>
    </div>
</td>
                </tr>
            `;
        }).join('');

        renderPagination();
    }

    function renderPagination() {
        const pagination = document.getElementById('pagination');
        
        const sortedData = [...filteredData].sort((a, b) => {
            const idA = parseInt(a[0]) || 0;
            const idB = parseInt(b[0]) || 0;
            return idB - idA;
        });
        
        const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedData.length / itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let pages = [];
        
        pages.push(`<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>ກ່ອນຫນ້າ</button>`);
        
        if (totalPages <= 10) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(`<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`);
            }
        } else {
            pages.push(`<button class="page-btn ${1 === currentPage ? 'active' : ''}" onclick="changePage(1)">1</button>`);
            
            if (currentPage > 3) {
                pages.push(`<span>...</span>`);
            }
            
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(`<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`);
            }
            
            if (currentPage < totalPages - 2) {
                pages.push(`<span>...</span>`);
            }
            
            pages.push(`<button class="page-btn ${totalPages === currentPage ? 'active' : ''}" onclick="changePage(${totalPages})">${totalPages}</button>`);
        }
        
        pages.push(`<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>ຖັດໄປ</button>`);
        pages.push(`<button class="page-btn" onclick="changePage(${totalPages})">ຫນ້າສຸດທ້າຍ</button>`);
        
        pagination.innerHTML = pages.join('');
    }

    function changePage(page) {
        const sortedData = [...filteredData].sort((a, b) => {
            const idA = parseInt(a[0]) || 0;
            const idB = parseInt(b[0]) || 0;
            return idB - idA;
        });
        
        const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedData.length / itemsPerPage);
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderTable();
    }

    function searchData() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (!searchTerm) {
            filteredData = [...allData];
        } else {
            filteredData = allData.filter(row => 
                row.some(cell => String(cell).toLowerCase().includes(searchTerm))
            );
        }
        currentPage = 1;
        renderTable();
    }

    // ========== COPY FUNCTION ==========
    function copyRow(index) {
        if (!canUpdate()) return;
    
    const row = filteredData[index];
    document.getElementById('copyRowIndex').value = index;
    
    // Fix date display - handle timezone correctly
    let dateValue = row[2] || '';
    if (dateValue) {
        // Parse the date string and create a new Date object
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            // Adjust for timezone offset to get the correct local date
            const timezoneOffset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - timezoneOffset);
            dateValue = localDate.toISOString().split('T')[0];
        }
    } else {
        // If no date in the row, set current date
        const today = new Date();
        const timezoneOffset = today.getTimezoneOffset() * 60000;
        const localToday = new Date(today.getTime() - timezoneOffset);
        dateValue = localToday.toISOString().split('T')[0];
    }
        document.getElementById('copyFormDate').value = dateValue;
        
        document.getElementById('copyFormDetail1').value = row[3] || '';
        document.getElementById('copyFormDetail2').value = row[4] || '';
        document.getElementById('copyFormDetail3').value = row[5] || '';
        document.getElementById('copyFormDetail4').value = row[6] || '';
        document.getElementById('copyFormDetail5').value = row[7] || '';
        document.getElementById('copyFormDetail6').value = row[8] || '';
        document.getElementById('copyFormDetail7').value = row[9] || '';
        document.getElementById('copyFormEmployeeId').value = row[10] || '';
        document.getElementById('copyFormFind1').value = row[11] || '';
        document.getElementById('copyFormFind2').value = row[12] || '';
        document.getElementById('copyFormFind3').value = row[13] || '';
        document.getElementById('copyFormFind4').value = row[14] || '';
        document.getElementById('copyFormRequest1').value = row[15] || '';
        document.getElementById('copyFormRequest2').value = row[16] || '';
        document.getElementById('copyFormRequest3').value = row[17] || '';
        document.getElementById('copyFormRequest4').value = row[18] || '';
        document.getElementById('copyFormPurchase1').value = row[19] || '';
        document.getElementById('copyFormPurchase2').value = row[20] || '';

        document.getElementById('copyModal').classList.add('active');
        startIdUpdate();
    }

    document.getElementById('copyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!canUpdate()) return;
        
        const saveBtn = e.target.querySelector('button[type="submit"]');
        const originalText = saveBtn.textContent;
        
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ ກຳລັງບັນທຶກ...';
        saveBtn.style.opacity = '0.7';
        
        startUpdateCooldown();
        disableActionButtons(true);
        
        updateIdField();
        
        const newId = document.getElementById('copyFormId').value;
        
        const isDuplicateId = allData.some(row => row[0] && row[0].toString() === newId.toString());
        
        if (isDuplicateId) {
            await Swal.fire({
                icon: 'warning',
                title: '⚠️ ລະຫັດຊໍ້າ!',
                text: `ລະຫັດ "${newId}" ມີຢູ່ໃນລະບົບແລ້ວ ບໍ່ສາມາດເພີ່ມຂໍ້ມູນໄດ້`
            });
            
            updateIdField();
            
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                saveBtn.style.opacity = '1';
                disableActionButtons(false);
            }, 5000);
            return;
        }

        const formData = {
            action: 'addData',
            id: newId,
            employeeId: document.getElementById('copyFormEmpId').value,
            date: document.getElementById('copyFormDate').value,
            detail1: document.getElementById('copyFormDetail1').value,
            detail2: document.getElementById('copyFormDetail2').value,
            detail3: document.getElementById('copyFormDetail3').value,
            detail4: document.getElementById('copyFormDetail4').value,
            detail5: document.getElementById('copyFormDetail5').value,
            detail6: document.getElementById('copyFormDetail6').value,
            detail7: document.getElementById('copyFormDetail7').value,
            department: document.getElementById('copyFormEmployeeId').value,
            find1: document.getElementById('copyFormFind1').value,
            find2: document.getElementById('copyFormFind2').value,
            find3: document.getElementById('copyFormFind3').value,
            find4: document.getElementById('copyFormFind4').value,
            request1: document.getElementById('copyFormRequest1').value,
            request2: document.getElementById('copyFormRequest2').value,
            request3: document.getElementById('copyFormRequest3').value,
            request4: document.getElementById('copyFormRequest4').value,
            purchase1: document.getElementById('copyFormPurchase1').value,
            purchase2: document.getElementById('copyFormPurchase2').value
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'ສຳເລັດ!',
                    text: 'ບັນທຶກຂໍ້ມູນສຳເນົາສຳເລັດແລ້ວ'
                });
                
                document.getElementById('copyModal').classList.remove('active');
                document.getElementById('copyForm').reset();
                stopIdUpdate();
                await fetchData();
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'ເກີດຂໍ້ຜິດພາດ',
                    text: result.message || 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້'
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'ເກີດຂໍ້ຜິດພາດ',
                text: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້'
            });
        } finally {
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                saveBtn.style.opacity = '1';
                disableActionButtons(false);
            }, 5000);
        }
    });

    // ========== MODIFIED FUNCTIONS WITH 5-SECOND COOLDOWN ==========

    function editRow(index) {
        if (!canUpdate()) return;
        
        const row = filteredData[index];
        document.getElementById('editRowIndex').value = index;
        document.getElementById('editFormId').value = row[0] || '';
        document.getElementById('editFormEmpId').value = row[1] || '';
       // Fix date display - handle timezone correctly
    let dateValue = row[2] || '';
    if (dateValue) {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            // Adjust for timezone offset to get the correct local date
            const timezoneOffset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - timezoneOffset);
            dateValue = localDate.toISOString().split('T')[0];
        }
    }
        document.getElementById('editFormDate').value = dateValue;
        
        document.getElementById('editFormDetail1').value = row[3] || '';
        document.getElementById('editFormDetail2').value = row[4] || '';
        document.getElementById('editFormDetail3').value = row[5] || '';
        document.getElementById('editFormDetail4').value = row[6] || '';
        document.getElementById('editFormDetail5').value = row[7] || '';
        document.getElementById('editFormDetail6').value = row[8] || '';
        document.getElementById('editFormDetail7').value = row[9] || '';
        document.getElementById('editFormEmployeeId').value = row[10] || '';
        document.getElementById('editFormFind1').value = row[11] || '';
        document.getElementById('editFormFind2').value = row[12] || '';
        document.getElementById('editFormFind3').value = row[13] || '';
        document.getElementById('editFormFind4').value = row[14] || '';
        document.getElementById('editFormRequest1').value = row[15] || '';
        document.getElementById('editFormRequest2').value = row[16] || '';
        document.getElementById('editFormRequest3').value = row[17] || '';
        document.getElementById('editFormRequest4').value = row[18] || '';
        document.getElementById('editFormPurchase1').value = row[19] || '';
        document.getElementById('editFormPurchase2').value = row[20] || '';

        document.getElementById('editModal').classList.add('active');
    }

    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!canUpdate()) return;
        
        const index = parseInt(document.getElementById('editRowIndex').value);
        const originalRow = filteredData[index];
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ ກຳລັງບັນທຶກ...';
        submitBtn.style.opacity = '0.7';
        
        startUpdateCooldown();
        disableActionButtons(true);
        
        const formData = {
            action: 'updateData',
            rowIndex: allData.indexOf(originalRow) + 2,
            id: document.getElementById('editFormId').value,
            employeeId: document.getElementById('editFormEmpId').value,    
            department: document.getElementById('editFormEmployeeId').value,
            date: document.getElementById('editFormDate').value,
            detail1: document.getElementById('editFormDetail1').value,
            detail2: document.getElementById('editFormDetail2').value,
            detail3: document.getElementById('editFormDetail3').value,
            detail4: document.getElementById('editFormDetail4').value,
            detail5: document.getElementById('editFormDetail5').value,
            detail6: document.getElementById('editFormDetail6').value,
            detail7: document.getElementById('editFormDetail7').value,
            find1: document.getElementById('editFormFind1').value,
            find2: document.getElementById('editFormFind2').value,
            find3: document.getElementById('editFormFind3').value,
            find4: document.getElementById('editFormFind4').value,
            request1: document.getElementById('editFormRequest1').value,
            request2: document.getElementById('editFormRequest2').value,
            request3: document.getElementById('editFormRequest3').value,
            request4: document.getElementById('editFormRequest4').value,
            purchase1: document.getElementById('editFormPurchase1').value,
            purchase2: document.getElementById('editFormPurchase2').value
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'ສຳເລັດ!',
                    text: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດແລ້ວ'
                });
                
                document.getElementById('editModal').classList.remove('active');
                document.getElementById('editForm').reset();
                await fetchData();
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'ເກີດຂໍ້ຜິດພາດ',
                    text: result.message || 'ບໍ່ສາມາດແກ້ໄຂຂໍ້ມູນໄດ້'
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'ເກີດຂໍ້ຜິດພາດ',
                text: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້'
            });
        } finally {
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.style.opacity = '1';
                disableActionButtons(false);
            }, 5000);
        }
    });

    async function deleteRow(index) {
        if (!canUpdate()) return;
        
        const result = await Swal.fire({
            title: 'ຢືນຢັນການລົບ?',
            text: 'ຕ້ອງການລົບຂໍ້ມູນແທ້ ຫຼື ບໍ່??',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ລົບ',
            cancelButtonText: 'ຍົກເລີກ'
        });

        if (result.isConfirmed) {
            startUpdateCooldown();
            disableActionButtons(true);
            
            const row = filteredData[index];
            const formData = {
                action: 'deleteData',
                rowIndex: allData.indexOf(row) + 2
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                const deleteResult = await response.json();
                
                if (deleteResult.status === 'success') {
                    await Swal.fire({
                        icon: 'success',
                        title: 'ສຳເລັດ!',
                        text: 'ລົບຂໍ້ມູນສຳເລັດແລ້ວ'
                    });
                    await fetchData();
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: 'ເກີດຂໍ້ຜິດພາດ',
                        text: deleteResult.message || 'ບໍ່ສາມາດລົບຂໍ້ມູນໄດ້'
                    });
                }
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'ເກີດຂໍ້ຜິດພາດ',
                    text: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້'
                });
            } finally {
                setTimeout(() => {
                    disableActionButtons(false);
                }, 5000);
            }
        }
    }

    document.getElementById('addForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!canUpdate()) return;
        
        const saveBtn = document.getElementById('saveRecordBtn');
        const originalText = saveBtn.textContent;
        
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ ກຳລັງບັນທຶກ...';
        saveBtn.style.opacity = '0.7';
        
        startUpdateCooldown();
        disableActionButtons(true);
        
        updateIdField();
        
        const newId = document.getElementById('formId').value;
        
        const isDuplicateId = allData.some(row => row[0] && row[0].toString() === newId.toString());
        
        if (isDuplicateId) {
            await Swal.fire({
                icon: 'warning',
                title: '⚠️ ລະຫັດຊໍ້າ!',
                text: `ລະຫັດ "${newId}" ມີຢູ່ໃນລະບົບແລ້ວ ບໍ່ສາມາດເພີ່ມຂໍ້ມູນໄດ້`
            });
            
            updateIdField();
            
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                saveBtn.style.opacity = '1';
                disableActionButtons(false);
            }, 5000);
            return;
        }

        const formData = {
            action: 'addData',
            id: newId,
            employeeId: document.getElementById('formEmpId').value,
            date: document.getElementById('formDate').value,
            detail1: document.getElementById('formDetail1').value,
            detail2: document.getElementById('formDetail2').value,
            detail3: document.getElementById('formDetail3').value,
            detail4: document.getElementById('formDetail4').value,
            detail5: document.getElementById('formDetail5').value,
            detail6: document.getElementById('formDetail6').value,
            detail7: document.getElementById('formDetail7').value,
            department: document.getElementById('formEmployeeId').value,
            find1: document.getElementById('formFind1').value,
            find2: document.getElementById('formFind2').value,
            find3: document.getElementById('formFind3').value,
            find4: document.getElementById('formFind4').value,
            request1: document.getElementById('formRequest1').value,
            request2: document.getElementById('formRequest2').value,
            request3: document.getElementById('formRequest3').value,
            request4: document.getElementById('formRequest4').value,
            purchase1: document.getElementById('formPurchase1').value,
            purchase2: document.getElementById('formPurchase2').value
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                await Swal.fire({
                    icon: 'success',
                    title: 'ສຳເລັດ!',
                    text: 'ບັນທຶກຂໍ້ມູນສຳເລັດແລ້ວ'
                });
                
                document.getElementById('addModal').classList.remove('active');
                document.getElementById('addForm').reset();
                stopIdUpdate();
                await fetchData();
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'ເກີດຂໍ້ຜິດພາດ',
                    text: result.message || 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້'
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'ເກີດຂໍ້ຜິດພາດ',
                text: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້'
            });
        } finally {
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
                saveBtn.style.opacity = '1';
                disableActionButtons(false);
            }, 5000);
        }
    });

    async function sendData(id) {
        if (!canUpdate()) return;
        
        startUpdateCooldown();
        disableActionButtons(true);

        const formData = {
            action: 'sendToSheet2',
            id: id
        };

        

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {

                
            const sheetsUrl = 'https://docs.google.com/spreadsheets/d/1KI_c8x05zglJ2XHqyeWC7bnZ_6UBfqfcDN7eQAZqReg/edit?gid=2116115900#gid=2116115900https://docs.google.com/spreadsheets/d/1KI_c8x05zglJ2XHqyeWC7bnZ_6UBfqfcDN7eQAZqReg/edit?usp=sharing';
            window.open(sheetsUrl, '_blank');

                
                /* await Swal.fire({
                    icon: 'success',
                    title: 'ສຳເລັດ!',
                    text: 'ສົ່ງຂໍ້ມູນໄປຍັງ Sheet 2 ສຳເລັດແລ້ວ'
                    
                }); */
                
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'ເກີດຂໍ້ຜິດພາດ',
                    text: result.message || 'ບໍ່ສາມາດສົ່ງຂໍ້ມູນໄດ້'
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'ເກີດຂໍ້ຜິດພາດ',
                text: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້'
            });
        } finally {
            setTimeout(() => {
                disableActionButtons(false);
            }, 5000);
        }
    }

    async function sendDatas(id) {
        if (!canUpdate()) return;
        
        startUpdateCooldown();
        disableActionButtons(true);

        const formData = {
            action: 'sendToSheet4',
            id: id
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {


                const sheetsUrl = 'https://docs.google.com/spreadsheets/d/1KI_c8x05zglJ2XHqyeWC7bnZ_6UBfqfcDN7eQAZqReg/edit?gid=1821582580#gid=1821582580';
            window.open(sheetsUrl, '_blank');
                /* await Swal.fire({
                    icon: 'success',
                    title: 'ສຳເລັດ!',
                    text: 'ສົ່ງຂໍ້ມູນໄປຍັງ Sheet 4 ສຳເລັດແລ້ວ'
                }); */
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'ເກີດຂໍ້ຜິດພາດ',
                    text: result.message || 'ບໍ່ສາມາດສົ່ງຂໍ້ມູນໄດ້'
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'ເກີດຂໍ້ຜິດພາດ',
                text: 'ບໍ່ສາມາດເຊື່ອມຕໍ່ກັບເຊີບເວີໄດ້'
            });
        } finally {
            setTimeout(() => {
                disableActionButtons(false);
            }, 5000);
        }
    }

    // ========== EVENT LISTENERS ==========
    document.getElementById('searchBtn').addEventListener('click', searchData);
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') searchData();
    });

    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
        itemsPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });

    document.getElementById('addDataBtn').addEventListener('click', () => {
        document.getElementById('addModal').classList.add('active');
        document.getElementById('formDate').valueAsDate = new Date();
        document.getElementById('formEmployeeId').value = 'FM/IT';
        startIdUpdate();
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('addModal').classList.remove('active');
        document.getElementById('addForm').reset();
        stopIdUpdate();
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        document.getElementById('editModal').classList.remove('active');
        document.getElementById('editForm').reset();
    });

    document.getElementById('cancelCopyBtn').addEventListener('click', () => {
        document.getElementById('copyModal').classList.remove('active');
        document.getElementById('copyForm').reset();
        stopIdUpdate();
    });

    // ========== INITIALIZATION ==========
    async function initializeApp() {
        console.log('🚀 ເລີ່ມຕົ້ນລະບົບ Project Management...');
        
        try {
            document.getElementById('tableBody').innerHTML = '<tr><td colspan="8" class="loading">🔄 ກຳລັງໂຫຼດຂໍ້ມູນ...</td></tr>';
            
            await Promise.all([
                fetchData(false),
                fetchEmployeeData()
            ]);
            
            console.log('✅ ໂຫຼດຂໍ້ມູນເບື້ອງຕົ້ນສຳເລັດ');
            console.log(`📊 ຂໍ້ມູນຫຼັກ: ${allData.length} ລາຍການ`);
            console.log(`👥 ຂໍ້ມູນພະນັກງານ: ${employeeData.length} ລາຍການ`);
            
            startAutoUpdate();
            
        } catch (error) {
            console.error('❌ ເກີດຂໍ້ຜິດພາດໃນການເລີ່ມຕົ້ນລະບົບ:', error);
            document.getElementById('tableBody').innerHTML = '<tr><td colspan="8" class="no-data">❌ ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ</td></tr>';
        }
    }
    
    initializeApp();

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoUpdate();
        } else {
            startAutoUpdate();
        }
    });

    window.addEventListener('beforeunload', () => {
        stopAutoUpdate();
    });

    // Make functions available globally
    window.editRow = editRow;
    window.deleteRow = deleteRow;
    window.copyRow = copyRow;
    window.sendData = sendData;
    window.sendDatas = sendDatas;
    window.changePage = changePage;
    window.searchData = searchData;

