/**
 * 现代化导航条组件
 * 为命缘池、八字详批和六爻占卜页面提供统一的导航体验
 */

class NavigationMenu {
    constructor() {
        this.menuItems = [
            { name: '八字详批', url: '../system/bazinew.html', icon: 'fa-solid fa-calendar-days' },
            { name: '六爻占卜', url: '../system/lynew.html', icon: 'fa-solid fa-yin-yang' },
            { name: '命缘池', url: '../system/wishingwell.html', icon: 'fa-solid fa-water' }
        ];
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createMenu());
        } else {
            this.createMenu();
        }
    }

    createMenu() {
        // 创建导航容器
        const navContainer = document.createElement('div');
        navContainer.className = 'nav-menu-container';
        
        // 创建导航栏
        const navBar = document.createElement('nav');
        navBar.className = 'modern-nav';
        
        // 创建logo区域
        const logoArea = document.createElement('div');
        logoArea.className = 'nav-logo';
        logoArea.innerHTML = '<i class="fa-solid fa-dragon"></i> <span>麦八字</span>';
        
        // 创建菜单项容器
        const menuList = document.createElement('ul');
        menuList.className = 'nav-links';
        
        // 添加菜单项
        this.menuItems.forEach(item => {
            const menuItem = document.createElement('li');
            
            // 检查当前页面是否为该菜单项
            // 提取当前页面的文件名
            const currentPath = window.location.pathname;
            const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
            
            // 提取菜单项URL的文件名
            const itemFile = item.url.substring(item.url.lastIndexOf('/') + 1);
            
            // 比较文件名而不是整个路径
            const isCurrent = currentFile === itemFile;
            
            menuItem.className = isCurrent ? 'nav-item current' : 'nav-item';
            
            const link = document.createElement('a');
            link.href = item.url;
            link.innerHTML = `<i class="${item.icon}"></i> <span>${item.name}</span>`;
            
            menuItem.appendChild(link);
            menuList.appendChild(menuItem);
        });
        
        // 创建移动端菜单按钮
        const mobileMenuBtn = document.createElement('div');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
        mobileMenuBtn.addEventListener('click', () => {
            navBar.classList.toggle('mobile-open');
        });
        
        // 组装导航栏
        navBar.appendChild(logoArea);
        navBar.appendChild(menuList);
        navBar.appendChild(mobileMenuBtn);
        navContainer.appendChild(navBar);
        
        // 添加样式
        this.addStyles();
        
        // 将导航栏添加到页面顶部
        const body = document.body;
        body.insertBefore(navContainer, body.firstChild);
    }
    
    addStyles() {
        // 创建样式元素
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            /* 导航菜单容器 */
            .nav-menu-container {
                width: 100%;
                position: relative;
                z-index: 1000;
                font-family: 'Noto Serif SC', 'Microsoft YaHei', sans-serif !important;
            }
            
            /* 现代导航栏 */
            .modern-nav {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.8rem 2.5rem;
                background: #000000;
                color: white;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                position: relative;
                overflow: hidden;
            }
            
            /* 添加动态背景效果 */
            .modern-nav::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 40%);
                animation: navGlow 15s infinite linear;
                z-index: 0;
            }
            
            @keyframes navGlow {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Logo样式 */
            .nav-logo {
                display: flex;
                align-items: center;
                font-size: 1.6rem;
                font-weight: 700;
                color: #fff;
                position: relative;
                z-index: 1;
                text-shadow: 0 2px 10px rgba(255, 153, 0, 0.3);
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                font-family: 'Noto Serif SC', 'Microsoft YaHei', sans-serif !important;
            }
            
            .nav-logo:hover {
                transform: scale(1.05);
            }
            
            .nav-logo i {
                margin-right: 0.7rem;
                color: #ff9900;
                font-size: 2rem;
                filter: drop-shadow(0 0 8px rgba(255, 153, 0, 0.5));
                animation: dragonFloat 3s ease-in-out infinite;
            }
            
            @keyframes dragonFloat {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-5px) rotate(5deg); }
            }
            
            /* 导航链接 */
            .nav-links {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;
                position: relative;
                z-index: 1;
            }
            
            .nav-item {
                margin: 0 0.8rem;
                position: relative;
            }
            
            .nav-item a {
                display: flex;
                align-items: center;
                padding: 0.6rem 1.2rem;
                color: rgba(255, 255, 255, 0.9);
                text-decoration: none;
                font-weight: 500;
                border-radius: 8px;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
                overflow: hidden;
                letter-spacing: 0.5px;
                font-family: 'Noto Serif SC', 'Microsoft YaHei', sans-serif !important;
            }
            
            .nav-item a::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
                transform: translateY(100%);
                transition: transform 0.4s ease;
                z-index: -1;
                border-radius: 8px;
            }
            
            .nav-item a:hover::before {
                transform: translateY(0);
            }
            
            .nav-item a i {
                margin-right: 0.6rem;
                font-size: 1.2rem;
                transition: all 0.4s ease;
            }
            
            .nav-item a:hover {
                color: white;
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }
            
            .nav-item a:hover i {
                transform: scale(1.2) rotate(10deg);
                color: #ff9900;
            }
            
            /* 当前页面高亮效果 */
            .nav-item.current a {
                background: rgba(255, 153, 0, 0.15);
                color: #ff9900;
                font-weight: 600;
                border: 1px solid rgba(255, 153, 0, 0.3);
                box-shadow: 0 0 15px rgba(255, 153, 0, 0.4);
                transform: translateY(-3px);
                position: relative;
            }
            
            .nav-item.current a::after {
                content: '';
                position: absolute;
                bottom: -3px;
                left: 50%;
                width: 40%;
                height: 3px;
                background: linear-gradient(90deg, transparent, #ff9900, transparent);
                transform: translateX(-50%);
                border-radius: 3px;
                animation: glowLine 1.5s infinite alternate;
            }
            
            @keyframes glowLine {
                0% { opacity: 0.5; width: 30%; }
                100% { opacity: 1; width: 60%; }
            }
            
            .nav-item.current a i {
                color: #ff9900;
                animation: iconPulse 1.5s infinite alternate;
            }
            
            @keyframes iconPulse {
                0% { transform: scale(1); }
                100% { transform: scale(1.2); }
            }
            
            /* 移动菜单按钮 */
            .mobile-menu-btn {
                display: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.6rem;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
                position: relative;
                z-index: 1;
            }
            
            .mobile-menu-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: rotate(90deg);
            }
            
            /* 响应式设计 */
            @media (max-width: 768px) {
                .modern-nav {
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 1rem 1.5rem;
                }
                
                .nav-logo {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .mobile-menu-btn {
                    display: block;
                }
                
                .nav-links {
                    flex-direction: column;
                    width: 100%;
                    margin-top: 1rem;
                    display: none;
                    animation: slideDown 0.5s ease forwards;
                }
                
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .modern-nav.mobile-open .nav-links {
                    display: flex;
                }
                
                .nav-item {
                    margin: 0.4rem 0;
                    width: 100%;
                }
                
                .nav-item a {
                    width: 100%;
                    padding: 0.8rem 1.2rem;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    margin: 2px 0;
                    transition: all 0.3s ease;
                }
                
                .nav-item a:hover {
                    background: rgba(255, 255, 255, 0.08);
                    transform: translateX(5px);
                }
                
                .nav-item.current a {
                    border-left: 3px solid #ff9900;
                }
            }
        `;
        
        // 添加样式到页面头部
        document.head.appendChild(styleEl);
    }
}

// 初始化导航菜单
const navMenu = new NavigationMenu();
