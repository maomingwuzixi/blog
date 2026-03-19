// ==================== HR工作台 主应用 ====================

// 全局状态
const state = {
    currentPage: 'dashboard',
    currentDate: new Date(),
    user: { name: '吴梓锡', role: '人力资源专员' },
    data: {
        employees: [],
        candidates: [],
        interviews: [],
        schedules: [],
        todos: [],
        contracts: [],
        files: [],
        announcements: []
    }
};

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
    loadAllData();
    renderCalendar();
    updateStats();
    setupEventListeners();
    showToast('欢迎回来，吴梓锡！', 'success');
});

// ==================== 页面切换 ====================
function showPage(pageId) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageId) {
            item.classList.add('active');
        }
    });

    // 切换页面内容
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('page-' + pageId).classList.add('active');

    // 更新标题
    const titles = {
        'dashboard': '工作台概览',
        'schedule': '日程安排',
        'todos': '待办事项',
        'interviews': '面试安排',
        'candidates': '候选人管理',
        'employees': '员工台账',
        'contracts': '合同台账',
        'forms': '表单自动化',
        'files': '文件管理',
        'info': '信息发布'
    };
    document.getElementById('page-title').textContent = titles[pageId] || 'HR工作台';

    state.currentPage = pageId;

    // 页面特定渲染
    switch(pageId) {
        case 'dashboard': renderDashboard(); break;
        case 'schedule': renderScheduleList(); break;
        case 'todos': renderTodos(); break;
        case 'interviews': renderInterviews(); break;
        case 'candidates': renderCandidates(); break;
        case 'employees': renderEmployees(); break;
        case 'contracts': renderContracts(); break;
        case 'files': renderFiles(); break;
        case 'info': renderAnnouncements(); break;
    }
}

// ==================== 数据加载 ====================
async function loadAllData() {
    // 优先从本地加载（离线可用）
    state.data.employees = localDB.get('employees');
    state.data.candidates = localDB.get('candidates');
    state.data.interviews = localDB.get('interviews');
    state.data.schedules = localDB.get('schedules');
    state.data.todos = localDB.get('todos');
    state.data.contracts = localDB.get('contracts');
    state.data.files = localDB.get('files');
    state.data.announcements = localDB.get('announcements');

    // 如果没有数据，初始化示例数据
    if (state.data.employees.length === 0) initSampleData();

    // 尝试从Supabase同步（如果在线）
    if (supabaseClient) {
        try {
            await syncFromSupabase();
        } catch (e) {
            console.log('Supabase同步失败，使用本地数据');
        }
    }

    updateStats();
    renderDashboard();
}

// 初始化示例数据
function initSampleData() {
    const today = new Date().toISOString().split('T')[0];
    
    // 员工示例
    state.data.employees = [
        { id: 'E001', name: '张三', dept: '技术部', position: '前端工程师', hireDate: '2024-01-15', status: '在职' },
        { id: 'E002', name: '李四', dept: '产品部', position: '产品经理', hireDate: '2023-08-20', status: '在职' },
        { id: 'E003', name: '王五', dept: '市场部', position: '市场专员', hireDate: '2024-03-01', status: '试用期' }
    ];
    localDB.set('employees', state.data.employees);

    // 候选人示例
    state.data.candidates = [
        { id: 'C001', name: '赵六', position: 'Java开发', source: 'BOSS直聘', status: '初面通过', createdAt: today },
        { id: 'C002', name: '钱七', position: 'UI设计师', source: '猎聘', status: '待面试', createdAt: today }
    ];
    localDB.set('candidates', state.data.candidates);

    // 面试安排示例
    state.data.interviews = [
        { id: 'I001', candidateName: '赵六', position: 'Java开发', time: today + ' 14:00', interviewer: '技术总监', status: '待进行' },
        { id: 'I002', candidateName: '钱七', position: 'UI设计师', time: today + ' 16:00', interviewer: '设计主管', status: '待进行' }
    ];
    localDB.set('interviews', state.data.interviews);

    // 待办事项示例
    state.data.todos = [
        { id: 'T001', title: '安排下周面试', priority: 'high', deadline: today, completed: false },
        { id: 'T002', title: '更新员工档案', priority: 'medium', deadline: today, completed: false },
        { id: 'T003', title: '准备月度报告', priority: 'low', deadline: today, completed: true }
    ];
    localDB.set('todos', state.data.todos);

    // 日程示例
    state.data.schedules = [
        { id: 'S001', title: '部门周会', date: today, time: '09:30', type: 'meeting' },
        { id: 'S002', title: '候选人赵六面试', date: today, time: '14:00', type: 'interview' },
        { id: 'S003', title: '新员工入职培训', date: today, time: '15:00', type: 'training' }
    ];
    localDB.set('schedules', state.data.schedules);

    // 合同示例
    state.data.contracts = [
        { id: 'CT001', employeeName: '张三', type: '劳动合同', startDate: '2024-01-15', endDate: '2027-01-14', status: '有效' },
        { id: 'CT002', employeeName: '李四', type: '劳动合同', startDate: '2023-08-20', endDate: '2026-08-19', status: '有效' }
    ];
    localDB.set('contracts', state.data.contracts);
}

// ==================== 统计更新 ====================
function updateStats() {
    document.getElementById('stat-employees').textContent = state.data.employees.filter(e => e.status === '在职' || e.status === '试用期').length;
    document.getElementById('stat-interviews').textContent = state.data.interviews.filter(i => i.status === '待进行').length;
    document.getElementById('stat-todos').textContent = state.data.todos.filter(t => !t.completed).length;
    
    // 计算30天内到期合同
    const today = new Date();
    const expiring = state.data.contracts.filter(c => {
        if (c.status !== '有效') return false;
        const end = new Date(c.endDate);
        const diff = (end - today) / (1000 * 60 * 60 * 24);
        return diff <= 30 && diff >= 0;
    });
    document.getElementById('stat-contracts').textContent = expiring.length;
    document.getElementById('expiring-count').textContent = expiring.length + ' 个即将到期';

    // 更新徽章
    document.getElementById('today-events').textContent = state.data.schedules.filter(s => s.date === today.toISOString().split('T')[0]).length;
    document.getElementById('pending-todos').textContent = state.data.todos.filter(t => !t.completed).length;
}

// ==================== 仪表板渲染 ====================
function renderDashboard() {
    // 今日时间线
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = state.data.schedules
        .filter(s => s.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));
    
    const timelineEl = document.getElementById('today-timeline');
    if (todayEvents.length === 0) {
        timelineEl.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h4>今日暂无日程</h4><p>点击快捷操作添加新日程</p></div>';
    } else {
        timelineEl.innerHTML = todayEvents.map(event => `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-time">${event.time}</div>
                    <div style="font-weight:500;margin-top:4px;">${event.title}</div>
                </div>
            </div>
        `).join('');
    }

    // 待办列表（取前5个未完成的）
    const pendingTodos = state.data.todos.filter(t => !t.completed).slice(0, 5);
    const todosEl = document.getElementById('dashboard-todos');
    if (pendingTodos.length === 0) {
        todosEl.innerHTML = '<div class="empty-state" style="padding:30px;"><div class="icon">✅</div><h4>暂无待办事项</h4></div>';
    } else {
        todosEl.innerHTML = pendingTodos.map(todo => `
            <div class="todo-item">
                <div class="todo-check ${todo.completed ? 'checked' : ''}" onclick="toggleTodo('${todo.id}')">
                    ${todo.completed ? '✓' : ''}
                </div>
                <div class="todo-content ${todo.completed ? 'completed' : ''}">
                    <div class="todo-title">${todo.title}</div>
                    <div class="todo-meta">${todo.deadline} · ${getPriorityText(todo.priority)}</div>
                </div>
            </div>
        `).join('');
    }
}

// ==================== 日历功能 ====================
function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    document.getElementById('calendar-month').textContent = `${year}年${month + 1}月`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    let html = '';
    
    // 上月日期
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month"><span class="day-num">${daysInPrevMonth - i}</span></div>`;
    }
    
    // 当月日期
    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === today;
        const events = state.data.schedules.filter(s => s.date === dateStr);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" onclick="showDayEvents('${dateStr}')">
                <span class="day-num">${day}</span>
                <div class="events">
                    ${events.map(() => `<span class="event-dot" style="background:${getEventColor(events[0]?.type)}"></span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // 下月日期
    const remaining = (7 - ((firstDay + daysInMonth) % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month"><span class="day-num">${i}</span></div>`;
    }
    
    document.getElementById('calendar-body').innerHTML = html;
}

function changeMonth(delta) {
    state.currentDate.setMonth(state.currentDate.getMonth() + delta);
    renderCalendar();
}

function getEventColor(type) {
    const colors = { meeting: '#3b82f6', interview: '#10b981', training: '#f59e0b', other: '#8b5cf6' };
    return colors[type] || colors.other;
}

function showDayEvents(date) {
    const events = state.data.schedules.filter(s => s.date === date);
    if (events.length > 0) {
        showToast(`${date} 有 ${events.length} 个日程`, 'info');
    }
}

// ==================== 日程列表 ====================
function renderScheduleList() {
    const listEl = document.getElementById('schedule-list');
    const sorted = state.data.schedules.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    
    if (sorted.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><div class="icon">📅</div><h4>暂无日程安排</h4></div>';
    } else {
        listEl.innerHTML = sorted.map(s => `
            <div class="todo-item" style="border-left:3px solid ${getEventColor(s.type)};padding-left:16px;">
                <div class="todo-content">
                    <div class="todo-title">${s.title}</div>
                    <div class="todo-meta">${s.date} ${s.time} · ${getTypeText(s.type)}</div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="deleteSchedule('${s.id}')">删除</button>
            </div>
        `).join('');
    }
}

function getTypeText(type) {
    const map = { meeting: '会议', interview: '面试', training: '培训', other: '其他' };
    return map[type] || '其他';
}

function deleteSchedule(id) {
    if (confirm('确定删除此日程？')) {
        localDB.deleteItem('schedules', id);
        state.data.schedules = localDB.get('schedules');
        renderCalendar();
        renderScheduleList();
        renderDashboard();
        updateStats();
        showToast('已删除', 'success');
    }
}

// ==================== 待办事项 ====================
function renderTodos() {
    const filterStatus = document.getElementById('todo-filter-status')?.value || '';
    const filterPriority = document.getElementById('todo-filter-priority')?.value || '';
    
    let todos = state.data.todos;
    if (filterStatus === 'pending') todos = todos.filter(t => !t.completed);
    if (filterStatus === 'completed') todos = todos.filter(t => t.completed);
    if (filterPriority) todos = todos.filter(t => t.priority === filterPriority);
    
    const listEl = document.getElementById('todos-list');
    if (todos.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><div class="icon">✅</div><h4>暂无待办事项</h4></div>';
    } else {
        listEl.innerHTML = todos.map(todo => `
            <div class="todo-item">
                <div class="todo-check ${todo.completed ? 'checked' : ''}" onclick="toggleTodo('${todo.id}')">
                    ${todo.completed ? '✓' : ''}
                </div>
                <div class="todo-content ${todo.completed ? 'completed' : ''}">
                    <div class="todo-title">${todo.title}</div>
                    <div class="todo-meta">截止: ${todo.deadline} · ${getPriorityText(todo.priority)}</div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="deleteTodo('${todo.id}')">删除</button>
            </div>
        `).join('');
    }
}

function toggleTodo(id) {
    const todo = state.data.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        localDB.set('todos', state.data.todos);
        updateStats();
        renderTodos();
        renderDashboard();
        showToast(todo.completed ? '已完成' : '已取消完成', 'success');
    }
}

function deleteTodo(id) {
    if (confirm('确定删除此待办？')) {
        localDB.deleteItem('todos', id);
        state.data.todos = localDB.get('todos');
        updateStats();
        renderTodos();
        renderDashboard();
        showToast('已删除', 'success');
    }
}

function getPriorityText(p) {
    const map = { high: '高优先级', medium: '中优先级', low: '低优先级' };
    return map[p] || p;
}

function filterTodos() {
    renderTodos();
}

// ==================== 面试管理 ====================
function renderInterviews() {
    const tbody = document.getElementById('interviews-table');
    if (state.data.interviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无面试安排</td></tr>';
    } else {
        tbody.innerHTML = state.data.interviews.map(i => `
            <tr>
                <td><strong>${i.candidateName}</strong></td>
                <td>${i.position}</td>
                <td>${i.time}</td>
                <td>${i.interviewer}</td>
                <td><span class="status status-${getStatusClass(i.status)}">${i.status}</span></td>
                <td>
                    ${i.status === '已通过' ? `<button class="btn btn-sm btn-success" onclick="convertToEmployee('${i.id}')">入职</button>` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="editInterview('${i.id}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInterview('${i.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    }
}

function getStatusClass(status) {
    const map = { '待进行': 'info', '已通过': 'success', '未通过': 'danger', '已取消': 'warning' };
    return map[status] || 'info';
}

function deleteInterview(id) {
    if (confirm('确定删除此面试安排？')) {
        localDB.deleteItem('interviews', id);
        state.data.interviews = localDB.get('interviews');
        renderInterviews();
        updateStats();
        showToast('已删除', 'success');
    }
}

// ==================== 候选人 ====================
function renderCandidates() {
    const tbody = document.getElementById('candidates-table');
    if (state.data.candidates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无候选人</td></tr>';
    } else {
        tbody.innerHTML = state.data.candidates.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.position}</td>
                <td>${c.source}</td>
                <td><span class="status status-${getCandidateStatusClass(c.status)}">${c.status}</span></td>
                <td>${c.createdAt}</td>
                <td>
                    ${c.status === '待筛选' || c.status === '初面通过' ? `<button class="btn btn-sm btn-primary" onclick="scheduleInterviewFromCandidate('${c.id}')">安排面试</button>` : ''}
                    ${c.status === '终面通过' ? `<button class="btn btn-sm btn-success" onclick="convertCandidateToEmployee('${c.id}')">办理入职</button>` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="editCandidate('${c.id}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCandidate('${c.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    }
}

function getCandidateStatusClass(status) {
    const map = { '待筛选': 'info', '初面通过': 'warning', '终面通过': 'warning', 'Offer已发': 'success', '已入职': 'success', '淘汰': 'danger' };
    return map[status] || 'info';
}

function deleteCandidate(id) {
    if (confirm('确定删除此候选人？')) {
        localDB.deleteItem('candidates', id);
        state.data.candidates = localDB.get('candidates');
        renderCandidates();
        showToast('已删除', 'success');
    }
}

// ==================== 员工台账 ====================
function renderEmployees() {
    const tbody = document.getElementById('employees-table');
    if (state.data.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无员工数据</td></tr>';
    } else {
        tbody.innerHTML = state.data.employees.map(e => `
            <tr>
                <td>${e.id}</td>
                <td><strong>${e.name}</strong></td>
                <td>${e.dept}</td>
                <td>${e.position}</td>
                <td>${e.hireDate}</td>
                <td><span class="status status-${e.status === '在职' ? 'success' : 'warning'}">${e.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="editEmployee('${e.id}')">编辑</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${e.id}')">删除</button>
                </td>
            </tr>
        `).join('');
    }
}

function deleteEmployee(id) {
    if (confirm('确定删除此员工？')) {
        localDB.deleteItem('employees', id);
        state.data.employees = localDB.get('employees');
        renderEmployees();
        updateStats();
        showToast('已删除', 'success');
    }
}

// ==================== 合同台账 ====================
function renderContracts() {
    const tbody = document.getElementById('contracts-table');
    const today = new Date();
    
    if (state.data.contracts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">暂无合同数据</td></tr>';
    } else {
        tbody.innerHTML = state.data.contracts.map(c => {
            const end = new Date(c.endDate);
            const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
            const daysLeft = diff >= 0 ? diff + ' 天' : '已过期';
            const isExpiring = diff <= 30 && diff >= 0;
            
            return `
                <tr style="${isExpiring ? 'background:#fef3c7;' : ''}">
                    <td><strong>${c.employeeName}</strong></td>
                    <td>${c.type}</td>
                    <td>${c.startDate}</td>
                    <td>${c.endDate}</td>
                    <td style="${isExpiring ? 'color:#92400e;font-weight:600;' : ''}">${daysLeft}</td>
                    <td><span class="status status-${c.status === '有效' ? 'success' : 'danger'}">${c.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="editContract('${c.id}')">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteContract('${c.id}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function deleteContract(id) {
    if (confirm('确定删除此合同？')) {
        localDB.deleteItem('contracts', id);
        state.data.contracts = localDB.get('contracts');
        renderContracts();
        updateStats();
        showToast('已删除', 'success');
    }
}

// ==================== 文件管理（支持真实文件上传下载） ====================
function renderFiles() {
    const grid = document.getElementById('files-grid');
    if (state.data.files.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">📁</div><h4>暂无文件</h4><p>点击上传文件按钮添加</p></div>';
    } else {
        grid.innerHTML = state.data.files.map(f => `
            <div class="file-item" onclick="showFileDetail('${f.id}')">
                <div class="file-icon">${getFileIcon(f.type)}</div>
                <div class="file-name">${f.name}</div>
                <div class="file-meta">${f.size} · ${f.date}</div>
                <div class="file-actions" style="margin-top:8px;">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();downloadRealFile('${f.id}')">下载</button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteFile('${f.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }
}

function getFileIcon(type) {
    const icons = { 
        pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', 
        ppt: '📽️', pptx: '📽️', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', 
        gif: '🖼️', zip: '📦', rar: '📦', txt: '📃', mp4: '🎬',
        mp3: '🎵', docm: '📝', xlsm: '📊'
    };
    return icons[type.toLowerCase()] || '📄';
}

// 显示文件详情
function showFileDetail(fileId) {
    const file = state.data.files.find(f => f.id === fileId);
    if (!file) return;
    
    const modal = {
        title: '文件详情',
        content: `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:64px;margin-bottom:16px;">${getFileIcon(file.type)}</div>
                <h3 style="margin-bottom:8px;">${file.name}</h3>
                <p style="color:var(--text-light);margin-bottom:16px;">${file.desc || '暂无描述'}</p>
                <div style="background:#f8fafc;padding:16px;border-radius:8px;text-align:left;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>文件大小:</span><span>${file.size}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>文件类型:</span><span>${file.type.toUpperCase()}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                        <span>上传日期:</span><span>${file.date}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span>上传者:</span><span>${file.uploader || state.user.name}</span>
                    </div>
                </div>
            </div>
        `,
        onConfirm: () => {
            downloadRealFile(fileId);
            closeModal();
        }
    };
    openEditModal(modal);
}

// 真实文件下载（使用Base64存储）
function downloadRealFile(fileId) {
    const file = state.data.files.find(f => f.id === fileId);
    if (!file) {
        showToast('文件不存在', 'error');
        return;
    }
    
    if (!file.content) {
        showToast('该文件没有可下载内容', 'error');
        return;
    }
    
    // 从Base64解码并下载
    try {
        const byteString = atob(file.content.split(',')[1] || file.content);
        const mimeType = file.mimeType || 'application/octet-stream';
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('文件下载已开始', 'success');
    } catch (e) {
        console.error('下载失败:', e);
        showToast('文件下载失败', 'error');
    }
}

// 删除文件
function deleteFile(fileId) {
    if (confirm('确定删除此文件？')) {
        localDB.deleteItem('files', fileId);
        state.data.files = localDB.get('files');
        renderFiles();
        showToast('文件已删除', 'success');
    }
}

// ==================== 信息发布（增强版） ====================
function renderAnnouncements() {
    const list = document.getElementById('announcements-list');
    if (state.data.announcements.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="icon">📢</div><h4>暂无公告</h4></div>';
    } else {
        // 按时间倒序排列
        const sorted = [...state.data.announcements].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        list.innerHTML = sorted.map(a => {
            // 处理内容摘要
            const contentPreview = a.content ? (a.content.length > 100 ? a.content.substring(0, 100) + '...' : a.content) : '';
            const hasFullContent = a.content && a.content.length > 100;
            
            // 根据类型显示不同颜色标签
            const typeColors = {
                '通知': '#3b82f6',
                '公告': '#10b981', 
                '制度': '#f59e0b',
                '活动': '#8b5cf6',
                '紧急': '#ef4444'
            };
            const typeColor = typeColors[a.type] || '#6b7280';
            
            return `
            <div class="card announcement-card" style="margin-bottom:16px;cursor:pointer;transition:all 0.2s;" onclick="showAnnouncementDetail('${a.id}')">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:16px;">
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                                <span class="announcement-type" style="background:${typeColor}20;color:${typeColor};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;">${a.type || '通知'}</span>
                                ${a.isImportant ? '<span style="color:#ef4444;">🔴</span>' : ''}
                                ${a.isTop ? '<span style="color:#f59e0b;">📌</span>' : ''}
                            </div>
                            <h4 style="margin-bottom:8px;font-size:16px;">${a.title}</h4>
                            <p style="color:var(--text-light);font-size:14px;line-height:1.6;">${contentPreview}</p>
                            ${hasFullContent ? '<span style="color:#3b82f6;font-size:13px;">点击查看详情 →</span>' : ''}
                            <div style="margin-top:12px;font-size:12px;color:var(--text-light);display:flex;gap:16px;">
                                <span>📅 ${a.date}</span>
                                <span>👤 ${a.author}</span>
                                ${a.department ? `<span>🏢 ${a.department}</span>` : ''}
                                ${a.readCount ? `<span>👁️ ${a.readCount} 次阅读</span>` : ''}
                            </div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();editAnnouncement('${a.id}')">编辑</button>
                            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteAnnouncement('${a.id}')">删除</button>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');
    }
}

// 显示公告详情
function showAnnouncementDetail(id) {
    const a = state.data.announcements.find(item => item.id === id);
    if (!a) return;
    
    // 增加阅读次数
    if (!a.readCount) a.readCount = 0;
    a.readCount++;
    localDB.update('announcements', id, { readCount: a.readCount });
    
    const typeColors = {
        '通知': '#3b82f6',
        '公告': '#10b981', 
        '制度': '#f59e0b',
        '活动': '#8b5cf6',
        '紧急': '#ef4444'
    };
    const typeColor = typeColors[a.type] || '#6b7280';
    
    const modal = {
        title: '',
        content: `
            <div style="max-height:60vh;overflow-y:auto;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <span style="background:${typeColor}20;color:${typeColor};padding:4px 12px;border-radius:4px;font-size:13px;font-weight:500;">${a.type || '通知'}</span>
                    ${a.isImportant ? '<span style="background:#fef2f2;color:#dc2626;padding:4px 12px;border-radius:4px;font-size:13px;">🔴 重要</span>' : ''}
                    ${a.isTop ? '<span style="background:#fffbeb;color:#d97706;padding:4px 12px;border-radius:4px;font-size:13px;">📌 置顶</span>' : ''}
                </div>
                <h2 style="margin-bottom:16px;font-size:20px;">${a.title}</h2>
                <div style="display:flex;gap:16px;margin-bottom:20px;font-size:13px;color:var(--text-light);padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
                    <span>📅 发布时间：${a.date}</span>
                    <span>👤 发布人：${a.author}</span>
                    ${a.department ? `<span>🏢 ${a.department}</span>` : ''}
                    <span>👁️ ${a.readCount || 1} 次阅读</span>
                </div>
                <div style="line-height:1.8;color:#374151;white-space:pre-wrap;">${a.content || '暂无内容'}</div>
                ${a.attachments ? `
                <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
                    <h4 style="margin-bottom:12px;font-size:14px;">📎 附件</h4>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${a.attachments.map(att => `
                            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#f8fafc;border-radius:6px;">
                                <span>${getFileIcon(att.type)}</span>
                                <span style="flex:1;">${att.name}</span>
                                <button class="btn btn-sm btn-primary" onclick="downloadAttachment('${att.id}')">下载</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `,
        onConfirm: () => closeModal()
    };
    openEditModal(modal);
}

// 编辑公告
function editAnnouncement(id) {
    const a = state.data.announcements.find(item => item.id === id);
    if (!a) return;
    
    const modal = {
        title: '编辑公告',
        content: `
            <input type="hidden" id="edit-announcement-id" value="${id}">
            <div class="form-group"><label>标题</label><input type="text" id="announce-title" value="${a.title}"></div>
            <div class="form-row">
                <div class="form-group"><label>类型</label>
                    <select id="announce-type">
                        <option ${a.type === '通知' ? 'selected' : ''}>通知</option>
                        <option ${a.type === '公告' ? 'selected' : ''}>公告</option>
                        <option ${a.type === '制度' ? 'selected' : ''}>制度</option>
                        <option ${a.type === '活动' ? 'selected' : ''}>活动</option>
                        <option ${a.type === '紧急' ? 'selected' : ''}>紧急</option>
                    </select>
                </div>
                <div class="form-group"><label>发布部门</label><input type="text" id="announce-dept" value="${a.department || '人力资源部'}"></div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;">
                    <input type="checkbox" id="announce-important" ${a.isImportant ? 'checked' : ''}>
                    <label for="announce-important" style="margin:0;">标记为重要</label>
                </div>
                <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;">
                    <input type="checkbox" id="announce-top" ${a.isTop ? 'checked' : ''}>
                    <label for="announce-top" style="margin:0;">置顶显示</label>
                </div>
            </div>
            <div class="form-group"><label>内容</label><textarea id="announce-content" rows="6" placeholder="请输入公告内容...">${a.content || ''}</textarea></div>
        `,
        onConfirm: () => {
            const updates = {
                title: document.getElementById('announce-title').value,
                type: document.getElementById('announce-type').value,
                department: document.getElementById('announce-dept').value,
                content: document.getElementById('announce-content').value,
                isImportant: document.getElementById('announce-important').checked,
                isTop: document.getElementById('announce-top').checked,
                updatedAt: new Date().toISOString()
            };
            
            if (!updates.title || !updates.content) { showToast('请填写完整信息', 'error'); return; }
            
            localDB.update('announcements', id, updates);
            state.data.announcements = localDB.get('announcements');
            renderAnnouncements();
            closeModal();
            showToast('公告已更新', 'success');
        }
    };
    openEditModal(modal);
}

function deleteAnnouncement(id) {
    if (confirm('确定删除此公告？')) {
        localDB.deleteItem('announcements', id);
        state.data.announcements = localDB.get('announcements');
        renderAnnouncements();
        showToast('已删除', 'success');
    }
}

// ==================== 表单自动化（与台账数据联动） ====================
function generateForm(type) {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // 根据实际数据生成表单
    const forms = {
        onboarding: { 
            name: '入职登记表', 
            headers: ['工号', '姓名', '性别', '部门', '职位', '入职日期', '联系方式', '身份证号', '紧急联系人', '学历', '毕业院校', '状态'],
            getData: () => state.data.employees.map(e => [e.id, e.name, e.gender || '', e.dept, e.position, e.hireDate, e.phone || '', e.idcard || '', e.emergency || '', e.education || '', e.school || '', e.status])
        },
        resignation: { 
            name: '离职交接表', 
            headers: ['工号', '姓名', '部门', '职位', '入职日期', '离职日期', '离职原因', '工作交接情况', '物品归还', '财务结算', '合同状态'],
            getData: () => state.data.employees
                .filter(e => e.status === '已离职')
                .map(e => [e.id, e.name, e.dept, e.position, e.hireDate, e.leaveDate || '', e.leaveReason || '', '', '', '', '已解除'])
        },
        attendance: { 
            name: '考勤汇总表', 
            headers: ['工号', '姓名', '部门', '月份', '应出勤天数', '实出勤天数', '迟到次数', '早退次数', '请假天数', '加班时长', '备注'],
            getData: () => state.data.employees.map(e => [e.id, e.name, e.dept, currentMonth, '21', '20', '0', '0', '0', '0', ''])
        },
        offer: { 
            name: 'Offer录用函', 
            headers: ['候选人姓名', '应聘岗位', '部门', '入职日期', '试用期', '转正薪资', '试用期薪资', 'Offer有效期', 'HR联系人', '联系电话', '状态'],
            getData: () => state.data.candidates
                .filter(c => c.status === '终面通过' || c.status === 'Offer已发')
                .map(c => [c.name, c.position, '', today, '3个月', '', '', '', state.user.name, '', c.status])
        },
        payslip: { 
            name: '工资条', 
            headers: ['工号', '姓名', '部门', '月份', '基本工资', '岗位津贴', '绩效奖金', '加班费', '社保扣款', '公积金', '个税', '实发工资'],
            getData: () => state.data.employees
                .filter(e => e.status === '在职' || e.status === '试用期')
                .map(e => [e.id, e.name, e.dept, currentMonth, e.baseSalary || '8000', e.allowance || '2000', e.bonus || '0', '0', '800', '1200', '0', ''])
        },
        evaluation: { 
            name: '绩效评估表', 
            headers: ['工号', '姓名', '部门', '职位', '评估周期', 'KPI完成率', '工作质量', '团队协作', '创新能力', '综合得分', '等级', '改进建议'],
            getData: () => state.data.employees
                .filter(e => e.status === '在职' || e.status === '试用期')
                .map(e => [e.id, e.name, e.dept, e.position, currentMonth, '', '', '', '', '', '', ''])
        },
        contract: {
            name: '合同台账表',
            headers: ['合同编号', '员工姓名', '工号', '合同类型', '开始日期', '结束日期', '剩余天数', '状态', '备注'],
            getData: () => {
                const today = new Date();
                return state.data.contracts.map(c => {
                    const end = new Date(c.endDate);
                    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                    const daysLeft = diff >= 0 ? diff + ' 天' : '已过期';
                    return [c.id, c.employeeName, c.employeeId || '', c.type, c.startDate, c.endDate, daysLeft, c.status, ''];
                });
            }
        }
    };
    
    const form = forms[type];
    if (!form) { showToast('未知表单类型', 'error'); return; }
    
    showToast(`正在生成 ${form.name}...`, 'info');
    
    setTimeout(() => {
        // 获取实际数据
        const data = form.getData();
        
        // 生成 CSV 格式（Excel 可直接打开）
        const BOM = '\uFEFF'; // UTF-8 BOM
        const headers = form.headers.join(',');
        
        let csvContent;
        if (data.length === 0) {
            // 没有数据时生成表头
            csvContent = BOM + headers + '\n';
        } else {
            // 有数据时生成完整表格
            const rows = data.map(row => row.map(v => `"${v}"`).join(',')).join('\n');
            csvContent = BOM + headers + '\n' + rows + '\n';
        }
        
        downloadFileContent(`${form.name}_${today}.csv`, csvContent);
        showToast(`${form.name} 已生成，包含 ${data.length} 条记录`, 'success');
    }, 500);
}

function downloadFileContent(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== 模态框系统 ====================
const modals = {
    'add-todo': {
        title: '新建待办',
        content: `
            <div class="form-group"><label>待办标题</label><input type="text" id="todo-title" placeholder="输入待办事项"></div>
            <div class="form-row">
                <div class="form-group"><label>优先级</label><select id="todo-priority"><option value="high">高</option><option value="medium" selected>中</option><option value="low">低</option></select></div>
                <div class="form-group"><label>截止日期</label><input type="date" id="todo-deadline" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
        `,
        onConfirm: () => {
            const title = document.getElementById('todo-title').value;
            const priority = document.getElementById('todo-priority').value;
            const deadline = document.getElementById('todo-deadline').value;
            if (!title) { showToast('请输入待办标题', 'error'); return; }
            
            localDB.add('todos', { title, priority, deadline, completed: false });
            state.data.todos = localDB.get('todos');
            updateStats();
            renderTodos();
            renderDashboard();
            closeModal();
            showToast('待办已创建', 'success');
        }
    },
    'add-interview': {
        title: '安排面试',
        content: `
            <div class="form-group"><label>候选人姓名</label><input type="text" id="interview-candidate" placeholder="输入候选人姓名"></div>
            <div class="form-group"><label>应聘岗位</label><input type="text" id="interview-position" placeholder="输入岗位名称"></div>
            <div class="form-row">
                <div class="form-group"><label>面试日期</label><input type="date" id="interview-date" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>面试时间</label><input type="time" id="interview-time" value="14:00"></div>
            </div>
            <div class="form-group"><label>面试官</label><input type="text" id="interview-interviewer" placeholder="输入面试官姓名"></div>
        `,
        onConfirm: () => {
            const candidateName = document.getElementById('interview-candidate').value;
            const position = document.getElementById('interview-position').value;
            const date = document.getElementById('interview-date').value;
            const time = document.getElementById('interview-time').value;
            const interviewer = document.getElementById('interview-interviewer').value;
            if (!candidateName || !position) { showToast('请填写完整信息', 'error'); return; }
            
            localDB.add('interviews', { candidateName, position, time: date + ' ' + time, interviewer, status: '待进行' });
            state.data.interviews = localDB.get('interviews');
            renderInterviews();
            updateStats();
            closeModal();
            showToast('面试已安排', 'success');
        }
    },
    'add-candidate': {
        title: '录入候选人',
        content: `
            <div class="form-group"><label>姓名</label><input type="text" id="candidate-name" placeholder="候选人姓名"></div>
            <div class="form-group"><label>应聘岗位</label><input type="text" id="candidate-position" placeholder="岗位名称"></div>
            <div class="form-row">
                <div class="form-group"><label>来源渠道</label><select id="candidate-source"><option>BOSS直聘</option><option>猎聘</option><option>智联</option><option>内部推荐</option><option>其他</option></select></div>
                <div class="form-group"><label>当前状态</label><select id="candidate-status"><option>待筛选</option><option>初面通过</option><option>终面通过</option><option>Offer已发</option><option>已入职</option><option>淘汰</option></select></div>
            </div>
        `,
        onConfirm: () => {
            const name = document.getElementById('candidate-name').value;
            const position = document.getElementById('candidate-position').value;
            const source = document.getElementById('candidate-source').value;
            const status = document.getElementById('candidate-status').value;
            if (!name || !position) { showToast('请填写完整信息', 'error'); return; }
            
            localDB.add('candidates', { name, position, source, status, createdAt: new Date().toISOString().split('T')[0] });
            state.data.candidates = localDB.get('candidates');
            renderCandidates();
            closeModal();
            showToast('候选人已录入', 'success');
        }
    },
    'add-employee': {
        title: '入职登记',
        content: `
            <div class="form-row">
                <div class="form-group"><label>工号</label><input type="text" id="emp-id" placeholder="如: E004"></div>
                <div class="form-group"><label>姓名</label><input type="text" id="emp-name" placeholder="员工姓名"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>部门</label><select id="emp-dept"><option>技术部</option><option>产品部</option><option>市场部</option><option>人事部</option><option>财务部</option></select></div>
                <div class="form-group"><label>职位</label><input type="text" id="emp-position" placeholder="职位名称"></div>
            </div>
            <div class="form-group"><label>入职日期</label><input type="date" id="emp-hire-date" value="${new Date().toISOString().split('T')[0]}"></div>
        `,
        onConfirm: () => {
            const id = document.getElementById('emp-id').value;
            const name = document.getElementById('emp-name').value;
            const dept = document.getElementById('emp-dept').value;
            const position = document.getElementById('emp-position').value;
            const hireDate = document.getElementById('emp-hire-date').value;
            if (!id || !name) { showToast('请填写完整信息', 'error'); return; }
            
            localDB.add('employees', { id, name, dept, position, hireDate, status: '试用期' });
            state.data.employees = localDB.get('employees');
            renderEmployees();
            updateStats();
            closeModal();
            showToast('员工已登记', 'success');
        }
    },
    'add-contract': {
        title: '新增合同',
        content: `
            <div class="form-group"><label>员工姓名</label><input type="text" id="contract-emp" placeholder="员工姓名"></div>
            <div class="form-row">
                <div class="form-group"><label>合同类型</label><select id="contract-type"><option>劳动合同</option><option>劳务合同</option><option>实习协议</option></select></div>
                <div class="form-group"><label>状态</label><select id="contract-status"><option>有效</option><option>已到期</option><option>已解除</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>开始日期</label><input type="date" id="contract-start" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>结束日期</label><input type="date" id="contract-end"></div>
            </div>
        `,
        onConfirm: () => {
            const employeeName = document.getElementById('contract-emp').value;
            const type = document.getElementById('contract-type').value;
            const status = document.getElementById('contract-status').value;
            const startDate = document.getElementById('contract-start').value;
            const endDate = document.getElementById('contract-end').value;
            if (!employeeName || !endDate) { showToast('请填写完整信息', 'error'); return; }
            
            localDB.add('contracts', { employeeName, type, status, startDate, endDate });
            state.data.contracts = localDB.get('contracts');
            renderContracts();
            updateStats();
            closeModal();
            showToast('合同已添加', 'success');
        }
    },
    'add-schedule': {
        title: '新建日程',
        content: `
            <div class="form-group"><label>日程标题</label><input type="text" id="schedule-title" placeholder="输入日程标题"></div>
            <div class="form-row">
                <div class="form-group"><label>日期</label><input type="date" id="schedule-date" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>时间</label><input type="time" id="schedule-time" value="09:00"></div>
            </div>
            <div class="form-group"><label>类型</label><select id="schedule-type"><option value="meeting">会议</option><option value="interview">面试</option><option value="training">培训</option><option value="other">其他</option></select></div>
        `,
        onConfirm: () => {
            const title = document.getElementById('schedule-title').value;
            const date = document.getElementById('schedule-date').value;
            const time = document.getElementById('schedule-time').value;
            const type = document.getElementById('schedule-type').value;
            if (!title) { showToast('请输入日程标题', 'error'); return; }
            
            localDB.add('schedules', { title, date, time, type });
            state.data.schedules = localDB.get('schedules');
            renderCalendar();
            renderScheduleList();
            renderDashboard();
            updateStats();
            closeModal();
            showToast('日程已创建', 'success');
        }
    },
    'add-announcement': {
        title: '发布信息',
        content: `
            <div class="form-group"><label>标题</label><input type="text" id="announce-title" placeholder="公告标题"></div>
            <div class="form-row">
                <div class="form-group"><label>类型</label>
                    <select id="announce-type">
                        <option>通知</option>
                        <option>公告</option>
                        <option>制度</option>
                        <option>活动</option>
                        <option>紧急</option>
                    </select>
                </div>
                <div class="form-group"><label>发布部门</label><input type="text" id="announce-dept" value="人力资源部"></div>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;">
                    <input type="checkbox" id="announce-important">
                    <label for="announce-important" style="margin:0;">标记为重要</label>
                </div>
                <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;">
                    <input type="checkbox" id="announce-top">
                    <label for="announce-top" style="margin:0;">置顶显示</label>
                </div>
            </div>
            <div class="form-group"><label>内容</label><textarea id="announce-content" rows="6" placeholder="请输入公告内容..."></textarea></div>
        `,
        onConfirm: () => {
            const title = document.getElementById('announce-title').value;
            const content = document.getElementById('announce-content').value;
            const type = document.getElementById('announce-type').value;
            const department = document.getElementById('announce-dept').value;
            const isImportant = document.getElementById('announce-important').checked;
            const isTop = document.getElementById('announce-top').checked;
            
            if (!title || !content) { showToast('请填写完整信息', 'error'); return; }
            
            localDB.add('announcements', { 
                title, 
                content, 
                type,
                department,
                isImportant,
                isTop,
                author: state.user.name,
                date: new Date().toISOString().split('T')[0],
                readCount: 0
            });
            state.data.announcements = localDB.get('announcements');
            renderAnnouncements();
            closeModal();
            showToast('公告已发布', 'success');
        }
    },
    'upload-file': {
        title: '上传文件',
        content: `
            <div class="form-group"><label>选择文件</label><input type="file" id="file-input" onchange="previewFile()"></div>
            <div id="file-preview" style="display:none;padding:12px;background:#f8fafc;border-radius:8px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span id="preview-icon" style="font-size:32px;">📄</span>
                    <div>
                        <div id="preview-name" style="font-weight:600;"></div>
                        <div id="preview-size" style="font-size:12px;color:var(--text-light);"></div>
                    </div>
                </div>
            </div>
            <div class="form-group"><label>文件说明</label><input type="text" id="file-desc" placeholder="可选：添加文件说明"></div>
            <div class="form-group">
                <label>关联类型（可选）</label>
                <select id="file-related-type">
                    <option value="">无关联</option>
                    <option value="employee">员工档案</option>
                    <option value="contract">合同</option>
                    <option value="candidate">候选人</option>
                </select>
            </div>
        `,
        onConfirm: () => {
            const fileInput = document.getElementById('file-input');
            if (!fileInput.files[0]) { showToast('请选择文件', 'error'); return; }
            
            const file = fileInput.files[0];
            const ext = file.name.split('.').pop().toLowerCase();
            
            // 读取文件内容为Base64
            const reader = new FileReader();
            reader.onload = function(e) {
                const fileData = {
                    name: file.name,
                    type: ext,
                    mimeType: file.type,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    date: new Date().toISOString().split('T')[0],
                    desc: document.getElementById('file-desc').value,
                    uploader: state.user.name,
                    content: e.target.result, // Base64编码的文件内容
                    relatedType: document.getElementById('file-related-type').value
                };
                
                localDB.add('files', fileData);
                state.data.files = localDB.get('files');
                renderFiles();
                closeModal();
                showToast('文件已上传', 'success');
            };
            reader.onerror = function() {
                showToast('文件读取失败', 'error');
            };
            reader.readAsDataURL(file);
        }
    }
};

function openModal(type) {
    const modal = modals[type];
    if (!modal) return;
    
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal show" id="active-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modal.title}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">${modal.content}</div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="modalConfirm()">确定</button>
                </div>
            </div>
        </div>
    `;
    
    window.currentModal = modal;
}

function closeModal() {
    const modal = document.getElementById('active-modal');
    if (modal) modal.remove();
    window.currentModal = null;
}

function modalConfirm() {
    if (window.currentModal && window.currentModal.onConfirm) {
        window.currentModal.onConfirm();
    }
}

// ==================== Toast 提示 ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== 全局搜索 ====================
function globalSearch(keyword) {
    if (!keyword) return;
    keyword = keyword.toLowerCase();
    
    const results = [];
    state.data.employees.forEach(e => {
        if (e.name.toLowerCase().includes(keyword) || e.id.toLowerCase().includes(keyword)) {
            results.push({ type: '员工', name: e.name, id: e.id });
        }
    });
    state.data.candidates.forEach(c => {
        if (c.name.toLowerCase().includes(keyword)) {
            results.push({ type: '候选人', name: c.name, id: c.id });
        }
    });
    
    if (results.length > 0) {
        showToast(`找到 ${results.length} 个结果`, 'success');
    }
}

// ==================== 快捷操作 ====================
function quickAction() {
    const actions = ['add-todo', 'add-interview', 'add-candidate', 'add-employee'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    openModal(action);
}

// ==================== 事件监听 ====================
function setupEventListeners() {
    // ESC关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// ==================== Supabase 同步 ====================
async function syncFromSupabase() {
    // 从Supabase加载数据
    const tables = ['employees', 'candidates', 'interviews', 'schedules', 'todos', 'contracts'];
    for (const table of tables) {
        const { data, error } = await db.select(table);
        if (data && data.length > 0) {
            localDB.set(table, data);
            state.data[table] = data;
        }
    }
}

async function syncToSupabase() {
    // 将本地数据同步到Supabase（需要表已创建）
    // 实际使用时需要处理冲突和增量同步
}

// 导出全局函数
window.showPage = showPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.modalConfirm = modalConfirm;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.filterTodos = filterTodos;
window.deleteInterview = deleteInterview;
window.deleteCandidate = deleteCandidate;
window.deleteEmployee = deleteEmployee;
window.deleteContract = deleteContract;
window.deleteSchedule = deleteSchedule;
window.deleteAnnouncement = deleteAnnouncement;
window.changeMonth = changeMonth;
window.showDayEvents = showDayEvents;
window.generateForm = generateForm;
window.globalSearch = globalSearch;
window.quickAction = quickAction;
// ==================== 编辑功能 ====================
function editInterview(id) {
    const item = state.data.interviews.find(i => i.id === id);
    if (!item) return;
    const [date, time] = item.time.split(' ');
    
    const modal = {
        title: '编辑面试',
        content: `
            <input type="hidden" id="edit-id" value="${id}">
            <div class="form-group"><label>候选人姓名</label><input type="text" id="interview-candidate" value="${item.candidateName}"></div>
            <div class="form-group"><label>应聘岗位</label><input type="text" id="interview-position" value="${item.position}"></div>
            <div class="form-row">
                <div class="form-group"><label>面试日期</label><input type="date" id="interview-date" value="${date}"></div>
                <div class="form-group"><label>面试时间</label><input type="time" id="interview-time" value="${time || '14:00'}"></div>
            </div>
            <div class="form-group"><label>面试官</label><input type="text" id="interview-interviewer" value="${item.interviewer}"></div>
            <div class="form-group"><label>状态</label><select id="interview-status"><option>待进行</option><option>已通过</option><option>未通过</option><option>已取消</option></select></div>
        `,
        onConfirm: () => {
            const updates = {
                candidateName: document.getElementById('interview-candidate').value,
                position: document.getElementById('interview-position').value,
                time: document.getElementById('interview-date').value + ' ' + document.getElementById('interview-time').value,
                interviewer: document.getElementById('interview-interviewer').value,
                status: document.getElementById('interview-status').value
            };
            localDB.update('interviews', id, updates);
            state.data.interviews = localDB.get('interviews');
            renderInterviews();
            updateStats();
            closeModal();
            showToast('面试已更新', 'success');
        }
    };
    openEditModal(modal);
}

function editCandidate(id) {
    const item = state.data.candidates.find(c => c.id === id);
    if (!item) return;
    
    const modal = {
        title: '编辑候选人',
        content: `
            <input type="hidden" id="edit-id" value="${id}">
            <div class="form-group"><label>姓名</label><input type="text" id="candidate-name" value="${item.name}"></div>
            <div class="form-group"><label>应聘岗位</label><input type="text" id="candidate-position" value="${item.position}"></div>
            <div class="form-row">
                <div class="form-group"><label>来源渠道</label><select id="candidate-source"><option>BOSS直聘</option><option>猎聘</option><option>智联</option><option>内部推荐</option><option>其他</option></select></div>
                <div class="form-group"><label>当前状态</label><select id="candidate-status"><option>待筛选</option><option>初面通过</option><option>终面通过</option><option>Offer已发</option><option>已入职</option><option>淘汰</option></select></div>
            </div>
        `,
        onConfirm: () => {
            const updates = {
                name: document.getElementById('candidate-name').value,
                position: document.getElementById('candidate-position').value,
                source: document.getElementById('candidate-source').value,
                status: document.getElementById('candidate-status').value
            };
            localDB.update('candidates', id, updates);
            state.data.candidates = localDB.get('candidates');
            renderCandidates();
            closeModal();
            showToast('候选人已更新', 'success');
        }
    };
    openEditModal(modal);
}

function editEmployee(id) {
    const item = state.data.employees.find(e => e.id === id);
    if (!item) return;
    
    const modal = {
        title: '编辑员工信息',
        content: `
            <input type="hidden" id="edit-id" value="${id}">
            <div class="form-row">
                <div class="form-group"><label>工号</label><input type="text" id="emp-id" value="${item.id}"></div>
                <div class="form-group"><label>姓名</label><input type="text" id="emp-name" value="${item.name}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>部门</label><select id="emp-dept"><option>技术部</option><option>产品部</option><option>市场部</option><option>人事部</option><option>财务部</option></select></div>
                <div class="form-group"><label>职位</label><input type="text" id="emp-position" value="${item.position}"></div>
            </div>
            <div class="form-group"><label>入职日期</label><input type="date" id="emp-hire-date" value="${item.hireDate}"></div>
            <div class="form-group"><label>状态</label><select id="emp-status"><option>在职</option><option>试用期</option><option>已离职</option></select></div>
        `,
        onConfirm: () => {
            const updates = {
                id: document.getElementById('emp-id').value,
                name: document.getElementById('emp-name').value,
                dept: document.getElementById('emp-dept').value,
                position: document.getElementById('emp-position').value,
                hireDate: document.getElementById('emp-hire-date').value,
                status: document.getElementById('emp-status').value
            };
            localDB.update('employees', id, updates);
            state.data.employees = localDB.get('employees');
            renderEmployees();
            updateStats();
            closeModal();
            showToast('员工信息已更新', 'success');
        }
    };
    openEditModal(modal);
}

function editContract(id) {
    const item = state.data.contracts.find(c => c.id === id);
    if (!item) return;
    
    const modal = {
        title: '编辑合同',
        content: `
            <input type="hidden" id="edit-id" value="${id}">
            <div class="form-group"><label>员工姓名</label><input type="text" id="contract-emp" value="${item.employeeName}"></div>
            <div class="form-row">
                <div class="form-group"><label>合同类型</label><select id="contract-type"><option>劳动合同</option><option>劳务合同</option><option>实习协议</option></select></div>
                <div class="form-group"><label>状态</label><select id="contract-status"><option>有效</option><option>已到期</option><option>已解除</option></select></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>开始日期</label><input type="date" id="contract-start" value="${item.startDate}"></div>
                <div class="form-group"><label>结束日期</label><input type="date" id="contract-end" value="${item.endDate}"></div>
            </div>
        `,
        onConfirm: () => {
            const updates = {
                employeeName: document.getElementById('contract-emp').value,
                type: document.getElementById('contract-type').value,
                status: document.getElementById('contract-status').value,
                startDate: document.getElementById('contract-start').value,
                endDate: document.getElementById('contract-end').value
            };
            localDB.update('contracts', id, updates);
            state.data.contracts = localDB.get('contracts');
            renderContracts();
            updateStats();
            closeModal();
            showToast('合同已更新', 'success');
        }
    };
    openEditModal(modal);
}

function openEditModal(modal) {
    window.currentModal = modal;
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal show" id="active-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modal.title}</h3>
                    <button class="modal-close" onclick="closeModal()">×</button>
                </div>
                <div class="modal-body">${modal.content}</div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button class="btn btn-primary" onclick="modalConfirm()">保存</button>
                </div>
            </div>
        </div>
    `;
}

// 文件预览函数
function previewFile() {
    const fileInput = document.getElementById('file-input');
    const previewDiv = document.getElementById('file-preview');
    const previewIcon = document.getElementById('preview-icon');
    const previewName = document.getElementById('preview-name');
    const previewSize = document.getElementById('preview-size');
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        
        previewDiv.style.display = 'block';
        previewIcon.textContent = getFileIcon(ext);
        previewName.textContent = file.name;
        previewSize.textContent = (file.size / 1024).toFixed(1) + ' KB';
    }
}

// 绑定到window
window.previewFile = previewFile;
window.showFileDetail = showFileDetail;
window.downloadRealFile = downloadRealFile;
window.deleteFile = deleteFile;
window.showAnnouncementDetail = showAnnouncementDetail;
window.editAnnouncement = editAnnouncement;

// ==================== 全链路自动化功能 ====================

// 从候选人安排面试
function scheduleInterviewFromCandidate(candidateId) {
    const candidate = state.data.candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    
    const modal = {
        title: `为 ${candidate.name} 安排面试`,
        content: `
            <input type="hidden" id="link-candidate-id" value="${candidateId}">
            <div class="form-group"><label>候选人</label><input type="text" value="${candidate.name}" disabled></div>
            <div class="form-group"><label>应聘岗位</label><input type="text" id="interview-position" value="${candidate.position}"></div>
            <div class="form-row">
                <div class="form-group"><label>面试日期</label><input type="date" id="interview-date" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>面试时间</label><input type="time" id="interview-time" value="14:00"></div>
            </div>
            <div class="form-group"><label>面试官</label><input type="text" id="interview-interviewer" placeholder="输入面试官姓名"></div>
            <div class="form-group"><label>面试轮次</label><select id="interview-round"><option>初面</option><option>终面</option></select></div>
        `,
        onConfirm: () => {
            const date = document.getElementById('interview-date').value;
            const time = document.getElementById('interview-time').value;
            const interviewer = document.getElementById('interview-interviewer').value;
            const position = document.getElementById('interview-position').value;
            const round = document.getElementById('interview-round').value;
            
            if (!interviewer) { showToast('请输入面试官', 'error'); return; }
            
            // 创建面试记录
            const interview = localDB.add('interviews', { 
                candidateName: candidate.name, 
                position: position, 
                time: date + ' ' + time, 
                interviewer: interviewer, 
                status: '待进行',
                round: round,
                candidateId: candidateId
            });
            
            // 更新候选人状态
            localDB.update('candidates', candidateId, { 
                status: round === '初面' ? '初面安排' : '终面安排',
                interviewId: interview.id
            });
            
            // 自动创建日程
            localDB.add('schedules', {
                title: `${candidate.name} ${round}面试`,
                date: date,
                time: time,
                type: 'interview',
                relatedId: interview.id,
                relatedType: 'interview'
            });
            
            // 自动创建待办
            localDB.add('todos', {
                title: `准备${candidate.name}的${round}面试`,
                priority: 'high',
                deadline: date,
                completed: false,
                relatedId: interview.id
            });
            
            state.data.interviews = localDB.get('interviews');
            state.data.candidates = localDB.get('candidates');
            state.data.schedules = localDB.get('schedules');
            state.data.todos = localDB.get('todos');
            
            renderInterviews();
            renderCandidates();
            renderCalendar();
            renderScheduleList();
            updateStats();
            closeModal();
            showToast(`已为 ${candidate.name} 安排${round}，并自动创建日程和待办`, 'success');
        }
    };
    openEditModal(modal);
}

// 从面试记录直接办理入职
function convertToEmployee(interviewId) {
    const interview = state.data.interviews.find(i => i.id === interviewId);
    if (!interview) return;
    
    // 查找关联的候选人
    const candidate = state.data.candidates.find(c => c.name === interview.candidateName);
    
    const modal = {
        title: `${interview.candidateName} 入职登记`,
        content: `
            <input type="hidden" id="link-interview-id" value="${interviewId}">
            <input type="hidden" id="link-candidate-id" value="${candidate ? candidate.id : ''}">
            <div class="form-row">
                <div class="form-group"><label>工号</label><input type="text" id="emp-id" placeholder="如: E004"></div>
                <div class="form-group"><label>姓名</label><input type="text" id="emp-name" value="${interview.candidateName}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>部门</label><select id="emp-dept"><option>技术部</option><option>产品部</option><option>市场部</option><option>人事部</option><option>财务部</option></select></div>
                <div class="form-group"><label>职位</label><input type="text" id="emp-position" value="${interview.position}"></div>
            </div>
            <div class="form-group"><label>入职日期</label><input type="date" id="emp-hire-date" value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-group"><label>联系方式</label><input type="text" id="emp-phone" placeholder="手机号码"></div>
            <div class="form-group"><label>身份证号</label><input type="text" id="emp-idcard" placeholder="身份证号码"></div>
        `,
        onConfirm: () => {
            const id = document.getElementById('emp-id').value;
            const name = document.getElementById('emp-name').value;
            const dept = document.getElementById('emp-dept').value;
            const position = document.getElementById('emp-position').value;
            const hireDate = document.getElementById('emp-hire-date').value;
            const phone = document.getElementById('emp-phone').value;
            const idcard = document.getElementById('emp-idcard').value;
            
            if (!id || !name) { showToast('请填写完整信息', 'error'); return; }
            
            // 创建员工记录
            const employee = localDB.add('employees', { 
                id, name, dept, position, hireDate, status: '试用期',
                phone, idcard,
                source: candidate ? candidate.source : '其他',
                interviewId: interviewId
            });
            
            // 更新面试状态
            localDB.update('interviews', interviewId, { status: '已入职', employeeId: id });
            
            // 更新候选人状态
            if (candidate) {
                localDB.update('candidates', candidate.id, { status: '已入职', employeeId: id });
            }
            
            // 自动创建合同记录
            const contractEnd = new Date(hireDate);
            contractEnd.setFullYear(contractEnd.getFullYear() + 3);
            localDB.add('contracts', {
                employeeName: name,
                employeeId: id,
                type: '劳动合同',
                startDate: hireDate,
                endDate: contractEnd.toISOString().split('T')[0],
                status: '有效'
            });
            
            // 自动创建入职日程
            localDB.add('schedules', {
                title: `${name} 入职办理`,
                date: hireDate,
                time: '09:00',
                type: 'training',
                relatedId: id,
                relatedType: 'employee'
            });
            
            // 刷新数据
            state.data.employees = localDB.get('employees');
            state.data.interviews = localDB.get('interviews');
            state.data.candidates = localDB.get('candidates');
            state.data.contracts = localDB.get('contracts');
            state.data.schedules = localDB.get('schedules');
            
            renderEmployees();
            renderInterviews();
            renderCandidates();
            renderContracts();
            renderCalendar();
            updateStats();
            closeModal();
            showToast(`${name} 已入职，合同和日程已自动创建`, 'success');
        }
    };
    openEditModal(modal);
}

// 从候选人直接办理入职
function convertCandidateToEmployee(candidateId) {
    const candidate = state.data.candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    
    const modal = {
        title: `${candidate.name} 入职登记`,
        content: `
            <input type="hidden" id="link-candidate-id" value="${candidateId}">
            <div class="form-row">
                <div class="form-group"><label>工号</label><input type="text" id="emp-id" placeholder="如: E004"></div>
                <div class="form-group"><label>姓名</label><input type="text" id="emp-name" value="${candidate.name}"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>部门</label><select id="emp-dept"><option>技术部</option><option>产品部</option><option>市场部</option><option>人事部</option><option>财务部</option></select></div>
                <div class="form-group"><label>职位</label><input type="text" id="emp-position" value="${candidate.position}"></div>
            </div>
            <div class="form-group"><label>入职日期</label><input type="date" id="emp-hire-date" value="${new Date().toISOString().split('T')[0]}"></div>
            <div class="form-group"><label>联系方式</label><input type="text" id="emp-phone" placeholder="手机号码"></div>
            <div class="form-group"><label>身份证号</label><input type="text" id="emp-idcard" placeholder="身份证号码"></div>
        `,
        onConfirm: () => {
            const id = document.getElementById('emp-id').value;
            const name = document.getElementById('emp-name').value;
            const dept = document.getElementById('emp-dept').value;
            const position = document.getElementById('emp-position').value;
            const hireDate = document.getElementById('emp-hire-date').value;
            const phone = document.getElementById('emp-phone').value;
            const idcard = document.getElementById('emp-idcard').value;
            
            if (!id || !name) { showToast('请填写完整信息', 'error'); return; }
            
            // 创建员工记录
            localDB.add('employees', { 
                id, name, dept, position, hireDate, status: '试用期',
                phone, idcard,
                source: candidate.source,
                candidateId: candidateId
            });
            
            // 更新候选人状态
            localDB.update('candidates', candidateId, { status: '已入职', employeeId: id });
            
            // 自动创建合同记录
            const contractEnd = new Date(hireDate);
            contractEnd.setFullYear(contractEnd.getFullYear() + 3);
            localDB.add('contracts', {
                employeeName: name,
                employeeId: id,
                type: '劳动合同',
                startDate: hireDate,
                endDate: contractEnd.toISOString().split('T')[0],
                status: '有效'
            });
            
            // 自动创建入职日程
            localDB.add('schedules', {
                title: `${name} 入职办理`,
                date: hireDate,
                time: '09:00',
                type: 'training',
                relatedId: id,
                relatedType: 'employee'
            });
            
            // 刷新数据
            state.data.employees = localDB.get('employees');
            state.data.candidates = localDB.get('candidates');
            state.data.contracts = localDB.get('contracts');
            state.data.schedules = localDB.get('schedules');
            
            renderEmployees();
            renderCandidates();
            renderContracts();
            renderCalendar();
            updateStats();
            closeModal();
            showToast(`${name} 已入职，合同和日程已自动创建`, 'success');
        }
    };
    openEditModal(modal);
}

// 绑定到 window
window.editInterview = editInterview;
window.editCandidate = editCandidate;
window.editEmployee = editEmployee;
window.editContract = editContract;
window.downloadFile = downloadFile;
window.scheduleInterviewFromCandidate = scheduleInterviewFromCandidate;
window.convertToEmployee = convertToEmployee;
window.convertCandidateToEmployee = convertCandidateToEmployee;
