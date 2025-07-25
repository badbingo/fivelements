# -*- coding: utf-8 -*-
"""
八字身强身弱自动判断系统
包含：身强、身弱、均衡、从强、从弱五种状态判断
考虑：月令权重、天干地支生克、合化能量、通根强弱等要素
"""

# 基础数据配置
ELEMENTS = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', 
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}

BRANCH_ELEMENTS = {
    '子': {'主': '水', '藏': ['癸']},
    '丑': {'主': '土', '藏': ['己', '癸', '辛']},
    '寅': {'主': '木', '藏': ['甲', '丙', '戊']},
    '卯': {'主': '木', '藏': ['乙']},
    '辰': {'主': '土', '藏': ['戊', '乙', '癸']},
    '巳': {'主': '火', '藏': ['丙', '庚', '戊']},
    '午': {'主': '火', '藏': ['丁', '己']},
    '未': {'主': '土', '藏': ['己', '丁', '乙']},
    '申': {'主': '金', '藏': ['庚', '壬', '戊']},
    '酉': {'主': '金', '藏': ['辛']},
    '戌': {'主': '土', '藏': ['戊', '辛', '丁']},
    '亥': {'主': '水', '藏': ['壬', '甲']}
}

# 合化规则
HEHUA_RULES = {
    '天干': {
        ('甲', '己'): '土',
        ('乙', '庚'): '金',
        ('丙', '辛'): '水',
        ('丁', '壬'): '木',
        ('戊', '癸'): '火'
    },
    '地支': {
        ('子', '丑'): '土',
        ('寅', '亥'): '木',
        ('卯', '戌'): '火',
        ('辰', '酉'): '金',
        ('巳', '申'): '水',
        ('午', '未'): '土'
    },
    '三合': {
        ('申', '子', '辰'): '水',
        ('亥', '卯', '未'): '木',
        ('寅', '午', '戌'): '火',
        ('巳', '酉', '丑'): '金'
    }
}

def calculate_bazi_strength(bazi):
    """
    主计算函数
    :param bazi: 八字字典 {'year': '壬子', 'month': '癸丑', 'day': '己巳', 'hour': '癸酉'}
    :return: 强度类型和得分
    """
    # 1. 解析八字
    day_gan = bazi['day'][0]
    day_element = ELEMENTS[day_gan]
    
    # 2. 检查合化情况
    combined = check_combinations(bazi)
    
    # 3. 计算各项得分
    score = 0
    
    # 月令得分 (40%)
    month_branch = bazi['month'][1]
    score += get_month_strength(day_element, month_branch, combined)
    
    # 天干得分
    gans = [bazi['year'][0], bazi['month'][0], bazi['day'][0], bazi['hour'][0]]
    score += get_gans_strength(day_element, gans, combined)
    
    # 地支得分
    branches = [bazi['year'][1], bazi['month'][1], bazi['day'][1], bazi['hour'][1]]
    score += get_branches_strength(day_element, branches, combined)
    
    # 通根得分
    score += get_root_strength(day_element, branches, combined)
    
    # 4. 特殊格局判断
    strength_type = determine_strength_type(score, day_element, bazi, combined)
    
    return strength_type, score

def check_combinations(bazi):
    """检查所有合化情况"""
    combined = {}
    
    # 天干五合
    gans = [bazi['year'][0], bazi['month'][0], bazi['day'][0], bazi['hour'][0]]
    for i in range(len(gans)-1):
        gan1, gan2 = gans[i], gans[i+1]
        for pair, to_element in HEHUA_RULES['天干'].items():
            if (gan1 in pair) and (gan2 in pair):
                # 简单判断：相邻且月令支持
                month_element = ELEMENTS[bazi['month'][0]]
                if month_element == to_element:
                    combined[gan1] = to_element
                    combined[gan2] = to_element
    
    # 地支六合
    branches = [bazi['year'][1], bazi['month'][1], bazi['day'][1], bazi['hour'][1]]
    for i in range(len(branches)-1):
        br1, br2 = branches[i], branches[i+1]
        for pair, to_element in HEHUA_RULES['地支'].items():
            if (br1 in pair) and (br2 in pair):
                combined[br1] = to_element
                combined[br2] = to_element
    
    # 地支三合
    for trio, to_element in HEHUA_RULES['三合'].items():
        if all(br in branches for br in trio):
            for br in trio:
                combined[br] = to_element
    
    return combined

def get_month_strength(day_element, month_branch, combined):
    """月令得分计算"""
    # 如果月支被合化，使用合化后的元素
    current_element = combined.get(month_branch, BRANCH_ELEMENTS[month_branch]['主'])
    
    if current_element == day_element:
        return 40  # 得令
    elif is_generating(current_element, day_element):
        return 20  # 得生
    elif is_restricting(current_element, day_element):
        return -20  # 被克
    else:
        return 0  # 不得令

def get_gans_strength(day_element, gans, combined):
    """天干得分计算"""
    score = 0
    for gan in gans:
        current_element = combined.get(gan, ELEMENTS[gan])
        if current_element == day_element:
            score += 10  # 比劫
        elif is_generating(current_element, day_element):
            score += 10  # 印星
        elif is_restricting(current_element, day_element):
            score -= 10  # 官杀
        elif is_outputting(day_element, current_element):
            score -= 5   # 食伤
        else:  # 财星
            score -= 8
    return score

def get_branches_strength(day_element, branches, combined):
    """地支得分计算"""
    score = 0
    for branch in branches:
        # 处理合化后的地支
        if branch in combined:
            main_element = combined[branch]
            score += 15 if main_element == day_element else (
                -15 if is_restricting(main_element, day_element) else 0
            )
        else:
            # 主气
            main_element = BRANCH_ELEMENTS[branch]['主']
            main_score = 15 if main_element == day_element else (
                -15 if is_restricting(main_element, day_element) else 0
            )
            
            # 中气余气
            hidden_score = 0
            for hidden_gan in BRANCH_ELEMENTS[branch]['藏'][1:]:
                hidden_element = ELEMENTS[hidden_gan]
                hidden_score += 7 if hidden_element == day_element else (
                    -7 if is_restricting(hidden_element, day_element) else 0
                )
            
            score += main_score + hidden_score * 0.5  # 中余气权重减半
    return score

def get_root_strength(day_element, branches, combined):
    """通根得分计算"""
    strong_root = False
    weak_root = False
    
    for branch in branches:
        if branch in combined:
            if combined[branch] == day_element:
                strong_root = True
        else:
            if BRANCH_ELEMENTS[branch]['主'] == day_element:
                strong_root = True
            elif day_element in [ELEMENTS[g] for g in BRANCH_ELEMENTS[branch]['藏']]:
                weak_root = True
    
    if strong_root:
        return 20
    elif weak_root:
        return 10
    return 0

def determine_strength_type(score, day_element, bazi, combined):
    """最终强度判断"""
    # 先检查特殊格局
    if is_cong_strong(score, day_element, bazi, combined):
        return "从强"
    elif is_cong_weak(score, day_element, bazi, combined):
        return "从弱"
    
    # 普通格局
    if score > 60:
        return "身强"
    elif 30 <= score <= 60:
        return "均衡"
    else:
        return "身弱"

def is_cong_strong(score, day_element, bazi, combined):
    """从强格判断"""
    # 条件1：得分极高
    if score < 80:
        return False
    
    # 条件2：几乎没有克制
    branches = [bazi['year'][1], bazi['month'][1], bazi['day'][1], bazi['hour'][1]]
    for branch in branches:
        current_element = combined.get(branch, BRANCH_ELEMENTS[branch]['主'])
        if is_restricting(current_element, day_element):
            return False
    
    # 条件3：生扶集中
    return True

def is_cong_weak(score, day_element, bazi, combined):
    """从弱格判断"""
    # 条件1：得分极低
    if score > 10:
        return False
    
    # 条件2：几乎没有生扶
    gans = [bazi['year'][0], bazi['month'][0], bazi['day'][0], bazi['hour'][0]]
    branches = [bazi['year'][1], bazi['month'][1], bazi['day'][1], bazi['hour'][1]]
    
    # 检查天干生扶
    for gan in gans:
        current_element = combined.get(gan, ELEMENTS[gan])
        if current_element == day_element or is_generating(current_element, day_element):
            return False
    
    # 检查地支生扶
    for branch in branches:
        current_element = combined.get(branch, BRANCH_ELEMENTS[branch]['主'])
        if current_element == day_element or is_generating(current_element, day_element):
            return False
    
    # 条件3：克泄耗集中
    return True

# 五行关系判断工具函数
def is_generating(e1, e2):
    """e1是否能生e2"""
    return (e1 == '木' and e2 == '火') or (e1 == '火' and e2 == '土') or \
           (e1 == '土' and e2 == '金') or (e1 == '金' and e2 == '水') or \
           (e1 == '水' and e2 == '木')

def is_restricting(e1, e2):
    """e1是否能克e2"""
    return (e1 == '木' and e2 == '土') or (e1 == '土' and e2 == '水') or \
           (e1 == '水' and e2 == '火') or (e1 == '火' and e2 == '金') or \
           (e1 == '金' and e2 == '木')

def is_outputting(e1, e2):
    """e1是否能泄e2（e2生e1）"""
    return is_generating(e2, e1)

# 示例使用
if __name__ == "__main__":
    example_bazi = {'year': '壬子', 'month': '癸丑', 'day': '己巳', 'hour': '癸酉'}
    strength_type, score = calculate_bazi_strength(example_bazi)
    print(f"八字强度: {strength_type} (得分: {score})")