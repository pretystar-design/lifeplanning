## ADDED Requirements

### Requirement: Dashboard overview
The system SHALL provide an authenticated user with a dashboard displaying an overview of their life planning metrics.

#### Scenario: View dashboard with all data
- **WHEN** authenticated user views their dashboard
- **THEN** system returns goal progress summary, habit streak summary, budget status, and key metrics

#### Scenario: View dashboard with no data
- **WHEN** authenticated user with no goals, habits, or budgets views dashboard
- **THEN** system returns empty summaries with encouragement message to get started

#### Scenario: View dashboard for another user
- **WHEN** authenticated user attempts to view another user's dashboard
- **THEN** system returns a 403 Forbidden error

### Requirement: Goal progress summary
The system SHALL display a summary of goal progress including total goals, completed, in progress, and by category breakdown.

#### Scenario: Goal summary shows category breakdown
- **WHEN** authenticated user views dashboard
- **THEN** system returns count of goals by category (financial, health, career, personal) and overall completion percentage

#### Scenario: Goal summary shows recent progress
- **WHEN** authenticated user views dashboard
- **THEN** system returns the 3 most recent progress entries across all goals

### Requirement: Habit streak summary
The system SHALL display a summary of habit streaks including active habits, current streaks, and longest streaks.

#### Scenario: Habit summary shows streak leaders
- **WHEN** authenticated user views dashboard
- **THEN** system returns habit streak data including habits with longest current streaks

#### Scenario: Habit summary shows completion rate
- **WHEN** authenticated user views dashboard
- **THEN** system returns overall habit completion rate for the current week

### Requirement: Budget status summary
The system SHALL display a summary of budget status including total budgeted, total spent, and category breakdown.

#### Scenario: Budget summary shows spending overview
- **WHEN** authenticated user views dashboard
- **THEN** system returns total budgeted amount, total spent, and number of budgets with overspend warnings

#### Scenario: Budget summary shows top spending categories
- **WHEN** authenticated user views dashboard
- **THEN** system returns the top 3 spending categories by amount

### Requirement: Key metrics display
The system SHALL display key metrics calculated from user's goals, habits, and financial data.

#### Scenario: Metrics include progress indicators
- **WHEN** authenticated user views dashboard
- **THEN** system returns calculated metrics such as overall completion percentage, active streaks count, and budget utilization

#### Scenario: Metrics update in real-time
- **WHEN** user completes a habit or logs progress after viewing dashboard
- **THEN** subsequent dashboard views reflect the updated data