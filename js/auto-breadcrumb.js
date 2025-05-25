/**
 * 智能面包屑导航生成脚本 - 完整版
 * 功能：
 * 1. 自动识别URL生成导航
 * 2. 特定目录不可点击（基础知识/进阶知识/学习工具/命理系统）
 * 3. 中英文路径智能转换
 * 4. 自动适配移动端
 * 5. SEO友好结构
 */

document.addEventListener('DOMContentLoaded', function() {
    // ====================== 配置区域 ======================
    const CONFIG = {
        // 基础配置
        home: {
            icon: '<i class="fas fa-home"></i>',
            text: '首页',
            url: '/'
        },
        
        // 路径分隔符
        separator: '<span class="separator">/</span>',
        
        // 不可点击的目录（优先判断）
        nonClickableDirs: ['basics', 'advanced', 'tools', 'system'],
        
        // 特殊路径映射（包含是否可点击的设置）
        pathMap: {
            // 不可点击目录
            'basics':   { name: '基础知识', clickable: false, icon: '<i class="fas fa-book-open"></i>' },
            'advanced': { name: '进阶知识', clickable: false, icon: '<i class="fas fa-chart-line"></i>' },
            'tools':    { name: '学习工具', clickable: false, icon: '<i class="fas fa-tools"></i>' },
            'system':   { name: '命理系统', clickable: false, icon: '<i class="fas fa-shapes"></i>' },
            
            // 可点击页面
            'seven.html': { name: '七步速成', clickable: true },
            'bazi-process.html': { name: '八字入门', clickable: true },
            'calculator.html': { name: '计算工具', clickable: true }
        },
        
        // 智能术语转换（用于未配置的路径）
        termMap: {
            'bazi': '八字', 'wuxing': '五行', 'shensha': '神煞',
            'dasha': '大运', 'liunian': '流年', 'hehun': '合婚'
        },
        
        // 排除路径（不生成面包屑）
        excludePaths: ['api', 'admin', 'assets'],
        
        // 样式类名
        classes: {
            container: 'auto-breadcrumb',
            home: 'breadcrumb-home',
            link: 'breadcrumb-link',
            current: 'breadcrumb-current',
            nonClickable: 'breadcrumb-non-clickable'
        }
    };

    // ====================== 核心函数 ======================
    function generateBreadcrumb() {
        const path = window.location.pathname;
        if (shouldExclude(path)) return;
        
        const segments = getPathSegments(path);
        if (segments.length === 0) return;
        
        const breadcrumb = createBreadcrumbElement();
        breadcrumb.innerHTML = buildBreadcrumbHTML(segments);
        
        insertBreadcrumb(breadcrumb);
        addSchemaMarkup(segments);
    }

    // ====================== 工具函数 ======================
    function shouldExclude(path) {
        return CONFIG.excludePaths.some(exclude => path.includes(exclude));
    }

    function getPathSegments(path) {
        return path.split('/')
            .filter(segment => segment && !segment.endsWith('.html'))
            .concat([getCurrentPageName()]);
    }

    function getCurrentPageName() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    function createBreadcrumbElement() {
        const nav = document.createElement('nav');
        nav.className = CONFIG.classes.container;
        nav.setAttribute('aria-label', '网站导航路径');
        return nav;
    }

    function buildBreadcrumbHTML(segments) {
        let html = buildHomeLink();
        let accumulatedPath = '';
        
        segments.forEach((segment, index) => {
            accumulatedPath += `/${segment}`;
            const isLast = index === segments.length - 1;
            const { name, icon, clickable } = getSegmentInfo(segment);
            
            html += CONFIG.separator;
            
            if (isLast) {
                html += `<span class="${CONFIG.classes.current}">${icon || ''}${name}</span>`;
            } else {
                const shouldDisable = CONFIG.nonClickableDirs.includes(segment) || clickable === false;
                html += shouldDisable
                    ? `<span class="${CONFIG.classes.nonClickable}">${icon || ''}${name}</span>`
                    : `<a href="${accumulatedPath}" class="${CONFIG.classes.link}">${icon || ''}${name}</a>`;
            }
        });
        
        return html;
    }

    function buildHomeLink() {
        return `<a href="${CONFIG.home.url}" class="${CONFIG.classes.home}">
            ${CONFIG.home.icon}${CONFIG.home.text}
        </a>`;
    }

    function getSegmentInfo(segment) {
        const cleanSegment = segment.replace('.html', '');
        const exactMatch = CONFIG.pathMap[segment] || CONFIG.pathMap[`${cleanSegment}.html`];
        
        if (exactMatch) {
            return {
                name: exactMatch.name,
                icon: exactMatch.icon || '',
                clickable: exactMatch.clickable
            };
        }
        
        // 智能转换未配置的路径
        return {
            name: convertTechnicalTerms(cleanSegment),
            icon: '',
            clickable: true
        };
    }

    function convertTechnicalTerms(segment) {
        const terms = segment.split('-');
        return terms.map(term => CONFIG.termMap[term] || beautifyTerm(term)).join(' ');
    }

    function beautifyTerm(term) {
        return term.replace(/^\w/, c => c.toUpperCase());
    }

    function insertBreadcrumb(element) {
        const containers = [
            'main', '.content-container', 'article', '.container'
        ].map(sel => document.querySelector(sel));
        
        const validContainer = containers.find(el => el);
        (validContainer || document.body).insertBefore(element, (validContainer || document.body).firstChild);
    }

    function addSchemaMarkup(segments) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": generateBreadcrumbSchema(segments)
        });
        document.head.appendChild(script);
    }

    function generateBreadcrumbSchema(segments) {
        let position = 1;
        let accumulatedPath = '';
        
        return [
            // 首页项
            {
                "@type": "ListItem",
                "position": position++,
                "name": CONFIG.home.text,
                "item": `${window.location.origin}${CONFIG.home.url}`
            },
            
            // 路径项
            ...segments.map(segment => {
                accumulatedPath += `/${segment}`;
                const { name } = getSegmentInfo(segment);
                
                return {
                    "@type": "ListItem",
                    "position": position++,
                    "name": name,
                    "item": `${window.location.origin}${accumulatedPath}`
                };
            })
        ];
    }

    // ====================== 初始化 ======================
    generateBreadcrumb();
});
