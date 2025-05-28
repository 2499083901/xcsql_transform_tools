// 切换功能模块
document.getElementById('mode1').addEventListener('click', () => {
    setMode(1);
});
document.getElementById('mode2').addEventListener('click', () => {
    setMode(2);
});
document.getElementById('transformSQL').addEventListener('click', () => {
    transformSQL();
});
document.getElementById('copyOutput1').addEventListener('click', () => {
    copyOutput('output1');
});
document.getElementById('generateAlterSQL').addEventListener('click', () => {
    generateAlterSQL();
});
document.getElementById('copyOutput2').addEventListener('click', () => {
    copyOutput('alterOutput');
});

function setMode(mode) {
    console.log("切换到功能", mode);
    document.getElementById('mode1').classList.remove('active');
    document.getElementById('mode2').classList.remove('active');
    document.getElementById('section1').classList.remove('active');
    document.getElementById('section2').classList.remove('active');

    document.getElementById(`mode${mode}`).classList.add('active');
    document.getElementById(`section${mode}`).classList.add('active');
}

function transformSQL() {
    const input = document.getElementById('input1').value.trim();
    if (!input) {
        alert('⚠️ 请粘贴原始 SQL');
        return;
    }
    const statements = input.split(/;\s*\n?/).filter(s => s.trim());
    const dialectTag = '/#dialect-simple#/';
    const output = [];

    statements.forEach(stmt => {
        const s = stmt.trim();
        const lower = s.toLowerCase();
        let res = '';

        if (lower.startsWith('create table')) {
            res = s.replace(/create table\s+(\w+)/i, 'CREATE TABLE IF NOT EXISTS #SCHEMANAME#.$1');
        } else if (lower.startsWith('alter table')) {
            res = s.replace(/alter table\s+(\w+)/i, 'ALTER TABLE IF EXISTS ONLY #SCHEMANAME#.$1')
                .replace(/add constraint/i, 'ADD CONSTRAINT');
        } else if (lower.startsWith('insert into')) {
            const match = s.match(/into\s+(\w+)\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/i);
            if (match) {
                const table = match[1];
                const cols = match[2].split(',').map(c => c.trim().toLowerCase());
                const vals = match[3].split(',');
                const fidIdx = cols.indexOf('fid');
                if (fidIdx !== -1 && vals[fidIdx]) {
                    output.push(`${dialectTag}\nDELETE FROM #SCHEMANAME#.${table} WHERE fid = ${vals[fidIdx].trim()};`);
                }
            }
            res = s.replace(/insert into\s+(\w+)/i, 'INSERT INTO #SCHEMANAME#.$1');
        } else if (lower.startsWith('create index')) {
            res = s.replace(/create index\s+/i, 'CREATE INDEX IF NOT EXISTS ')
                .replace(/on\s+(\w+)/i, 'ON #SCHEMANAME#.$1');
        }

        if (res) output.push(`${dialectTag}\n${res};`);
    });

    document.getElementById('output1').value = output.join('\n\n');
}

function generateAlterSQL() {
    const tableName = document.getElementById('tableName').value.trim();
    const rawFields = document.getElementById('fieldInput').value.trim();
    if (!tableName || !rawFields) {
        alert('⚠️ 请填写表名和字段定义');
        return;
    }

    const dialectTag = '/#dialect-simple#/';
    const fields = rawFields.split(',').map(f => f.trim()).filter(f => f);
    const sqls = fields.map(f =>
        `${dialectTag}\nALTER TABLE IF EXISTS ONLY #SCHEMANAME#.${tableName} \nADD COLUMN IF NOT EXISTS ${f};`
    );

    document.getElementById('alterOutput').value = sqls.join('\n\n');
}

function copyOutput(id) {
    const target = document.getElementById(id);
    if (!target.value.trim()) {
        alert('没有内容可复制');
        return;
    }

    navigator.clipboard.writeText(target.value).then(() => {
        alert('✅ 已复制到剪贴板');
    }).catch(() => {
        target.select();
        document.execCommand('copy');
        alert('✅ 已复制（兼容模式）');
    });
}