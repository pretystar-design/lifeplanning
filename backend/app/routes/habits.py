from flask import Blueprint, request, jsonify
from app import db
from app.models import Habit, HabitCompletion
from app.utils.auth import token_required
from datetime import datetime, date, timedelta

bp = Blueprint('habits', __name__, url_prefix='/api/v1/habits')


def calculate_streak(habit):
    """Calculate current streak for a habit"""
    today = date.today()
    completions = HabitCompletion.query.filter_by(habit_id=habit.id).order_by(
        HabitCompletion.completed_date.desc()
    ).all()
    
    if not completions:
        return 0, 0
    
    current_streak = 0
    check_date = today
    
    if habit.frequency == 'daily':
        # Check if completed today or yesterday
        if completions[0].completed_date == today:
            current_streak = 1
            check_date = today - timedelta(days=1)
        elif completions[0].completed_date == today - timedelta(days=1):
            current_streak = 1
            check_date = today - timedelta(days=2)
        else:
            return 0, habit.longest_streak
        
        for completion in completions[1:]:
            if completion.completed_date == check_date:
                current_streak += 1
                check_date -= timedelta(days=1)
            elif completion.completed_date < check_date:
                break
                
    elif habit.frequency == 'weekly':
        # For weekly, check if completed in current week or last week
        week_start = today - timedelta(days=today.weekday())
        last_week_start = week_start - timedelta(days=7)
        
        if completions[0].completed_date >= week_start:
            current_streak = 1
            check_week = last_week_start
        elif completions[0].completed_date >= last_week_start:
            current_streak = 1
            check_week = last_week_start - timedelta(days=7)
        else:
            return 0, habit.longest_streak
        
        for completion in completions[1:]:
            if completion.completed_date >= check_week and completion.completed_date < check_week + timedelta(days=7):
                if not any(c.completed_date >= check_week and c.completed_date < check_week + timedelta(days=7) 
                          for c in completions[:completions.index(completion)]):
                    current_streak += 1
                    check_week -= timedelta(days=7)
    
    return current_streak, max(current_streak, habit.longest_streak)


@bp.route('', methods=['GET'])
@token_required
def get_habits():
    """Get all habits for the current user"""
    habits = Habit.query.filter_by(user_id=request.user_id).order_by(
        HabitCompletion.completed_date.desc().nullslast(),
        Habit.created_at.desc()
    ).all()
    
    # Get today's completions for quick status
    today = date.today()
    today_completions = {c.habit_id for c in HabitCompletion.query.filter_by(
        user_id=request.user_id, completed_date=today
    ).all()}
    
    result = []
    for habit in habits:
        habit_dict = habit.to_dict()
        habit_dict['completed_today'] = habit.id in today_completions
        result.append(habit_dict)
    
    return jsonify({'habits': result}), 200


@bp.route('', methods=['POST'])
@token_required
def create_habit():
    """Create a new habit"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    habit = Habit(
        user_id=request.user_id,
        name=data['name'],
        frequency=data.get('frequency', 'daily'),
        current_streak=0,
        longest_streak=0
    )
    
    db.session.add(habit)
    db.session.commit()
    
    return jsonify({
        'message': 'Habit created successfully',
        'habit': habit.to_dict()
    }), 201


@bp.route('/<int:habit_id>', methods=['GET'])
@token_required
def get_habit(habit_id):
    """Get a single habit"""
    habit = Habit.query.get(habit_id)
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    if habit.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    today = date.today()
    today_completed = HabitCompletion.query.filter_by(
        habit_id=habit_id, completed_date=today
    ).first() is not None
    
    habit_dict = habit.to_dict()
    habit_dict['completed_today'] = today_completed
    
    return jsonify({'habit': habit_dict}), 200


@bp.route('/<int:habit_id>', methods=['PUT'])
@token_required
def update_habit(habit_id):
    """Update a habit"""
    habit = Habit.query.get(habit_id)
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    if habit.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if data.get('name'):
        habit.name = data['name']
    if data.get('frequency'):
        habit.frequency = data['frequency']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Habit updated successfully',
        'habit': habit.to_dict()
    }), 200


@bp.route('/<int:habit_id>', methods=['DELETE'])
@token_required
def delete_habit(habit_id):
    """Delete a habit"""
    habit = Habit.query.get(habit_id)
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    if habit.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(habit)
    db.session.commit()
    
    return jsonify({'message': 'Habit deleted successfully'}), 200


@bp.route('/<int:habit_id>/complete', methods=['POST'])
@token_required
def complete_habit(habit_id):
    """Mark a habit as completed for today"""
    habit = Habit.query.get(habit_id)
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    if habit.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json() or {}
    completed_date = datetime.strptime(data.get('date', date.today().isoformat()), '%Y-%m-%d').date()
    
    # Check if already completed on this date
    existing = HabitCompletion.query.filter_by(
        habit_id=habit_id, completed_date=completed_date
    ).first()
    
    if existing:
        return jsonify({'error': 'Habit already completed for this date'}), 400
    
    completion = HabitCompletion(
        habit_id=habit_id,
        user_id=request.user_id,
        completed_date=completed_date
    )
    
    db.session.add(completion)
    
    # Update streaks
    current_streak, longest_streak = calculate_streak(habit)
    habit.current_streak = current_streak
    habit.longest_streak = longest_streak
    
    db.session.commit()
    
    return jsonify({
        'message': 'Habit completed successfully',
        'completion': completion.to_dict(),
        'habit': habit.to_dict()
    }), 201


@bp.route('/<int:habit_id>/uncomplete', methods=['POST'])
@token_required
def uncomplete_habit(habit_id):
    """Remove completion for today"""
    habit = Habit.query.get(habit_id)
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    if habit.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    today = date.today()
    completion = HabitCompletion.query.filter_by(
        habit_id=habit_id, completed_date=today
    ).first()
    
    if completion:
        db.session.delete(completion)
        db.session.commit()
    
    return jsonify({
        'message': 'Completion removed',
        'habit': habit.to_dict()
    }), 200


@bp.route('/<int:habit_id>/history', methods=['GET'])
@token_required
def get_habit_history(habit_id):
    """Get completion history for a habit"""
    habit = Habit.query.get(habit_id)
    
    if not habit:
        return jsonify({'error': 'Habit not found'}), 404
    
    if habit.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Get last 30 days of completions
    thirty_days_ago = date.today() - timedelta(days=30)
    completions = HabitCompletion.query.filter(
        HabitCompletion.habit_id == habit_id,
        HabitCompletion.completed_date >= thirty_days_ago
    ).order_by(HabitCompletion.completed_date.desc()).all()
    
    return jsonify({
        'habit': habit.to_dict(),
        'completions': [c.to_dict() for c in completions]
    }), 200
