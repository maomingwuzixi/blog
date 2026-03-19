// Supabase 配置
const SUPABASE_URL = 'https://wahhfssjvhuwdugctwnb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Us3O7cL4cMo03f8kXDeubg_WxFETihT';

// 初始化 Supabase 客户端（CDN加载）
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase 已初始化');
        return supabaseClient;
    }
    console.error('❌ Supabase 库未加载');
    return null;
}

// 数据库表名常量
const TABLES = {
    EMPLOYEES: 'employees',
    CANDIDATES: 'candidates',
    INTERVIEWS: 'interviews',
    SCHEDULES: 'schedules',
    TODOS: 'todos',
    CONTRACTS: 'contracts',
    FILES: 'files',
    FORMS: 'forms'
};

// 通用 CRUD 操作
const db = {
    // 获取数据
    async select(table, options = {}) {
        if (!supabaseClient) initSupabase();
        let query = supabaseClient.from(table).select(options.columns || '*');
        if (options.eq) query = query.eq(options.eq.column, options.eq.value);
        if (options.order) query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
        if (options.limit) query = query.limit(options.limit);
        const { data, error } = await query;
        return error ? { error } : { data };
    },

    // 插入数据
    async insert(table, data) {
        if (!supabaseClient) initSupabase();
        const { data: result, error } = await supabaseClient.from(table).insert(data).select();
        return error ? { error } : { data: result };
    },

    // 更新数据
    async update(table, id, data) {
        if (!supabaseClient) initSupabase();
        const { data: result, error } = await supabaseClient.from(table).update(data).eq('id', id).select();
        return error ? { error } : { data: result };
    },

    // 删除数据
    async delete(table, id) {
        if (!supabaseClient) initSupabase();
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        return error ? { error } : { success: true };
    },

    // 搜索
    async search(table, column, keyword) {
        if (!supabaseClient) initSupabase();
        const { data, error } = await supabaseClient.from(table).select('*').ilike(column, `%${keyword}%`);
        return error ? { error } : { data };
    }
};

// 本地存储（离线备用）
const localDB = {
    get(key) {
        try {
            const data = localStorage.getItem(`hr_${key}`);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('localDB.get error:', e);
            return [];
        }
    },
    set(key, data) {
        try {
            localStorage.setItem(`hr_${key}`, JSON.stringify(data));
        } catch (e) {
            console.error('localDB.set error:', e);
        }
    },
    add(key, item) {
        const data = this.get(key);
        item.id = item.id || Date.now().toString();
        item.created_at = new Date().toISOString();
        data.unshift(item);
        this.set(key, data);
        return item;
    },
    update(key, id, updates) {
        const data = this.get(key);
        const index = data.findIndex(i => i.id === id);
        if (index > -1) {
            data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
            this.set(key, data);
            return data[index];
        }
        return null;
    },
    deleteItem(key, id) {
        const data = this.get(key);
        const filtered = data.filter(i => i.id !== id);
        this.set(key, filtered);
    }
};

// 导出
window.SUPABASE_CONFIG = { URL: SUPABASE_URL, KEY: SUPABASE_KEY, TABLES };
window.initSupabase = initSupabase;
window.db = db;
window.localDB = localDB;
