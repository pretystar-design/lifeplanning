from flask import Blueprint, request, jsonify
from app import db
from app.models import Goal, Milestone, ProgressEntry, User
from app.utils.auth import token_required
from datetime import datetime

bp = Blueprint('goals', __name__, url_prefix='/api/v1/goals')

@bp.route('', methods=['GET'])
@token_required
def get_goals():
    category = request.args.get('category')
    status = request.args.get('status')
    
    query = Goal.query.filter_by(user_id=request.user_id)
    
    if category:
        query = query.filter_by(category=category)
    if status:
        query = query.filter_by(status=status)
    
    goals = query.order_by(Goal.created_at.desc()).all()
    
    return jsonify({'goals': [g.to_dict() for g in goals]}), 200


@bp.route('', methods=['POST'])
@token_required
def create_goal():
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    goal = Goal(
        user_id=request.user_id,
        title=data['title'],
        description=data.get('description', ''),
        category=data.get('category', 'personal'),
        status=data.get('status', 'not_started'),
        target_date=datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None,
        progress=0
    )
    
    db.session.add(goal)
    db.session.commit()
    
    return jsonify({
        'message': 'Goal created successfully',
        'goal': goal.to_dict()
    }), 201


@bp.route('/<int:goal_id>', methods=['GET'])
@token_required
def get_goal(goal_id):
    goal = Goal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({'goal': goal.to_dict()}), 200


@bp.route('/<int:goal_id>', methods=['PUT'])
@token_required
def update_goal(goal_id):
    goal = Goal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if data.get('title'):
        goal.title = data['title']
    if data.get('description') is not None:
        goal.description = data['description']
    if data.get('category'):
        goal.category = data['category']
    if data.get('status'):
        goal.status = data['status']
    if data.get('target_date'):
        goal.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date()
    if data.get('progress') is not None:
        goal.progress = data['progress']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Goal updated successfully',
        'goal': goal.to_dict()
    }), 200


@bp.route('/<int:goal_id>', methods=['DELETE'])
@token_required
def delete_goal(goal_id):
    goal = Goal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(goal)
    db.session.commit()
    
    return jsonify({'message': 'Goal deleted successfully'}), 200


@bp.route('/<int:goal_id>/milestones', methods=['GET'])
@token_required
def get_milestones(goal_id):
    goal = Goal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({'milestones': [m.to_dict() for m in goal.milestones]}), 200


@bp.route('/<int:goal_id>/milestones', methods=['POST'])
@token_required
def create_milestone(goal_id):
    goal = Goal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    milestone = Milestone(
        goal_id=goal_id,
        title=data['title'],
        target_date=datetime.strptime(data['target_date'], '%Y-%m-%d').date() if data.get('target_date') else None
    )
    
    db.session.add(milestone)
    db.session.commit()
    
    return jsonify({
        'message': 'Milestone created successfully',
        'milestone': milestone.to_dict()
    }), 201


@bp.route('/<int:goal_id>/milestones/<int:milestone_id>', methods=['PUT'])
@token_required
def update_milestone(goal_id, milestone_id):
    goal = Goal.query.get(goal_id)
    
    if not goal or goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    milestone = Milestone.query.get(milestone_id)
    
    if not milestone or milestone.goal_id != goal_id:
        return jsonify({'error': 'Milestone not found'}), 404
    
    data = request.get_json()
    
    if data.get('title'):
        milestone.title = data['title']
    if data.get('target_date'):
        milestone.target_date = datetime.strptime(data['target_date'], '%Y-%m-%d').date()
    if data.get('completed') is not None:
        milestone.completed = data['completed']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Milestone updated successfully',
        'milestone': milestone.to_dict()
    }), 200


@bp.route('/<int:goal_id>/progress', methods=['GET'])
@token_required
def get_progress(goal_id):
    goal = Goal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    entries = ProgressEntry.query.filter_by(goal_id=goal_id).order_by(ProgressEntry.created_at.desc()).all()
    
    return jsonify({'progress': [e.to_dict() for e in entries]}), 200


@bp.route('/<int:goal_id>/progress', methods=['POST'])
@token_required
def log_progress(goal_id):
    goal = Goal.query.get(goal_id)
    
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404
    
    if goal.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    entry = ProgressEntry(
        goal_id=goal_id,
        user_id=request.user_id,
        notes=data.get('notes', ''),
        value=data.get('value', 0)
    )
    
    db.session.add(entry)
    
    if data.get('value'):
        goal.progress = min(100, goal.progress + data['value'])
        if goal.progress >= 100:
            goal.status = 'completed'
        elif goal.progress > 0:
            goal.status = 'in_progress'
    
    db.session.commit()
    
    return jsonify({
        'message': 'Progress logged successfully',
        'entry': entry.to_dict(),
        'goal': goal.to_dict()
    }), 201
