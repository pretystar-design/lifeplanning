from flask import Blueprint, request, jsonify
from app import db
from app.models import Goal, Habit, Budget
from app.utils.auth import token_required
from sqlalchemy import func

bp = Blueprint('dashboard', __name__, url_prefix='/api/v1/dashboard')

@bp.route('', methods=['GET'])
@token_required
def get_dashboard():
    user_id = request.user_id
    
    # Goal stats
    total_goals = Goal.query.filter_by(user_id=user_id).count()
    completed_goals = Goal.query.filter_by(user_id=user_id, status='completed').count()
    in_progress_goals = Goal.query.filter_by(user_id=user_id, status='in_progress').count()
    
    # Goals by category
    goals_by_category = db.session.query(
        Goal.category, func.count(Goal.id)
    ).filter_by(user_id=user_id).group_by(Goal.category).all()
    
    # Goals by status
    goals_by_status = db.session.query(
        Goal.status, func.count(Goal.id)
    ).filter_by(user_id=user_id).group_by(Goal.status).all()
    
    # Average progress
    avg_progress = db.session.query(func.avg(Goal.progress)).filter_by(user_id=user_id).scalar() or 0
    
    # Recent goals
    recent_goals = Goal.query.filter_by(user_id=user_id).order_by(
        Goal.created_at.desc()
    ).limit(5).all()
    
    # Habit stats
    total_habits = Habit.query.filter_by(user_id=user_id).count()
    habits_with_streaks = Habit.query.filter(
        Habit.user_id == user_id,
        Habit.current_streak > 0
    ).count()
    
    # Budget stats
    total_budgets = Budget.query.filter_by(user_id=user_id).count()
    
    return jsonify({
        'goals': {
            'total': total_goals,
            'completed': completed_goals,
            'in_progress': in_progress_goals,
            'completion_rate': round(completed_goals / total_goals * 100, 1) if total_goals > 0 else 0,
            'average_progress': round(avg_progress, 1),
            'by_category': {cat: count for cat, count in goals_by_category},
            'by_status': {status: count for status, count in goals_by_status},
            'recent': [g.to_dict() for g in recent_goals]
        },
        'habits': {
            'total': total_habits,
            'with_streaks': habits_with_streaks
        },
        'budgets': {
            'total': total_budgets
        }
    }), 200
