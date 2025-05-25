/**
 * 完整版自动面包屑导航 - 含全站中英文路径映射
 * 最后更新：2023年12月
 */
document.addEventListener('DOMContentLoaded', function() {
    // ====================== 完整路径配置 ======================
    const CONFIG = {
        home: {
            icon: '<i class="fas fa-home"></i>',
            text: '首页',
            url: '/'
        },
        separator: '<span class="separator">/</span>',
        nonClickableDirs: ['basics', 'advanced', 'tools', 'system'],
        
        // 完整路径映射表（包含所有子目录）
        pathMap: {
            /* ========== 不可点击的父目录 ========== */
            'basics': {
                name: '基础知识',
                clickable: false,
                icon: '<i class="fas fa-book-open"></i>'
            },
            'advanced': {
                name: '进阶知识',
                clickable: false,
                icon: '<i class="fas fa-chart-line"></i>'
            },
            'tools': {
                name: '学习工具',
                clickable: false,
                icon: '<i class="fas fa-tools"></i>'
            },
            'system': {
                name: '命理系统',
                clickable: false,
                icon: '<i class="fas fa-shapes"></i>'
            },
            
            /* ========== 基础知识子页面 ========== */
            'bazi-process.html': { name: '八字介绍' },
            'bazi-chart.html': { name: '排盘方法' },
            'yen-strength.html': { name: '日元强弱' },
            'elements.html': { name: '天干地支' },
            'wuxing.html': { name: '五行生克' },
            'balance.html': { name: '五行平衡' },
            'ten-gods.html': { name: '十神关系' },
            'combinations.html': { name: '合冲破害' },
            
            /* ========== 进阶知识子页面 ========== */
            'tomb.html': { name: '四大墓库' },
            'personality.html': { name: '性格分析' },
            'wealth.html': { name: '财运分析' },
            'career.html': { name: '事业分析' },
            'marriage.html': { name: '婚姻分析' },
            'health.html': { name: '健康分析' },
            'luck.html': { name: '大运流年' },
            'disaster.html': { name: '重大灾祸' },
            
            /* ========== 学习工具子页面 ========== */
            'calculator.html': { name: '八字计算器' },
            'reference.html': { name: '速查表' },
            'common.html': { name: '常见格局' },
            'special.html': { name: '特殊格局' },
            'bazi-test.html': { name: '八字试题' },
            
            /* ========== 命理系统子页面 ========== */
            'bazi.html': { name: '机缘命理' },
            'hehun.html': { name: '八字合婚' },
            'liuyao.html': { name: '六爻起卦' },
            
            /* ========== 其他独立页面 ========== */
            'seven.html': { name: '七步速成' },
            'about.html': { name: '关于我们' },
            'contact.html': { name: '联系我们' }
        },
        
        // 智能术语转换（用于未配置的路径）
        termMap: {
            'bazi': '八字', 'wuxing': '五行', 'shensha': '神煞',
            'dasha': '大运', 'liunian': '流年', 'hehun': '合婚',
            'liuyao': '六爻', 'ganzhi': '干支', 'nayin': '纳音',
            'kongwang': '空亡', 'xun': '旬', 'qimen': '奇门'
        },
        
        classes: {
            container: 'auto-breadcrumb',
            home: 'breadcrumb-home',
            link: 'breadcrumb-link',
            current: 'breadcrumb-current',
            nonClickable: 'breadcrumb-non-clickable'
        }
    };

    // ====================== 核心函数（保持不变） ======================
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

    function shouldExclude(path) {
        return ['api', 'admin', 'assets'].some(exclude => path.includes(exclude));
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
            {
                "@type": "ListItem",
                "position": position++,
                "name": CONFIG.home.text,
                "item": `${window.location.origin}${CONFIG.home.url}`
            },
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

    // 初始化
    generateBreadcrumb();
});
