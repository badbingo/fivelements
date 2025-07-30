/**
 * 现代化导航条组件
 * 为命缘池、八字详批和六爻占卜页面提供统一的导航体验
 */

class NavigationMenu {
    constructor() {
        this.menuItems = [
            { name: '命缘池', url: '../system/wishingwell.html', icon: 'fa-solid fa-water' },
            { name: '八字详批', url: '../system/bazinew.html', icon: 'fa-solid fa-calendar-days' },
            { name: '六爻占卜', url: '../system/lynew.html', icon: 'fa-solid fa-yin-yang' }
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
            const isCurrent = window.location.pathname.includes(item.url);
            
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
            }
            
            /* 现代导航栏 */
            .modern-nav {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 2rem;
                background: #000000;
                color: white;
            }
            
            /* Logo样式 */
            .nav-logo {
                display: flex;
                align-items: center;
                font-size: 1.5rem;
                font-weight: 700;
                color: #fff;
                
            }
            
            .nav-logo i {
                margin-right: 0.5rem;
                color: #ff9900;
                font-size: 1.8rem;
            }
            
            /* 导航链接 */
            .nav-links {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;
            }
            
            .nav-item {
                margin: 0 0.5rem;
                position: relative;
            }
            
            .nav-item a {
                display: flex;
                align-items: center;
                padding: 0.5rem 1rem;
                color: rgba(255, 255, 255, 0.9);
                text-decoration: none;
                font-weight: 500;
                border-radius: 4px;
                transition: all 0.3s ease;
            }
            
            .nav-item a i {
                margin-right: 0.5rem;
                font-size: 1.1rem;
            }
            
            .nav-item a:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                transform: translateY(-2px);
            }
            
            .nav-item.current a {
                background: rgba(255, 153, 0, 0.2);
                color: #ff9900;
                font-weight: 600;
                
            }
            
            /* 移动菜单按钮 */
            .mobile-menu-btn {
                display: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 4px;
            }
            
            .mobile-menu-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* 响应式设计 */
            @media (max-width: 768px) {
                .modern-nav {
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 1rem;
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
                }
                
                .modern-nav.mobile-open .nav-links {
                    display: flex;
                }
                
                .nav-item {
                    margin: 0.25rem 0;
                    width: 100%;
                }
                
                .nav-item a {
                    width: 100%;
                    padding: 0.75rem 1rem;
                }
            }
        `;
        
        // 添加样式到页面头部
        document.head.appendChild(styleEl);
    }
}

// 初始化导航菜单
const navMenu = new NavigationMenu();
