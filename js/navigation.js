/**
 * navigation.js - 动态导航系统
 * 功能：
 * 1. 自动生成响应式导航栏
 * 2. 自动生成面包屑导航
 * 3. 桌面端/移动端适配
 * 4. 创意交互特效
 * 5. 性能优化
 */

// 导航配置数据
const NAV_DATA = [
    {
        title: "七步速成",
        icon: "fa-home",
        link: "seven.html",
        active: isCurrentPage("seven.html")
    },
    {
        title: "基础知识",
        icon: "fa-book-open",
        active: isCurrentSection("basics"),
        submenu: [
            { title: "八字介绍", link: "basics/bazi-process.html" },
            { title: "八字排盘", link: "basics/bazi-chart.html" },
            { title: "日元强弱分析", link: "basics/yen-strength.html" },
            { title: "天干地支意象", link: "basics/elements.html" },
            { title: "五行生克", link: "basics/wuxing.html" },
            { title: "五行平衡", link: "basics/balance.html" },
            { title: "十神关系", link: "basics/ten-gods.html" },
            { title: "合冲破害", link: "basics/combinations.html" }
        ]
    },
    {
        title: "进阶知识",
        icon: "fa-chart-line",
        active: isCurrentSection("advanced"),
        submenu: [
            { title: "四大墓库", link: "advanced/tomb.html" },
            { title: "性格分析", link: "advanced/personality.html" },
            { title: "财运分析", link: "advanced/wealth.html" },
            { title: "事业分析", link: "advanced/career.html" },
            { title: "婚姻分析", link: "advanced/marriage.html" },
            { title: "健康分析", link: "advanced/health.html" },
            { title: "大运流年", link: "advanced/luck.html" },
            { title: "重大灾祸", link: "advanced/disaster.html" }
        ]
    },
    {
        title: "学习工具",
        icon: "fa-tools",
        active: isCurrentSection("tools"),
        submenu: [
            { title: "八字计算器", link: "tools/calculator.html" },
            { title: "速查表", link: "tools/reference.html" },
            { title: "常见格局", link: "tools/common.html" },
            { title: "特殊格局", link: "tools/special.html" },
            { title: "八字试题", link: "tools/bazi-test.html" }
        ]
    },
    {
        title: "洞察天机",
        icon: "fa-shapes",
        active: isCurrentSection("system"),
        submenu: [
            { title: "机缘命理系统", link: "system/bazi.html" },
            { title: "八字合婚系统", link: "system/hehun.html" },
            { title: "六爻起卦", link: "system/liuyao.html" }
        ]
    },
    {
        title: "关于我们",
        icon: "fa-info-circle",
        link: "about.html",
        active: isCurrentPage("about.html")
    }
];

// 主初始化函数
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
});

/**
 * 初始化导航系统
 */
function initNavigation() {
    createHeader();
    if (!isHomePage()) {
        createBreadcrumb();
    }
    setupNavInteractions();
    setupScrollEffects();
    setupCursorEffects();
    setupRippleEffects();
}

/**
 * 创建导航头部
 */
function createHeader() {
    const header = document.createElement('header');
    header.className = 'main-header';
    
    header.innerHTML = `
    <div class="header-container">
        <div class="logo-container">
            <a href="index.html" class="logo-link">
                <div class="logo-text">
                    <h1>麦<span class="ba-character">八</span>字</h1>
                    <p class="slogan">我命由我不由天</p>
                </div>
            </a>
        </div>
        
        <nav class="main-nav">
            <ul class="nav-list">
                ${generateNavItemsHTML()}
            </ul>
        </nav>
        
        <div class="mobile-menu-toggle">
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>
    `;
    
    document.body.insertBefore(header, document.body.firstChild);
}

/**
 * 生成导航项HTML
 */
function generateNavItemsHTML() {
    return NAV_DATA.map(item => {
        const activeClass = item.active ? 'active' : '';
        
        if (item.submenu) {
            return `
            <li class="nav-item ${activeClass}">
                <a href="#" class="nav-link">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.title}</span>
                    <i class="dropdown-arrow fas fa-angle-down"></i>
                </a>
                <ul class="submenu">
                    ${item.submenu.map(subItem => `
                    <li>
                        <a href="${subItem.link}" class="submenu-link">
                            ${subItem.title}
                        </a>
                    </li>
                    `).join('')}
                </ul>
            </li>
            `;
        } else {
            return `
            <li class="nav-item ${activeClass}">
                <a href="${item.link}" class="nav-link">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.title}</span>
                </a>
            </li>
            `;
        }
    }).join('');
}

/**
 * 创建面包屑导航
 */
function createBreadcrumb() {
    const pathSegments = getPathSegments();
    if (pathSegments.length === 0) return;

    const breadcrumbContainer = document.createElement('div');
    breadcrumbContainer.className = 'breadcrumb-container';
    
    breadcrumbContainer.innerHTML = `
    <nav class="breadcrumb-nav">
        <ol class="breadcrumb-list">
            <li class="breadcrumb-item">
                <a href="/" class="breadcrumb-link">
                    <i class="fas fa-home"></i> 首页
                </a>
            </li>
            ${generateBreadcrumbItemsHTML(pathSegments)}
        </ol>
    </nav>
    `;
    
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.insertBefore(breadcrumbContainer, mainContent.firstChild);
    }
}

/**
 * 生成面包屑项HTML
 */
function generateBreadcrumbItemsHTML(segments) {
    let accumulatedPath = '';
    return segments.map((segment, index) => {
        accumulatedPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        const name = formatBreadcrumbName(segment);
        
        return `
        <li class="breadcrumb-item ${isLast ? 'active' : ''}">
            ${isLast ? 
                `<span>${name}</span>` : 
                `<a href="${accumulatedPath}" class="breadcrumb-link">${name}</a>`
            }
        </li>
        `;
    }).join('');
}

/**
 * 设置导航交互
 */
function setupNavInteractions() {
    // 移动端菜单切换
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.main-nav');
    
    toggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        nav.classList.toggle('active');
        toggleBtn.classList.toggle('active');
        document.body.classList.toggle('nav-open');
    });

    // 桌面端下拉菜单
    if (window.innerWidth > 992) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                const submenu = item.querySelector('.submenu');
                if (submenu) {
                    submenu.style.transform = 'scaleY(1)';
                    submenu.style.opacity = '1';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                const submenu = item.querySelector('.submenu');
                if (submenu) {
                    submenu.style.transform = 'scaleY(0)';
                    submenu.style.opacity = '0';
                }
            });
        });
    } else {
        // 移动端子菜单切换
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.querySelector('.submenu')) {
                const link = item.querySelector('.nav-link');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    item.classList.toggle('submenu-open');
                });
            }
        });
    }

    // 点击文档关闭菜单
    document.addEventListener('click', () => {
        document.querySelector('.main-nav')?.classList.remove('active');
        document.querySelector('.mobile-menu-toggle')?.classList.remove('active');
        document.body.classList.remove('nav-open');
    });
}

/**
 * 设置滚动特效
 */
function setupScrollEffects() {
    const header = document.querySelector('.main-header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', throttle(() => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 10) {
            header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.2)';
            header.style.backdropFilter = 'blur(8px)';
        } else {
            header.style.boxShadow = 'none';
            header.style.backdropFilter = 'none';
        }
        
        lastScroll = currentScroll;
    }, 16));
}

/**
 * 设置光标特效
 */
function setupCursorEffects() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('mousemove', (e) => {
            const rect = link.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            link.style.setProperty('--cursor-x', `${x}px`);
            link.style.setProperty('--cursor-y', `${y}px`);
        });
    });
}

/**
 * 设置波纹点击特效
 */
function setupRippleEffects() {
    document.addEventListener('click', function(e) {
        const navLink = e.target.closest('.nav-link');
        if (!navLink || navLink.href && !navLink.href.includes('#')) return;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = navLink.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size/2;
        const y = e.clientY - rect.top - size/2;
        
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        navLink.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 800);
    });
}

/**
 * 工具函数：判断是否是首页
 */
function isHomePage() {
    const path = window.location.pathname;
    return path === '/' || path === '/index.html' || path === '';
}

/**
 * 工具函数：判断是否是当前页面
 */
function isCurrentPage(pageName) {
    return window.location.pathname.endsWith(pageName);
}

/**
 * 工具函数：判断是否是当前板块
 */
function isCurrentSection(section) {
    return window.location.pathname.includes(`${section}/`);
}

/**
 * 工具函数：获取路径分段
 */
function getPathSegments() {
    return window.location.pathname
        .split('/')
        .filter(segment => segment && segment !== 'index.html');
}

/**
 * 工具函数：格式化面包屑名称
 */
function formatBreadcrumbName(path) {
    return path.replace('.html', '')
              .replace(/-/g, ' ')
              .replace(/^\w/, c => c.toUpperCase());
}

/**
 * 工具函数：节流函数
 */
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}
