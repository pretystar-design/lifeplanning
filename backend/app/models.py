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
