from flask import Blueprint, request, jsonify
from app import db
from app.models import Budget, BudgetCategory, Expense
from app.utils.auth import token_required
from datetime import datetime, date
from sqlalchemy import func

bp = Blueprint('budgets', __name__, url_prefix='/api/v1/budgets')


@bp.route('', methods=['GET'])
@token_required
def get_budgets():
    """Get all budgets for the current user"""
    budgets = Budget.query.filter_by(user_id=request.user_id).order_by(
        Budget.created_at.desc()
    ).all()
    
    return jsonify({'budgets': [b.to_dict() for b in budgets]}), 200


@bp.route('', methods=['POST'])
@token_required
def create_budget():
    """Create a new budget"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    budget = Budget(
        user_id=request.user_id,
        name=data['name'],
        total_amount=data.get('total_amount', 0),
        start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None,
        end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None
    )
    
    db.session.add(budget)
    db.session.commit()
    
    return jsonify({
        'message': 'Budget created successfully',
        'budget': budget.to_dict()
    }), 201


@bp.route('/<int:budget_id>', methods=['GET'])
@token_required
def get_budget(budget_id):
    """Get a single budget with categories and expenses"""
    budget = Budget.query.get(budget_id)
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    if budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({'budget': budget.to_dict()}), 200


@bp.route('/<int:budget_id>', methods=['PUT'])
@token_required
def update_budget(budget_id):
    """Update a budget"""
    budget = Budget.query.get(budget_id)
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    if budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if data.get('name'):
        budget.name = data['name']
    if data.get('total_amount') is not None:
        budget.total_amount = data['total_amount']
    if data.get('start_date'):
        budget.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
    if data.get('end_date'):
        budget.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Budget updated successfully',
        'budget': budget.to_dict()
    }), 200


@bp.route('/<int:budget_id>', methods=['DELETE'])
@token_required
def delete_budget(budget_id):
    """Delete a budget"""
    budget = Budget.query.get(budget_id)
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    if budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(budget)
    db.session.commit()
    
    return jsonify({'message': 'Budget deleted successfully'}), 200


@bp.route('/<int:budget_id>/categories', methods=['GET'])
@token_required
def get_categories(budget_id):
    """Get all categories for a budget"""
    budget = Budget.query.get(budget_id)
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    if budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    categories = BudgetCategory.query.filter_by(budget_id=budget_id).all()
    
    return jsonify({'categories': [c.to_dict() for c in categories]}), 200


@bp.route('/<int:budget_id>/categories', methods=['POST'])
@token_required
def create_category(budget_id):
    """Add a category to a budget"""
    budget = Budget.query.get(budget_id)
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    if budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    category = BudgetCategory(
        budget_id=budget_id,
        name=data['name'],
        allocated_amount=data.get('allocated_amount', 0)
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category created successfully',
        'category': category.to_dict()
    }), 201


@bp.route('/<int:budget_id>/categories/<int:category_id>', methods=['PUT'])
@token_required
def update_category(budget_id, category_id):
    """Update a category"""
    budget = Budget.query.get(budget_id)
    
    if not budget or budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    category = BudgetCategory.query.get(category_id)
    
    if not category or category.budget_id != budget_id:
        return jsonify({'error': 'Category not found'}), 404
    
    data = request.get_json()
    
    if data.get('name'):
        category.name = data['name']
    if data.get('allocated_amount') is not None:
        category.allocated_amount = data['allocated_amount']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Category updated successfully',
        'category': category.to_dict()
    }), 200


@bp.route('/<int:budget_id>/categories/<int:category_id>', methods=['DELETE'])
@token_required
def delete_category(budget_id, category_id):
    """Delete a category"""
    budget = Budget.query.get(budget_id)
    
    if not budget or budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    category = BudgetCategory.query.get(category_id)
    
    if not category or category.budget_id != budget_id:
        return jsonify({'error': 'Category not found'}), 404
    
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Category deleted successfully'}), 200


@bp.route('/<int:budget_id>/expenses', methods=['GET'])
@token_required
def get_expenses(budget_id):
    """Get all expenses for a budget"""
    budget = Budget.query.get(budget_id)
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    if budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    expenses = Expense.query.filter(
        Expense.category_id.in_([c.id for c in budget.categories])
    ).order_by(Expense.date.desc()).all()
    
    return jsonify({'expenses': [e.to_dict() for e in expenses]}), 200


@bp.route('/<int:budget_id>/expenses', methods=['POST'])
@token_required
def create_expense(budget_id):
    """Record an expense"""
    budget = Budget.query.get(budget_id)
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    if budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('category_id') or data.get('amount') is None:
        return jsonify({'error': 'Category and amount are required'}), 400
    
    # Verify category belongs to this budget
    category = BudgetCategory.query.get(data['category_id'])
    if not category or category.budget_id != budget_id:
        return jsonify({'error': 'Invalid category'}), 400
    
    expense = Expense(
        category_id=data['category_id'],
        user_id=request.user_id,
        amount=float(data['amount']),
        description=data.get('description', ''),
        date=datetime.strptime(data.get('date', date.today().isoformat()), '%Y-%m-%d').date()
    )
    
    db.session.add(expense)
    db.session.commit()
    
    return jsonify({
        'message': 'Expense recorded successfully',
        'expense': expense.to_dict()
    }), 201


@bp.route('/<int:budget_id>/expenses/<int:expense_id>', methods=['DELETE'])
@token_required
def delete_expense(budget_id, expense_id):
    """Delete an expense"""
    budget = Budget.query.get(budget_id)
    
    if not budget or budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    expense = Expense.query.get(expense_id)
    
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    # Verify expense belongs to this budget's categories
    category = BudgetCategory.query.get(expense.category_id)
    if not category or category.budget_id != budget_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    db.session.delete(expense)
    db.session.commit()
    
    return jsonify({'message': 'Expense deleted successfully'}), 200


@bp.route('/<int:budget_id>/summary', methods=['GET'])
@token_required
def get_budget_summary(budget_id):
    """Get budget summary with spending by category"""
    budget = Budget.query.get(budget_id)
    
    if not budget:
        return jsonify({'error': 'Budget not found'}), 404
    
    if budget.user_id != request.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    categories = BudgetCategory.query.filter_by(budget_id=budget_id).all()
    
    category_summary = []
    total_spent = 0
    total_allocated = 0
    
    for category in categories:
        spent = sum(e.amount for e in category.expenses)
        total_spent += spent
        total_allocated += category.allocated_amount
        
        category_summary.append({
            'id': category.id,
            'name': category.name,
            'allocated': category.allocated_amount,
            'spent': spent,
            'remaining': category.allocated_amount - spent,
            'percentage_used': round(spent / category.allocated_amount * 100, 1) if category.allocated_amount > 0 else 0
        })
    
    return jsonify({
        'budget': budget.to_dict(),
        'total_allocated': total_allocated,
        'total_spent': total_spent,
        'total_remaining': total_allocated - total_spent,
        'overall_percentage': round(total_spent / total_allocated * 100, 1) if total_allocated > 0 else 0,
        'categories': category_summary
    }), 200
