// 导航条功能
document.addEventListener('DOMContentLoaded', function() {
    // 移动端菜单切换
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
        });
    }
    
    // 为导航项添加五行属性
    const navItems = document.querySelectorAll('.nav-item');
    const wuxingElements = ['wood', 'fire', 'earth', 'metal', 'water'];
    
    navItems.forEach((item, index) => {
        // 跳过最后一个"关于我们"项
        if (index < navItems.length - 1) {
            const wuxingIndex = index % wuxingElements.length;
            item.setAttribute('data-wuxing', wuxingElements[wuxingIndex]);
            
            // 为"在线批命"添加特殊类
            if (item.querySelector('.nav-link').textContent.includes('在线批命')) {
                item.classList.add('golden');
            }
        }
    });
    
    // 创建五行背景元素
    const navBackground = document.createElement('div');
    navBackground.className = 'nav-background';
    document.querySelector('.main-nav').prepend(navBackground);
    
    for (let i = 0; i < 5; i++) {
        const element = document.createElement('div');
        element.className = `wuxing-element ${wuxingElements[i]}`;
        element.style.left = `${Math.random() * 80 + 10}%`;
        element.style.top = `${Math.random() * 80 + 10}%`;
        element.style.animationDelay = `${i * 2}s`;
        navBackground.appendChild(element);
    }
    
    // 当前页面高亮
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (currentPath === linkPath) {
            link.classList.add('active');
        }
    });
    
    // 自动生成面包屑导航
    generateBreadcrumbs();
});

// 面包屑导航功能
function generateBreadcrumbs() {
    const breadcrumbContainer = document.createElement('div');
    breadcrumbContainer.className = 'breadcrumb-container container';
    
    const breadcrumb = document.createElement('ol');
    breadcrumb.className = 'breadcrumb';
    
    // 首页链接
    const homeItem = createBreadcrumbItem('index.html', '首页', 'fas fa-home');
    breadcrumb.appendChild(homeItem);
    
    // 获取当前页面路径
    const path = window.location.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    
    // 构建面包屑路径
    let accumulatedPath = '';
    pathSegments.forEach((segment, index) => {
        accumulatedPath += `/${segment}`;
        const pageName = getPageName(segment);
        
        if (index === pathSegments.length - 1) {
            // 当前页面，不添加链接
            const currentItem = createBreadcrumbItem('', pageName, getPageIcon(segment), true);
            breadcrumb.appendChild(currentItem);
        } else {
            // 父级页面，添加链接
            const item = createBreadcrumbItem(accumulatedPath, pageName, getPageIcon(segment));
            breadcrumb.appendChild(item);
        }
    });
    
    breadcrumbContainer.appendChild(breadcrumb);
    
    // 将面包屑导航插入到页面中
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.insertBefore(breadcrumbContainer, mainContent.firstChild);
    }
}

function createBreadcrumbItem(href, text, icon, isActive = false) {
    const item = document.createElement('li');
    item.className = 'breadcrumb-item' + (isActive ? ' active' : '');
    
    const link = document.createElement('a');
    link.className = 'breadcrumb-link';
    if (!isActive) {
        link.href = href;
    }
    
    const iconElement = document.createElement('i');
    iconElement.className = icon;
    link.appendChild(iconElement);
    
    link.appendChild(document.createTextNode(text));
    item.appendChild(link);
    
    return item;
}

function getPageName(path) {
    const pageNames = {
        'index.html': '首页',
        'seven.html': '七步速成',
        'basics': '基础知识',
        'bazi-process.html': '八字介绍',
        'bazi-chart.html': '八字排盘',
        'yen-strength.html': '日元强弱',
        'elements.html': '天干地支',
        'wuxing.html': '五行生克',
        'balance.html': '五行平衡',
        'ten-gods.html': '十神关系',
        'combinations.html': '合冲破害',
        'advanced': '进阶知识',
        'tomb.html': '四大墓库',
        'personality.html': '性格分析',
        'wealth.html': '财运分析',
        'career.html': '事业分析',
        'marriage.html': '婚姻分析',
        'health.html': '健康分析',
        'luck.html': '大运流年',
        'disaster.html': '重大灾祸',
        'tools': '学习工具',
        'calculator.html': '八字计算器',
        'reference.html': '速查表',
        'common.html': '常见格局',
        'special.html': '特殊格局',
        'bazi-test.html': '八字试题',
        'system': '洞察天机',
        'bazi.html': '机缘命理',
        'hehun.html': '八字合婚',
        'liuyao.html': '六爻起卦',
        'about.html': '关于我们'
    };
    
    // 移除.html后缀
    const cleanPath = path.replace('.html', '');
    return pageNames[cleanPath] || cleanPath;
}

function getPageIcon(path) {
    const pageIcons = {
        'index.html': 'fas fa-home',
        'seven.html': 'fas fa-bolt',
        'basics': 'fas fa-book-open',
        'bazi-process.html': 'fas fa-info-circle',
        'bazi-chart.html': 'fas fa-project-diagram',
        'yen-strength.html': 'fas fa-balance-scale',
        'elements.html': 'fas fa-yin-yang',
        'wuxing.html': 'fas fa-atom',
        'balance.html': 'fas fa-weight',
        'ten-gods.html': 'fas fa-people-arrows',
        'combinations.html': 'fas fa-link',
        'advanced': 'fas fa-chart-line',
        'tomb.html': 'fas fa-tombstone-alt',
        'personality.html': 'fas fa-user',
        'wealth.html': 'fas fa-money-bill-wave',
        'career.html': 'fas fa-briefcase',
        'marriage.html': 'fas fa-heart',
        'health.html': 'fas fa-heartbeat',
        'luck.html': 'fas fa-calendar-alt',
        'disaster.html': 'fas fa-exclamation-triangle',
        'tools': 'fas fa-tools',
        'calculator.html': 'fas fa-calculator',
        'reference.html': 'fas fa-book',
        'common.html': 'fas fa-th-large',
        'special.html': 'fas fa-star',
        'bazi-test.html': 'fas fa-question-circle',
        'system': 'fas fa-shapes',
        'bazi.html': 'fas fa-chart-pie',
        'hehun.html': 'fas fa-rings-wedding',
        'liuyao.html': 'fas fa-dice',
        'about.html': 'fas fa-info-circle'
    };
    
    // 移除.html后缀
    const cleanPath = path.replace('.html', '');
    return pageIcons[cleanPath] || 'fas fa-circle';
}
