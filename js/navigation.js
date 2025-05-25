// navigation.js - 集中管理所有页面的导航条
document.addEventListener('DOMContentLoaded', function() {
    // 创建导航条容器
    const header = document.createElement('header');
    header.className = 'main-header';
    
    const headerContainer = document.createElement('div');
    headerContainer.className = 'container header-container';
    
    // 添加logo部分
    headerContainer.innerHTML = `
        <div class="logo-container">
            <a href="index.html" class="logo-link">
                <div class="logo-text">
                    <h1>麦<span class="ba-character">八</span>字</h1>
                    <p class="slogan">我命由我不由天</p>
                </div>
            </a>
        </div>
    `;
    
    // 创建导航菜单
    const nav = document.createElement('nav');
    nav.className = 'main-nav';
    
    const navList = document.createElement('ul');
    navList.className = 'nav-list';
    
    // 导航菜单数据 - 集中管理
    const navItems = [
        {
            text: '七步速成',
            icon: 'fa-home',
            href: 'seven.html',
            active: window.location.pathname.includes('seven.html')
        },
        {
            text: '基础知识',
            icon: 'fa-book-open',
            dropdown: [
                { text: '八字介绍', href: 'basics/bazi-process.html' },
                { text: '八字排盘', href: 'basics/bazi-chart.html' },
                { text: '日元强弱分析', href: 'basics/yen-strength.html' },
                { text: '天干地支意象', href: 'basics/elements.html' },
                { text: '五行生克', href: 'basics/wuxing.html' },
                { text: '五行平衡', href: 'basics/balance.html' },
                { text: '十神关系', href: 'basics/ten-gods.html' },
                { text: '合冲破害', href: 'basics/combinations.html' }
            ],
            active: window.location.pathname.includes('basics/')
        },
        {
            text: '进阶知识',
            icon: 'fa-chart-line',
            dropdown: [
                { text: '四大墓库', href: 'advanced/tomb.html' },
                { text: '性格分析', href: 'advanced/personality.html' },
                { text: '财运分析', href: 'advanced/wealth.html' },
                { text: '事业分析', href: 'advanced/career.html' },
                { text: '婚姻分析', href: 'advanced/marriage.html' },
                { text: '健康分析', href: 'advanced/health.html' },
                { text: '大运流年', href: 'advanced/luck.html' },
                { text: '重大灾祸', href: 'advanced/disaster.html' }
            ],
            active: window.location.pathname.includes('advanced/')
        },
        {
            text: '学习工具',
            icon: 'fa-tools',
            dropdown: [
                { text: '八字计算器', href: 'tools/calculator.html' },
                { text: '速查表', href: 'tools/reference.html' },
                { text: '常见格局', href: 'tools/common.html' },
                { text: '特殊格局', href: 'tools/special.html' },
                { text: '八字试题', href: 'tools/bazi-test.html' }
            ],
            active: window.location.pathname.includes('tools/')
        },
        {
            text: '洞察天机',
            icon: 'fa-shapes',
            dropdown: [
                { text: '机缘命理系统', href: 'system/bazi.html' },
                { text: '八字合婚系统', href: 'system/hehun.html' },
                { text: '六爻起卦', href: 'system/liuyao.html' }
            ],
            active: window.location.pathname.includes('system/')
        },
        {
            text: '关于我们',
            icon: 'fa-info-circle',
            href: 'about.html',
            active: window.location.pathname.includes('about.html')
        }
    ];
    
    // 生成导航菜单
    navItems.forEach(item => {
        const navItem = document.createElement('li');
        navItem.className = `nav-item ${item.active ? 'active' : ''}`;
        
        if (item.dropdown) {
            // 下拉菜单项
            navItem.classList.add('dropdown');
            const navLink = document.createElement('a');
            navLink.href = '#';
            navLink.className = 'nav-link';
            navLink.innerHTML = `
                <i class="fas ${item.icon}"></i> ${item.text} 
                <i class="fas fa-chevron-down dropdown-icon"></i>
            `;
            
            const dropdownMenu = document.createElement('ul');
            dropdownMenu.className = 'dropdown-menu';
            
            item.dropdown.forEach(dropdownItem => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = dropdownItem.href;
                a.className = 'dropdown-link';
                a.textContent = dropdownItem.text;
                li.appendChild(a);
                dropdownMenu.appendChild(li);
            });
            
            navItem.appendChild(navLink);
            navItem.appendChild(dropdownMenu);
        } else {
            // 普通菜单项
            const navLink = document.createElement('a');
            navLink.href = item.href;
            navLink.className = `nav-link ${item.active ? 'active' : ''}`;
            navLink.innerHTML = `<i class="fas ${item.icon}"></i>${item.text}`;
            navItem.appendChild(navLink);
        }
        
        navList.appendChild(navItem);
    });
    
    nav.appendChild(navList);
    headerContainer.appendChild(nav);
    header.appendChild(headerContainer);
    
    // 将导航条插入到body开头
    document.body.insertBefore(header, document.body.firstChild);
    
    // 添加滚动效果
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // 移动端菜单切换
    const mobileMenuToggle = document.createElement('div');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    headerContainer.prepend(mobileMenuToggle);
    
    mobileMenuToggle.addEventListener('click', function() {
        nav.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
    });
});
