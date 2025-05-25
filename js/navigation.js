/**
 * navigation.js - 动态生成导航条和面包屑导航
 * 功能：
 * 1. 自动生成响应式导航栏
 * 2. 自动生成面包屑导航
 * 3. 移动端适配
 * 4. 滚动效果
 * 5. 下拉菜单交互
 */

document.addEventListener('DOMContentLoaded', function() {
    // ==================== 常量定义 ====================
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

    // ==================== 主函数 ====================
    function initNavigation() {
        createHeader();
        if (!isHomePage()) {
            createBreadcrumb();
        }
        setupEventListeners();
    }
    // 添加光标跟随效果
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('mousemove', (e) => {
            const x = e.offsetX;
            const y = e.offsetY;
            link.style.setProperty('--x', `${x}px`);
            link.style.setProperty('--y', `${y}px`);
        });
    });
    
    // 移除滚动高度变化逻辑
    // 保持header高度不变
    }
    // ==================== 导航条生成 ====================
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

    function generateNavItemsHTML() {
        return NAV_DATA.map(item => {
            if (item.submenu) {
                return `
                <li class="nav-item ${item.active ? 'active' : ''}">
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
                <li class="nav-item ${item.active ? 'active' : ''}">
                    <a href="${item.link}" class="nav-link">
                        <i class="fas ${item.icon}"></i>
                        <span>${item.title}</span>
                    </a>
                </li>
                `;
            }
        }).join('');
    }

    // ==================== 面包屑生成 ====================
    // 在createBreadcrumb函数中更新面包屑容器样式
    function createBreadcrumb() {
        const pathSegments = getPathSegments();
        if (pathSegments.length === 0) return;
    
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'breadcrumb-container';
        breadcrumbContainer.style.marginTop = '0'; // 确保没有额外margin
        
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

    // ==================== 事件监听 ====================
    function setupEventListeners() {
        // 移动端菜单切换
        const toggleBtn = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        
        toggleBtn?.addEventListener('click', () => {
            nav.classList.toggle('active');
            toggleBtn.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });

        // 下拉菜单交互（桌面端）
        if (window.innerWidth > 992) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('mouseenter', showSubmenu);
                item.addEventListener('mouseleave', hideSubmenu);
            });
        } else {
            // 移动端子菜单切换
            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.nextElementSibling?.classList.contains('submenu')) {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        link.parentElement.classList.toggle('submenu-open');
                    });
                }
            });
        }

        // 滚动效果
        window.addEventListener('scroll', throttle(() => {
            const header = document.querySelector('.main-header');
            header?.classList.toggle('scrolled', window.scrollY > 50);
        }, 100));

        // 点击文档关闭移动菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.main-nav') && !e.target.closest('.mobile-menu-toggle')) {
                document.querySelector('.main-nav')?.classList.remove('active');
                document.querySelector('.mobile-menu-toggle')?.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });
    }

    // ==================== 工具函数 ====================
    function showSubmenu(e) {
        const submenu = e.currentTarget.querySelector('.submenu');
        if (submenu) {
            submenu.style.opacity = '1';
            submenu.style.visibility = 'visible';
            submenu.style.transform = 'translateY(0)';
        }
    }

    function hideSubmenu(e) {
        const submenu = e.currentTarget.querySelector('.submenu');
        if (submenu) {
            submenu.style.opacity = '0';
            submenu.style.visibility = 'hidden';
            submenu.style.transform = 'translateY(10px)';
        }
    }

    function isHomePage() {
        const path = window.location.pathname;
        return path === '/' || path === '/index.html' || path === '';
    }

    function isCurrentPage(pageName) {
        return window.location.pathname.endsWith(pageName);
    }

    function isCurrentSection(section) {
        return window.location.pathname.includes(`${section}/`);
    }

    function getPathSegments() {
        return window.location.pathname
            .split('/')
            .filter(segment => segment && segment !== 'index.html');
    }

    function formatBreadcrumbName(path) {
        return path.replace('.html', '')
                  .replace(/-/g, ' ')
                  .replace(/^\w/, c => c.toUpperCase());
    }

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

    // ==================== 初始化 ====================
    initNavigation();
});
