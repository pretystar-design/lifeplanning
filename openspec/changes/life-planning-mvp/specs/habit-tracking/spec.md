## ADDED Requirements

### Requirement: Create habit
The system SHALL allow authenticated users to create daily or weekly habits with a name and frequency.

#### Scenario: Create daily habit
- **WHEN** authenticated user creates a habit with name and frequency "daily"
- **THEN** system creates the habit linked to the user and returns habit id, name, frequency, created_at

#### Scenario: Create weekly habit
- **WHEN** authenticated user creates a habit with name and frequency "weekly"
- **THEN** system creates the habit linked to the user with weekly recurrence

#### Scenario: Create habit without required fields
- **WHEN** authenticated user creates a habit missing name or frequency
- **THEN** system returns a 400 Bad Request with validation errors

#### Scenario: Create habit with invalid frequency
- **WHEN** authenticated user creates a habit with frequency not in (daily, weekly)
- **THEN** system returns a 400 Bad Request with "Invalid frequency" message

### Requirement: Complete habit
The system SHALL allow authenticated users to mark their habit as completed for the current period.

#### Scenario: Complete daily habit
- **WHEN** authenticated user completes their daily habit for today
- **THEN** system creates a completion record with date and updates current streak

#### Scenario: Complete weekly habit
- **WHEN** authenticated user completes their weekly habit for the current week
- **THEN** system creates a completion record for the week and updates current streak

#### Scenario: Complete habit twice in same period
- **WHEN** authenticated user attempts to complete the same habit twice in the same day/week
- **THEN** system returns a 400 Bad Request with "Habit already completed for this period"

#### Scenario: Complete another user's habit
- **WHEN** authenticated user attempts to complete a habit they do not own
- **THEN** system returns a 403 Forbidden error

### Requirement: Track habit streaks
The system SHALL calculate and display the current streak and longest streak for each habit.

#### Scenario: Consecutive completions increase streak
- **WHEN** authenticated user completes their daily habit on consecutive days
- **THEN** system increments the current streak counter

#### Scenario: Missing a day resets streak
- **WHEN** authenticated user misses a day (no completion yesterday for daily habit)
- **THEN** system resets current streak to 0 on next completion

#### Scenario: Track longest streak
- **WHEN** authenticated user's current streak exceeds their longest streak
- **THEN** system updates the longest streak to match current streak

### Requirement: View habit completion history
The system SHALL allow authenticated users to view their habit completion history.

#### Scenario: View habit history
- **WHEN** authenticated user requests completion history for their habit
- **THEN** system returns a list of completion records ordered by date descending

### Requirement: Delete habit
The system SHALL allow authenticated users to delete their own habits.

#### Scenario: Successful habit deletion
- **WHEN** authenticated user deletes their own habit
- **THEN** system removes the habit and completion records and returns 204 No Content

#### Scenario: Delete habit with streaks
- **WHEN** authenticated user deletes a habit with completion history
- **THEN** system cascades delete to completion records

### Requirement: List habits
The system SHALL allow authenticated users to list all their habits with streak information.

#### Scenario: List all habits
- **WHEN** authenticated user requests their habits
- **THEN** system returns all habits owned by the user with current streak and longest streak