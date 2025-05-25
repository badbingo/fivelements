/**
 * 全站导航管理系统 - 完整版
 * 功能：
 * 1. 自动生成智能面包屑导航
 * 2. 动态渲染响应式主导航
 * 3. 支持多级下拉菜单
 * 4. 自动高亮当前页面
 * 5. 移动端适配
 */

class NavigationManager {
  constructor() {
    // ================= 基础配置 =================
    this.config = {
      baseUrl: '/',
      activeClass: 'active',
      mobileBreakpoint: 992,
      
      // 面包屑配置
      breadcrumb: {
        containerClass: 'auto-breadcrumb',
        home: { 
          icon: '<i class="fas fa-home"></i>', 
          text: '首页',
          url: '/'
        },
        separator: '<span class="separator">/</span>',
        nonClickableDirs: ['basics', 'advanced', 'tools', 'system'],
        excludePaths: ['api', 'admin', 'assets']
      },
      
      // 主导航配置
      navbar: {
        containerSelector: '.main-nav .nav-list',
        mobileToggleClass: 'mobile-menu-toggle',
        dropdownIcon: '<i class="fas fa-chevron-down dropdown-icon"></i>',
        closeIcon: '<i class="fas fa-times"></i>'
      }
    };
    
    // 全站路径映射
    this.pathMap = this.getFullPathMap();
    
    // 全站菜单结构
    this.menuConfig = this.getFullMenuConfig();
    
    // 移动端状态
    this.isMobile = window.innerWidth < this.config.mobileBreakpoint;
  }

  // ================= 初始化 =================
  init() {
    this.generateBreadcrumb();
    this.renderNavbar();
    this.setupEventListeners();
    
    // 响应式检测
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < this.config.mobileBreakpoint;
    });
  }

  // ================= 面包屑导航 =================
  generateBreadcrumb() {
    const path = window.location.pathname;
    if (this.shouldExclude(path)) return;
    
    const segments = this.getPathSegments(path);
    if (segments.length === 0) return;
    
    const breadcrumb = this.createBreadcrumbElement();
    breadcrumb.innerHTML = this.buildBreadcrumbHTML(segments);
    
    this.insertBreadcrumb(breadcrumb);
    this.addSchemaMarkup(segments);
  }

  getPathSegments(path) {
    return path.split('/')
      .filter(segment => segment && !segment.endsWith('.html'))
      .concat([this.getCurrentPageName()]);
  }

  getCurrentPageName() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  shouldExclude(path) {
    return this.config.breadcrumb.excludePaths.some(exclude => path.includes(exclude));
  }

  createBreadcrumbElement() {
    const nav = document.createElement('nav');
    nav.className = this.config.breadcrumb.containerClass;
    nav.setAttribute('aria-label', '页面导航路径');
    return nav;
  }

  buildBreadcrumbHTML(segments) {
    let html = this.buildBreadcrumbHome();
    let accumulatedPath = '';
    
    segments.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      const { name, icon } = this.getBreadcrumbSegmentInfo(segment);
      
      html += this.config.breadcrumb.separator;
      
      if (isLast) {
        html += `<span class="breadcrumb-current">${icon || ''}${name}</span>`;
      } else {
        const shouldDisable = this.config.breadcrumb.nonClickableDirs.includes(segment);
        html += shouldDisable
          ? `<span class="breadcrumb-non-clickable">${icon || ''}${name}</span>`
          : `<a href="${accumulatedPath}" class="breadcrumb-link">${icon || ''}${name}</a>`;
      }
    });
    
    return html;
  }

  buildBreadcrumbHome() {
    const { home } = this.config.breadcrumb;
    return `<a href="${home.url}" class="breadcrumb-home">${home.icon}${home.text}</a>`;
  }

  getBreadcrumbSegmentInfo(segment) {
    const cleanSegment = segment.replace('.html', '');
    const exactMatch = this.pathMap[segment] || this.pathMap[`${cleanSegment}.html`];
    
    if (exactMatch) {
      return {
        name: exactMatch.name,
        icon: exactMatch.icon || ''
      };
    }
    
    return {
      name: this.convertTechnicalTerms(cleanSegment),
      icon: ''
    };
  }

  convertTechnicalTerms(segment) {
    const termMap = {
      'bazi': '八字', 'wuxing': '五行', 'shensha': '神煞',
      'dasha': '大运', 'liunian': '流年', 'hehun': '合婚'
    };
    
    return segment.split('-')
      .map(term => termMap[term] || this.capitalizeFirstLetter(term))
      .join(' ');
  }

  capitalizeFirstLetter(str) {
    return str.replace(/^\w/, c => c.toUpperCase());
  }

  insertBreadcrumb(element) {
    const containers = [
      'main', '.content-container', 'article', '.container'
    ].map(sel => document.querySelector(sel));
    
    const validContainer = containers.find(el => el);
    (validContainer || document.body).insertBefore(element, (validContainer || document.body).firstChild);
  }

  addSchemaMarkup(segments) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(this.generateBreadcrumbSchema(segments));
    document.head.appendChild(script);
  }

  generateBreadcrumbSchema(segments) {
    let position = 1;
    let accumulatedPath = '';
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        // 首页项
        {
          "@type": "ListItem",
          "position": position++,
          "name": this.config.breadcrumb.home.text,
          "item": `${window.location.origin}${this.config.breadcrumb.home.url}`
        },
        // 路径项
        ...segments.map(segment => {
          accumulatedPath += `/${segment}`;
          const { name } = this.getBreadcrumbSegmentInfo(segment);
          
          return {
            "@type": "ListItem",
            "position": position++,
            "name": name,
            "item": `${window.location.origin}${accumulatedPath}`
          };
        })
      ]
    };
  }

  // ================= 主导航菜单 =================
  renderNavbar() {
    const navContainer = document.querySelector(this.config.navbar.containerSelector);
    if (!navContainer) return;
    
    navContainer.innerHTML = this.buildNavbarHTML(this.menuConfig);
    this.highlightCurrentNavItem();
    
    // 移动端初始化
    if (this.isMobile) {
      document.querySelector('.main-nav').classList.add('mobile-hidden');
    }
  }

  buildNavbarHTML(menuItems, level = 0) {
    return menuItems.map(item => {
      const isActive = this.isCurrentPage(item.url);
      const hasChildren = item.children?.length > 0;
      const isParentActive = hasChildren && item.children.some(child => this.isCurrentPage(child.url));
      
      return `
        <li class="nav-item ${isActive || isParentActive ? this.config.activeClass : ''} 
            ${hasChildren ? 'dropdown' : ''} ${level > 0 ? 'dropdown-item' : ''}">
          <a href="${item.url || '#'}" class="nav-link" ${hasChildren ? 'aria-haspopup="true"' : ''}>
            ${item.icon || ''}
            <span class="nav-text">${item.text}</span>
            ${hasChildren ? this.config.navbar.dropdownIcon : ''}
          </a>
          ${hasChildren ? `
            <button class="dropdown-toggle" aria-expanded="false">
              ${this.config.navbar.dropdownIcon}
            </button>
            <ul class="dropdown-menu">
              ${this.buildNavbarHTML(item.children, level + 1)}
            </ul>
          ` : ''}
        </li>
      `;
    }).join('');
  }

  isCurrentPage(url) {
    if (!url) return false;
    const currentPath = window.location.pathname.replace(/\/$/, '');
    return currentPath.endsWith(url.replace(/\.html$/, ''));
  }

  highlightCurrentNavItem() {
    document.querySelectorAll('.nav-link').forEach(link => {
      const navItem = link.closest('.nav-item');
      if (this.isCurrentPage(link.getAttribute('href'))) {
        navItem.classList.add(this.config.activeClass);
        
        // 展开所有父级菜单
        let parentMenu = navItem.closest('.dropdown-menu');
        while (parentMenu) {
          parentMenu.previousElementSibling.classList.add('expanded');
          parentMenu.previousElementSibling.setAttribute('aria-expanded', 'true');
          parentMenu.closest('.nav-item').classList.add(this.config.activeClass);
          parentMenu = parentMenu.closest('.dropdown-menu');
        }
      }
    });
  }

  // ================= 事件监听 =================
  setupEventListeners() {
    // 移动端菜单切换
    document.querySelector(`.${this.config.navbar.mobileToggleClass}`)?.addEventListener('click', () => {
      document.querySelector('.main-nav').classList.toggle('mobile-hidden');
    });
    
    // 下拉菜单交互
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', !expanded);
        toggle.classList.toggle('expanded', !expanded);
        toggle.nextElementSibling.classList.toggle('show');
      });
    });
    
    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
          menu.classList.remove('show');
          menu.previousElementSibling.classList.remove('expanded');
          menu.previousElementSibling.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  // ================= 数据配置 =================
  getFullPathMap() {
    return {
      /* ========== 主目录 ========== */
      'basics': { name: '基础知识', clickable: false, icon: '<i class="fas fa-book-open"></i>' },
      'advanced': { name: '进阶知识', clickable: false, icon: '<i class="fas fa-chart-line"></i>' },
      'tools': { name: '学习工具', clickable: false, icon: '<i class="fas fa-tools"></i>' },
      'system': { name: '命理系统', clickable: false, icon: '<i class="fas fa-shapes"></i>' },
      
      /* ========== 基础知识 ========== */
      'bazi-process.html': { name: '八字介绍' },
      'bazi-chart.html': { name: '排盘方法' },
      'yen-strength.html': { name: '日元强弱' },
      'elements.html': { name: '天干地支' },
      'wuxing.html': { name: '五行生克' },
      'balance.html': { name: '五行平衡' },
      'ten-gods.html': { name: '十神关系' },
      'combinations.html': { name: '合冲破害' },
      
      /* ========== 进阶知识 ========== */
      'tomb.html': { name: '四大墓库' },
      'personality.html': { name: '性格分析' },
      'wealth.html': { name: '财运分析' },
      'career.html': { name: '事业分析' },
      'marriage.html': { name: '婚姻分析' },
      'health.html': { name: '健康分析' },
      'luck.html': { name: '大运流年' },
      'disaster.html': { name: '重大灾祸' },
      
      /* ========== 学习工具 ========== */
      'calculator.html': { name: '八字计算器' },
      'reference.html': { name: '速查表' },
      'common.html': { name: '常见格局' },
      'special.html': { name: '特殊格局' },
      'bazi-test.html': { name: '八字试题' },
      
      /* ========== 命理系统 ========== */
      'bazi.html': { name: '机缘命理' },
      'hehun.html': { name: '八字合婚' },
      'liuyao.html': { name: '六爻起卦' },
      
      /* ========== 其他页面 ========== */
      'seven.html': { name: '七步速成' },
      'about.html': { name: '关于我们' },
      'contact.html': { name: '联系我们' }
    };
  }

  getFullMenuConfig() {
    return [
      {
        text: '七步速成',
        url: 'seven.html',
        icon: '<i class="fas fa-home"></i>'
      },
      {
        text: '基础知识',
        icon: '<i class="fas fa-book-open"></i>',
        children: [
          { text: '八字介绍', url: 'basics/bazi-process.html' },
          { text: '排盘方法', url: 'basics/bazi-chart.html' },
          { text: '日元强弱', url: 'basics/yen-strength.html' },
          { text: '天干地支', url: 'basics/elements.html' },
          { text: '五行生克', url: 'basics/wuxing.html' },
          { text: '十神关系', url: 'basics/ten-gods.html' }
        ]
      },
      {
        text: '进阶知识',
        icon: '<i class="fas fa-chart-line"></i>',
        children: [
          { text: '性格分析', url: 'advanced/personality.html' },
          { text: '财运分析', url: 'advanced/wealth.html' },
          { text: '事业分析', url: 'advanced/career.html' },
          { text: '婚姻分析', url: 'advanced/marriage.html' }
        ]
      },
      {
        text: '学习工具',
        icon: '<i class="fas fa-tools"></i>',
        children: [
          { text: '八字计算器', url: 'tools/calculator.html' },
          { text: '常见格局', url: 'tools/common.html' },
          { text: '八字试题', url: 'tools/bazi-test.html' }
        ]
      },
      {
        text: '关于我们',
        url: 'about.html',
        icon: '<i class="fas fa-info-circle"></i>'
      }
    ];
  }
}

// ================= 初始化 =================
document.addEventListener('DOMContentLoaded', () => {
  const navManager = new NavigationManager();
  navManager.init();
});
