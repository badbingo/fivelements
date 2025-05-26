// 面包屑导航完整版JS代码
// 路径名称映射表
const pathNameMap = {
    'seven': '七步速成',
    'basics': '基础知识',
    'bazi-process': '八字介绍',
    'bazi-chart': '八字排盘',
    'yen-strength': '日元强弱',
    'elements': '天干地支',
    'wuxing': '五行生克',
    'balance': '五行平衡',
    'ten-gods': '十神关系',
    'combinations': '合冲破害',
    'advanced': '进阶知识',
    'tomb': '四大墓库',
    'personality': '性格分析',
    'wealth': '财运分析',
    'career': '事业分析',
    'marriage': '婚姻分析',
    'health': '健康分析',
    'luck': '大运流年',
    'disaster': '重大灾祸',
    'tools': '学习工具',
    'calculator': '八字计算器',
    'reference': '速查表',
    'common': '常见格局',
    'special': '特殊格局',
    'bazi-test': '八字试题',
    'system': '命理系统',
    'bazi': '八字排盘',
    'hehun': '八字合婚',
    'liuyao': '六爻起卦',
    'about': '关于我们'
};

// 主功能入口
document.addEventListener('DOMContentLoaded', function() {
    // 创建导航栏
    createNavigation();
    
    // 创建面包屑导航和最近访问记录
    createBreadcrumb();
    
    // 移动端菜单切换
    setupMobileMenu();
    
    // 滚动效果
    setupScrollEffects();
});

/**
 * 更新最近访问页面记录
 */
function updateRecentPages() {
    const currentPath = window.location.pathname;
    const currentTitle = document.title;
    
    // 排除不需要记录的页面
    if (currentPath === '/' || currentPath === '/index.html') {
        return;
    }
    
    // 获取当前页面的显示名称
    let displayName = currentTitle;
    const pathSegments = currentPath.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1].replace('.html', '');
    if (pathNameMap[lastSegment]) {
        displayName = pathNameMap[lastSegment];
    }
    
    // 获取现有的最近访问记录
    let recentPages = JSON.parse(localStorage.getItem('recentPages') || '[]');
    
    // 验证并清理现有数据
    recentPages = recentPages.filter(page => 
        page && page.path && page.title && page.timestamp
    );
    
    // 如果当前页面已经在记录中，先移除它
    recentPages = recentPages.filter(page => 
        page.path !== currentPath && 
        !page.path.includes('undefined') &&
        !page.title.includes('undefined')
    );
    
    // 添加当前页面到记录开头
    recentPages.unshift({
        path: currentPath,
        title: displayName,
        timestamp: Date.now()
    });
    
    // 只保留最近5个有效记录
    recentPages = recentPages.slice(0, 5);
    
    // 修复这里：移除多余括号
    localStorage.setItem('recentPages', JSON.stringify(recentPages));
}

/**
 * 创建面包屑导航
 */
function createBreadcrumb() {
    // 更新最近访问记录
    updateRecentPages();
    
    const breadcrumbContainer = document.createElement('div');
    breadcrumbContainer.className = 'breadcrumb-container';
    
    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'breadcrumb';
    
    // 首页面包屑
    const homeItem = document.createElement('div');
    homeItem.className = 'breadcrumb-item';
    homeItem.innerHTML = `
        <a href="/"><i class="fas fa-home"></i> 首页</a>
        <span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>
    `;
    breadcrumb.appendChild(homeItem);
    
    // 获取当前路径并生成面包屑
    const path = window.location.pathname.split('/').filter(Boolean);
    let currentPath = '';
    
    // 主目录与图标映射
    const mainCategories = {
        'basics': { icon: 'fa-book-open', name: '基础知识' },
        'advanced': { icon: 'fa-chart-line', name: '进阶知识' },
        'tools': { icon: 'fa-tools', name: '学习工具' },
        'system': { icon: 'fa-shapes', name: '洞察天机' }
    };
    
    path.forEach((segment, index) => {
        currentPath += '/' + segment;
        const isLast = index === path.length - 1;
        
        // 移除.html后缀
        let key = segment.replace('.html', '');
        // 获取中文名称，如果没有映射则使用原名称
        let displayText = pathNameMap[key] || key;
        
        const breadcrumbItem = document.createElement('div');
        breadcrumbItem.className = 'breadcrumb-item';
        
        // 检查是否是主目录
        if (mainCategories[key]) {
            breadcrumbItem.classList.add('no-link');
            const category = mainCategories[key];
            breadcrumbItem.innerHTML = `
                <span>
                    <i class="fas ${category.icon}"></i>${category.name}
                </span>
                ${!isLast ? `<span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>` : ''}
            `;
        } else if (isLast) {
            breadcrumbItem.innerHTML = `<span class="active">${displayText}</span>`;
        } else {
            // 确保链接使用绝对路径
            const linkPath = currentPath.startsWith('/') ? currentPath : '/' + currentPath;
            breadcrumbItem.innerHTML = `
                <a href="${linkPath}">${displayText}</a>
                <span class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></span>
            `;
        }
        
        breadcrumb.appendChild(breadcrumbItem);
    });
    
    breadcrumbContainer.appendChild(breadcrumb);
    
    // 添加最近访问部分
    addRecentPagesSection(breadcrumbContainer);
    
    // 添加到页面中
    insertBreadcrumbIntoDOM(breadcrumbContainer);
}

/**
 * 添加最近访问部分
 */
function addRecentPagesSection(container) {
    const recentPages = JSON.parse(localStorage.getItem('recentPages') || '[]';
    if (recentPages.length === 0) return;
    
    // 过滤掉无效记录和当前页面
    const currentPath = window.location.pathname;
    const filteredPages = recentPages.filter(page => 
        page && 
        page.path && 
        page.title && 
        page.path !== currentPath &&
        !page.path.includes('undefined')
    );
    
    if (filteredPages.length === 0) return;
    
    // 创建外层flex容器
    const flexContainer = document.createElement('div');
    flexContainer.className = 'breadcrumb-flex-container';
    
    // 将原有面包屑放入flex容器
    const breadcrumb = container.querySelector('.breadcrumb');
    container.insertBefore(flexContainer, breadcrumb);
    flexContainer.appendChild(breadcrumb);
    
    // 创建最近浏览容器
    const recentContainer = document.createElement('div');
    recentContainer.className = 'recent-pages-container right-aligned';
    
    const recentTitle = document.createElement('span');
    recentTitle.className = 'recent-title';
    recentTitle.textContent = '最近浏览:';
    recentContainer.appendChild(recentTitle);
    
    const recentList = document.createElement('span');
    recentList.className = 'recent-pages-list';
    
    filteredPages.forEach((page, index) => {
        if (!page.path || !page.title) return;
        
        const recentItem = document.createElement('a');
        recentItem.href = page.path;
        recentItem.className = 'recent-page-item';
        recentItem.textContent = page.title;
        recentItem.title = page.title;
        
        recentList.appendChild(recentItem);
        
        if (index < filteredPages.length - 1) {
            const separator = document.createElement('span');
            separator.className = 'recent-separator';
            separator.textContent = '•';
            recentList.appendChild(separator);
        }
    });
    
    recentContainer.appendChild(recentList);
    flexContainer.appendChild(recentContainer);
}

/**
 * 将面包屑导航插入到DOM中
 */
function insertBreadcrumbIntoDOM(breadcrumbContainer) {
    // 尝试插入到main标签前
    const mainContent = document.querySelector('main') || document.querySelector('.content-container');
    if (mainContent) {
        document.body.insertBefore(breadcrumbContainer, mainContent);
    } 
    // 如果没有找到main或.content-container，尝试插入到header之后
    else if (document.querySelector('header')) {
        document.querySelector('header').after(breadcrumbContainer);
    } 
    // 最后尝试插入到body的开头
    else {
        document.body.insertBefore(breadcrumbContainer, document.body.firstChild);
    }
}

/**
 * 创建导航栏
 */
function createNavigation() {
    const header = document.createElement('header');
    header.className = 'main-header';
    
    const container = document.createElement('div');
    container.className = 'header-container';
    
    // 1. 添加logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    
    const logoLink = document.createElement('a');
    logoLink.href = '/';
    logoLink.className = 'logo-link';
    
    const logoText = document.createElement('div');
    logoText.className = 'logo-text';
    logoText.innerHTML = `
        <h1>麦<span class="ba-character">八</span>字</h1>
        <p class="slogan">我命由我不由天</p>
    `;
    
    logoLink.appendChild(logoText);
    logoContainer.appendChild(logoLink);
    container.appendChild(logoContainer);
    
    // 2. 添加导航菜单
    const mainNav = document.createElement('nav');
    mainNav.className = 'main-nav';
    
    const navList = document.createElement('ul');
    navList.className = 'nav-list';
    
    // 导航菜单项数据
    const navItems = [
        {
            text: '七步速成',
            icon: 'fa-home',
            href: '/seven.html',
            wuxing: 'fire'
        },
        {
            text: '基础知识',
            icon: 'fa-book-open',
            href: '#',
            wuxing: 'wood',
            dropdown: [
                { text: '八字介绍', href: '/basics/bazi-process.html' },
                { text: '八字排盘', href: '/basics/bazi-chart.html' },
                { text: '日元强弱分析', href: '/basics/yen-strength.html' },
                { text: '天干地支意象', href: '/basics/elements.html' },
                { text: '五行生克', href: '/basics/wuxing.html' },
                { text: '五行平衡', href: '/basics/balance.html' },
                { text: '十神关系', href: '/basics/ten-gods.html' },
                { text: '合冲破害', href: '/basics/combinations.html' }
            ]
        },
        {
            text: '进阶知识',
            icon: 'fa-chart-line',
            href: '#',
            wuxing: 'metal',
            dropdown: [
                { text: '四大墓库', href: '/advanced/tomb.html' },
                { text: '性格分析', href: '/advanced/personality.html' },
                { text: '财运分析', href: '/advanced/wealth.html' },
                { text: '事业分析', href: '/advanced/career.html' },
                { text: '婚姻分析', href: '/advanced/marriage.html' },
                { text: '健康分析', href: '/advanced/health.html' },
                { text: '大运流年', href: '/advanced/luck.html' },
                { text: '重大灾祸', href: '/advanced/disaster.html' }
            ]
        },
        {
            text: '学习工具',
            icon: 'fa-tools',
            href: '#',
            wuxing: 'earth',
            dropdown: [
                { text: '八字计算器', href: '/tools/calculator.html' },
                { text: '速查表', href: '/tools/reference.html' },
                { text: '常见格局', href: '/tools/common.html' },
                { text: '特殊格局', href: '/tools/special.html' },
                { text: '八字试题', href: '/tools/bazi-test.html' }
            ]
        },
        {
            text: '洞察天机',
            icon: 'fa-shapes',
            href: '#',
            wuxing: 'water',
            dropdown: [
                { text: '八字排盘系统', href: '/system/bazi.html' },
                { text: '八字合婚系统', href: '/system/hehun.html' },
                { text: '六爻起卦', href: '/system/liuyao.html' }
            ]
        },
        {
            text: '关于我们',
            icon: 'fa-info-circle',
            href: '/about.html',
            wuxing: 'water'
        }
    ];
    
    // 3. 生成导航菜单
    navItems.forEach(item => {
        const navItem = document.createElement('li');
        navItem.className = 'nav-item';
        if (item.wuxing === 'golden') {
            navItem.classList.add('golden');
        } else {
            navItem.setAttribute('data-wuxing', item.wuxing);
        }
        
        const navLink = document.createElement('a');
        navLink.href = item.href;
        navLink.className = 'nav-link';
        
        // 设置当前活动菜单项
        const currentPath = window.location.pathname;
        if (currentPath === item.href || 
            (item.dropdown && item.dropdown.some(sub => currentPath === sub.href))) {
            navLink.classList.add('active');
        }
        
        navLink.innerHTML = `
            <i class="fas ${item.icon}"></i>
            <span class="nav-text">${item.text}</span>
            <span class="nav-underline"></span>
        `;
        
        navItem.appendChild(navLink);
        
        // 4. 添加下拉菜单
        if (item.dropdown) {
            const dropdownIcon = document.createElement('i');
            dropdownIcon.className = 'fas fa-chevron-down dropdown-icon';
            navLink.appendChild(dropdownIcon);
            
            const dropdownMenu = document.createElement('ul');
            dropdownMenu.className = 'dropdown-menu';
            
            item.dropdown.forEach(dropdownItem => {
                const dropdownLi = document.createElement('li');
                const dropdownLink = document.createElement('a');
                dropdownLink.href = dropdownItem.href;
                dropdownLink.className = 'dropdown-link';
                
                // 设置当前活动子菜单项
                if (window.location.pathname === dropdownItem.href) {
                    dropdownLink.classList.add('active');
                    navLink.classList.add('active');
                }
                
                // 根据文字长度添加类名
                if (dropdownItem.text.length >= 6) {
                    dropdownLink.classList.add('long-text');
                }
                
                // 用span包裹文字以便精确控制
                const textSpan = document.createElement('span');
                textSpan.textContent = dropdownItem.text;
                dropdownLink.appendChild(textSpan);
                
                dropdownLi.appendChild(dropdownLink);
                dropdownMenu.appendChild(dropdownLi);
            });
            
            navItem.appendChild(dropdownMenu);
        }
        
        navList.appendChild(navItem);
    });
    
    mainNav.appendChild(navList);
    
    // 5. 移动端菜单按钮（修复了变量定义顺序问题）
    const mobileMenuBtn = document.createElement('div');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.innerHTML = `
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
    `;
    
    container.appendChild(mobileMenuBtn);
    container.appendChild(mainNav);
    header.appendChild(container);
    
    // 6. 添加到页面顶部
    document.body.insertBefore(header, document.body.firstChild);
}

/**
 * 设置移动端菜单
 */
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
        
        // 处理下拉菜单点击
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.querySelector('.dropdown-menu')) {
                const navLink = item.querySelector('.nav-link');
                navLink.addEventListener('click', function(e) {
                    if (window.innerWidth <= 992) {
                        e.preventDefault();
                        const dropdown = item.querySelector('.dropdown-menu');
                        dropdown.classList.toggle('active');
                    }
                });
            }
        });
    }
}

/**
 * 设置滚动效果
 */
function setupScrollEffects() {
    // 滚动时改变导航栏样式
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.main-header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}
