## ADDED Requirements

### Requirement: Create budget
The system SHALL allow authenticated users to create a budget with a name, total amount, and start/end dates.

#### Scenario: Create monthly budget
- **WHEN** authenticated user creates a budget with name, amount, start_date, and end_date
- **THEN** system creates the budget linked to the user and returns budget id, name, amount, start_date, end_date

#### Scenario: Create budget without required fields
- **WHEN** authenticated user creates a budget missing name, amount, or dates
- **THEN** system returns a 400 Bad Request with validation errors

#### Scenario: Create budget with negative amount
- **WHEN** authenticated user creates a budget with a negative amount
- **THEN** system returns a 400 Bad Request with "Amount must be positive"

### Requirement: Add expense category to budget
The system SHALL allow authenticated users to add expense categories to their budgets with a name and allocated amount.

#### Scenario: Add category to budget
- **WHEN** authenticated user adds a category (e.g., "Food", "Transportation") with allocated amount to their budget
- **THEN** system creates the category linked to the budget with allocated amount and remaining amount equal to allocated

#### Scenario: Categories exceed budget amount
- **WHEN** authenticated user adds categories whose allocated amounts sum exceeds budget total
- **THEN** system allows creation but returns a warning that "Category allocations exceed budget"

### Requirement: Log expense
The system SHALL allow authenticated users to log expenses against their budget categories.

#### Scenario: Log expense to category
- **WHEN** authenticated user logs an expense with amount, description, and category_id to their budget
- **THEN** system creates the expense and deducts amount from category's remaining amount

#### Scenario: Log expense exceeding category remaining
- **WHEN** authenticated user logs an expense that exceeds category's remaining amount
- **THEN** system allows creation but returns warning that "Expense exceeds category budget"

#### Scenario: Log expense to another user's budget
- **WHEN** authenticated user attempts to log an expense to a budget they do not own
- **THEN** system returns a 403 Forbidden error

### Requirement: View budget vs actual spending
The system SHALL provide a comparison of budgeted amounts versus actual spending per category.

#### Scenario: View budget summary
- **WHEN** authenticated user views their budget summary
- **THEN** system returns each category with allocated, spent, and remaining amounts, plus overall budget status

#### Scenario: View spending trends
- **WHEN** authenticated user views spending trends for their budget
- **THEN** system returns categorized spending grouped by date with running totals

### Requirement: Delete budget
The system SHALL allow authenticated users to delete their own budgets.

#### Scenario: Delete budget with expenses
- **WHEN** authenticated user deletes their budget
- **THEN** system cascades delete to categories and expenses and returns 204 No Content

### Requirement: List budgets
The system SHALL allow authenticated users to list all their budgets.

#### Scenario: List all budgets
- **WHEN** authenticated user requests their budgets
- **THEN** system returns all budgets owned by the user with summary spending data