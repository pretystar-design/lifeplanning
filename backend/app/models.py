from datetime import datetime
from app import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    goals = db.relationship('Goal', backref='user', lazy=True, cascade='all, delete-orphan')
    habits = db.relationship('Habit', backref='user', lazy=True, cascade='all, delete-orphan')
    budgets = db.relationship('Budget', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'created_at': self.created_at.isoformat()
        }


class Goal(db.Model):
    __tablename__ = 'goals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), default='personal')  # financial, health, career, personal
    status = db.Column(db.String(20), default='not_started')  # not_started, in_progress, completed
    target_date = db.Column(db.Date)
    progress = db.Column(db.Integer, default=0)  # 0-100
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    milestones = db.relationship('Milestone', backref='goal', lazy=True, cascade='all, delete-orphan')
    progress_entries = db.relationship('ProgressEntry', backref='goal', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'status': self.status,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'progress': self.progress,
            'milestones': [m.to_dict() for m in self.milestones],
            'created_at': self.created_at.isoformat()
        }


class Milestone(db.Model):
    __tablename__ = 'milestones'
    
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('goals.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    target_date = db.Column(db.Date)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'goal_id': self.goal_id,
            'title': self.title,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'completed': self.completed,
            'created_at': self.created_at.isoformat()
        }


class ProgressEntry(db.Model):
    __tablename__ = 'progress_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('goals.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text)
    value = db.Column(db.Integer, default=0)  # Progress percentage added
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'goal_id': self.goal_id,
            'user_id': self.user_id,
            'notes': self.notes,
            'value': self.value,
            'created_at': self.created_at.isoformat()
        }


class Habit(db.Model):
    __tablename__ = 'habits'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    frequency = db.Column(db.String(20), default='daily')  # daily, weekly
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    completions = db.relationship('HabitCompletion', backref='habit', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'frequency': self.frequency,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'created_at': self.created_at.isoformat()
        }


class HabitCompletion(db.Model):
    __tablename__ = 'habit_completions'
    
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    completed_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'user_id': self.user_id,
            'completed_date': self.completed_date.isoformat(),
            'created_at': self.created_at.isoformat()
        }


class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    total_amount = db.Column(db.Float, default=0)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    categories = db.relationship('BudgetCategory', backref='budget', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        total_spent = sum(c.spent for c in self.categories)
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'total_amount': self.total_amount,
            'total_spent': total_spent,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'categories': [c.to_dict() for c in self.categories],
            'created_at': self.created_at.isoformat()
        }


class BudgetCategory(db.Model):
    __tablename__ = 'budget_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    budget_id = db.Column(db.Integer, db.ForeignKey('budgets.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    allocated_amount = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    expenses = db.relationship('Expense', backref='category', lazy=True, cascade='all, delete-orphan')
    
    @property
    def spent(self):
        return sum(e.amount for e in self.expenses)
    
    @property
    def remaining(self):
        return self.allocated_amount - self.spent
    
    def to_dict(self):
        return {
            'id': self.id,
            'budget_id': self.budget_id,
            'name': self.name,
            'allocated_amount': self.allocated_amount,
            'spent': self.spent,
            'remaining': self.remaining,
            'created_at': self.created_at.isoformat()
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('budget_categories.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(500))
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'user_id': self.user_id,
            'amount': self.amount,
            'description': self.description,
            'date': self.date.isoformat(),
            'created_at': self.created_at.isoformat()
        }

# ==================== Immigration Models ====================

class ImmigrationGoal(db.Model):
    """移民目标模型"""
    __tablename__ = 'immigration_goals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    target_country = db.Column(db.String(100), nullable=False)  # 目标国家
    immigration_type = db.Column(db.String(50), nullable=False)  # 技术移民/投资移民/留学移民/团聚移民等
    current_status = db.Column(db.String(50), default='planning')  # planning, preparing, applying, approved, rejected
    target_date = db.Column(db.Date)  # 目标移民日期
    budget = db.Column(db.Float, default=0)  # 预算
    notes = db.Column(db.Text)  # 备注信息
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='immigration_goals')
    plan = db.relationship('ImmigrationPlan', backref='goal', uselist=False, cascade='all, delete-orphan')
    risks = db.relationship('ImmigrationRisk', backref='goal', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'target_country': self.target_country,
            'immigration_type': self.immigration_type,
            'current_status': self.current_status,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'budget': self.budget,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class ImmigrationPlan(db.Model):
    """移民方案模型"""
    __tablename__ = 'immigration_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('immigration_goals.id'), nullable=False, unique=True)
    plan_data = db.Column(db.JSON)  # 完整的方案数据
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'goal_id': self.goal_id,
            'plan_data': self.plan_data,
            'generated_at': self.generated_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class ImmigrationRisk(db.Model):
    """移民风险评估模型"""
    __tablename__ = 'immigration_risks'
    
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('immigration_goals.id'), nullable=False)
    risk_type = db.Column(db.String(50), nullable=False)  # policy, financial, timeline, documents, language, other
    risk_level = db.Column(db.String(20), nullable=False)  # high, medium, low
    risk_description = db.Column(db.Text, nullable=False)
    mitigation_suggestion = db.Column(db.Text)  # 风险缓解建议
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'goal_id': self.goal_id,
            'risk_type': self.risk_type,
            'risk_level': self.risk_level,
            'risk_description': self.risk_description,
            'mitigation_suggestion': self.mitigation_suggestion,
            'created_at': self.created_at.isoformat()
        }

# ==================== Finance Advisor Models ====================

class FinancialGoal(db.Model):
    """理财目标模型"""
    __tablename__ = 'financial_goals'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    goal_type = db.Column(db.String(50), nullable=False)  # 养老/教育/购房/旅游/应急基金等
    name = db.Column(db.String(200), nullable=False)  # 目标名称
    target_amount = db.Column(db.Float, nullable=False)  # 目标金额
    current_amount = db.Column(db.Float, default=0)  # 当前金额
    target_date = db.Column(db.Date)  # 目标日期
    risk_tolerance = db.Column(db.String(20), default='balanced')  # 保守/稳健/平衡/进取/激进
    monthly_investment = db.Column(db.Float, default=0)  # 每月定投金额
    notes = db.Column(db.Text)  # 备注信息
    status = db.Column(db.String(20), default='active')  # active, completed, paused
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='financial_goals')
    investment_plan = db.relationship('InvestmentPlan', backref='goal', uselist=False, cascade='all, delete-orphan')
    risks = db.relationship('InvestmentRisk', backref='goal', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        progress = 0
        if self.target_amount > 0:
            progress = min(100, round((self.current_amount / self.target_amount) * 100, 2))
        return {
            'id': self.id,
            'user_id': self.user_id,
            'goal_type': self.goal_type,
            'name': self.name,
            'target_amount': self.target_amount,
            'current_amount': self.current_amount,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'risk_tolerance': self.risk_tolerance,
            'monthly_investment': self.monthly_investment,
            'notes': self.notes,
            'status': self.status,
            'progress': progress,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class InvestmentPlan(db.Model):
    """投资方案模型"""
    __tablename__ = 'investment_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('financial_goals.id'), nullable=False, unique=True)
    portfolio_allocation = db.Column(db.JSON)  # 资产配置比例 {"stocks": 40, "bonds": 35, "funds": 20, "cash": 5}
    expected_return = db.Column(db.Float, default=0)  # 预期年化收益率
    expected_final_amount = db.Column(db.Float, default=0)  # 预期最终金额
    risk_level = db.Column(db.String(20), default='medium')  # low, medium, high
    generated_by_ai = db.Column(db.Boolean, default=True)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'goal_id': self.goal_id,
            'portfolio_allocation': self.portfolio_allocation,
            'expected_return': self.expected_return,
            'expected_final_amount': self.expected_final_amount,
            'risk_level': self.risk_level,
            'generated_by_ai': self.generated_by_ai,
            'generated_at': self.generated_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class InvestmentRisk(db.Model):
    """投资风险评估模型"""
    __tablename__ = 'investment_risks'
    
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey('financial_goals.id'), nullable=False)
    risk_type = db.Column(db.String(50), nullable=False)  # market, liquidity, inflation, timing, product
    risk_name = db.Column(db.String(100))  # 风险名称
    risk_probability = db.Column(db.Float, default=0)  # 发生概率 0-1
    risk_impact = db.Column(db.Float, default=0)  # 影响程度 0-1
    risk_level = db.Column(db.String(20), default='medium')  # low, medium, high
    mitigation_strategy = db.Column(db.Text)  # 缓解策略
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'goal_id': self.goal_id,
            'risk_type': self.risk_type,
            'risk_name': self.risk_name,
            'risk_probability': self.risk_probability,
            'risk_impact': self.risk_impact,
            'risk_level': self.risk_level,
            'mitigation_strategy': self.mitigation_strategy,
            'created_at': self.created_at.isoformat()
        }

# ==================== Advisor Conversation Models ====================

class AdvisorConversation(db.Model):
    """AI理财顾问对话会话模型"""
    __tablename__ = 'advisor_conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), default='新对话')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='advisor_conversations')
    messages = db.relationship('AdvisorMessage', backref='conversation', lazy=True, cascade='all, delete-orphan', order_by='AdvisorMessage.created_at')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'message_count': len(self.messages)
        }


class AdvisorMessage(db.Model):
    """AI理财顾问对话消息模型"""
    __tablename__ = 'advisor_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('advisor_conversations.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # user / assistant
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'role': self.role,
            'content': self.content,
            'created_at': self.created_at.isoformat()
        }
