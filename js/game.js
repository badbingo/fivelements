/**
 * 五行之道 - 八字命理游戏
 * 基于八字命理系统的五行相生相克游戏
 */

document.addEventListener('DOMContentLoaded', function() {
    // 游戏配置
    const gameConfig = {
        roundsPerGame: 10,      // 每局游戏的回合数
        timePerRound: 15,      // 每回合的时间（秒）
        baseScore: 100,        // 基础得分
        comboMultiplier: 0.2,  // 连击加成倍数
        maxLevel: 10,          // 最高等级
        elementInitPower: 20   // 初始五行能量值
    };
    
    // 五行元素定义
    const elements = {
        wood: { name: '木', icon: 'leaf', color: '#4CAF50', power: gameConfig.elementInitPower },
        fire: { name: '火', icon: 'fire', color: '#FF5722', power: gameConfig.elementInitPower },
        earth: { name: '土', icon: 'mountain', color: '#FFC107', power: gameConfig.elementInitPower },
        metal: { name: '金', icon: 'coins', color: '#9E9E9E', power: gameConfig.elementInitPower },
        water: { name: '水', icon: 'water', color: '#2196F3', power: gameConfig.elementInitPower }
    };
    
    // 五行相生关系
    const generationRelations = {
        wood: 'fire',   // 木生火
        fire: 'earth',  // 火生土
        earth: 'metal', // 土生金
        metal: 'water', // 金生水
        water: 'wood'   // 水生木
    };
    
    // 五行相克关系
    const controlRelations = {
        wood: 'earth',  // 木克土
        earth: 'water', // 土克水
        water: 'fire',  // 水克火
        fire: 'metal',  // 火克金
        metal: 'wood'   // 金克木
    };
    
    // 天干与五行对应关系
    const stemElements = {
        '甲': 'wood', '乙': 'wood',
        '丙': 'fire', '丁': 'fire',
        '戊': 'earth', '己': 'earth',
        '庚': 'metal', '辛': 'metal',
        '壬': 'water', '癸': 'water'
    };
    
    // 地支与五行对应关系
    const branchElements = {
        '子': 'water', '丑': 'earth', '寅': 'wood', '卯': 'wood',
        '辰': 'earth', '巳': 'fire', '午': 'fire', '未': 'earth',
        '申': 'metal', '酉': 'metal', '戌': 'earth', '亥': 'water'
    };
    
    // 游戏状态
    const gameState = {
        isPlaying: false,
        currentRound: 0,
        score: 0,
        level: 1,
        combo: 0,
        timer: null,
        timeLeft: gameConfig.timePerRound,
        elements: JSON.parse(JSON.stringify(elements)), // 深拷贝元素状态
        currentQuestion: null,
        gameMode: 'basic' // 基础模式
    };
    
    // DOM 元素
    const dom = {
        startBtn: document.getElementById('start-game'),
        instructionsBtn: document.getElementById('instructions-btn'),
        leaderboardBtn: document.getElementById('leaderboard-btn'),
        playAgainBtn: document.getElementById('play-again'),
        shareResultBtn: document.getElementById('share-result'),
        welcomeScreen: document.getElementById('welcome-screen'),
        gamePlayArea: document.getElementById('game-play-area'),
        gameMessage: document.getElementById('game-message'),
        gameTimer: document.getElementById('game-timer'),
        gameRound: document.getElementById('game-round'),
        comboCount: document.getElementById('combo-count'),
        playerLevel: document.getElementById('player-level'),
        playerScore: document.getElementById('player-score'),
        instructionsModal: document.getElementById('instructions-modal'),
        leaderboardModal: document.getElementById('leaderboard-modal'),
        resultModal: document.getElementById('result-modal'),
        resultContent: document.getElementById('result-content'),
        leaderboardBody: document.getElementById('leaderboard-body')
    };
    
    // 更新元素能量显示
    function updateElementPowers() {
        for (const [key, element] of Object.entries(gameState.elements)) {
            const powerBar = document.getElementById(`${key}-power`);
            const powerValue = powerBar.parentElement.nextElementSibling;
            
            // 更新进度条宽度
            powerBar.style.width = `${element.power}%`;
            
            // 更新数值显示
            powerValue.textContent = Math.round(element.power);
            
            // 根据能量值改变颜色
            if (element.power < 20) {
                powerBar.style.backgroundColor = '#FF5252'; // 低能量警告色
            } else {
                powerBar.style.backgroundColor = element.color;
            }
        }
    }
    
    // 更新游戏状态显示
    function updateGameStatus() {
        dom.gameRound.textContent = gameState.currentRound;
        dom.gameTimer.textContent = gameState.timeLeft;
        dom.comboCount.textContent = gameState.combo;
        dom.playerScore.textContent = gameState.score;
        dom.playerLevel.textContent = gameState.level;
    }
    
    // 生成问题
    function generateQuestion() {
        const questionTypes = [
            'generation', // 相生
            'control',    // 相克
            'stem',       // 天干
            'branch'      // 地支
        ];
        
        // 基础模式只使用相生相克问题
        const availableTypes = gameState.gameMode === 'basic' 
            ? questionTypes.slice(0, 2) 
            : questionTypes;
        
        const questionType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        let question, correctAnswer, options;
        
        switch (questionType) {
            case 'generation':
                const sourceElement = getRandomElement();
                question = `哪个五行元素被${elements[sourceElement].name}所生？`;
                correctAnswer = generationRelations[sourceElement];
                options = generateOptions(correctAnswer);
                return { type: questionType, question, correctAnswer, options, context: sourceElement };
                
            case 'control':
                const controlElement = getRandomElement();
                question = `哪个五行元素被${elements[controlElement].name}所克？`;
                correctAnswer = controlRelations[controlElement];
                options = generateOptions(correctAnswer);
                return { type: questionType, question, correctAnswer, options, context: controlElement };
                
            case 'stem':
                const stems = Object.keys(stemElements);
                const randomStem = stems[Math.floor(Math.random() * stems.length)];
                question = `天干${randomStem}属于哪个五行？`;
                correctAnswer = stemElements[randomStem];
                options = generateOptions(correctAnswer);
                return { type: questionType, question, correctAnswer, options, context: randomStem };
                
            case 'branch':
                const branches = Object.keys(branchElements);
                const randomBranch = branches[Math.floor(Math.random() * branches.length)];
                question = `地支${randomBranch}属于哪个五行？`;
                correctAnswer = branchElements[randomBranch];
                options = generateOptions(correctAnswer);
                return { type: questionType, question, correctAnswer, options, context: randomBranch };
        }
    }
    
    // 获取随机五行元素
    function getRandomElement() {
        const elementKeys = Object.keys(elements);
        return elementKeys[Math.floor(Math.random() * elementKeys.length)];
    }
    
    // 生成选项（包含正确答案和干扰项）
    function generateOptions(correctAnswer) {
        const allElements = Object.keys(elements);
        const options = [correctAnswer];
        
        // 添加不重复的干扰项
        while (options.length < 4) {
            const randomElement = allElements[Math.floor(Math.random() * allElements.length)];
            if (!options.includes(randomElement)) {
                options.push(randomElement);
            }
        }
        
        // 打乱选项顺序
        return shuffleArray(options);
    }
    
    // 打乱数组顺序（Fisher-Yates 洗牌算法）
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // 显示问题
    function displayQuestion(questionData) {
        // 清空游戏区域
        dom.gamePlayArea.innerHTML = '';
        
        // 创建问题容器
        const questionContainer = document.createElement('div');
        questionContainer.className = 'question-container fade-in';
        
        // 添加问题文本
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = questionData.question;
        questionContainer.appendChild(questionText);
        
        // 添加上下文元素（如果有）
        if (questionData.context) {
            const contextElement = document.createElement('div');
            contextElement.className = 'context-element';
            
            // 根据问题类型显示不同的上下文
            if (questionData.type === 'generation' || questionData.type === 'control') {
                // 显示五行元素
                const elementKey = questionData.context;
                const element = elements[elementKey];
                
                contextElement.innerHTML = `
                    <div class="element ${elementKey} pulse" style="background-color: ${element.color}">
                        <i class="fas fa-${element.icon}"></i>
                    </div>
                    <div class="element-name">${element.name}</div>
                `;
            } else {
                // 显示天干或地支
                contextElement.innerHTML = `
                    <div class="chinese-character pulse">${questionData.context}</div>
                `;
            }
            
            questionContainer.appendChild(contextElement);
        }
        
        // 添加选项
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        questionData.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option-item';
            optionElement.dataset.value = option;
            
            const element = elements[option];
            optionElement.innerHTML = `
                <div class="element ${option}" style="background-color: ${element.color}">
                    <i class="fas fa-${element.icon}"></i>
                </div>
                <div class="element-name">${element.name}</div>
            `;
            
            // 添加点击事件
            optionElement.addEventListener('click', () => handleAnswer(option, questionData.correctAnswer));
            
            optionsContainer.appendChild(optionElement);
        });
        
        questionContainer.appendChild(optionsContainer);
        dom.gamePlayArea.appendChild(questionContainer);
    }
    
    // 处理答案
    function handleAnswer(selectedAnswer, correctAnswer) {
        // 停止计时器
        clearInterval(gameState.timer);
        
        // 判断答案是否正确
        const isCorrect = selectedAnswer === correctAnswer;
        
        // 高亮显示正确和错误答案
        const options = document.querySelectorAll('.option-item');
        options.forEach(option => {
            const value = option.dataset.value;
            
            if (value === correctAnswer) {
                option.classList.add('correct');
            } else if (value === selectedAnswer && !isCorrect) {
                option.classList.add('wrong');
            }
            
            // 禁用所有选项
            option.style.pointerEvents = 'none';
        });
        
        // 更新游戏状态
        if (isCorrect) {
            // 正确答案处理
            gameState.combo++;
            const comboBonus = Math.floor(gameConfig.baseScore * (1 + gameState.combo * gameConfig.comboMultiplier));
            gameState.score += comboBonus;
            
            // 增加相应元素能量
            gameState.elements[correctAnswer].power = Math.min(100, gameState.elements[correctAnswer].power + 10);
            
            // 显示正确消息
            dom.gameMessage.textContent = `正确！+${comboBonus}分 (${gameState.combo}连击)`;
            dom.gameMessage.className = 'game-message correct-message';
        } else {
            // 错误答案处理
            gameState.combo = 0;
            
            // 减少相应元素能量
            gameState.elements[selectedAnswer].power = Math.max(5, gameState.elements[selectedAnswer].power - 15);
            
            // 显示错误消息
            dom.gameMessage.textContent = `错误！正确答案是: ${elements[correctAnswer].name}`;
            dom.gameMessage.className = 'game-message wrong-message';
        }
        
        // 更新显示
        updateGameStatus();
        updateElementPowers();
        
        // 延迟后进入下一回合
        setTimeout(() => {
            gameState.currentRound++;
            
            if (gameState.currentRound > gameConfig.roundsPerGame) {
                // 游戏结束
                endGame();
            } else {
                // 进入下一回合
                startRound();
            }
        }, 1500);
    }
    
    // 开始新回合
    function startRound() {
        // 重置计时器
        gameState.timeLeft = gameConfig.timePerRound;
        updateGameStatus();
        
        // 生成新问题
        gameState.currentQuestion = generateQuestion();
        displayQuestion(gameState.currentQuestion);
        
        // 更新消息
        dom.gameMessage.textContent = `第 ${gameState.currentRound} 回合，请选择正确答案`;
        dom.gameMessage.className = 'game-message';
        
        // 启动计时器
        gameState.timer = setInterval(() => {
            gameState.timeLeft--;
            dom.gameTimer.textContent = gameState.timeLeft;
            
            if (gameState.timeLeft <= 0) {
                // 时间到，视为回答错误
                clearInterval(gameState.timer);
                handleAnswer('', gameState.currentQuestion.correctAnswer);
            }
        }, 1000);
    }
    
    // 开始游戏
    function startGame() {
        // 初始化游戏状态
        gameState.isPlaying = true;
        gameState.currentRound = 1;
        gameState.score = 0;
        gameState.combo = 0;
        gameState.elements = JSON.parse(JSON.stringify(elements)); // 重置元素状态
        
        // 更新显示
        updateGameStatus();
        updateElementPowers();
        
        // 隐藏欢迎屏幕，显示游戏区域
        dom.welcomeScreen.style.display = 'none';
        dom.gamePlayArea.style.display = 'flex';
        
        // 开始第一回合
        startRound();
    }
    
    // 结束游戏
    function endGame() {
        gameState.isPlaying = false;
        
        // 计算最终等级
        calculateFinalLevel();
        
        // 显示结果
        showResult();
        
        // 保存分数到排行榜
        saveScore();
    }
    
    // 计算最终等级
    function calculateFinalLevel() {
        // 基于分数计算等级
        const baseLevel = Math.floor(gameState.score / 500) + 1;
        
        // 计算五行平衡度（所有元素能量的标准差，越低越平衡）
        const powers = Object.values(gameState.elements).map(e => e.power);
        const avgPower = powers.reduce((sum, power) => sum + power, 0) / powers.length;
        const variance = powers.reduce((sum, power) => sum + Math.pow(power - avgPower, 2), 0) / powers.length;
        const balanceFactor = Math.max(0, 1 - Math.sqrt(variance) / 50); // 0到1之间的平衡因子
        
        // 最终等级 = 基础等级 + 平衡加成（最多2级）
        const balanceBonus = Math.floor(balanceFactor * 2);
        gameState.level = Math.min(gameConfig.maxLevel, baseLevel + balanceBonus);
    }
    
    // 显示游戏结果
    function showResult() {
        // 生成结果内容
        let resultHTML = `
            <div class="result-score">${gameState.score}</div>
            <div class="result-level">等级: ${gameState.level} - ${getLevelTitle(gameState.level)}</div>
            
            <div class="element-balance">
                <h3>五行能量分布</h3>
                <div class="element-balance-chart">
        `;
        
        // 添加五行能量条
        for (const [key, element] of Object.entries(gameState.elements)) {
            resultHTML += `
                <div class="element-bar">
                    <div class="element-icon ${key}" style="background-color: ${element.color}">
                        <i class="fas fa-${element.icon}"></i>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${element.power}%; background-color: ${element.color};"></div>
                    </div>
                    <div class="element-value">${Math.round(element.power)}</div>
                </div>
            `;
        }
        
        // 添加分析结果
        resultHTML += `
                </div>
            </div>
            
            <div class="result-analysis">
                <h3>命理分析</h3>
                <p>${generateAnalysis()}</p>
            </div>
        `;
        
        // 更新结果模态框内容
        dom.resultContent.innerHTML = resultHTML;
        
        // 显示结果模态框
        dom.resultModal.style.display = 'flex';
    }
    
    // 获取等级称号
    function getLevelTitle(level) {
        const titles = [
            '初学者',
            '五行学徒',
            '命理新秀',
            '八字探索者',
            '五行调和师',
            '命理分析师',
            '八字大师',
            '命理宗师',
            '五行通灵者',
            '命理大师'
        ];
        
        return titles[Math.min(level - 1, titles.length - 1)];
    }
    
    // 生成分析结果
    function generateAnalysis() {
        // 获取最强和最弱的五行
        const elementEntries = Object.entries(gameState.elements);
        elementEntries.sort((a, b) => b[1].power - a[1].power);
        
        const strongest = elementEntries[0];
        const weakest = elementEntries[elementEntries.length - 1];
        
        // 计算五行平衡度
        const powers = elementEntries.map(e => e[1].power);
        const avgPower = powers.reduce((sum, power) => sum + power, 0) / powers.length;
        const variance = powers.reduce((sum, power) => sum + Math.pow(power - avgPower, 2), 0) / powers.length;
        const balanceFactor = Math.max(0, 1 - Math.sqrt(variance) / 50);
        
        let balanceDesc;
        if (balanceFactor > 0.8) {
            balanceDesc = '您的五行非常平衡，显示出卓越的命理理解能力。';
        } else if (balanceFactor > 0.6) {
            balanceDesc = '您的五行较为平衡，但仍有提升空间。';
        } else if (balanceFactor > 0.4) {
            balanceDesc = '您的五行平衡度一般，需要更多练习。';
        } else {
            balanceDesc = '您的五行严重失衡，建议重新学习五行相生相克的基本原理。';
        }
        
        // 根据最强和最弱五行生成个性化分析
        const strongestAnalysis = `您在${elements[strongest[0]].name}的理解上表现最佳，这显示出您对${getElementCharacteristics(strongest[0])}的良好把握。`;
        const weakestAnalysis = `您在${elements[weakest[0]].name}的理解上有待提高，建议多关注${getElementCharacteristics(weakest[0])}的特性。`;
        
        // 综合分析
        return `${balanceDesc} ${strongestAnalysis} ${weakestAnalysis} 继续练习将帮助您更全面地理解八字命理的奥秘。`;
    }
    
    // 获取五行特性描述
    function getElementCharacteristics(element) {
        const characteristics = {
            wood: '生长、创造力、灵活性',
            fire: '热情、活力、表现力',
            earth: '稳定、包容、中正',
            metal: '坚韧、决断、精确',
            water: '智慧、适应性、沟通'
        };
        
        return characteristics[element];
    }
    
    // 保存分数到排行榜
    function saveScore() {
        // 获取现有排行榜
        let leaderboard = JSON.parse(localStorage.getItem('wuxingLeaderboard')) || [];
        
        // 添加新分数
        const newScore = {
            name: document.getElementById('name').value || '游客',
            score: gameState.score,
            level: gameState.level,
            balance: calculateBalanceScore(),
            date: new Date().toISOString()
        };
        
        leaderboard.push(newScore);
        
        // 排序并限制数量
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10); // 只保留前10名
        
        // 保存回本地存储
        localStorage.setItem('wuxingLeaderboard', JSON.stringify(leaderboard));
        
        // 更新排行榜显示
        updateLeaderboard();
    }
    
    // 计算平衡分数
    function calculateBalanceScore() {
        const powers = Object.values(gameState.elements).map(e => e.power);
        const avgPower = powers.reduce((sum, power) => sum + power, 0) / powers.length;
        const variance = powers.reduce((sum, power) => sum + Math.pow(power - avgPower, 2), 0) / powers.length;
        
        // 转换为0-100的分数，方差越小分数越高
        return Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 2));
    }
    
    // 更新排行榜显示
    function updateLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('wuxingLeaderboard')) || [];
        
        // 清空现有内容
        dom.leaderboardBody.innerHTML = '';
        
        // 添加排行榜条目
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score}</td>
                <td>${entry.level} - ${getLevelTitle(entry.level)}</td>
                <td>${Math.round(entry.balance)}%</td>
            `;
            
            dom.leaderboardBody.appendChild(row);
        });
    }
    
    // 事件监听器
    function setupEventListeners() {
        // 开始游戏按钮
        dom.startBtn.addEventListener('click', startGame);
        
        // 游戏说明按钮
        dom.instructionsBtn.addEventListener('click', () => {
            dom.instructionsModal.style.display = 'flex';
        });
        
        // 排行榜按钮
        dom.leaderboardBtn.addEventListener('click', () => {
            updateLeaderboard();
            dom.leaderboardModal.style.display = 'flex';
        });
        
        // 再玩一次按钮
        dom.playAgainBtn.addEventListener('click', () => {
            dom.resultModal.style.display = 'none';
            startGame();
        });
        
        // 分享结果按钮
        dom.shareResultBtn.addEventListener('click', () => {
            // 实现分享功能（可以根据需要扩展）
            alert('分享功能即将上线！');
        });
        
        // 关闭模态框
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        });
        
        // 点击模态框背景关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
    
    // 初始化游戏
    function initGame() {
        // 设置事件监听器
        setupEventListeners();
        
        // 初始化元素能量显示
        updateElementPowers();
        
        // 初始化游戏状态显示
        updateGameStatus();
        
        // 初始化排行榜
        updateLeaderboard();
        
        // 添加欢迎动画
        const welcomeElements = document.querySelectorAll('.element-circle .element');
        welcomeElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('pulse');
            }, index * 200);
        });
    }
    
    // 启动游戏初始化
    initGame();
});