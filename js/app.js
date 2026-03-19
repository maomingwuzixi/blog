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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">暂无面试安排</td></tr>';
    } else {
        tbody.innerHTML = state.data.interviews.map(i => `
            <tr>
                <td><strong>${i.candidateName}</strong></td>
                <td>${i.position}</td>
                <td>${i.time}</td>
                <td>${i.interviewer}</td>
                <td><span class="status status-${getStatusClass(i.status)}">${i.status}</span></td>
                <td>
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">暂无候选人</td></tr>';
    } else {
        tbody.innerHTML = state.data.candidates.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.position}</td>
                <td>${c.source}</td>
                <td><span class="status status-${getCandidateStatusClass(c.status)}">${c.status}</span></td>
                <td>${c.createdAt}</td>
                <td>
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

// ==================== 文件管理 ====================
function renderFiles() {
    const grid = document.getElementById('files-grid');
    if (state.data.files.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">📁</div><h4>暂无文件</h4><p>点击上传文件按钮添加</p></div>';
    } else {
        grid.innerHTML = state.data.files.map(f => `
            <div class="file-item" onclick="downloadFile('${f.id}')">
                <div class="file-icon">${getFileIcon(f.type)}</div>
                <div class="file-name">${f.name}</div>
                <div class="file-meta">${f.size} · ${f.date}</div>
            </div>
        `).join('');
    }
}

function getFileIcon(type) {
    const icons = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️', jpg: '🖼️', png: '🖼️', zip: '📦' };
    return icons[type] || '📄';
}

// ==================== 信息发布 ====================
function renderAnnouncements() {
    const list = document.getElementById('announcements-list');
    if (state.data.announcements.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="icon">📢</div><h4>暂无公告</h4></div>';
    } else {
        list.innerHTML = state.data.announcements.map(a => `
            <div class="card" style="margin-bottom:16px;">
                <div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:start;">
                        <div>
                            <h4 style="margin-bottom:8px;">${a.title}</h4>
                            <p style="color:var(--text-light);font-size:13px;">${a.content}</p>
                            <div style="margin-top:12px;font-size:12px;color:var(--text-light);">
                                发布于 ${a.date} · ${a.author}
                            </div>
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="deleteAnnouncement('${a.id}')">删除</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function deleteAnnouncement(id) {
    if (confirm('确定删除此公告？')) {
        localDB.deleteItem('announcements', id);
        state.data.announcements = localDB.get('announcements');
        renderAnnouncements();
        showToast('已删除', 'success');
    }
}

// ==================== 表单自动化 ====================
function generateForm(type) {
    const forms = {
        onboarding: { 
            name: '入职登记表', 
            headers: ['姓名', '性别', '部门', '职位', '入职日期', '联系方式', '身份证号', '紧急联系人', '学历', '毕业院校'],
            sample: ['张三', '男', '技术部', '前端工程师', '2024-03-20', '13800138000', '110101199001011234', '李四 13900139000', '本科', '北京大学']
        },
        resignation: { 
            name: '离职交接表', 
            headers: ['姓名', '部门', '职位', '入职日期', '离职日期', '离职原因', '工作交接情况', '物品归还', '财务结算', '直属领导签字'],
            sample: ['王五', '市场部', '市场专员', '2023-06-01', '2024-03-15', '个人发展', '已交接', '已归还', '已结清', '']
        },
        attendance: { 
            name: '考勤汇总表', 
            headers: ['姓名', '部门', '月份', '应出勤天数', '实出勤天数', '迟到次数', '早退次数', '请假天数', '加班时长', '备注'],
            sample: ['全员', '全部门', '2024-03', '21', '20', '1', '0', '1', '8h', '']
        },
        offer: { 
            name: 'Offer录用函', 
            headers: ['候选人姓名', '应聘岗位', '部门', '入职日期', '试用期', '转正薪资', '试用期薪资', 'Offer有效期', 'HR联系人', '联系电话'],
            sample: ['赵六', 'Java开发工程师', '技术部', '2024-04-01', '3个月', '15000', '12000', '2024-03-25', '吴梓锡', '010-12345678']
        },
        payslip: { 
            name: '工资条', 
            headers: ['姓名', '工号', '月份', '基本工资', '岗位津贴', '绩效奖金', '加班费', '社保扣款', '公积金', '个税', '实发工资'],
            sample: ['张三', 'E001', '2024-03', '8000', '2000', '3000', '500', '800', '1200', '450', '11050']
        },
        evaluation: { 
            name: '绩效评估表', 
            headers: ['姓名', '部门', '评估周期', 'KPI完成率', '工作质量', '团队协作', '创新能力', '综合得分', '等级', '改进建议'],
            sample: ['张三', '技术部', '2024Q1', '95%', '90', '88', '85', '89.5', 'A', '继续保持']
        }
    };
    
    const form = forms[type];
    showToast(`正在生成 ${form.name}...`, 'info');
    
    setTimeout(() => {
        // 生成 CSV 格式（Excel 可直接打开）
        const BOM = '\uFEFF'; // UTF-8 BOM
        const headers = form.headers.join(',');
        const sample = form.sample.map(v => `"${v}"`).join(',');
        const csvContent = BOM + headers + '\n' + sample + '\n';
        
        downloadFileContent(`${form.name}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
        showToast(`${form.name} 已生成（Excel可直接打开）`, 'success');
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
            <div class="form-group"><label>内容</label><textarea id="announce-content" rows="4" placeholder="公告内容"></textarea></div>
        `,
        onConfirm: () => {
            const title = document.getElementById('announce-title').value;
            const content = document.getElementById('announce-content').value;
            if (!title || !content) { showToast('请填写完整信息', 'error'); return; }
            
            localDB.add('announcements', { 
                title, 
                content, 
                author: state.user.name,
                date: new Date().toISOString().split('T')[0] 
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
            <div class="form-group"><label>选择文件</label><input type="file" id="file-input"></div>
            <div class="form-group"><label>文件说明</label><input type="text" id="file-desc" placeholder="可选：添加文件说明"></div>
        `,
        onConfirm: () => {
            const fileInput = document.getElementById('file-input');
            if (!fileInput.files[0]) { showToast('请选择文件', 'error'); return; }
            
            const file = fileInput.files[0];
            const ext = file.name.split('.').pop().toLowerCase();
            
            localDB.add('files', {
                name: file.name,
                type: ext,
                size: (file.size / 1024).toFixed(1) + ' KB',
                date: new Date().toISOString().split('T')[0],
                desc: document.getElementById('file-desc').value
            });
            state.data.files = localDB.get('files');
            renderFiles();
            closeModal();
            showToast('文件已上传', 'success');
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

// ==================== 文件下载 ====================
function downloadFile(id) {
    const file = state.data.files.find(f => f.id === id);
    if (!file) {
        showToast('文件不存在', 'error');
        return;
    }
    // 创建一个模拟的文本文件下载
    const content = `文件名称: ${file.name}\n文件类型: ${file.type}\n文件大小: ${file.size}\n上传日期: ${file.date}\n说明: ${file.desc || '无'}`;
    downloadFileContent(file.name.replace(/\.[^.]+$/, '') + '_信息.txt', content);
    showToast('文件信息已下载', 'success');
}

// 绑定到 window
window.editInterview = editInterview;
window.editCandidate = editCandidate;
window.editEmployee = editEmployee;
window.editContract = editContract;
window.downloadFile = downloadFile;
