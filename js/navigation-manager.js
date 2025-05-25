/**
 * 全站导航管理系统 - 完整版
 * 功能：
 * 1. 自动生成智能面包屑导航
 * 2. 动态渲染响应式主导航
 * 3. 移动端汉堡菜单
 * 4. 多级下拉菜单支持
 * 5. 当前页面高亮
 * 6. SEO友好结构化数据
 * 7. 平滑动画过渡
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
    this.mobileMenuOpen = false;
    
    // DOM引用
    this.mobileToggleBtn = null;
    this.mobileOverlay = null;
  }

  // ================= 初始化 =================
  init() {
    this.generateBreadcrumb();
    this.renderNavbar();
    this.setupEventListeners();
    
    if (this.isMobile) {
      this.setupMobileMenu();
      this.setupMobileOverlay();
    }
    
    window.addEventListener('resize', this.handleResize.bind(this));
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
        {
          "@type": "ListItem",
          "position": position++,
          "name": this.config.breadcrumb.home.text,
          "item": `${window.location.origin}${this.config.breadcrumb.home.url}`
        },
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
    
    if (this.isMobile) {
      this.addMobileCloseButton(navContainer);
    }
    
    this.setupDropdowns();
  }

  buildNavbarHTML(menuItems, level = 0) {
    return menuItems.map(item => {
      const isActive = this.isCurrentPage(item.url);
      const hasChildren = item.children?.length > 0;
      const isParentActive = hasChildren && item.children.some(child => this.isCurrentPage(child.url));
      
      return `
        <li class="nav-item ${isActive || isParentActive ? this.config.activeClass : ''} 
            ${hasChildren ? 'dropdown' : ''} ${level > 0 ? 'dropdown-item' : ''}"
            data-level="${level}">
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

  addMobileCloseButton(navContainer) {
    const closeBtn = document.createElement('div');
    closeBtn.className = 'mobile-close-btn';
    closeBtn.innerHTML = this.config.navbar.closeIcon;
    navContainer.insertBefore(closeBtn, navContainer.firstChild);
    
    closeBtn.addEventListener('click', () => {
      this.closeMobileMenu();
    });
  }

  // ================= 移动端功能 =================
  setupMobileMenu() {
    this.mobileToggleBtn = document.createElement('button');
    this.mobileToggleBtn.className = `${this.config.navbar.mobileToggleClass} animated fadeIn`;
    this.mobileToggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(this.mobileToggleBtn);
    
    this.mobileToggleBtn.addEventListener('click', () => {
      this.toggleMobileMenu();
    });
  }

  setupMobileOverlay() {
    this.mobileOverlay = document.createElement('div');
    this.mobileOverlay.className = 'mobile-overlay';
    document.body.appendChild(this.mobileOverlay);
    
    this.mobileOverlay.addEventListener('click', () => {
      this.closeMobileMenu();
    });
  }

  toggleMobileMenu() {
    const mainNav = document.querySelector('.main-nav');
    mainNav.classList.toggle('mobile-show');
    this.mobileOverlay.classList.toggle('show');
    document.body.classList.toggle('no-scroll');
    this.mobileMenuOpen = !this.mobileMenuOpen;
    
    // 按钮动画
    if (this.mobileMenuOpen) {
      this.mobileToggleBtn.innerHTML = '<i class="fas fa-times"></i>';
      this.mobileToggleBtn.style.transform = 'rotate(180deg)';
    } else {
      this.mobileToggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
      this.mobileToggleBtn.style.transform = 'rotate(0)';
    }
  }

  closeMobileMenu() {
    document.querySelector('.main-nav').classList.remove('mobile-show');
    this.mobileOverlay.classList.remove('show');
    document.body.classList.remove('no-scroll');
    this.mobileMenuOpen = false;
    this.mobileToggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    this.mobileToggleBtn.style.transform = 'rotate(0)';
  }

  // ================= 下拉菜单交互 =================
  setupDropdowns() {
    document.querySelectorAll('.nav-item').forEach(item => {
      const dropdown = item.querySelector('.dropdown-menu');
      if (!dropdown) return;
      
      const toggle = item.querySelector('.dropdown-toggle');
      
      if (!this.isMobile) {
        // 桌面端悬停
        item.addEventListener('mouseenter', () => {
          this.openDropdown(item, dropdown, toggle);
        });
        
        item.addEventListener('mouseleave', () => {
          this.closeDropdown(item, dropdown, toggle);
        });
      } else {
        // 移动端点击
        toggle.style.display = 'block';
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          if (dropdown.style.maxHeight === '500px') {
            this.closeDropdown(item, dropdown, toggle);
          } else {
            this.openDropdown(item, dropdown, toggle);
          }
        });
      }
    });
    
    // 点击外部关闭所有下拉
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
          const item = dropdown.closest('.nav-item');
          const toggle = item?.querySelector('.dropdown-toggle');
          if (item && toggle) this.closeDropdown(item, dropdown, toggle);
        });
      }
    });
  }

  openDropdown(item, dropdown, toggle) {
    if (this.isMobile) {
      dropdown.style.maxHeight = '500px';
    } else {
      dropdown.style.opacity = '1';
      dropdown.style.visibility = 'visible';
      dropdown.style.transform = 'translateY(0)';
    }
    toggle.classList.add('expanded');
    toggle.setAttribute('aria-expanded', 'true');
  }

  closeDropdown(item, dropdown, toggle) {
    if (this.isMobile) {
      dropdown.style.maxHeight = '0';
    } else {
      dropdown.style.opacity = '0';
      dropdown.style.visibility = 'hidden';
      dropdown.style.transform = 'translateY(10px)';
    }
    toggle.classList.remove('expanded');
    toggle.setAttribute('aria-expanded', 'false');
  }

  // ================= 响应式处理 =================
  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < this.config.mobileBreakpoint;
    
    if (wasMobile !== this.isMobile) {
      if (!this.isMobile && this.mobileMenuOpen) {
        this.closeMobileMenu();
      }
      
      // 清理移动端元素
      if (!this.isMobile) {
        this.cleanupMobileElements();
      }
      
      // 重新渲染导航
      this.renderNavbar();
    }
  }

  cleanupMobileElements() {
    if (this.mobileToggleBtn) {
      this.mobileToggleBtn.remove();
      this.mobileToggleBtn = null;
    }
    if (this.mobileOverlay) {
      this.mobileOverlay.remove();
      this.mobileOverlay = null;
    }
  }

  // ================= 事件监听 =================
  setupEventListeners() {
    // 主导航点击事件委托
    document.querySelector(this.config.navbar.containerSelector)?.addEventListener('click', (e) => {
      if (this.isMobile && e.target.closest('.nav-link')) {
        this.closeMobileMenu();
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


