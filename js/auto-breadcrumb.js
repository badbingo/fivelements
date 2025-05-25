/**
 * 自动面包屑导航生成脚本
 * 功能：
 * 1. 自动根据URL生成面包屑导航
 * 2. 支持中英文路径映射
 * 3. 智能识别常见命理学术语
 * 4. 自动插入到页面合适位置
 */

document.addEventListener('DOMContentLoaded', function() {
    // ================= 配置区域 =================
    const CONFIG = {
        // 首页显示配置
        home: {
            icon: '<i class="fas fa-home"></i>',
            text: '首页'
        },
        
        // 路径分隔符
        separator: '<span class="separator">/</span>',
        
        // 特殊路径映射（优先级最高）
        pathMap: {
            // 精确匹配
            'seven.html': '七步速成',
            'bazi-test.html': '八字能力测试',
            
            // 目录映射
            'basics': '基础知识',
            'advanced': '进阶知识',
            'tools': '学习工具',
            'system': '命理系统',
            
            // 具体页面
            'bazi-process.html': '八字入门',
            'bazi-chart.html': '排盘方法',
            'ten-gods.html': '十神关系',
            'wealth.html': '财运分析',
            'calculator.html': '计算工具'
        },
        
        // 智能术语转换（优先级次之）
        termMap: {
            'bazi': '八字',
            'wuxing': '五行',
            'shensha': '神煞',
            'dasha': '大运',
            'liunian': '流年',
            'hehun': '合婚',
            'liuyao': '六爻'
        },
        
        // 排除路径（如API路由）
        excludePaths: ['api', 'admin']
    };

    // ================= 核心功能 =================
    function generateBreadcrumb() {
        const path = window.location.pathname;
        if (shouldExclude(path)) return;
        
        const segments = getPathSegments(path);
        if (segments.length === 0) return;
        
        const breadcrumb = createBreadcrumbElement();
        breadcrumb.innerHTML = buildBreadcrumbHTML(segments);
        
        insertBreadcrumb(breadcrumb);
    }

    // ================= 工具函数 =================
    function shouldExclude(path) {
        return CONFIG.excludePaths.some(exclude => path.includes(exclude));
    }

    function getPathSegments(path) {
        return path.split('/')
            .filter(segment => segment && !segment.endsWith('.html'))
            .concat([getCurrentPageName()]);
    }

    function getCurrentPageName() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    }

    function createBreadcrumbElement() {
        const nav = document.createElement('nav');
        nav.className = 'auto-breadcrumb';
        nav.setAttribute('aria-label', '页面导航路径');
        return nav;
    }

    function buildBreadcrumbHTML(segments) {
        let html = `<a href="/" class="breadcrumb-home">${CONFIG.home.icon}${CONFIG.home.text}</a>`;
        let accumulatedPath = '';
        
        segments.forEach((segment, index) => {
            accumulatedPath += `/${segment}`;
            const isLast = index === segments.length - 1;
            
            html += CONFIG.separator;
            html += isLast ? 
                `<span class="current">${getDisplayName(segment)}</span>` : 
                `<a href="${accumulatedPath}">${getDisplayName(segment)}</a>`;
        });
        
        return html;
    }

    function getDisplayName(segment) {
        // 1. 检查精确匹配
        if (CONFIG.pathMap[segment]) {
            return CONFIG.pathMap[segment];
        }
        
        // 2. 检查带.html的页面匹配
        const pageKey = segment.endsWith('.html') ? segment : `${segment}.html`;
        if (CONFIG.pathMap[pageKey]) {
            return CONFIG.pathMap[pageKey];
        }
        
        // 3. 智能术语转换
        const converted = convertTechnicalTerms(segment);
        if (converted !== segment) {
            return converted;
        }
        
        // 4. 默认处理：转中文+美化
        return beautifySegment(segment);
    }

    function convertTechnicalTerms(segment) {
        const terms = segment.split('-');
        return terms.map(term => CONFIG.termMap[term] || term).join(' ');
    }

    function beautifySegment(segment) {
        return segment
            .replace('.html', '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    function insertBreadcrumb(breadcrumb) {
        const containers = [
            document.querySelector('main'),
            document.querySelector('.content-container'),
            document.querySelector('article'),
            document.querySelector('.container')
        ];
        
        for (const container of containers) {
            if (container) {
                container.insertBefore(breadcrumb, container.firstChild);
                return;
            }
        }
        
        // 作为最后手段添加到body开头
        document.body.insertBefore(breadcrumb, document.body.firstChild);
    }

    // ================= 初始化 =================
    generateBreadcrumb();
});
